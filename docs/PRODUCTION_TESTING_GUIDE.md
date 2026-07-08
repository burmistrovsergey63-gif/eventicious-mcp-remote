# Eventicious MCP Remote — вводный документ для production-тестирования

## 1. Короткий вывод

Eventicious MCP Remote — безопасный мост между AI-клиентами (OpenCode, Claude Code, Codex) и Eventicious External API v2. Система готова к контролируемому production-тестированию. **75 MCP tools**, версия **v1.0.0**, последний подтверждённый деплой: **dcf5e74**.

Все write-операции по умолчанию работают в режиме `dry_run=true`. Реальные изменения требуют `dry_run=false` + `confirm=true`, для деструктивных операций — дополнительно `danger_confirm`.

## 2. Текущий статус системы

| Параметр | Значение |
|---|---|
| Версия | v1.0.0 |
| Tool count | 75 |
| Последний deployed commit | dcf5e74 |
| `/healthz` | `{"ok":true,"service":"eventicious-mcp-remote","version":"1.0.0"}` |
| `/mcp` GET | `{"toolCount":75, "toolsEndpoint":"/mcp/tools"}` |
| `/mcp/tools` GET | Полный JSON-список 75 tools (без secrets) |
| CI/CD | GitHub Actions: typecheck → test → build |
| Unit tests | 364 тестов, Vitest |
| Статус | Production-ready для контролируемого тестирования |

**Важно:** Это не «раздать всем без сопровождения». Система проходит controlled production rollout — каждый новый пользователь подключается с инструктажем и подтверждением safety-правил.

## 3. Архитектура простыми словами

Eventicious MCP Remote — это серверное приложение на Next.js (App Router), развёрнутое на Layero.

```
AI-клиент (OpenCode / Claude Code / Codex)
       |
       | HTTPS / MCP протокол
       v
Eventicious MCP Remote (Layero)
       |
       | HTTP / Eventicious External API v2
       v
Eventicious
```

- **AI-клиент** подключается к MCP-серверу по HTTPS.
- **MCP-сервер** принимает запросы, валидирует токен, выполняет инструменты.
- **Eventicious API** — целевая система. MCP-сервер — прокси, который не хранит credentials на сервере.
- **Stateless:** каждая сессия создаётся заново. ID из Eventicious не сохраняются на сервере, поэтому AI-агент обязан вести локальный `EVENTICIOUS_MCP_IDS.md`.

### Три уровня безопасности

1. **dry_run=true (по умолчанию)** — все write-инструменты возвращают preview без реальных изменений.
2. **confirm=true** — обязателен для реального выполнения (dry_run=false).
3. **danger_confirm** — обязателен для деструктивных операций (удаление, финализация курса). Значение должно совпадать с точной строкой-константой (например, `"DELETE_EVENTICIOUS_USERS"`).

## 4. Что умеет MCP

### Пользователи и группы (8 tools)
- Проверка credentials (`eventicious_auth_check`)
- Получение инструкций для агента (`eventicious_get_agent_instructions`)
- Создание, обновление, блокировка, разблокировка, удаление пользователей
- Работа с ACL-группами (создание, переименование, удаление)
- Перемещение пользователей между группами
- Назначение и снятие ролей (Куратор=1, Супервайзер=2)
- Назначение и снятие менторов

### Каталоги и контент (27 tools)
- CRUD корневых каталогов и папок (с ACL visibility)
- Добавление/удаление файлов, ссылок, видео, Text 2.0 / GravityJson
- Переупорядочивание каталогов и элементов
- Добавление/удаление каталогов в меню
- Массовое удаление элементов
- Подготовка и валидация планов импорта каталогов

### Расписание (14 tools)
- CRUD локаций, тегов/тем, сессий
- CRUD вложений сессий
- Подготовка и валидация планов импорта расписания

### Курсы (8 tools)
- Загрузка изображений курсов
- Импорт полной структуры курса с этапами
- Маппинг ID из ответа импорта
- Импорт контента Poll/Test и Task
- Загрузка SCORM и вложений заданий
- Проверка готовности и финализация курса

### Экспоненты (6 tools)
- CRUD экспонентов
- Подготовка и валидация планов импорта

