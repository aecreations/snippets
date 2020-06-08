/* -*- mode: javascript; tab-width: 8; indent-tabs-mode: nil; js-indent-level: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


let gSnippetsDB;
let gPrefs;
let gComposeTabID;


messenger.runtime.onInstalled.addListener(async (install) => {
  if (install.reason == "install") {
    info("Snippets: Extension installed.");
    await setDefaultPrefs();
    await init();
    await detectLegacyClippings();
  }
  else if (install.reason == "update") {
    let oldVer = install.previousVersion;
    let currVer = messenger.runtime.getManifest().version;
    log(`Snippets: Upgrading from version ${oldVer} to ${currVer}`);

    init();
  }
});

messenger.runtime.onStartup.addListener(async () => {
  gPrefs = await browser.storage.local.get();
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
      { file: "compose.js" }
    ],
  };  
  messenger.composeScripts.register(compScriptOpts);

  messenger.runtime.onMessage.addListener(async (msg) => {
    if (msg.id == "insert-snippet") {
      let htmlPasteMode = gPrefs.htmlPasteMode;

      let comp = await messenger.compose.getComposeDetails(gComposeTabID);
      log(`Snippets: Handling message "${msg.id}".  Compose window tab ID: ${gComposeTabID}`);

      let content = DOMPurify.sanitize(msg.content);
      content = content.replace(/\\/g, "\\\\");
      content = content.replace(/\"/g, "\\\"");
      content = content.replace(/\n/g, "\\n");
      
      let injectOpts = {
        code: `insertSnippet("${content}", ${comp.isPlainText}, ${htmlPasteMode});`
      };
        
      messenger.tabs.executeScript(gComposeTabID, injectOpts);
    }
  });
  
  log("Snippets: Initialization complete.");
}


async function setDefaultPrefs()
{
  let aeSnippetsPrefs = {
    htmlPasteMode: aeConst.HTMLPASTE_AS_FORMATTED,
  };

  gPrefs = aeSnippetsPrefs;
  await browser.storage.local.set(aeSnippetsPrefs);
}


async function detectLegacyClippings()
{
  let prefVal = await messenger.aecreations.getPref("extensions.aecreations.clippings.first_run");
  if (prefVal === undefined) {
    log("It doesn't appear that Clippings 5.7 or older was installed.");
    return null;
  }

  // TO DO: Search in the data source folder location which may be set by the user.
  let fileData = await messenger.aecreations.detectClippingsJSONFile();
  if (fileData) {
    let clippings = JSON.parse(fileData);
    log(`Found the Clippings JSON file\nVersion: ${clippings.version}\nCreated by: ${clippings.createdBy}`);
  }
  else if (fileData === false) {
    log("Clippings JSON file not found");
  }
}


// Applicable if no popup defined for composeAction.
messenger.composeAction.onClicked.addListener(tab => {
  gComposeTabID = tab.id;

  let wndOpts = {
    url: "pages/snippets.html",
    type: "detached_panel",
    width: 352, height: 420,
    left: 64, top: 128
  };

  messenger.windows.create(wndOpts);
});


function getSnippetsDB()
{
  return gSnippetsDB;
}


function getComposeTabID()
{
  return gComposeTabID;
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

