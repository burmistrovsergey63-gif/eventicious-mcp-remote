# Подключение OpenCode к Eventicious MCP

## Через установщик (рекомендуется)

### 1. Скачайте архив

Скачайте `eventicious-mcp-opencode-setup.zip` или склонируйте репозиторий.

### 2. Запустите установщик

```powershell
cd path/to/eventicious-mcp-opencode-setup
powershell -ExecutionPolicy Bypass -File .\install-opencode.ps1
```

Installer спросит:
1. Папку проекта OpenCode (куда писать `opencode.json`)
2. MCP endpoint (Enter для default)
3. MCP_ACCESS_TOKEN (секрет, маскируется)
4. Eventicious CLIENT_ID
5. Eventicious CLIENT_SECRET (секрет, маскируется)
6. Eventicious base URL (Enter для default)

### 3. Откройте папку проекта в OpenCode

### 4. Проверьте

В OpenCode:
```
Используй eventicious MCP. Проверь tools/list и eventicious_auth_check.
```

Ожидается: `tools/list: 68`, `auth_check: success`

---

## Где должен лежать opencode.json

`opencode.json` должен лежать в корне проекта, который вы открываете в OpenCode.

Пример:
```
C:\Users\you\Desktop\my-project\opencode.json
```

Installer автоматически определит папку проекта и предложит её использовать.

---

## Прямое указание папки

Если не хотите использовать интерактивный режим:

```powershell
# Указать папку проекта
powershell -ExecutionPolicy Bypass -File .\install-opencode.ps1 -TargetDir "C:\Users\me\my-project"

# Указать конкретный файл
powershell -ExecutionPolicy Bypass -File .\install-opencode.ps1 -TargetPath "C:\Users\me\my-project\opencode.json"
```

---

## Non-interactive режим

Для автоматизации:

```powershell
powershell -ExecutionPolicy Bypass -File .\install-opencode.ps1 `
    -NonInteractive `
    -McpToken "ваш_токен" `
    -EventiciousClientId "cl-xxx" `
    -EventiciousClientSecret "cs-xxx" `
    -TargetDir "C:\path\to\project"
```

---

## Удаление

```powershell
powershell -ExecutionPolicy Bypass -File .\uninstall-opencode.ps1
```

Скрипт спросит папку проекта и удалит только `mcp.eventicious`.

Прямое указание:
```powershell
powershell -ExecutionPolicy Bypass -File .\uninstall-opencode.ps1 -TargetDir "C:\Users\me\my-project"
```

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
- Убедитесь, что BASE_URL корректен:
  - Правильно: `https://api-integration.eventicious.ru`
  - Неправильно: `https://api-integration.eventicious.ru/connect/token`
  - Неправильно: `https://api-integration.eventicious.ru/`
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
