/**
 * Google Apps Script для анкеты wedding-invite
 *
 * Установка:
 * 1. Google Таблица → Расширения → Apps Script
 * 2. Вставь этот код, сохрани
 * 3. Развернуть → Новое развёртывание → Веб-приложение
 *    — Выполнять как: Я
 *    — Доступ: Все
 * 4. URL вставь в config.json → formEndpoint
 */

var SHEET_NAME = 'Ответы';

var HEADERS = [
  'Дата',
  'Код гостя',
  'Имена',
  'Вы придёте?',
  'Алкоголь',
  'Аллергии',
  'Трансфер туда',
  'Трансфер обратно',
  'Пожелания',
];

function doPost(e) {
  try {
    var sheet = getSheet_();
    var data = (e && e.parameter) ? e.parameter : {};

    sheet.appendRow([
      formatDate_(data.submitted_at),
      data.guest_code || '',
      data.name || '',
      data.attending || '',
      data.alcohol || '',
      data.allergies || '',
      data.bus_to || '',
      data.bus_back || '',
      data.wishes || '',
    ]);

    return jsonResponse_({ result: 'ok' });
  } catch (err) {
    return jsonResponse_({ result: 'error', message: String(err) });
  }
}

function doGet() {
  return jsonResponse_({ status: 'ok', message: 'Wedding RSVP endpoint is running' });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  ensureHeaders_(sheet);
  return sheet;
}

function ensureHeaders_(sheet) {
  var firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  var hasHeaders = firstRow.some(function (cell) {
    return String(cell).trim() !== '';
  });

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
}

function formatDate_(isoString) {
  if (!isoString) {
    return Utilities.formatDate(new Date(), 'Europe/Moscow', 'dd.MM.yyyy HH:mm:ss');
  }

  var date = new Date(isoString);
  if (isNaN(date.getTime())) {
    return isoString;
  }

  return Utilities.formatDate(date, 'Europe/Moscow', 'dd.MM.yyyy HH:mm:ss');
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
