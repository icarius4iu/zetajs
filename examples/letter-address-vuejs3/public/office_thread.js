/* -*- Mode: JS; tab-width: 2; indent-tabs-mode: nil; js-indent-level: 2; fill-column: 100 -*- */
// SPDX-License-Identifier: MIT

// Debugging note:
// Switch the web worker in the browsers debug tab to debug this code.
// It's the "em-pthread" web worker with the most memory usage, where "zetajs" is defined.

// JS mode: module
import { ZetaHelperThread } from './assets/vendor/zetajs/zetaHelper.js';


// global variables - zetajs environment:
const zHT = new ZetaHelperThread();
const zetajs = zHT.zetajs;
const css = zHT.css;
const desktop = zHT.desktop;

// = global variables (some are global for easier debugging) =
// common variables:
let tableXModel, letterXModel, tableCtrl, letterCtrl;
// example specific:
let writerModuleConfigured=false, calcModuleConfigured=false;
const readyList = {Fonts: false, Window: false};
let uiReadyPending = false;  // true while exactly one ui_ready is still owed for the current (re)load
let letterFrame, tableFrame, fontsList, switchVals;
// switchVals needed globally in case the user switches tabs rapidly.
let bean_overwrite, bean_odt_export, bean_pdf_export;

// Export variables for debugging. Available for debugging via:
//   globalThis.zetajsStore.threadJsContext
export { zHT, tableXModel, letterXModel, tableCtrl, letterCtrl,
  bean_overwrite, bean_odt_export, bean_pdf_export };


function demo() {
  bean_overwrite = new css.beans.PropertyValue({Name: 'Overwrite', Value: true});
  bean_odt_export = new css.beans.PropertyValue({Name: 'FilterName', Value: 'writer8'});
  bean_pdf_export = new css.beans.PropertyValue({Name: 'FilterName', Value: 'writer_pdf_Export'});

  zHT.configDisableToolbars(['Writer', 'Calc']);
  try {
    loadFile('both');
    tableToHtml();
  } catch (err) {
    zHT.thrPort.postMessage({cmd: 'load_error', message: String((err && err.message) || err)});
  }

  zHT.thrPort.onmessage = (e) => {
    switch (e.data.cmd) {
    case 'switch_tab':
      if (e.data.id === 'letter') {
        switchVals = [true, false];
        tableToHtml();
      } else switchVals = [false, true];  // table
      const setVals = () => {
        letterFrame.getContainerWindow().FullScreen = switchVals[0];
        tableFrame.getContainerWindow().FullScreen = switchVals[1];
        zHT.thrPort.postMessage({cmd: 'resizeEvt'});
      }
      setVals();  // sometimes needed twice to apply resize
      setTimeout(() => { setVals(); }, 500);
      break;
    case 'download':
      const format = e.data.id === 'btnOdt' ? bean_odt_export : bean_pdf_export;
      letterXModel.storeToURL( 'file:///tmp/output', [bean_overwrite, format]);
      zHT.thrPort.postMessage({cmd: 'download', id: e.data.id});
      break;
    case 'reload':
      try {
        const letterForeground = e.data.id;
        if (letterForeground) letterXModel.close(true);
        else tableXModel.close(true);
        loadFile(letterForeground ? 'letter' : 'table');
      } catch (err) {
        zHT.thrPort.postMessage({cmd: 'load_error', message: String((err && err.message) || err)});
      }
      break;
    case 'generateInvoice':
      try {
        generateInvoice(e.data.data);
        zHT.thrPort.postMessage({cmd: 'resizeEvt'});  // nudge the canvas to repaint
      } catch (err) {
        console.error('generateInvoice failed:', err);
        zHT.thrPort.postMessage({cmd: 'invoice_error', message: String((err && err.message) || err)});
      }
      break;
    case 'toggleFormat':
      const params = [];
      const value = e.data.value;
      for (let i = 0; i < value.length; i++) {
        params[i] = new css.beans.PropertyValue({Name: value[i][0], Value: value[i][1]});
      }
      zHT.dispatch(letterCtrl, e.data.id, params);
      break;
    case 'insertAddress':
      const recipient = e.data.recipient;
      const fieldsEnum = letterXModel.getTextFields().createEnumeration();
      let state_count=0, city_count=0, postal_code_count=0, street_count=0;
      while (fieldsEnum.hasMoreElements()) {
        const field = fieldsEnum.nextElement().getAnchor();
        switch (field.getString()) {
          case "<Recipient's Title>": // additional space is needed
            field.setString(recipient[0] === '' ? '' : recipient[0]+' ');  // recipient
            break;
          case "<Recipient's name>":
            field.setString(recipient[1]);
            break;
          case "<Recipient's street>":
            field.setString(recipient[2]);
            break;
          case "<Recipient's postal code>":  // additional space is needed
            field.setString(recipient[3]+' ');
            break;
          case "<Recipient's city>":
            field.setString(recipient[4]);
            break;
          case "<Recipient's state>":
            field.setString(recipient[5]);
            break;
          case "<Sender's name>":
            field.setString("Dent, Arthur Phillip");
            break;
          case "<Sender's Company Name>":
            field.setString("Cottingshire Radio");
            break;
          case "<Sender's street>":
            field.setString("155 Country Lane");
            break;
          case "<Sender's postal code>":  // additional space is needed
            field.setString("2A 2A2A"+' ');
            break;
          case "<Sender's city>":
            field.setString("Cottington");
            break;
          case "<Sender's state>":
            field.setString("Cottingshire County");
            break;
        }
      }
      break;
    default:
      throw Error('Unknown message command: ' + e.data.cmd);
    }
  }
}


