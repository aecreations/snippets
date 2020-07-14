/* -*- mode: javascript; tab-width: 8; indent-tabs-mode: nil; js-indent-level: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


function $(eltID)
{
  return document.getElementById(eltID);
}


async function init()
{
  let prefs = await messenger.storage.local.get();
  let htmlPasteModeSelect = $("html-paste-mode");
  
  htmlPasteModeSelect.value = prefs.htmlPasteMode;
  htmlPasteModeSelect.addEventListener("change", async (e) => {
    messenger.storage.local.set({ htmlPasteMode: e.target.value });
  });

  let checkSpell = $("check-spelling");
  checkSpell.checked = prefs.checkSpelling;
  checkSpell.addEventListener("click", async (e) => {
    messenger.storage.local.set({ checkSpelling: e.target.checked });
  });
  
}


document.addEventListener("DOMContentLoaded", async (e) => { init() });
