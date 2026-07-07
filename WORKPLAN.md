# Eventicious MCP Remote — План работ

> Дата: 07.07.2026
> Последний коммит: `2f8cb2e` — docs: guide agents to create full course skeletons

---

## 1. Текущий статус проекта

### Что сделано

| Область | Статус | Детали |
|---------|--------|--------|
| MCP сервер | ✅ Готово | 75 инструментов, 6 версий (v0.1–v0.6) |
| Auth & безопасность | ✅ Готово | Bearer token, per-request credentials, dry_run/confirm/danger_confirm |
| Кэширование токенов | ✅ Готово | In-memory, 50 мин TTL |
| Логирование | ✅ Готово | JSON-формат, автоматический маскинг секретов |
| Rate limiting | ✅ Готово | Batch size guard + предупреждения |
| Валидация (Zod) | ✅ Готово | 16 схем в `src/schemas/` |
| Smoke-тесты | ✅ Готово | 11 PowerShell скриптов для всех версий |
| Документация | ✅ Готово | README (363 строки), API reference (6779 строк), гайд для менеджеров |
| Примеры | ✅ Готово | 57 JSON-файлов для всех инструментов |
| Деплой на Layero | ✅ Готово | `layero.json`, Node 20, Next.js |
| Установщик OpenCode | ✅ Готово | Интерактивный/неинтерактивный PowerShell-installer |

### Версии инструментов

- **v0.1** — Ядро: auth check, users CRUD, groups CRUD (8 tools)
- **v0.2** — Безопасность: delete с danger_confirm, роли, менторы (7 tools)
- **v0.3** — Расписание: locations, tags, sessions, attachments, import (14 tools)
- **v0.4** — Каталоги: полный CRUD, folders, content elements, bulk, menu (27 tools)
- **v0.5** — Курсы: import/finalize, polls, tasks, SCORM, gamification (12 tools)
- **v0.6** — Экспо: exhibitor CRUD, import, gamification validate (6 tools)

---

## 2. Что не хватает / проблемы

### Критичное

| # | Проблема | Влияние |
|---|----------|---------|
| 1 | ~~Нет unit/integration тестов~~ | ✅ 364 теста (Vitest) |
| 2 | ~~Нет CI/CD~~ | ✅ GitHub Actions workflow на main |
| 3 | ~~`src/mcp/server.ts` — legacy код~~ | ✅ Удалён |

### Важное

| # | Проблема | Влияние |
|---|----------|---------|
| 4 | ~~Дублирование `requireDangerConfirm()`~~ | ✅ Вынесено в `src/utils/confirm.ts` |
| 5 | **Схемы в `src/schemas/` не используются** | Определены, но не импортируются — tools определяют схемы инлайн |
| 6 | ~~`src/tools/auth-check.ts`, `users.ts`, `groups.ts`~~ | ✅ Удалены standalone-функции |
| 7 | ~~`package.json` version = `0.1.0`~~ | ✅ Обновлена до 0.6.4 |

### Мелочи

| # | Проблема | Влияние |
|---|----------|---------|
| 8 | ~~Нет `test` скрипта в package.json~~ | ✅ `npm run test` работает |
| 9 | ~~Branch `master` на 4 коммита впереди `origin/main`~~ | ✅ Remote master удалён |
| 10 | ~~`tsconfig.tsbuildinfo` в working tree~~ | ✅ Добавлен в .gitignore |

---

## 3. Сложности и риски

### Архитектурные

- **Stateless транспорт** — каждый запрос создает новый `McpServer` + `WebStandardStreamableHTTPServerTransport`. Это правильно для безопасности, но:
  - Нет возможности кешировать результаты между запросами (кроме bearer token)
  - Высокий overhead на создание объектов при большом потоке

- **Zod-схемы vs инлайн определения** — инструменты определяют параметры инлайн вместо импорта из `src/schemas/`. Это:
  - Усложняет поддержку (нужно менять в двух местах)
  - Делает схемы в `src/schemas/` мёртвым кодом

- **Дублирование v0.1/v0.2 в `server.ts`** — legacy файл, который можно удалить, если `transport.ts` покрывает всё

### Организационные

- **Нет ревью-процесса** — все коммиты идут напрямую в master
- **Нет стейджинг-среды** — тестирование только через smoke-скрипты на боевом сервере
- **Зависимость от PowerShell** — все smoke-тесты на PS, не кросс-платформенные

### Безопасные

- **Bearer token в памяти** — если сервер перезапускается, все токены теряются (ожидаемо, но стоит учитывать)
- **Нет rate limiting на уровне API** — только batch size guard, но нет ограничения частоты запросов

---

## 4. План действий на ближайшее время

### Приоритет 1: Техдолг (неделя 1)

- [x] **Удалить `src/mcp/server.ts`** — legacy, дублирует transport.ts
- [x] **Удалить standalone-функции** из `src/tools/auth-check.ts`, `users.ts`, `groups.ts`
- [x] **Вынести `requireDangerConfirm()`** в общую утилиту (`src/utils/confirm.ts`)
- [ ] **Подключить Zod-схемы** — заменить инлайн-определения в tools на импорт из `src/schemas/`
- [x] **Обновить `package.json` version** до `0.6.4`
- [x] **Добавить `tsconfig.tsbuildinfo`** в `.gitignore`
- [x] **Запушить коммиты** в origin/main

### Приоритет 2: Тесты (неделя 2)

- [x] **Настроить Vitest** как тестовый фреймворк
- [x] **Добавить unit-тесты** — 364 теста across 22 files
- [x] **Добавить integration-тесты** для transport, routes
- [x] **Добавить `test` скрипт** в package.json

### Приоритет 3: CI/CD (неделя 3)

- [x] **GitHub Actions workflow** — typecheck, test, build на каждый PR
- [x] **Автодеплой** на Layero из main-ветки
- [ ] **Staging-среда** — отдельный деплой для тестирования

### Приоритет 4: Новый функционал (неделя 4+)

- [ ] **Rate limiting на уровне API** — ограничение частоты запросов per-client
- [ ] **Structured error responses** — единый формат ошибок для всех tools
- [ ] **OpenAPI/schema экспорт** — автоматическая генерация документации из Zod-схем
- [ ] **Kross-platform smoke-тесты** — переписать на Node.js или добавить bash-альтернативы

---

## 5. Метрики

| Метрика | Текущее | Цель |
|---------|---------|------|
| MCP Tools | 75 | 75+ (стабильно) |
| Unit тесты | 364 | 364+ (стабильно) |
| Integration тесты | 22 files | 22+ files |
| Покрытие кода | ~60% | 60%+ |
| CI/CD | GitHub Actions | GitHub Actions |
| Legacy файлы | 0 | 0 |

---

## 6. Контакты и ссылки

- **Репозиторий:** `C:\Users\burmi\Desktop\eventicious-mcp-remote`
- **Деплой:** Layero (см. `docs/LAYERO_PRODUCTION.md`)
- **API Reference:** `docs/Eventicious_External_API_Training_v2_AI.md`
- **Руководство для менеджеров:** `docs/README_FOR_MANAGERS.md`
