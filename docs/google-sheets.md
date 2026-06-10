# Настройка Google Таблицы для сбора ответов

## Шаг 1. Создать таблицу

1. Открой [Google Таблицы](https://sheets.google.com) и создай новую таблицу.
2. Назови её **«Свадьба — анкета»**.

Заголовки колонок скрипт создаст автоматически при первом ответе. Если хочешь задать их вручную, используй такой порядок:

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| Дата | Код гостя | Имена | Вы придёте? | Алкоголь | Аллергии | Трансфер туда | Трансфер обратно | Пожелания |

---

## Шаг 2. Вставить Apps Script

1. В таблице выбери меню: **Расширения → Apps Script**.
2. Удали весь код в редакторе и вставь содержимое файла [`form-apps-script.js`](./form-apps-script.js)  
   (или скопируй код ниже).
3. Сохрани: **Ctrl+S** (или **Cmd+S**).

```javascript
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
```

---

## Соответствие полей анкеты

| Поле в таблице | Параметр из формы | Вопрос на сайте |
|---|---|---|
| Дата | `submitted_at` | время отправки |
| Код гостя | `guest_code` | код из ссылки `?g=...` |
| Имена | `name` | Ваши имена * |
| Вы придёте? | `attending` | `конечно, да` / `к сожалению, нет` |
| Алкоголь | `alcohol` | несколько значений через запятую |
| Аллергии | `allergies` | Аллергии или пищевые ограничения |
| Трансфер туда | `bus_to` | `да` / `нет` / `сообщим позже` |
| Трансфер обратно | `bus_back` | вечером / утром / `нет` / `сообщим позже` |
| Пожелания | `wishes` | свободный текст |

---

## Шаг 3. Задеплоить как Web App

1. Нажми **«Развернуть» → «Новое развёртывание»**.
2. Слева выбери тип **«Веб-приложение»**.
3. Заполни настройки:
   - **Выполнять как**: Я (свой аккаунт)
   - **Кому разрешён доступ**: Все (Anyone)
4. Нажми **«Развернуть»**.
5. Разреши доступ — появится окно с правами (нажми «Разрешить»).
6. Скопируй **URL веб-приложения** — он выглядит так:
   ```
   https://script.google.com/macros/s/AKfy.../exec
   ```

---

## Шаг 4. Вставить URL в config.json

Открой файл `config.json` в корне проекта и замени значение `formEndpoint`:

```json
"formEndpoint": "https://script.google.com/macros/s/AKfy.../exec"
```

---

## Шаг 5. Проверить

1. Запусти сайт через локальный сервер (`python3 -m http.server 8000`) — иначе `config.json` не загрузится.
2. Заполни анкету и нажми «Отправить».
3. Открой Google Таблицу — на листе **«Ответы»** должна появиться новая строка.

Проверка endpoint в браузере: открой URL скрипта — должен вернуться JSON  
`{"status":"ok","message":"Wedding RSVP endpoint is running"}`.

---

## Просмотр ответов

- Каждый новый ответ — новая строка на листе **«Ответы»**.
- Подсчёт подтвердивших: `=COUNTIF(D:D,"конечно, да")`
- Подсчёт отказов: `=COUNTIF(D:D,"к сожалению, нет")`
- Фильтр: **Данные → Создать фильтр**.
- Экспорт: **Файл → Скачать → Microsoft Excel (.xlsx)**.

---

## Обновление скрипта

Если изменишь поля анкеты:

1. Обнови `HEADERS` и `appendRow` в Apps Script.
2. Обнови отправку в `app.js`.
3. Задеплой заново: **Развернуть → Управление развёртываниями → ✏️ Редактировать → сохрани как новую версию**.
