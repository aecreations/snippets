/* -*- mode: javascript; tab-width: 8; indent-tabs-mode: nil; js-indent-level: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

let gSnippets;
let gSortable;


function $(eltID)
{
  return document.getElementById(eltID);
}


async function init()
{
  let bkgdWnd = await messenger.runtime.getBackgroundPage();
  gSnippets = bkgdWnd;
  let prefs = gSnippets.getPrefs();

  initSnippetsList();

  let newSnippetEditor = $("new-snippet-content");
  newSnippetEditor.placeholder = messenger.i18n.getMessage("newSnippetPlchldr");
  newSnippetEditor.setAttribute("spellcheck", prefs.checkSpelling);
  
  $("get-selection").addEventListener("click", e => { getSelectedText() });

  $("create").addEventListener("click", async (e) => { createSnippet() });

  $("insert-snippet").addEventListener("click", async (e) => { insertSnippet() });

  $("edit-snippet").addEventListener("click", e => { editSnippet() });

  $("dnd-rearrange").addEventListener("click", async (e) => { dndRearrange() });

  $("delete").addEventListener("click", e => { deleteSnippet() });

  $("import-and-export").addEventListener("click", e => { importAndExport() });

  $("close-window").addEventListener("click", e => {
    closeWnd();
  });

  let sortableList = $("snippets-sortable-list");
  let sortableOpts = {
    onStart(aEvent)
    {
      aEvent.target.classList.add("dnd-active");
    },

    onEnd(aEvent)
    {
      aEvent.target.classList.remove("dnd-active");
    }
  };
  
  gSortable = new Sortable(sortableList, sortableOpts);

  document.querySelector("#edit > .dlg-buttons > .btn-accept")
    .addEventListener("click", async (e) => { applyEdit() });
  document.querySelector("#edit > .dlg-buttons > .btn-cancel")
    .addEventListener("click", e => { cancelEdit() });

  document.querySelector("#rearrange-snippets > .dlg-buttons > .btn-accept")
    .addEventListener("click", e => { applyDndRearrange() });
  document.querySelector("#rearrange-snippets > .dlg-buttons > .btn-cancel")
    .addEventListener("click", e => { cancelDndRearrange() });

  document.querySelector("#import-export > #import > #import-row > #import-csv")
    .addEventListener("click", async (e) => { importCSV() });
  document.querySelector("#import-export > #export > #export-csv")
    .addEventListener("click", async (e) => { exportCSV() });
  document.querySelector("#import-export > .dlg-buttons > .btn-close")
    .addEventListener("click", e => { closeImportAndExport() });

  messenger.runtime.onMessage.addListener(msg => {
    if (msg.id == "new-from-selection") {
      gSnippets.log(`Snippets: Extension page received message "${msg.id}"`);

      if (msg.content.trim() == "") {
	return;
      }

      $("new-snippet-content").value = DOMPurify.sanitize(msg.content);
    }
  });

  document.addEventListener("keydown", async (e) => {
    function isDlgVisible(dlgID)
    {
      if (dlgID == "main-window") {
        let mainWndDisplay = document.getElementById(dlgID).style.display;
        return (!mainWndDisplay || mainWndDisplay == "block");
      }
      return (document.getElementById(dlgID).style.display == "block");
    }

    if (e.key == "Enter") {
      if (isDlgVisible("main-window") && e.target.id != "new-snippet-content") {
        insertSnippet();
      }
      else if (isDlgVisible("edit") && e.target.id != "snippet-editor") {
        document.querySelector(`#edit > .dlg-buttons > .btn-accept`).click();
      }
      else if (isDlgVisible("rearrange-snippets")) {
        document.querySelector(`#rearrange-snippets > .dlg-buttons > .btn-accept`).click();
      }
      else if (isDlgVisible("import-export")) {
        window.setTimeout(closeImportAndExport, 100);
      }
    }
    else if (e.key == "Escape") {
      if (isDlgVisible("main-window")) {
        closeWnd();
      }
      else if (isDlgVisible("edit")) {
        document.querySelector(`#edit > .dlg-buttons > .btn-cancel`).click();
      }
      else if (isDlgVisible("rearrange-snippets")) {
        document.querySelector(`#rearrange-snippets > .dlg-buttons > .btn-cancel`).click();
      }
      else if (isDlgVisible("import-export")) {
        window.setTimeout(closeImportAndExport, 100);
      }
    }
  });

  let snippetsList = $("snippets-list");
  if (snippetsList.options.length == 0) {
    newSnippetEditor.focus();
  }
}


async function initSnippetsList(clearList)
{
  let db = gSnippets.getSnippetsDB();
  let snippetsList = $("snippets-list");

  if (clearList) {
    while (snippetsList.hasChildNodes()) {
      snippetsList.removeChild(snippetsList.firstChild);
    }
  }

  await db.snippets.orderBy("displayOrder").each(snippet => {
    let option = document.createElement("option");
    option.value = snippet.id;
    option.textContent = snippet.name;
    snippetsList.appendChild(option);
  });

  if (snippetsList.length > 0) {
    snippetsList.selectedIndex = 0;
    snippetsList.scrollTo(0, 0);
    snippetsList.focus();
  }
}


function getSelectedText()
{
  let compTabID = gSnippets.getComposeTabID();
  let injectOpts = {
    code: `getSelectedText();`,
  };

  gSnippets.log("snippets.js::getSelectedText(): Executing compose script at compose tab ID: " + compTabID);;
  
  messenger.tabs.executeScript(compTabID, injectOpts);
}


async function createSnippet()
{
  let content = $("new-snippet-content").value;
  if (content.trim() == "") {
    return;
  }

  let name = gSnippets.createSnippetNameFromText(content);
      
  let db = gSnippets.getSnippetsDB();
  let numSnippets = await db.snippets.count();
  let newSnippetID = await db.snippets.add({name, content, displayOrder: numSnippets + 1});
  await initSnippetsList(true);

  showMsgBanner("create-confirm");
  $("new-snippet-content").value = "";
}


async function insertSnippet(closeWnd)
{
  let snippetID = getSelectedSnippetID();
  if (snippetID == -1) {
    return;
  }
  
  let db = gSnippets.getSnippetsDB();
  let snippet = await db.snippets.get(snippetID);
  let msg = {
    id: "insert-snippet",
    content: snippet.content,
  };

  await messenger.runtime.sendMessage(msg);

  if (closeWnd) {
    messenger.windows.remove(messenger.windows.WINDOW_ID_CURRENT);
  }
}


function getSelectedSnippetID()
{
  let rv;
  let snippetsList = $("snippets-list");
  if (snippetsList.selectedIndex != -1) {
    let selectedOpt = snippetsList.options[snippetsList.selectedIndex];
    rv = Number(selectedOpt.value);
  }
  else {
    rv = -1;
  }

  return rv;
}


async function editSnippet()
{
  let snippetID = getSelectedSnippetID();
  if (snippetID == -1) {
    return;
  }
  
  let db = gSnippets.getSnippetsDB();
  let snippet = await db.snippets.get(snippetID);
  
  $("main-window").style.display = "none";
  $("edit").style.display = "block";

  initEditDialog(snippet);
}


function initEditDialog(snippet)
{
  let prefs = gSnippets.getPrefs();
  let snippetEditor = $("snippet-editor");
  
  snippetEditor.value = snippet.content;
  snippetEditor.setAttribute("spellcheck", prefs.checkSpelling);
}


async function applyEdit()
{
  let snippetID = getSelectedSnippetID();
  if (snippetID == -1) {
    // This should never happen.
    gSnippets.warn("No snippet selected!");
    return;
  }
  
  let db = gSnippets.getSnippetsDB();
  let content = DOMPurify.sanitize($("snippet-editor").value);
  let updatedSnippet = { content };
  let updateSnippetName = ($("edit-snippet-name").checked && content.length > 0);
  
  if (updateSnippetName) {
    updatedSnippet.name = gSnippets.createSnippetNameFromText(content);
  }
  
  await db.snippets.update(snippetID, updatedSnippet);

  $("main-window").style.display = "block";
  $("edit").style.display = "none"; 
  $("snippet-editor").value = "";

  if (updateSnippetName) {
    initSnippetsList(true);
  }
}


function cancelEdit()
{
  $("main-window").style.display = "block";
  $("edit").style.display = "none"; 
}


async function dndRearrange()
{
  $("main-window").style.display = "none";
  $("rearrange-snippets").style.display = "block";

  await initRearrangeDialog();
}


async function initRearrangeDialog()
{
  let db = gSnippets.getSnippetsDB();
  let sortableList = $("snippets-sortable-list");

  await db.snippets.orderBy("displayOrder").each(snippet => {
    let listItem = document.createElement("div");
    listItem.dataset.id = snippet.id;
    let listItemTxt = document.createTextNode(snippet.name);
    listItem.appendChild(listItemTxt);
    
    sortableList.appendChild(listItem);
  });

  sortableList.scrollTo(0, 0);
}


function applyDndRearrange()
{
  let db = gSnippets.getSnippetsDB();
  let sortableList = $("snippets-sortable-list");
  let updates = [];
  
  for (let i = 0; i < sortableList.childNodes.length; i++) {
    let listItem = sortableList.childNodes[i];
    let snippetID = Number(listItem.dataset.id);
    updates.push(db.snippets.update(snippetID, {displayOrder: i + 1}));
  }

  Promise.all(updates).then(results => {
    sortableList.innerHTML = "";
    $("main-window").style.display = "block";
    $("rearrange-snippets").style.display = "none";
    initSnippetsList(true);
  });
}


function cancelDndRearrange()
{
  $("snippets-sortable-list").innerHTML = "";
  $("main-window").style.display = "block";
  $("rearrange-snippets").style.display = "none"; 
}


function closeImportAndExport()
{
  $("import-file-picker").value = "";
  $("import-export").style.display = "none";
  $("main-window").style.display = "block";
}


function deleteSnippet()
{
  let snippetID = getSelectedSnippetID();

  if (snippetID == 0 || snippetID == -1) {
    return;
  }

  let db = gSnippets.getSnippetsDB();
  db.snippets.delete(snippetID);
  updateDisplayOrder(db);

  let snippetsList = $("snippets-list");
  let selectedIdx = snippetsList.selectedIndex;
  let selectedOpt = snippetsList.options[selectedIdx];
  snippetsList.removeChild(selectedOpt);

  if (selectedIdx >= snippetsList.options.length) {
    snippetsList.selectedIndex = snippetsList.length - 1;
  }
  else {
    snippetsList.selectedIndex = selectedIdx;
  }
}


function updateDisplayOrder(snippetsDB)
{
  let seq = 1;
  snippetsDB.snippets.toCollection().modify(snippet => {
    snippet.displayOrder = seq++;
  });
}


function importAndExport()
{
  $("main-window").style.display = "none";
  $("import-export").style.display = "block";
}


async function importCSV()
{
  function sanitizeCSVData(csvData)
  {
    let rv = "";

    if (! csvData) {
      return rv;
    }
    if (csvData.startsWith('"')) {
      csvData = csvData.substring(1);
    }
    if (csvData.endsWith('"')) {
      csvData = csvData.substring(0, csvData.length - 1);
    }
    
    rv = DOMPurify.sanitize(csvData);

    return rv;
  }
  
  let inputFileElt = $("import-file-picker");
  if (inputFileElt.files.length == 0) {
    showMsgBanner("import-error-no-file");
    return;
  }

  let db = gSnippets.getSnippetsDB();
  let seq = await db.snippets.count();

  let importFile = inputFileElt.files[0];

  if (importFile.type == "text/csv" || importFile.name.endsWith(".csv")) {
    Papa.parse(importFile, {
      async complete(results) {
        let importedRows = [];
        
        results.data.forEach(row => {
          let newSnippet = {
            name: sanitizeCSVData(row[0]),
            content: sanitizeCSVData(row[1]),
            displayOrder: ++seq,
          };

          importedRows.push(db.snippets.add(newSnippet));
        });

        await Promise.all(importedRows);
        initSnippetsList(true);
        showMsgBanner("import-success");
      }
    });
  }
  else {
    showMsgBanner("import-error-invalid");
  }
}


async function exportCSV()
{ 
  let db = gSnippets.getSnippetsDB();
  let expData = [];

  await db.snippets.each(snippet => {
    expData.push([ snippet.name, snippet.content ]);
  });

  let cfgOpts = {
    quotes: true,
  };
  let csvData = Papa.unparse(expData, cfgOpts);
  let blobData = new Blob([csvData], { type: "text/csv;charset=utf-8" });
  
  saveToFile(blobData, aeConst.CSV_EXPORT_FILENAME);
}


function saveToFile(aBlobData, aFilename)
{
  messenger.downloads.download({
    url: URL.createObjectURL(aBlobData),
    filename: aFilename,
    saveAs: true
  }).then(aDownldItemID => {
    return messenger.downloads.search({ id: aDownldItemID });

  }).then(aDownldItems => {

    if (aDownldItems && aDownldItems.length > 0) {
      let exportFilePath = aDownldItems[0].filename;

      messenger.aeSnippets.alert(messenger.i18n.getMessage("extName"), messenger.i18n.getMessage("msgExpFinish", exportFilePath));
    }
  }).catch(aErr => {
    // An exception would be thrown if the user cancelled the download.
    console.error(aErr);
  });
}


function showMsgBanner(msgBannerID)
{
  $(msgBannerID).style.display = "inline";
  window.setTimeout(() => {$(msgBannerID).style.display = "none"}, 2500);
}


function closeWnd()
{
  messenger.windows.remove(messenger.windows.WINDOW_ID_CURRENT);
}


document.addEventListener("DOMContentLoaded", async (e) => { init() });
