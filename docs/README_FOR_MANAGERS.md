# Инструкция по подключению Eventicious MCP к AI-агенту

Эта инструкция для менеджера или клиента, который хочет подключить AI-агента к Eventicious.

Eventicious MCP позволяет агенту безопасно работать с данными Eventicious: пользователями, группами, каталогами, расписанием, курсами, экспонентами и другими разделами.

Главное правило: сначала всегда делайте preview. Реальные изменения выполняются только после отдельного подтверждения.

---

## Что понадобится

Перед началом подготовьте:

1. Рабочий компьютер.
2. Один из AI-клиентов:
   - OpenCode;
   - Claude Code;
   - Codex.
3. Ваши Eventicious API credentials:
   - Eventicious Base URL;
   - Client ID;
   - Client Secret.
4. MCP endpoint:

```text
https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru/mcp
```

В этой инструкции не описывается, где брать Client ID и Client Secret. Предполагается, что они у вас уже есть.

---

## Шаг 1. Установите AI-клиент

Выберите один клиент, с которым будете работать.

### Вариант А. OpenCode

1. Скачайте и установите OpenCode по официальной инструкции.
2. Откройте OpenCode.
3. Убедитесь, что можете открыть рабочую папку и начать новый чат.

### Вариант Б. Claude Code

1. Скачайте и установите Claude Code по официальной инструкции.
2. Откройте Claude Code.
3. Убедитесь, что можете открыть рабочую папку и начать новый чат.

### Вариант В. Codex

1. Скачайте и установите Codex по официальной инструкции.
2. Откройте Codex.
3. Убедитесь, что можете открыть рабочую папку и начать новый чат.

Если установка клиента уже выполнена, переходите к следующему шагу.

---

## Шаг 2. Создайте рабочую папку

Создайте отдельную папку для подключения Eventicious MCP.

Пример для Windows:

1. Откройте Рабочий стол.
2. Создайте папку:

```text
Eventicious MCP
```

Пример пути:

```text
C:\Users\<ваш_пользователь>\Desktop\Eventicious MCP
```

Дальше все файлы нужно создавать именно в этой папке.

---

## Шаг 3. Создайте файл `.env`

Файл `.env` нужен, чтобы хранить ваши локальные ключи и токен подключения.

### Как создать файл через Блокнот

1. Откройте папку `Eventicious MCP`.
2. Нажмите правой кнопкой мыши внутри папки.
3. Выберите **Создать → Текстовый документ**.
4. Откройте файл.
5. Вставьте шаблон ниже.
6. Сохраните файл с названием:

```text
.env
```

Важно: файл должен называться именно `.env`, а не `.env.txt`.

Если Windows скрывает расширения файлов, включите отображение расширений в Проводнике. Иначе файл может случайно сохраниться как `.env.txt`.

### Что вставить в `.env`

```env
EVENTICIOUS_BASE_URL=https://api-integration.eventicious.ru/
EVENTICIOUS_CLIENT_ID=вставьте_ваш_client_id
EVENTICIOUS_CLIENT_SECRET=вставьте_ваш_client_secret
```

Замените значения:

```text
вставьте_ваш_client_id
вставьте_ваш_client_secret
```

на ваши реальные Eventicious API credentials.

Не отправляйте `EVENTICIOUS_CLIENT_SECRET` в общий чат. Не публикуйте файл `.env`. Не добавляйте его в GitHub.

---

## Шаг 4. Откройте новый чат внутри этой папки

Откройте ваш AI-клиент и выберите папку:

```text
Eventicious MCP
```

Важно, чтобы новый чат был открыт именно внутри этой папки. Агент должен видеть файл `.env`.

---

## Шаг 5. Отправьте промт для получения MCP token

Скопируйте и отправьте агенту этот промт:

```text
Ты находишься в папке, где лежит файл .env с моими Eventicious API credentials.

Задача:
1. Прочитай значения из файла .env:
   - EVENTICIOUS_BASE_URL
   - EVENTICIOUS_CLIENT_ID
   - EVENTICIOUS_CLIENT_SECRET

2. Отправь POST-запрос на:
   https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru/auth/exchange

3. В JSON body передай:
   - baseUrl = EVENTICIOUS_BASE_URL
   - clientId = EVENTICIOUS_CLIENT_ID
   - clientSecret = EVENTICIOUS_CLIENT_SECRET

4. Получи из ответа поле mcpToken.

5. Добавь в файл .env новую строку:
   EVENTICIOUS_MCP_TOKEN=<полученный_mcp_token>

6. Не удаляй старые строки из .env.

7. Создай в этой же папке файл .mcp.json со следующим содержимым:

{
  "mcpServers": {
    "eventicious": {
      "type": "http",
      "url": "https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru/mcp",
      "headers": {
        "Authorization": "Bearer ${EVENTICIOUS_MCP_TOKEN}"
      },
      "timeout": 120000
    }
  }
}

Для картинок внутри текстовых блоков пользователь загружает изображение в любое публичное хранилище и передаёт ссылку как imageUrl.

Важно:
- не выводи EVENTICIOUS_CLIENT_SECRET в ответ;
- не выводи полный MCP token в ответ;
- не отправляй содержимое .env в чат;
- если нужно показать токен, покажи только первые и последние 6 символов;
- после выполнения напиши только краткий отчёт:
  "MCP token получен, .env обновлён, .mcp.json создан".
```

