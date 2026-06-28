# Eventicious MCP для OpenCode

## Быстрая установка

1. Распакуйте архив `eventicious-mcp-opencode-setup.zip`.
2. Откройте PowerShell в папке проекта, где будет использоваться OpenCode.
3. Запустите:

```powershell
powershell -ExecutionPolicy Bypass -File .\install-opencode.ps1
```

4. Введите данные подключения:
   - MCP endpoint (по умолчанию: preview URL)
   - MCP_ACCESS_TOKEN
   - Eventicious CLIENT_ID
   - Eventicious CLIENT_SECRET
   - Eventicious base URL (по умолчанию: `https://api-integration.eventicious.ru`)

5. Перезапустите OpenCode.

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

## Безопасность

- Не отправляйте скриншоты с токенами.
- Не публикуйте `opencode.json`, если в нём есть secrets.
- Не коммитьте `opencode.json` с реальными ключами в публичные репозитории.
- Для реальных операций нужен `dry_run=false` + `confirm=true`.
- Для finalize/delete нужен `danger_confirm`.

## Non-interactive режим

Для автоматизации (CI, скрипты):

```powershell
powershell -ExecutionPolicy Bypass -File .\install-opencode.ps1 `
    -NonInteractive `
    -McpToken "ваш_токен" `
    -EventiciousClientId "cl-xxx" `
    -EventiciousClientSecret "cs-xxx"
```

## Troubleshooting

### tools/list < 68

- Убедитесь, что OpenCode перезапущен после установки.
- Проверьте, что `opencode.json` содержит секцию `mcp.eventicious`.
- Убедитесь, что MCP endpoint доступен.

### auth_check failed

- Проверьте CLIENT_ID и CLIENT_SECRET.
- Убедитесь, что EVENTICIOUS_BASE_URL корректен.
- Проверьте, что MCP_ACCESS_TOKEN установлен.

### OpenCode не видит MCP

- Перезапустите OpenCode полностью.
- Проверьте `opencode.json` на валидный JSON.
- Убедитесь, что поле `enabled: true`.

### opencode.json невалидный

- Используйте бэкап: `opencode.json.bak.<timestamp>`
- Проверьте JSON онлайн или через `Get-Content opencode.json | ConvertFrom-Json`