### Геймификация (2 tools)
- Начисление/списание баллов
- Валидация параметров начисления

## 5. Поддерживаемые AI-клиенты

| Клиент | Конфигурационный файл | Формат |
|---|---|---|
| OpenCode | `opencode.json` | `mcp.eventicious.type: "remote"` |
| Claude Code | `.mcp.json` | `mcpServers.eventicious.type: "http"` |
| Codex / generic MCP | Произвольный | MCP URL + Bearer token |

## 6. Подключение: общий порядок

1. Установите AI-клиент (OpenCode, Claude Code или Codex).
2. Создайте рабочую папку (например, `Eventicious MCP`).
3. Создайте файл `.env` с Eventicious API credentials (Base URL, Client ID, Client Secret).
4. Получите MCP token через `/auth/exchange`.
5. Создайте конфигурационный файл клиента (`opencode.json` или `.mcp.json`).
6. Перезапустите чат, чтобы клиент подхватил конфиг.
7. Выполните первую read-only проверку.

## 7. Получение MCP token

**Endpoint:** `POST https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru/auth/exchange`

MCP token — это AES-256-GCM зашифрованный набор Eventicious credentials. Token начинается с префикса `mcp_evt_`. Срок действия: **180 дней** по умолчанию (настраивается через `MCP_TOKEN_TTL_DAYS`).

```bash
curl -s -X POST https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru/auth/exchange \
  -H "Content-Type: application/json" \
  -d '{
    "baseUrl": "https://api-integration.eventicious.ru/",
    "clientId": "<your-client-id>",
    "clientSecret": "<your-client-secret>"
  }'
```

**Ответ:**
```json
{
  "ok": true,
  "mcpToken": "mcp_evt_...",
  "mcpUrl": "https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru/mcp",
  "expiresAt": "2027-01-03T...",
  "toolsCount": 75
}
```

**Правила:**
- Token хранить в `.env` или конфиге клиента, никогда не публиковать.
- Не выводить полный token в чатах и логах.
- Если token истёк — получить новый через `/auth/exchange` (старый отозвать нельзя, выпускается новый).

**Проверка token:**
```bash
curl -s https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru/auth/verify \
  -H "Authorization: Bearer mcp_evt_..."
```
**Ответ:** `{"ok":true,"toolsCount":75}`

## 8. Конфигурация OpenCode

### Ручной способ

Создайте `opencode.json` в корне проекта:

```json
{
  "mcp": {
    "eventicious": {
      "type": "remote",
      "url": "https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru/mcp",
      "enabled": true,
      "timeout": 120000,
      "authorization": {
        "type": "bearer",
        "token": "<your-mcp-token>"
      }
    }
  }
}
```

### Установщик (рекомендуется)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\installers\opencode\install-opencode.ps1
```

Подробности: [docs/INSTALL_OPENCODE.md](INSTALL_OPENCODE.md)

## 9. Конфигурация Claude Code

Создайте `.mcp.json` в корне проекта:

```json
{
  "mcpServers": {
    "eventicious": {
      "type": "http",
      "url": "https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru/mcp",
      "authorization": {
        "type": "bearer",
        "token": "<your-mcp-token>"
      }
    }
  }
}
```

### Альтернатива: legacy headers

Если MCP token не используется, можно передавать credentials напрямую:

```json
{
  "mcpServers": {
    "eventicious": {
      "type": "http",
      "url": "https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru/mcp",
      "headers": {
        "x-eventicious-client-id": "<your-client-id>",
        "x-eventicious-client-secret": "<your-client-secret>",
        "x-eventicious-base-url": "https://api-integration.eventicious.ru"
      }
    }
  }
}
```

**Не смешивать** legacy headers с `authorization.bearer` — используйте один из двух методов.

## 10. Конфигурация Codex / generic MCP clients

Для Codex и других MCP-клиентов формат конфига может отличаться. Общий принцип:

```json
{
  "mcpServers": {
    "eventicious": {
      "type": "http",
      "url": "https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru/mcp",
      "authorization": {
        "type": "bearer",
        "token": "<your-mcp-token>"
      }
    }
  }
}
```

Рекомендуется уточнить конкретный формат в документации вашего MCP-клиента. Всегда используйте Bearer token, полученный через `/auth/exchange`.

## 11. Быстрый вариант для macOS через Терминал

Finder может не создавать файлы с точкой в начале (`.env`, `.mcp.json`). Используйте Терминал:

```bash
cd ~/Desktop
mkdir "Eventicious MCP"
cd "Eventicious MCP"

