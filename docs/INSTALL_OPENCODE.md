# Подключение OpenCode к Eventicious MCP

## Через установщик (рекомендуется)

### 1. Скачайте архив

Скачайте `eventicious-mcp-opencode-setup.zip` или склонируйте репозиторий.

### 2. Запустите установщик

```powershell
cd path/to/your-project
powershell -ExecutionPolicy Bypass -File .\install-opencode.ps1
```

Скрипт запросит:
- MCP endpoint (Enter для default)
- MCP_ACCESS_TOKEN (секрет, маскируется)
- Eventicious CLIENT_ID
- Eventicious CLIENT_SECRET (секрет, маскируется)
- Eventicious base URL (Enter для default)

### 3. Перезапустите OpenCode

### 4. Проверьте

В OpenCode:
```
Используй eventicious MCP. Проверь tools/list и eventicious_auth_check.
```

Ожидается: `tools/list: 68`, `auth_check: success`

---

## Через прямой запуск

Если архив недоступен, скрипты можно запустить из репозитория:

```powershell
cd eventicious-mcp-remote
powershell -ExecutionPolicy Bypass -File .\scripts\installers\opencode\install-opencode.ps1
```

---

## Non-interactive режим

Для автоматизации:

```powershell
powershell -ExecutionPolicy Bypass -File .\install-opencode.ps1 `
    -NonInteractive `
    -McpToken "ваш_токен" `
    -EventiciousClientId "cl-xxx" `
    -EventiciousClientSecret "cs-xxx"
```

---

## Удаление

```powershell
powershell -ExecutionPolicy Bypass -File .\uninstall-opencode.ps1
```

Скрипт удалит только `mcp.eventicious`, остальные MCP servers сохранит.

---

## Что создаётся в opencode.json

```json
{
  "mcp": {
    "eventicious": {
      "type": "remote",
      "url": "https://sergeyburmistrov-eventicious-mcp-remote.preview.layero.ru/mcp",
      "enabled": true,
      "oauth": false,
      "timeout": 120000,
      "headers": {
        "Authorization": "Bearer <MCP_ACCESS_TOKEN>",
        "x-eventicious-client-id": "<CLIENT_ID>",
        "x-eventicious-client-secret": "<CLIENT_SECRET>",
        "x-eventicious-base-url": "https://api-integration.eventicious.ru"
      }
    }
  }
}
```

---

## Troubleshooting

### tools/list < 68

- Перезапустите OpenCode после установки
- Проверьте `opencode.json`: `Get-Content opencode.json | ConvertFrom-Json`
- Убедитесь, что MCP endpoint доступен

### auth_check failed

- Проверьте CLIENT_ID и CLIENT_SECRET
- Убедитесь, что BASE_URL корректен
- Проверьте MCP_ACCESS_TOKEN

### OpenCode не видит MCP

- Перезапустите OpenCode полностью
- Проверьте, что `opencode.json` — валидный JSON
- Убедитесь, что `enabled: true`

### opencode.json невалидный

Используйте бэкап:
```powershell
Copy-Item opencode.json.bak.* opencode.json
```

Проверьте JSON:
```powershell
Get-Content opencode.json | ConvertFrom-Json
```

---

## Безопасность

- Не публикуйте `opencode.json` с реальными ключами
- Не коммитьте `opencode.json` в публичные репозитории
- Не отправляйте скриншоты с токенами
- Для реальных операций: `dry_run=false` + `confirm=true`
- Для finalize/delete: `danger_confirm`

---

## Сборка ZIP

Для создания дистрибутива:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\installers\opencode\build-opencode-setup-zip.ps1
```

ZIP создастся в `dist/eventicious-mcp-opencode-setup.zip`.
