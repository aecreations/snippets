/* -*- mode: javascript; tab-width: 8; indent-tabs-mode: nil; js-indent-level: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


const DEBUG = true;
const HTMLPASTE_AS_FORMATTED = 1;
const HTMLPASTE_AS_IS = 2;


function getSelectedText()
{
  log("Snippets::compose.js::getSelectedText()");
  
  let selection = document.defaultView.getSelection();
  let content = selection.toString() || "";
  let msg = {
    id: "new-from-selection",
    content,
  };

  log(`Snippets::compose.js::getSelectedText(): Sending selected text to extension page`);
  
  // Can't use `messenger` namespace inside a compose script.
  browser.runtime.sendMessage(msg);
}


function insertSnippet(content, isPlainText, htmlPasteMode)
{
  log("Snippets::compose.js: >> insertSnippet()");
  
  if (isPlainText) {
    document.execCommand("insertText", false, content);
  }
  else {
    insertTextIntoRichTextEditor(document, content, true, htmlPasteMode);
  }
}


//
// Helper functions
//

function insertTextIntoRichTextEditor(aRichTextEditorDocument, aClippingText, aAutoLineBreak, aPasteMode)
{
  log("Snippets::compose.js: >> insertTextIntoRichTextEditor()");

  let hasHTMLTags = aClippingText.search(/<[a-z1-6]+( [a-z]+(\="?.*"?)?)*>/i) != -1;
  let hasRestrictedHTMLTags = aClippingText.search(/<\?|<%|<!DOCTYPE|(<\b(html|head|body|meta|script|applet|embed|object|i?frame|frameset)\b)/i) != -1;
  let clippingText = aClippingText;

  if (hasHTMLTags) {
    if (hasRestrictedHTMLTags || aPasteMode == HTMLPASTE_AS_IS) {
      clippingText = clippingText.replace(/&/g, "&amp;");
      clippingText = clippingText.replace(/</g, "&lt;");
      clippingText = clippingText.replace(/>/g, "&gt;");
    }
  }
  else {
    // Could be plain text but with angle brackets, e.g. for denoting URLs
    // or email addresses, e.g. <joel_user@acme.com>, <http://www.acme.com>
    let hasOpenAngleBrackets = clippingText.search(/</) != -1;
    let hasCloseAngleBrackets = clippingText.search(/>/) != -1;

    if (hasOpenAngleBrackets) {
      clippingText = clippingText.replace(/</g, "&lt;");
    }
    if (hasCloseAngleBrackets) {
      clippingText = clippingText.replace(/>/g, "&gt;");	  
    }
  }

  let hasLineBreakTags = clippingText.search(/<br|<p/i) != -1;
  if (aAutoLineBreak && !hasLineBreakTags) {
    clippingText = clippingText.replace(/\n/g, "<br>");
  }

  try {
    aRichTextEditorDocument.execCommand("insertHTML", false, clippingText);
  }
  catch (e) {}

  return true;
}


//
// Error reporting and debugging output
//

function log(aMessage)
{
  if (DEBUG) { console.log(aMessage); }
}


function info(aMessage)
{
  if (DEBUG) { console.info(aMessage); }
}


function warn(aMessage)
{
  if (DEBUG) { console.warn(aMessage); }
}
