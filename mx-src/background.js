/* -*- mode: javascript; tab-width: 8; indent-tabs-mode: nil; js-indent-level: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


let gSnippetsDB;
let gComposeTabID;


messenger.runtime.onInstalled.addListener(install => {
  if (install.reason == "install") {
    info("Snippets: Extension installed.");
    init();
    detectLegacyClippings();
  }
  else if (install.reason == "update") {
    let oldVer = install.previousVersion;
    let currVer = messenger.runtime.getManifest().version;
    log(`Snippets: Upgrading from version ${oldVer} to ${currVer}`);

    init();
  }
});

messenger.runtime.onStartup.addListener(() => {
  init();
});


function init()
{
  info("Snippets: Initializing integration with host app...");

  messenger.runtime.getBrowserInfo().then(brws => {
    log(`Snippets: Host app: ${brws.name} (version ${brws.version})`);
  });

  log("Initializing Snippets database");
  
  gSnippetsDB = new Dexie("aeSnippets");
  gSnippetsDB.version(1).stores({
    snippets: "++id, name"
  });

  gSnippetsDB.open().catch(err => { onError(err) });

  messenger.runtime.onMessage.addListener(msg => {
    if (msg.id == "insert-snippet") {
      messenger.compose.getComposeDetails(gComposeTabID).then(composeInfo => {
        log(`Snippets: Handling message "${msg.id}".  Compose window tab ID: ${gComposeTabID}`);
        
        let injectOpts = {
          code: `insertSnippet("${msg.content}", ${composeInfo.isPlainText});`
        };
        
        messenger.tabs.executeScript(gComposeTabID, injectOpts);
      });
    }
  });
  
  let compScriptOpts = {
    js: [
      { file: "compose.js" }
    ],
  };  
  messenger.composeScripts.register(compScriptOpts);

  log("Snippets: Initialization complete.");
}


function detectLegacyClippings()
{
  messenger.aecreations.getPref("extensions.aecreations.clippings.first_run").then(prefVal => {
    if (prefVal === undefined) {
      log("It doesn't appear that Clippings 5.7 or older was installed.");
      return null;
    }
    else {
      return messenger.aecreations.detectClippingsJSONFile();
    }
  }).then(fileData => {
    if (fileData) {
      let clippings = JSON.parse(fileData);
      log(`Found the Clippings JSON file\nVersion: ${clippings.version}\nCreated by: ${clippings.createdBy}`);
    }
    else if (fileData === false) {
      log("Clippings JSON file not found");
    }
  });
}

// Applicable if no popup defined for composeAction.
messenger.composeAction.onClicked.addListener(tab => {
  gComposeTabID = tab.id;

  let wndOpts = {
    url: "pages/snippets.html",
    type: "detached_panel",
    width: 350, height: 420,
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