После успешного выполнения в файле `.env` должна появиться строка:

```env
EVENTICIOUS_MCP_TOKEN=mcp_evt_...
```

А в папке должен появиться файл:

```text
.mcp.json
```

---

## Шаг 6. Перезапустите чат

После создания `.mcp.json` лучше закрыть текущий чат и открыть новый чат в этой же папке.

Это нужно, чтобы AI-клиент заново прочитал MCP-настройки.

Проверьте:

1. Папка всё ещё та же:

```text
Eventicious MCP
```

2. В папке есть файл:

```text
.env
```

3. В папке есть файл:

```text
.mcp.json
```

4. В `.env` есть строка:

```env
EVENTICIOUS_MCP_TOKEN=mcp_evt_...
```

---

## Шаг 7. Отправьте первый проверочный промт

В новом чате отправьте:

```text
Проверь подключение к Eventicious MCP.

Сделай только безопасные read-only проверки:
1. Проверь, что MCP-сервер доступен.
2. Проверь, что MCP token валиден.
3. Проверь, что доступно 75 MCP tools.
4. Не выполняй create/update/delete операции.
5. Не запускай операции с dry_run=false.
6. Не выводи секреты из .env.
7. Не выводи полный MCP token.

В ответ напиши:
- подключение работает или нет;
- сколько tools доступно;
- какие read-only tools можно использовать для первой проверки.
```

Ожидаемый результат:

```text
Подключение работает.
Доступно 75 MCP tools.
```

Если агент пишет, что tools не видны, перейдите к разделу “Частые ошибки”.

---

## Шаг 8. Сделайте первый безопасный запрос

После проверки подключения отправьте:

```text
Сделай безопасную проверку Eventicious.

Используй только read-only tools.
Ничего не создавай, не обновляй и не удаляй.

Проверь:
1. Валидны ли credentials.
2. Можно ли получить список ACL-групп.
3. Можно ли получить список каталогов.

В ответ дай краткий отчёт.
```

Это безопасная проверка. Она не должна менять данные в Eventicious.

---

## Шаг 9. Как безопасно работать с изменениями

Не просите агента сразу “создать”, “обновить” или “удалить” данные.

Сначала просите preview.

Пример:

```text
Подготовь preview создания пользователей из этого файла.

Важно:
- используй dry_run=true;
- ничего реально не создавай;
- покажи, какие пользователи будут созданы;
- покажи ошибки и предупреждения;
- не выполняй операцию без моего отдельного подтверждения.
```

Проверьте preview. Если всё правильно, можно дать отдельное подтверждение:

```text
Я проверил preview.

Выполни операцию реально:
dry_run=false
confirm=true
```

Для опасных операций агент может попросить дополнительную строку подтверждения `danger_confirm`. Это нормально. Такая защита нужна, чтобы случайно не удалить или не изменить данные.

---

## Шаг 10. Что можно делать через Eventicious MCP

Eventicious MCP помогает с такими задачами:

- проверка подключения к Eventicious;
- работа с пользователями;
- работа с ACL-группами;
- перенос пользователей между группами;
- работа с каталогами и материалами;
- работа с расписанием (включая mass-import расписания через Excel/CSV);
- работа с курсами (включая загрузку обложек по URL, base64 или готовым ID, импорт структуры курсов с автоматической нормализацией типов этапов и условий перехода);
- работа с Text 2.0 / GravityJson (включая вставку inline-изображений через ImgBB);
- работа с экспонентами;
- работа с геймификацией;
- подготовка import-планов;
- preview изменений перед выполнением.

### Изображения

**Обложки курсов:**
- Загружаются через Eventicious API → возвращают `fileId` / `thumbnailFileId`
- Используются в `coverImageFileId` / `coverImageThumbnailFileId`

**Inline-изображения в Text 2.0:**
- Картинка внутри текста требует **публичный URL** (доступен без авторизации)
- Пользователь загружает изображение в любое хранилище (Google Drive, Яндекс Диск, ImgBB, GitHub Pages, CDN) и передаёт ссылку как `imageUrl`
- MCP вставит URL в GravityJson `image.attrs.src`

