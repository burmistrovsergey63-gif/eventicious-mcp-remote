# Eventicious MCP для OpenCode

## Быстрая установка

1. Распакуйте архив `eventicious-mcp-opencode-setup.zip`.
2. Откройте PowerShell в папке архива.
3. Запустите:

```powershell
powershell -ExecutionPolicy Bypass -File .\install-opencode.ps1
```

4. Когда installer спросит папку проекта OpenCode, укажите папку проекта.
5. Введите данные подключения:
   - MCP endpoint (Enter для default)
   - MCP_ACCESS_TOKEN (секрет, маскируется)
   - Eventicious CLIENT_ID
   - Eventicious CLIENT_SECRET (секрет, маскируется)
   - Eventicious base URL (Enter для default)
6. Откройте эту папку в OpenCode.
7. Проверьте tools/list.

### Где должен лежать opencode.json

`opencode.json` должен лежать в корне проекта, который вы открываете в OpenCode.

Пример:

```
C:\Users\Sergey\Desktop\my-project\opencode.json
```

Installer сам определит папку проекта и предложит её использовать.

## Проверка

В OpenCode напишите:

```
Используй eventicious MCP.
Проверь tools/list и eventicious_auth_check.
Никаких реальных операций.
```

Ожидается:

- `tools/list`: 68 tools
- `auth_check`: success

## Удаление

```powershell
powershell -ExecutionPolicy Bypass -File .\uninstall-opencode.ps1
```

Скрипт спросит папку проекта и удалит только `mcp.eventicious`.

## Прямое указание папки

Если не хотите использовать интерактивный режим:

```powershell
# Указать папку проекта
powershell -ExecutionPolicy Bypass -File .\install-opencode.ps1 -TargetDir "C:\Users\me\my-project"

# Указать конкретный файл
powershell -ExecutionPolicy Bypass -File .\install-opencode.ps1 -TargetPath "C:\Users\me\my-project\opencode.json"
```

## Non-interactive режим

Для автоматизации (CI, скрипты):

```powershell
powershell -ExecutionPolicy Bypass -File .\install-opencode.ps1 `
    -NonInteractive `
    -McpToken "ваш_токен" `
    -EventiciousClientId "cl-xxx" `
    -EventiciousClientSecret "cs-xxx" `
    -TargetDir "C:\path\to\project"
```

## Безопасность

- Не отправляйте скриншоты с токенами.
- Не публикуйте `opencode.json`, если в нём есть secrets.
- Не коммитьте `opencode.json` с реальными ключами в публичные репозитории.
- Для реальных операций нужен `dry_run=false` + `confirm=true`.
- Для finalize/delete нужен `danger_confirm`.

## Troubleshooting

### tools/list < 68

- Перезапустите OpenCode после установки.
- Проверьте, что `opencode.json` содержит секцию `mcp.eventicious`.
- Убедитесь, что MCP endpoint доступен.

### auth_check failed

- Проверьте CLIENT_ID и CLIENT_SECRET.
- Убедитесь, что EVENTICIOUS_BASE_URL корректен:
  - Правильно: `https://api-integration.eventicious.ru`
  - Неправильно: `https://api-integration.eventicious.ru/connect/token`
  - Неправильно: `https://api-integration.eventicious.ru/`
- Проверьте MCP_ACCESS_TOKEN.

### OpenCode не видит MCP

- Перезапустите OpenCode полностью.
- Проверьте, что `opencode.json` — валидный JSON.
- Убедитесь, что `enabled: true`.

### opencode.json невалидный

Используйте бэкап:
```powershell
Copy-Item opencode.json.bak.* opencode.json
```