# Создать .env
touch .env
open -a TextEdit .env

# Создать .mcp.json
cat > .mcp.json
{
  "mcpServers": {
    "eventicious": {
      "type": "http",
      "url": "https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru/mcp",
      "authorization": {
        "type": "bearer",
        "token": "<your-mcp-token>"
      }
    }
  }
}
# Нажмите Ctrl+D

# Проверить
ls -la
# В Finder: Cmd+Shift+. (показать скрытые файлы)
```

## 12. Первая read-only проверка

После подключения отправьте AI-агенту промт:

```
Проверь подключение к Eventicious MCP.

Сделай только безопасные read-only проверки:
1. Проверь, что MCP-сервер доступен.
2. Проверь, что MCP token валиден.
3. Проверь, что доступно 75 MCP tools.
4. Не выполняй create/update/delete операции.
5. Не запускай операции с dry_run=false.
6. Не выводи секреты из .env.
7. Не выводи полный MCP token.
```

Ожидаемый результат: `Подключение работает. Доступно 75 MCP tools.`

### Ручная проверка

```bash
# Health check
curl -s https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru/healthz

# Verify token
curl -s -H "Authorization: Bearer mcp_evt_..." \
  https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru/auth/verify

# MCP info
curl -s https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru/mcp
```

## 13. Проверка полного списка tools через /mcp/tools

**Endpoint:** `GET https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru/mcp/tools`

Этот endpoint решает проблему SSE fragmentation — он возвращает полный JSON-список всех зарегистрированных MCP tools без необходимости парсить SSE-поток. Аутентификация не требуется (список tools не является секретным).

```bash
curl -s https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru/mcp/tools
```

**Ответ:**
```json
{
  "service": "eventicious-mcp-remote",
  "version": "1.0.0",
  "toolCount": 75,
  "tools": [
    { "name": "eventicious_auth_check" },
    { "name": "eventicious_get_agent_instructions" },
    ...
  ]
}
```

Secrets/tokens/clientSecret **не возвращаются** этим endpoint-ом.

## 14. Safety-правила

### Обязательные

1. **Read-only first** — начинайте с read-only инструментов. Не делайте write без необходимости.
2. **dry_run перед write** — все write-инструменты по умолчанию работают с `dry_run=true`. Preview нужно изучить перед реальным выполнением.
3. **explicit confirmation** — реальное выполнение требует `dry_run=false` + `confirm=true`.
4. **danger_confirm** — для деструктивных операций (удаление, финализация курса) требуется точная строка:
   - `DELETE_EVENTICIOUS_USERS`
   - `DELETE_EVENTICIOUS_ACL_GROUP`
   - `DELETE_EVENTICIOUS_LOCATIONS`
   - `DELETE_EVENTICIOUS_TAGS`
   - `DELETE_EVENTICIOUS_SESSIONS`
   - `DELETE_EVENTICIOUS_SESSION_ATTACHMENTS`
   - `DELETE_EVENTICIOUS_CATALOG`
   - `DELETE_EVENTICIOUS_CATALOG_FOLDER`
   - `DELETE_EVENTICIOUS_CATALOG_CONTENT`
   - `DELETE_EVENTICIOUS_CATALOG_GROUP`
   - `DELETE_EVENTICIOUS_CATALOG_ITEMS_BULK`
   - `CHANGE_EVENTICIOUS_CATALOG_ORDER`
   - `FINALIZE_EVENTICIOUS_COURSE`
   - `DELETE_EVENTICIOUS_EXHIBITOR`
5. **Secrets не сохранять** — не хранить client secret, MCP token, encryption keys в ID ledger, чатах, публичных документах.
6. **ПДн не передавать** — персональные данные (ФИО, email, телефон) не передавать без согласованного контура обработки. В тестовых/демо-средах использовать обезличенные данные.
7. **Excel/CSV через внешний LLM** — избегать передачи real participant Excel-файлов через внешние LLM без согласования.

### Запрещено без отдельного согласования

- Прямые write-вызовы Eventicious API в обход MCP.
- Отключение safety-гарантий (dry_run, confirm, danger_confirm).
- Передача ПДн в промты или ID ledger.
- Использование непубличного MCP endpoint без авторизации.

## 15. Работа с курсами

### Полный course skeleton

`courseId` недостаточен для наполнения курса. Нужен полный набор ID: `stageCatalogId`, `pollId`, `taskContentId`.

**Правильный порядок:**
1. Загрузить обложку курса (`eventicious_upload_course_images`).
2. Импортировать полную структуру курса (`eventicious_import_course_structure`).
3. Сохранить raw response и обновить `EVENTICIOUS_MCP_IDS.md`.
4. Импортировать Task content (пока курс в статусе draft).
5. Импортировать Poll/Test content через `pollId`.
6. Добавить Text 2.0 материалы через `stageCatalogId`.
7. Проверить готовность (`eventicious_check_course_ready_to_finalize`).
8. Финализировать курс (`eventicious_finalize_course`, требует `danger_confirm`).

### Известные ограничения

- Нет `eventicious_update_text2` — для изменения Text 2.0 нужно удалить старый и создать новый.
- Нет `eventicious_update_course` — настройки курса задаются до создания.
- Нет `eventicious_unfinalize_course` — после финализации курс нельзя вернуть в draft.
- Task content должен быть импортирован до финализации.
- Нет `eventicious_update_stage` — тип и порядок этапов задаются до импорта.
- Полный course skeleton обязателен (минимальный payload приводит к HTTP 500).

## 16. ID Ledger: EVENTICIOUS_MCP_IDS.md

### Зачем

MCP-сервер stateless. ID, возвращаемые Eventicious (`courseId`, `stageId`, `stageCatalogId`, `pollId`, `taskContentId`, `scormId`), не сохраняются между сессиями. Без локального файла с ID наполнение курса контентом невозможно.

### Когда создавать

После каждой успешной create/import/upload/write операции.

### Что сохранять

- `courseId`, `courseCatalogId`
- `stageId`, `stageCatalogId`, `pollId`, `taskContentId`, `scormId`
- Технические ID и безопасные метки объектов

### Что НЕ сохранять

- Client Secret
- MCP token
- Encryption keys
- Персональные данные

### Почему это важно

Если нужный ID отсутствует в ledger, агент **не должен** выполнять write call. Он сообщает о блокере и просит пользователя восстановить ID.

## 17. Работа с кириллицей и UTF-8

Русские названия и тексты поддерживаются. Не использовать латиницу по умолчанию.

### Алгоритм диагностики

Если текст отображается некорректно (кракозябры, mojibake):

1. Сохранить object ID.
2. Выполнить `read/get` объекта.
3. Сравнить:
   - Что было отправлено в write-запросе
   - Что вернулось в read-ответе
   - Что отображается в UI Eventicious
4. Если UI и read-response нормальные — это display issue клиента.
5. Если UI или read-response битые — это blocker. Сообщить с objectId, field, expected, actual.

### Правила для агента

- Использовать UTF-8 везде.
- HTTP Content-Type: `application/json; charset=utf-8`.
- При прямых HTTP-запросах из PowerShell 5.1 использовать UTF-8 byte array, не передавать тело строкой.
- Всегда проверять dry_run preview перед записью кириллических текстов.

## 18. Персональные данные и ограничения

- **ПДн без согласованного контура обработки запрещены.**
- Не запрашивать у пользователя ФИО, email, телефон без явной необходимости.
- Не сохранять ПДн в `EVENTICIOUS_MCP_IDS.md`.
- Для тестовых/демо-сред использовать обезличенные данные.
- При создании пользователей передавать минимально необходимый набор полей.

## 19. Что можно показывать менеджерам и клиентам

**Можно:**
- Что Eventicious MCP Remote — безопасный мост между AI и Eventicious.
- Что все 75 tools работают.
- Что dry_run по умолчанию защищает от случайных изменений.
- Что есть готовые инструкции по подключению.
- Адрес `/healthz`, `/mcp`, `/mcp/tools`.
- Версию и tool count.
- Общую архитектуру (AI-клиент → MCP-сервер → Eventicious).

**Нельзя:**
- Показывать реальные MCP tokens или client secrets.
- Показывать содержимое `.env`.
- Показывать содержимое `EVENTICIOUS_MCP_IDS.md` со связанными данными, если там есть ПДн.
- Публиковать конфигурационные файлы с реальными токенами.
- Утверждать, что «всё безопасно» — правильно: «безопасно при соблюдении правил».

## 20. Рекомендуемый сценарий демо

1. Показать `/healthz` — сервер работает.
2. Показать `/mcp/tools` — 75 tools в JSON.
3. Объяснить архитектуру: AI-клиент → MCP-сервер → Eventicious.
4. Показать dry_run: «вот как выглядит preview создания пользователя».
5. Объяснить confirm и danger_confirm: «реальные изменения требуют двух подтверждений».
6. Показать ID ledger: «агент ведёт локальный файл с ID, чтобы не потерять связь с объектами».
7. Показать /mcp/tools: «всегда можно проверить, какие инструменты доступны».

## 21. Controlled rollout plan

### Фаза 0: Подготовка (завершено)
- [x] Инфраструктура: Layero preview instance
- [x] CI/CD: GitHub Actions
- [x] Smoke checks: 75 tools, healthz, mcp info, auth verify
- [x] Документация: manager guide, client setup, token exchange
- [x] Safety: dry_run, confirm, danger_confirm
- [x] Release v1.0.0, commit dcf5e74

### Фаза 1: Internal testing (текущая)
- [ ] Подключить 2-3 внутренних пользователя
- [ ] Проверить read-only операции
- [ ] Проверить write с dry_run
- [ ] Собрать feedback по документации
- [ ] Проверить работу с кириллицей

### Фаза 2: Controlled team rollout
- [ ] Подключить до 10 менеджеров
- [ ] Провести onboarding-сессию
- [ ] Раздать вводный документ (этот файл)
- [ ] Назначить ответственного за safety
- [ ] Мониторинг логов на ошибки

### Фаза 3: Production hardening
- [ ] Проверить rate limiting на реальной нагрузке
- [ ] Опционально: добавить мониторинг/алерты
- [ ] Проверить token refresh flow
- [ ] Проверить отзыв доступа

### Фаза 4: Широкий rollout
- [ ] Открыть доступ для всех согласованных менеджеров
- [ ] Подготовить FAQ по частым вопросам
- [ ] Регулярный аудит логов

## 22. Частые ошибки и диагностика

| Ошибка | Причина | Решение |
|---|---|---|
| Файл `.env.txt` | Windows добавил расширение | Переименуйте в `.env`, включите показ расширений |
| `401 invalid credentials` | Eventicious credentials неверны | Проверьте Base URL, Client ID, Client Secret |
| `401 invalid MCP token` | Token неверный или истёк | Получите новый через `/auth/exchange` |
| `401 Token expired` | Token старше 180 дней | Обменяйте credentials на новый token |
| `404 endpoint not found` | Неправильный endpoint | Используйте `/auth/exchange`, не `/api/auth/exchange` |
| `500 Server configuration error` | MCP_TOKEN_ENCRYPTION_KEY не настроен | Сообщите администратору |
| `502 Unable to reach Eventicious API` | Eventicious недоступен | Проверьте Base URL, повторите |
| Tools не видны | Не перезапущен чат после настройки | Закройте и откройте новый чат |
| tools/list < 75 | Неправильный token или endpoint | Проверьте `/auth/verify` |
| Кракозябры в русском тексте | Проблема с UTF-8 | Следуйте алгоритму диагностики (раздел 17) |

## 23. Known limitations / backlog

### Инструменты, которых нет

- `eventicious_update_text2` — обновление Text 2.0 (workaround: delete+create)
- `eventicious_update_course` — обновление настроек курса
- `eventicious_unfinalize_course` — возврат курса в draft
- `eventicious_update_stage` — изменение этапов курса
- SCORM-контент не может быть прочитан или изменён после загрузки

### Инфраструктурные

- Нет session persistence (stateless — это design choice, не баг)
- Нет автоматического мониторинга/алертов (добавить в Фазе 3)
- Нет rate limiting на стороне MCP-сервера (есть batch size guard)
- Нет WebSocket/SSE-push уведомлений
- Нет UI для управления токенами (получение только через API)

### Требующие согласования

- Real participant Excel/CSV через внешний LLM
- ПДн без согласованного контура обработки

## 24. Чеклист перед тестированием

- [ ] Установлен AI-клиент (OpenCode / Claude Code / Codex)
- [ ] Создана рабочая папка
- [ ] Получены Eventicious API credentials (Base URL, Client ID, Client Secret)
- [ ] Создан `.env` с credentials
- [ ] Получен MCP token через `/auth/exchange`
- [ ] Создан конфигурационный файл (`opencode.json` / `.mcp.json`)
- [ ] Чат открыт внутри рабочей папки
- [ ] Чат перезапущен после создания конфига
- [ ] Выполнена read-only проверка (75 tools доступны)
- [ ] Проверен `/healthz` — `{"ok":true,"version":"1.0.0"}`
- [ ] Проверен `/mcp/tools` — 75 tools в JSON
- [ ] Прочитаны safety-правила (раздел 14)

## 25. Приложение: готовые промты

### Промт 1: Получить MCP token

```
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
7. Напиши краткий отчёт: "MCP token получен, .env обновлён".