function tableToHtml() {
  const activeSheet = tableCtrl.getActiveSheet();
  const data = [];
  let row_10 = 0;
  let local_row = 0;
  while (local_row >= 0) {
    local_row = 0;
    const lines_block = activeSheet.
      getCellRangeByPosition(0, row_10*10+1, 5, row_10*10+9+1).getDataArray();
    while (local_row >= 0 && local_row < 10) {
      const recipient = [];
      for (let rowData of lines_block[local_row]) recipient.push(rowData);
      if (!recipient.reduce((acc,v) => acc &&= v==='', true)) {
        data.push(recipient);
        local_row += 1;
      } else local_row = -1;
    }
    if (local_row > 0) local_row = 0;
    row_10 += 1;
  }
  zHT.thrPort.postMessage({cmd: 'addrData', data});
}


// Build an invoice from a plain data object: scalar header fields plus a
// dynamically sized Writer text table (one row per item) and a totals row.
// This is the "report engine" core - data in, document out, all via UNO.
function generateInvoice(data) {
  const xText = letterXModel.getText();
  xText.setString('');                       // clear the document body
  const cursor = xText.createTextCursor();

  // Title.
  cursor.setPropertyValue('CharWeight', css.awt.FontWeight.BOLD);
  cursor.setPropertyValue('CharHeight', 20);
  xText.insertString(cursor, 'INVOICE', false);
  xText.insertControlCharacter(cursor, css.text.ControlCharacter.PARAGRAPH_BREAK, false);

  // Scalar header fields.
  cursor.setPropertyValue('CharWeight', css.awt.FontWeight.NORMAL);
  cursor.setPropertyValue('CharHeight', 12);
  for (const line of ['Bill to: ' + data.customer,
                      'Invoice #: ' + data.number,
                      'Date: ' + data.date]) {
    xText.insertString(cursor, line, false);
    xText.insertControlCharacter(cursor, css.text.ControlCharacter.PARAGRAPH_BREAK, false);
  }
  xText.insertControlCharacter(cursor, css.text.ControlCharacter.PARAGRAPH_BREAK, false);

  // Dynamic items table: header row + one row per item + a totals row.
  const headers = ['Description', 'Qty', 'Unit price', 'Amount'];
  const items = data.items || [];
  const table = letterXModel.createInstance('com.sun.star.text.TextTable');
  table.initialize(items.length + 2, headers.length);
  xText.insertTextContent(cursor, table, false);

  const colName = (c) => String.fromCharCode(65 + c);  // 0 -> 'A', 1 -> 'B', ...
  headers.forEach((h, c) => table.getCellByName(colName(c) + '1').setString(h));

  let total = 0;
  items.forEach((it, i) => {
    const qty = Number(it.qty) || 0;
    const price = Number(it.price) || 0;
    const amount = qty * price;
    total += amount;
    const row = i + 2;  // row 1 is the header
    table.getCellByName('A' + row).setString(String(it.desc));
    table.getCellByName('B' + row).setString(String(qty));
    table.getCellByName('C' + row).setString(price.toFixed(2));
    table.getCellByName('D' + row).setString(amount.toFixed(2));
  });

  const totalRow = items.length + 2;
  table.getCellByName('A' + totalRow).setString('TOTAL');
  table.getCellByName('D' + totalRow).setString(total.toFixed(2));
}