> **Внимание:** `fileId` подходит только для обложки курса, но не для картинки внутри текста. Для Text 2.0 нужен публичный URL.

### Создание курса: рабочий skeleton

> **Важно:** Минимальный payload приводит к HTTP 500. Eventicious create course endpoint плохо отвечает, если не хватает важных полей. Всегда используйте полный course skeleton.

**Workflow:**
1. Загрузите обложку через `eventicious_upload_course_images` → получите `coverImageFileId` + `coverImageThumbnailFileId`
2. Соберите полный course skeleton с полным settings и stages
3. Выполните `dry_run=true` — проверьте warnings
4. После подтверждения выполните `confirm=true`

**Обязательные поля:**
- `name`, `externalId`, `description`
- `coverImageFileId`, `coverImageThumbnailFileId`
- `settings.progress`, `settings.finalScreen`, `settings.deadline`, `settings.isFreeOrderAllowed`
- `stages[]` с полной структурой

**Settings safe defaults:**
```json
{
  "progress": { "isEnabled": true, "hintText": "Прогресс прохождения" },
  "finalScreen": { "isEnabled": true, "title": "Курс завершён", "text": "Вы успешно завершили курс." },
  "deadline": {
    "isEnabled": true,
    "fixedDeadlineDate": "<YYYY-MM-DD>",
    "relativeDeadlineUnits": "Months",
    "relativeDeadlineValue": 5,
    "notificationSettings": {
      "isEnabled": true,
      "localizedText": {
        "en-US": "The deadline for the course «{CourseName}» is approaching. Complete it by {DeadlineDate}.",
        "ru-RU": "Приближается срок выполнения курса «{CourseName}». Успейте пройти его до {DeadlineDate}."
      },
      "duplicateInEmail": false,
      "sendingPeriods": [
        { "unit": "Months", "value": 3 },
        { "unit": "Weeks", "value": 2 },
        { "unit": "Days", "value": 1 }
      ]
    }
  },
  "isFreeOrderAllowed": true
}
```

**Stages:**
- Common stage: `type: "Common"`, `settings.transition.conditionType` (CheckInformation / PassTest / PassPoll), `settings.finalMessage`
- Task stage: `type: "Task"`, `taskContent.title` обязателен
- PassTest/PassPoll: `transition.pollButtonNameOverride`, `transition.pollPoints`, `transition.poll.name`

**Enum guidance:** MCP input schema использует PascalCase (Common/Task/Scorm, CheckInformation/PassTest/PassPoll, Days/Weeks/Months). Нормализатор конвертирует в lowercase для API.

**Пример запроса к агенту:**
```
Создай курс в Eventicious по следующему описанию.
Сначала собери полный course skeleton и выполни dry_run.
Не отправляй минимальный payload.

Данные курса:
- Название: ...
- Описание: ...
- Обложка: ...
- Этапы: 1. Common / CheckInformation / ..., 2. Task / ...

После dry_run покажи summary. Только после подтверждения запускай real creation.
```

См. `examples/course-create.reference.example.json` для полного примера skeleton.

---

## ID Ledger / Mapping Artifact

### Зачем это нужно

MCP-сервер stateless — ID-шники, которые возвращает Eventicious (courseId, stageId, stageCatalogId, pollId, taskContentId, scormId), не сохраняются между сессиями. Без сохранения этих ID невозможно наполнить курс контентом.

### Что делать

После каждой успешной create/import/upload/write операции агент обязан:

1. Извлечь все ID из ответа MCP.
2. Сохранить или обновить локальный markdown-файл `EVENTICIOUS_MCP_IDS.md` в рабочей папке.
3. Использовать этот файл как source of truth для следующих шагов.
4. Не наполнять курс, если нужные ID отсутствуют в ledger.

### Какие ID сохранять

- `courseId` — идентификатор курса
- `courseCatalogId` — идентификатор каталога курса (если есть)
- `stageId` — идентификатор этапа
- `stageCatalogId` — идентификатор каталога этапа (нужен для Text 2.0)
- `pollId` — идентификатор опроса/теста (нужен для PassTest/PassPoll)
- `taskContentId` — идентификатор задания (нужен для Task)
- `scormId` — идентификатор SCORM-пакета (если есть)

### Чего нельзя сохранять

- Секреты (client secret, MCP token, encryption keys)
- Персональные данные
- Токены доступа

### Пример workflow

1. Агент создаёт курс через `eventicious_import_course_structure`
2. Сохраняет raw response
3. Вызывает `eventicious_map_course_import_response`
4. Записывает все ID в `EVENTICIOUS_MCP_IDS.md`
5. Перед наполнением Text 2.0 проверяет наличие `stageCatalogId`
6. Перед импортом теста проверяет наличие `pollId`
7. Перед импортом задания проверяет наличие `taskContentId`
8. Если нужного ID нет — не выполняет write и сообщает о блокере