Важно:
- не выводи EVENTICIOUS_CLIENT_SECRET в ответ;
- не выводи полный MCP token в ответ;
- не отправляй содержимое .env в чат;
- если нужно показать токен, покажи только первые и последние 6 символов.
```

### Промт 2: Первая read-only проверка

```
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

### Промт 3: Объяснить менеджеру, что умеет MCP

```
Объясни менеджеру, что такое Eventicious MCP на простом языке.

Расскажи:
1. Это безопасный мост между AI и Eventicious.
2. Какие разделы доступны (пользователи, каталоги, курсы, расписание, экспоненты, геймификация).
3. Что все изменения сначала показываются как preview.
4. Что реальные изменения выполняются только после двух подтверждений.
5. Что персональные данные не передаются без согласования.

Не используй технический жаргон.
Будь краток — не более 5 предложений.
```

### Промт 4: Создать тестовый FAQ без ПДн

```
Создай тестовый элемент Text 2.0 в каталоге eventicious с учебным FAQ по работе с Eventicious.

Условия:
- Без персональных данных.
- Используй stageCatalogId из EVENTICIOUS_MCP_IDS.md.
- dry_run=true.
- После dry_run покажи preview, не выполняй реальную запись без подтверждения.
```

### Промт 5: Создать тестовый курс через safe workflow