function loadFile(fileTab) {
  // Reset the readiness gate for this (re)load so exactly one ui_ready is posted.
  readyList.Window = false;
  uiReadyPending = true;
  if (fileTab != 'letter') {  // table or both
    tableXModel = desktop.loadComponentFromURL('file:///tmp/table.ods', '_default', 0, []);
    tableCtrl = tableXModel.getCurrentController();
    if (!calcModuleConfigured) {
      calcModuleConfigured = true;
      // Permanant Calc module toggles. Don't run again on a document reload.
      zHT.dispatch(tableCtrl, 'Sidebar', []);
      zHT.dispatch(tableCtrl, 'InputLineVisible', []); // FormulaBar at the top
    }
    tableFrame = tableCtrl.getFrame();
    // Turn off UI elements (idempotent operations):
    tableFrame.LayoutManager.hideElement("private:resource/statusbar/statusbar");
    tableFrame.LayoutManager.hideElement("private:resource/menubar/menubar");
    tableCtrl.setPropertyValue('SheetTabs', false);
    if (fileTab == 'table') {
      // Storing the getContainerWindow() result is unstable.
      tableFrame.getContainerWindow().setPosSize(-1000,-1000,500,500,15);
      tableFrame.getContainerWindow().FullScreen = true;
    }
  }

  if (fileTab != 'table') {  // letter or both
    letterXModel = desktop.loadComponentFromURL('file:///tmp/letter.odt', '_default', 0, []);
    letterCtrl = letterXModel.getCurrentController();
    if (!writerModuleConfigured) {
      writerModuleConfigured = true;
      // Permanant Writer module toggles. Don't run again on a document reload.
      zHT.dispatch(letterCtrl, 'Sidebar', []);
      zHT.dispatch(letterCtrl, 'Ruler', []);
    }
    letterFrame = letterCtrl.getFrame();
    // Turn off UI elements (idempotent operations):
    letterFrame.LayoutManager.hideElement("private:resource/statusbar/statusbar");
    letterFrame.LayoutManager.hideElement("private:resource/menubar/menubar");
    // Storing the getContainerWindow() result is unstable.
    letterFrame.getContainerWindow().setPosSize(-1000,-1000,500,500,15);
    letterFrame.getContainerWindow().FullScreen = true;

    // Get font list for toolbar. This must never strand readiness: if the
    // FontNameList status event is slow or never arrives, fall back after a few
    // seconds so the loading overlay still resolves (the font list is just
    // cosmetic data for the toolbar, not required for the document to be usable).
    readyList.Fonts = false;
    let fontsFallback = setTimeout(() => startupReady('Fonts'), 5000);
    try {
      const fontsUrlObj = zHT.transformUrl('FontNameList');
      const fontsDispatcher = zHT.queryDispatch(letterCtrl, fontsUrlObj);
      const fontsDispatchNotifier = css.frame.XDispatch.constructor(fontsDispatcher);
      const fontListener = zetajs.unoObject(
        [css.frame.XStatusListener],
        { statusChanged(e) {
            clearTimeout(fontsFallback);
            fontsDispatchNotifier.removeStatusListener(fontListener, fontsUrlObj);
            fontsList = zetajs.fromAny(e.State);
            startupReady('Fonts');
        }});
      fontsDispatchNotifier.addStatusListener(fontListener, fontsUrlObj);
    } catch (err) {
      console.error('FontNameList listener setup failed; continuing without a font list:', err);
      clearTimeout(fontsFallback);
      startupReady('Fonts');
    }

    for (const id of [
        'Bold', 'Italic', 'Underline',
        'Overline', 'Strikeout', 'Shadowed', 'Color', 'CharBackColor',
        'LeftPara', 'CenterPara', 'RightPara', 'JustifyPara', 'DefaultBullet',
        'FontHeight', 'CharFontName'
        ]) {
      const urlObj = zHT.transformUrl(id);
      const listener = zetajs.unoObject([css.frame.XStatusListener], {
        disposing: (source) => {},
        statusChanged: (rawSt) => {  // rawState
          rawSt = zetajs.fromAny(rawSt.State);
          // If a non uniformly formatted area is selected, state may contain an invalid value.
          let state;
          if (id === 'FontHeight') {
            if (typeof rawSt.Height === 'number') state = Math.round(rawSt.Height * 10) / 10;
          } else if (id === 'CharFontName') {
            if (typeof rawSt.Name === 'string') state = rawSt.Name;
          } else if (['Color', 'CharBackColor'].includes(id)) {
            if (typeof rawSt === 'number') {
              if (id === 'Color' && rawSt === -1) rawSt = 0x000000;
              else if (id === 'CharBackColor' && rawSt === -1) rawSt = 0xFFFFFF;
              state = '#' + (0x1000000 + rawSt).toString(16).substring(1, 7);  // int to #RRGGBB
            }
          } else if (typeof rawSt === 'boolean') state = rawSt;
          else state = false;  // Behave like desktop UI if a non uniformly formatted area is selected.
          if (typeof state !== 'undefined') zetajs.mainPort.postMessage({cmd: 'setFormat', id, state});
        }
      });
      zHT.queryDispatch(letterCtrl, urlObj).addStatusListener(listener, urlObj);
    }
  }
  startupReady('Window');
}


function startupReady(startupStep) {
  readyList[startupStep] = true;
  if (uiReadyPending && Object.values(readyList).indexOf(false) == -1) {
    uiReadyPending = false;  // ensure ui_ready is posted exactly once per (re)load
    zHT.thrPort.postMessage({cmd: 'ui_ready', fontsList});
  }
}

demo();  // launching demo

/* vim:set shiftwidth=2 softtabstop=2 expandtab cinoptions=b1,g0,N-s cinkeys+=0=break: */