### Структура файла EVENTICIOUS_MCP_IDS.md

Агент создаёт файл по шаблону, который доступен через `eventicious_get_agent_instructions`. Шаблон включает таблицы для:

- Session (дата, Event ID, Base URL)
- Files (fileId, thumbnailFileId)
- Courses (courseId, externalId, status)
- Course Stages (stageId, stageCatalogId, pollId, taskContentId, scormId)
- Catalogs and Elements
- Polls and Tests
- Tasks
- Action Log (time, tool, returned IDs, next action)

### Если клиент не может писать файлы

Если MCP-клиент не поддерживает запись файлов, агент выводит содержимое `EVENTICIOUS_MCP_IDS.md` в чат и просит пользователя сохранить его перед продолжением.

Полный список tools не нужен для первого подключения. Агент сам увидит доступные tools после подключения.

---

## Шаг 11. Частые ошибки

| Ошибка | Что значит | Что сделать |
|---|---|---|
| Файл получился `.env.txt` | Windows добавил расширение `.txt` | Переименуйте файл в `.env` |
| Файл получился `.mcp.json.txt` | Windows добавил расширение `.txt` | Переименуйте файл в `.mcp.json` |
| Агент не видит `.env` | Чат открыт не в той папке | Откройте новый чат внутри папки `Eventicious MCP` |
| Агент не видит `.mcp.json` | Файл создан не в той папке или с неправильным названием | Проверьте название и расположение файла |
| `401 invalid credentials` | Eventicious credentials неверные или отозваны | Проверьте Base URL, Client ID и Client Secret |
| `401 invalid MCP token` | MCP token неверный, повреждён или устарел | Получите новый MCP token через `/auth/exchange` |
| `404 endpoint not found` | Указан неправильный endpoint | Проверьте адрес MCP-сервера |
| `500 server config error` | Ошибка настройки сервера MCP | Передайте ошибку техническому специалисту |
| Tools не видны | AI-клиент не подхватил MCP-конфиг | Перезапустите чат или клиент |
| Агент просит Client Secret повторно | Он не прочитал `.env` | Проверьте, что `.env` лежит в рабочей папке |
| Доступ был отозван | Eventicious credentials больше не работают | Получите актуальные credentials и выпустите новый MCP token |

---

## Шаг 12. Безопасность

Соблюдайте правила:

1. Не отправляйте `Client Secret` в общий чат.
2. Не публикуйте файл `.env`.
3. Не добавляйте `.env` в GitHub.
4. Не пересылайте `EVENTICIOUS_MCP_TOKEN` посторонним.
5. Не вставляйте полный MCP token в публичные сообщения.
6. Если доступ нужно отозвать, отзовите или перевыпустите credentials на стороне Eventicious.
7. Если MCP token попал не туда, получите новый token после обновления Eventicious credentials.
8. Всегда начинайте с `dry_run=true`.
9. Реальные изменения выполняйте только после проверки preview.

---

## Шаг 13. Что делать, если ничего не работает

Передайте техническому специалисту:

1. Какой клиент используете:
   - OpenCode;
   - Claude Code;
   - Codex.
2. На каком шаге остановились.
3. Скриншот ошибки.
4. Что показывает адрес:

```text
https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru/healthz
```

5. Видит ли агент файлы:
   - `.env`;
   - `.mcp.json`.

Не передавайте техническому специалисту в открытом виде:

- `EVENTICIOUS_CLIENT_SECRET`;
- полный `EVENTICIOUS_MCP_TOKEN`.

---

## Быстрая проверка для технического специалиста

Этот раздел нужен только для диагностики.

Проверить health endpoint:

```text
https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru/healthz
```

Ожидаемый ответ:

```json
{
  "ok": true,
  "service": "eventicious-mcp-remote",
  "version": "0.6.4"
}
```

Проверить, что в проекте доступно 75 MCP tools.

Реальные изменения в Eventicious не выполнять без `dry_run=false` и `confirm=true`.

---

## Короткая памятка

1. Установите OpenCode, Claude Code или Codex.
2. Создайте папку `Eventicious MCP`.
3. Создайте `.env`.
4. Вставьте Eventicious API credentials.
5. Откройте чат внутри этой папки.
6. Отправьте промт для получения MCP token.
7. Убедитесь, что создан `.mcp.json`.
8. Перезапустите чат.
9. Отправьте проверочный промт.
10. Работайте сначала через preview.

Для подключённых AI-агентов правила доступны через MCP tool `eventicious_get_agent_instructions`.
