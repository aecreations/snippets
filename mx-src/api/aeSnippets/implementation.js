/* -*- mode: javascript; tab-width: 8; indent-tabs-mode: nil; js-indent-level: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var { ExtensionCommon } = ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
var { OS } = ChromeUtils.import("resource://gre/modules/osfile.jsm");


var aeSnippets = class extends ExtensionCommon.ExtensionAPI {
  getAPI(context) {
    return {
      aeSnippets: {
	DEBUG: true,
	CLIPPINGS_JSON_FILENAME: "clippings.json",

	async alert(title, msg)
	{
	  Services.prompt.alert(null, title, msg);
	},

	async getPref(prefName)
	{
	  let prefs = Services.prefs;
	  let prefType = prefs.getPrefType(prefName);
	  let rv = undefined;

	  this._log(`aeSnippets.getPref(): Retrieving value of pref "${prefName}"`);

	  if (prefType == prefs.PREF_STRING) {
	    rv = prefs.getCharPref(prefName);
	  }
	  else if (prefType == prefs.PREF_INT) {
	    rv = prefs.getIntPref(prefName);
	  }
	  else if (prefType == prefs.PREF_BOOL) {
	    rv = prefs.getBoolPref(prefName);
	  }

	  return rv;
	},

	async detectClippingsJSONFile()
	{
          let jsonFilePath = await this.getPref("extensions.aecreations.clippings.datasource.location");
          if (jsonFilePath) {
            jsonFilePath = OS.Path.join(jsonFilePath, this.CLIPPINGS_JSON_FILENAME);
          }
          else {
            let dirProp = Services.dirsvc;
	    let profileDir = dirProp.get("ProfD", Components.interfaces.nsIFile);
	    let path = profileDir.path;
            jsonFilePath = OS.Path.join(path, this.CLIPPINGS_JSON_FILENAME);
          }

	  this._log("aeSnippets.detectClippingsJSONFile(): Clippings JSON file path: " + jsonFilePath);
	  
	  let fileData;
	  try {
	    fileData = await OS.File.read(jsonFilePath, { encoding: "utf-8" });
	  }
	  catch (e) {
	    this._log("aeSnippets.detectClippingsJSONFile(): Error attempting to read file " + this.CLIPPINGS_JSON_FILENAME + ": " + e);
	    return false; 
	  }

	  return fileData;
	},

	// Helper methods
	_log(msg)
	{
	  if (this.DEBUG) {
	    Services.console.logStringMessage(msg);
	  }
	}
      }
    }
  }
};
