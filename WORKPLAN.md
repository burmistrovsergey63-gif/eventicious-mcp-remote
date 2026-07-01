# Eventicious MCP Remote — План работ

> Дата: 29.06.2026
> Последний коммит: `e8c44f3` — fix: smoke script handles isError responses

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
| 1 | **Нет unit/integration тестов** | Нет гарантий при рефакторинге, regressions возможны |
| 2 | **Нет CI/CD** | Нет автоматической проверки PR, деплоя, тестов |
| 3 | **`src/mcp/server.ts` — legacy код** | Дублирует логику из `transport.ts`, путает разработчиков |

### Важное

| # | Проблема | Влияние |
|---|----------|---------|
| 4 | **Дублирование `requireDangerConfirm()`** | 4 файла: transport, catalog-elements, courses, expo |
| 5 | **Схемы в `src/schemas/` не используются** | Определены, но не импортируются — tools определяют схемы инлайн |
| 6 | **`src/tools/auth-check.ts`, `users.ts`, `groups.ts`** | Содержат standalone-функции, дублирующие MCP-инструменты |
| 7 | **`package.json` version = `0.1.0`** | Не обновлена с момента создания (healthz = 0.6.0) |

### Мелочи

| # | Проблема | Влияние |
|---|----------|---------|
| 8 | **Нет `test` скрипта в package.json** | Невозможно запустить тесты одной командой |
| 9 | **Branch `master` на 4 коммита впереди `origin/main`** | Не запушенные изменения |
| 10 | **`tsconfig.tsbuildinfo` в working tree** | Мусорный файл, должен быть в .gitignore |

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

- [ ] **Удалить `src/mcp/server.ts`** — legacy, дублирует transport.ts
- [ ] **Удалить standalone-функции** из `src/tools/auth-check.ts`, `users.ts`, `groups.ts` — они не используются
- [ ] **Вынести `requireDangerConfirm()`** в общую утилиту (`src/utils/` или `src/errors.ts`)
- [ ] **Подключить Zod-схемы** — заменить инлайн-определения в tools на импорт из `src/schemas/`
- [ ] **Обновить `package.json` version** до `0.6.0`
- [ ] **Добавить `tsconfig.tsbuildinfo`** в `.gitignore`
- [ ] **Запушить 4 коммита** в origin/main

### Приоритет 2: Тесты (неделя 2)

- [ ] **Настроить Vitest** (или Jest) как тестовый фреймворк
- [ ] **Добавить unit-тесты** для:
  - `src/auth.ts` — валидация токенов, извлечение credentials
  - `src/token-cache.ts` — кэширование, TTL, инвалидация
  - `src/eventicious-client.ts` — запросы к API, обработка ошибок
  - `src/logger.ts` — маскирование секретов
  - `src/schemas/*.ts` — валидация Zod-схем
- [ ] **Добавить integration-тесты** для:
  - `app/mcp/route.ts` — end-to-end MCP запрос
  - `app/healthz/route.ts` — health check
- [ ] **Добавить `test` скрипт** в package.json

### Приоритет 3: CI/CD (неделя 3)

- [ ] **GitHub Actions workflow** — lint, typecheck, test на каждый PR
- [ ] **Автодеплой** на Layero из main-ветки
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
| Unit тесты | 0 | 50+ |
| Integration тесты | 0 | 10+ |
| Покрытие кода | 0% | 60%+ |
| CI/CD | Нет | GitHub Actions |
| Legacy файлы | 2 (server.ts, standalone tools) | 0 |

---

## 6. Контакты и ссылки

- **Репозиторий:** `C:\Users\burmi\Desktop\eventicious-mcp-remote`
- **Деплой:** Layero (см. `docs/LAYERO_PRODUCTION.md`)
- **API Reference:** `docs/Eventicious_External_API_Training_v2_AI.md`
- **Руководство для менеджеров:** `docs/README_FOR_MANAGERS.md`