```
Создай тестовый курс в Eventicious.

Порядок:
1. Собери полный course skeleton (не минимальный payload).
2. Выполни dry_run=true.
3. Покажи summary: количество этапов, их типы, условия переходов, наличие дедлайна.
4. Реальное создание только после моего подтверждения.

Данные курса:
- Название: Тестовый курс
- Описание: Создан через safe workflow
- ExternalId: test-course-001
- Этапы:
  1. Common / CheckInformation / Введение
  2. Common / PassTest / Проверка знаний
```

### Промт 6: Проверить кириллицу

```
Проверь поддержку кириллицы в Eventicious MCP.

Сделай:
1. Прочитай существующий Text 2.0 элемент через eventicious_get_catalog или stageCatalogId.
2. Проверь, что русский текст отображается корректно в JSON-ответе.
3. Если есть искажения — сообщи objectId, field, expected, actual.
4. Не создавай новые элементы без необходимости.
```

### Промт 7: Проверить /mcp/tools

```
Проверь endpoint /mcp/tools.

Выполни GET-запрос на:
https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru/mcp/tools

Проверь:
1. Возвращается ли toolCount = 75.
2. Нет ли в ответе secrets, tokens или clientSecret.
3. Сколько tools в массиве tools.
4. Названия первых 5 tools для примера.
```

---

*Документ является source of truth для controlled production rollout. Версия: v1.0.0. Последний deployed commit: dcf5e74.*
