/* -*- mode: javascript; tab-width: 8; indent-tabs-mode: nil; js-indent-level: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

let gSnippetsDB;
let gPrefs;
let gComposeTabID;
let gRecentSnippetID;


messenger.runtime.onInstalled.addListener(async (install) => {
  if (install.reason == "install") {
    info("Snippets: Extension installed.");
    await setDefaultPrefs();
    await init();
  }
  else if (install.reason == "update") {
    let oldVer = install.previousVersion;
    let currVer = messenger.runtime.getManifest().version;
    log(`Snippets: Upgrading from version ${oldVer} to ${currVer}`);

    init();
  }
});

messenger.runtime.onStartup.addListener(async () => {
  gPrefs = await messenger.storage.local.get();
  init();
});


async function init()
{
  info("Snippets: Initializing integration with host app...");

  let hostApp = await messenger.runtime.getBrowserInfo();
  log(`Snippets: Host app: ${hostApp.name} (version ${hostApp.version})`);

  log("Initializing Snippets database");
  
  gSnippetsDB = new Dexie("aeSnippets");
  gSnippetsDB.version(1).stores({
    snippets: "++id, name"
  });
  gSnippetsDB.version(2).stores({
    snippets: "++id, name, displayOrder"
  });

  gSnippetsDB.open().catch(err => { onError(err) });

  let compScriptOpts = {
    js: [
      {file: "lib/purify.min.js"},
      {file: "compose.js"}
    ],
  };  
  messenger.composeScripts.register(compScriptOpts);

  messenger.menus.create({
    id: "ae-snippets",
    title: messenger.i18n.getMessage("extName"),
    contexts: ["compose_body"],
  });
  messenger.menus.create({
    id: "ae-snippets-recent",
    title: "insert recent",
    parentId: "ae-snippets",
    contexts: ["compose_body"],
  });
  messenger.menus.create({
    id: "ae-snippets-open",
    title: "show snippets",
    parentId: "ae-snippets",
    contexts: ["compose_body"],
  });
  
  log("Snippets: Initialization complete.");
}


//
// Event handlers
//

messenger.runtime.onMessage.addListener(async (msg) => {
  if (msg.id == "insert-snippet") {
    log(`Snippets: Handling message "${msg.id}".  Compose window tab ID: ${gComposeTabID}`);

    let snippet = {content: msg.content};
    insertSnippet(snippet, msg.asQuoted);
    gRecentSnippetID = msg.snippetID;
  }
  else if (msg.id == "snippet-deleted") {
    if (gRecentSnippetID == msg.snippetID) {
      gRecentSnippetID = null;
    }
  }
});

// Applicable if no popup defined for composeAction.
messenger.composeAction.onClicked.addListener(tab => {
  log(`Snippets: composeAction triggered. Active tab ID: ${tab.id}`);
  gComposeTabID = tab.id;
  openSnippetsWindow();
});

messenger.menus.onClicked.addListener((info, tab) => {
  if (info.menuItemId == "ae-snippets-open") {
    gComposeTabID = tab.id;
    openSnippetsWindow();
  }
  else if (info.menuItemId == "ae-snippets-recent") {
    insertRecentSnippet();
  }
})


messenger.commands.onCommand.addListener(async (cmdName) => {
  if (cmdName == "ae-snippets-window") {
    // In Thunderbird versions older than 102.0, the tab ID of the current tab
    // at the time the command was executed may not necessarily be the one for
    // the special "hidden" tab representing the compose window!
    let [tab] = await messenger.tabs.query({active: true, currentWindow: true});
    gComposeTabID = tab.id;
    openSnippetsWindow();
  }
});


messenger.storage.onChanged.addListener((changes, areaName) => {
  let changedPrefs = Object.keys(changes);

  for (let pref of changedPrefs) {
    gPrefs[pref] = changes[pref].newValue;
  }
});


async function setDefaultPrefs()
{
  let defaultPrefs = {
    htmlPasteMode: aeConst.HTMLPASTE_AS_FORMATTED,
    checkSpelling: true,
  };

  gPrefs = defaultPrefs;
  await messenger.storage.local.set(defaultPrefs);
}


async function insertRecentSnippet()
{
  if (! gRecentSnippetID) {
    console.warn("Snippets: No recent snippet found.");
    return;
  }

  let snippet = await gSnippetsDB.snippets.get(gRecentSnippetID);
  insertSnippet(snippet);
}


async function insertSnippet(snippet, insertAsQuoted)
{
  let htmlPasteMode = gPrefs.htmlPasteMode;

  let comp = await messenger.compose.getComposeDetails(gComposeTabID);
  let content = snippet.content.replace(/\\/g, "\\\\");
  content = content.replace(/\"/g, "\\\"");
  content = content.replace(/\n/g, "\\n");

  content = processPlaceholders(content);

  insertAsQuoted = !!insertAsQuoted;
  
  let injectOpts = {
    code: `insertSnippet("${content}", ${comp.isPlainText}, ${htmlPasteMode}, ${insertAsQuoted});`
  };

  messenger.tabs.executeScript(gComposeTabID, injectOpts);
}


function processPlaceholders(snippetText)
{
  let rv = "";
  let date = new Date();

  rv = snippetText.replace(/\$\[DATE\]/gm, date.toLocaleDateString());
  rv = rv.replace(/\$\[TIME\]/gm, date.toLocaleTimeString());

  return rv;
}


async function openSnippetsWindow()
{
  if (gComposeTabID) {
    log("Snippets: Compose window tab ID: " + gComposeTabID);

    let compTab = await messenger.tabs.get(gComposeTabID);
    let compWnd = await messenger.windows.get(compTab.windowId);
    let wndGeom = {
      w: compTab.width,
      h: compTab.height,
      x: compWnd.left,
      y: compWnd.top
    };

    log("Snippets: Composer window geometry (w, h, x, y):");
    log(wndGeom);
  }
  else {
    warn("Snippets: gComposeTabID is not initialized!");
  }
  
  let wndOpts = {
    url: "pages/snippets.html",
    type: "popup",
    width: 408, height: 428,
    left: 64, top: 128
  };
  messenger.windows.create(wndOpts);
}


async function getMostRecentHostAppWndID(wndType)
{
  // `wndType` is a string with possible values:
  // - "normal" - main Thunderbird 3-pane messenger window
  // - "messageCompose" - the message compose window
  let rv = null;
  let msgrTabs = await messenger.tabs.query({});

  for (let tab of msgrTabs) {
    let wnd = await messenger.windows.get(tab.windowId);
    if (wnd.type == wndType && wnd.focused) {
      rv = tab.windowId;
      break;
    }
  }

  return rv;
}


function getSnippetsDB()
{
  return gSnippetsDB;
}


function getPrefs()
{
  return gPrefs;
}


function getComposeTabID()
{
  return gComposeTabID;
}


//
// Utilities
//

function createSnippetNameFromText(aText)
{
  let rv = "";
  let clipName = "";

  aText = aText.trim();

  if (aText.length > aeConst.MAX_NAME_LENGTH) {
    // Leave room for the three-character elipsis.
    clipName = aText.substr(0, aeConst.MAX_NAME_LENGTH - 3) + "...";
  } 
  else {
    clipName = aText;
  }

  // Truncate clipping names at newlines if they exist.
  let newlineIdx = clipName.indexOf("\n");
  rv = (newlineIdx == -1) ? clipName : clipName.substring(0, newlineIdx);

  return rv;
}


//
// Error reporting and debugging output
//

function onError(aError)
{
  console.error("Snippets: " + aError);
}


function log(aMessage)
{
  if (aeConst.DEBUG) { console.log(aMessage); }
}


function info(aMessage)
{
  if (aeConst.DEBUG) { console.info(aMessage); }
}


function warn(aMessage)
{
  if (aeConst.DEBUG) { console.warn(aMessage); }
}

