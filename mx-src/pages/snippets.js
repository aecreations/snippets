/* -*- mode: javascript; tab-width: 8; indent-tabs-mode: nil; js-indent-level: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


const TIMEOUT_MS = 2500;

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

  initSnippetsList();

  $("get-selection").addEventListener("click", e => { getSelectedText() });

  $("create").addEventListener("click", async (e) => { createSnippet() });

  $("insert-snippet").addEventListener("click", async (e) => { insertSnippet() });

  $("edit-snippet").addEventListener("click", e => { editSnippet() });

  $("dnd-rearrange").addEventListener("click", async (e) => { dndRearrange() });

  $("delete").addEventListener("click", e => { deleteSnippet() });

  $("close-window").addEventListener("click", e => {
    messenger.windows.remove(messenger.windows.WINDOW_ID_CURRENT);
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

  messenger.runtime.onMessage.addListener(msg => {
    if (msg.id == "new-from-selection") {
      gSnippets.log(`Snippets: Extension page received message "${msg.id}"`);

      if (msg.content.trim() == "") {
	return;
      }

      $("new-snippet-content").value = DOMPurify.sanitize(msg.content);
    }
  });
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

  $("create-confirm").style.visibility = "visible";
  window.setTimeout(() => {$("create-confirm").style.visibility = "hidden"}, TIMEOUT_MS);
  $("new-snippet-content").value = "";
}


async function insertSnippet()
{
  let snippetID = getSelectedSnippetID();
  if (snippetID == -1) {
    window.alert("Select a snippet.");
    return;
  }
  
  let db = gSnippets.getSnippetsDB();
  let snippet = await db.snippets.get(snippetID);
  let msg = {
    id: "insert-snippet",
    content: snippet.content,
  };

  // BUG: This will throw an error if `msg.content` contains unescaped line breaks!
  await messenger.runtime.sendMessage(msg);

  // Close the popup window.
  // BUG - This doesn't work (the value of the window ID is always -1)
  //messenger.windows.remove(messenger.windows.WINDOW_ID_CURRENT);
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
  $("snippet-editor").value = snippet.content;
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


document.addEventListener("DOMContentLoaded", async (e) => { init() });
