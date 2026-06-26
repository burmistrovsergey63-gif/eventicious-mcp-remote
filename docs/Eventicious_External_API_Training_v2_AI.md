# Eventicious External API (Обучение) v2 — AI-friendly Markdown

> Сгенерировано из Postman Collection: `Eventicious External API (Обучение) v2.postman_collection.json`  
> Дата генерации: 2026-06-17  
> Всего endpoints: **71**

## Как использовать этот файл с ИИ

Этот MD подготовлен так, чтобы ИИ мог быстро находить нужный метод, не выдумывать endpoint'ы и правильно различать:
- **Eventicious API** — запросы к `{{baseUrl}}`, почти всегда требуют `Authorization: Bearer {bearer_token}`;
- **callback во внешнюю систему** — URL вида `{your api base path}/...`, их должна реализовать внешняя система, а Eventicious будет вызывать их при синхронизации;
- **experimental courses API** — методы импорта структуры курса, опросов, заданий, изображений, вложений и SCORM.

Главное правило для ИИ: использовать только endpoints, перечисленные в этом файле. Если нужного действия нет в карте методов, не придумывать новый endpoint, а явно указать, что в коллекции он отсутствует.

**Текущий `baseUrl`:** `https://api-integration.eventicious.ru`

## Ключевые правила API

- Авторизация для External API v2 выполняется через Bearer token.
- Токен получается через `POST {{baseUrl}}/connect/token` и живёт 1 час.
- В запросах связи между объектами задаются через внутренние ID вашей внешней системы, которые передаются в Eventicious как `id`.
- Для пользователей `id` — это идентификатор пользователя во внешней системе, то есть `externalID` в Eventicious.
- Для массовых операций с пользователями обычно действует лимит **до 200 пользователей в одном запросе**.
- Если включена автопубликация пользователей, запросы `users/create`, `users/update`, `users/delete` ограничены **10 запросами в минуту**.
- Для изображений по URL сервер должен возвращать корректный `content-type`; поддерживаются `image/jpeg` и `image/png`.
- `POST` создаёт сущности на основном языке программы обучения.
- В `PUT` запросы можно добавлять `language` (`ru-RU`, `en-US`) для редактирования перевода. Если язык отсутствует/невалиден — редактирование происходит на основном языке.

## Базовые переменные и placeholders

| Переменная | Значение / смысл |
|---|---|
| `{{baseUrl}}` | Базовый URL Eventicious/Talent Rocks API: `https://api-integration.eventicious.ru` |
| `{{client_id}}` | Идентификатор ключа для получения токена. |
| `{{client_secret}}` | Секрет ключа для получения токена. |
| `{your api base path}` | Базовый URL внешней системы, которую вызывает Eventicious в callback-сценариях. |
| `{id}` | Path placeholder для ID объекта во внешней системе. |
| `{{catalogId}}` | ID раздела каталога Eventicious. |
| `{{catalogElementId}}` | ID элемента каталога. |
| `{{courseId}}` | ID курса. |
| `{{stageId}}` | ID этапа курса. |
| `{{taskContentId}}` | ID контента задания. |
| `{{pollId}}` | ID опроса/теста. |
| `{{fileId}}` | ID загруженного файла. |

Дополнительные placeholders, встречающиеся в коллекции:

`{CourseName}`, `{DeadlineDate}`, `{baseUrl}`, `{catalogElementId}`, `{catalogId}`, `{client_id}`, `{client_secret}`, `{courseId}`, `{folderId}`, `{menteeId_1}`, `{menteeId_2}`, `{mentorId}`, `{pollId}`, `{scormId}`, `{sessionId}`, `{sourceId}`, `{stageId}`, `{taskContentId}`, `{your api path}`, `{{folderId}}`, `{{scormId}}`

## Быстрые сценарии интеграции

### 1. Создание пользователя из внешней системы в Eventicious

1. Получить Bearer token: `POST {{baseUrl}}/connect/token`.
2. Создать пользователя: `POST {{baseUrl}}/api/external/v2/users/create`.
3. Передать в теле `users[]`, где `id` — ID пользователя во внешней системе.
4. В ответе Eventicious вернёт `pinCode`, `autoLogin`, `qrCode` и исходный `id`.

### 2. Обновление пользователя

1. Получить Bearer token.
2. Отправить `PATCH {{baseUrl}}/api/external/v2/users/update`.
3. Передать массив `users[]` с теми же внешними `id`.

### 3. Закрытие доступа пользователю

- Вариант мягкого закрытия доступа: `POST {{baseUrl}}/api/external/v2/users/block`.
- Разблокировка: `POST {{baseUrl}}/api/external/v2/users/unblock`.
- Полное удаление: `DELETE {{baseUrl}}/api/external/v2/users/delete`.

### 4. Callback-синхронизация Eventicious → внешняя система

Раздел **«Синхронизация изменений пользователей с внешней системой»** описывает методы, которые должна реализовать внешняя система:
- `POST {your api base path}/create`
- `PUT {your api base path}/update/{id}`
- `DELETE {your api base path}/delete/{id}`

Важно: это не endpoints Eventicious. Это endpoints внешней системы, которые Eventicious вызывает сам при создании/изменении/удалении пользователя внутри Eventicious.

### 5. Группы, роли и наставники

- Создать ACL-группу: `POST /api/external/v2/aclgroups/create`.
- Добавить/удалить пользователей из групп: `POST /api/external/v2/aclgroups/users/move`.
- Назначить роль куратора/руководителя: `POST /api/external/v2/aclgroups/roles/add`.
- Назначить наставника подопечным: `POST /api/external/v2/users/mentor`.

## Сводка разделов

| Раздел | Количество endpoints |
|---|---:|
| Аутентификация и авторизация | 1 |
| Работа с пользователями | 3 |
| Блокировка пользователей | 2 |
| Работа с группами пользователей | 5 |
| Работа с наставниками | 2 |
| Работа с ролями | 2 |
| Синхронизация изменений пользователей с внешней системой | 3 |
| Работа с событиями в расписании | 3 |
| Работа с локациями в расписании | 3 |
| Работа с темами (тэгами) событий в расписании | 3 |
| Работа с материалами (ссылками) к событию в расписании | 3 |
| Геймификация | 2 |
| Синхронизация пользователей посредством загрузки CSV файла | 1 |
| Работа с каталогами | 31 |
| [Experimental feature] Работа с курсами | 7 |

## Полная карта endpoints

| # | Раздел | Действие | Method | URL |
|---:|---|---|---|---|
| 1 | Аутентификация и авторизация | Получение токена | `POST` | `{{baseUrl}}/connect/token` |
| 2 | Работа с пользователями | Создание | `POST` | `{{baseUrl}}/api/external/v2/users/create` |
| 3 | Работа с пользователями | Редактирование | `PATCH` | `{{baseUrl}}/api/external/v2/users/update` |
| 4 | Работа с пользователями | Удаление | `DELETE` | `{{baseUrl}}/api/external/v2/users/delete` |
| 5 | Блокировка пользователей | Блокировка | `POST` | `{{baseUrl}}/api/external/v2/users/block` |
| 6 | Блокировка пользователей | Разблокировка | `POST` | `{{baseUrl}}/api/external/v2/users/unblock` |
| 7 | Работа с группами пользователей | Создание | `POST` | `{{baseUrl}}/api/external/v2/aclgroups/create` |
| 8 | Работа с группами пользователей | Редактирование | `PUT` | `{{baseUrl}}/api/external/v2/aclgroups/update/{id}` |
| 9 | Работа с группами пользователей | Удаление | `DELETE` | `{{baseUrl}}/api/external/v2/aclgroups/delete/{id}` |
| 10 | Работа с группами пользователей | Список групп | `GET` | `{{baseUrl}}/api/external/v2/aclgroups` |
| 11 | Работа с группами пользователей | Добавление (удаление) пользователей в группы пользователей | `POST` | `{{baseUrl}}/api/external/v2/aclgroups/users/move` |
| 12 | Работа с наставниками | Назначение наставника подопечным | `POST` | `{{baseUrl}}/api/external/v2/users/mentor` |
| 13 | Работа с наставниками | Удаление наставника у подопечных | `DELETE` | `{{baseUrl}}/api/external/v2/users/mentor` |
| 14 | Работа с ролями | Назначение роли | `POST` | `{{baseUrl}}/api/external/v2/aclgroups/roles/add` |
| 15 | Работа с ролями | Снятие роли | `POST` | `{{baseUrl}}/api/external/v2/aclgroups/roles/remove` |
| 16 | Синхронизация изменений пользователей с внешней системой | Создание | `POST` | `{your api base path}/create` |
| 17 | Синхронизация изменений пользователей с внешней системой | Редактирование | `PUT` | `{your api base path}/update/{id}` |
| 18 | Синхронизация изменений пользователей с внешней системой | Удаление | `DELETE` | `{your api base path}/delete/{id}` |
| 19 | Работа с событиями в расписании | Создание | `POST` | `{{baseUrl}}/api/external/v2/sessions/create` |
| 20 | Работа с событиями в расписании | Редактирование | `PUT` | `{{baseUrl}}/api/external/v2/sessions/update/{id}` |
| 21 | Работа с событиями в расписании | Удаление | `DELETE` | `{{baseUrl}}/api/external/v2/sessions/delete/{id}` |
| 22 | Работа с локациями в расписании | Создание | `POST` | `{{baseUrl}}/api/external/v2/locations/create` |
| 23 | Работа с локациями в расписании | Редактирование | `PUT` | `{{baseUrl}}/api/external/v2/locations/update/{id}` |
| 24 | Работа с локациями в расписании | Удаление | `DELETE` | `{{baseUrl}}/api/external/v2/locations/delete/{id}` |
| 25 | Работа с темами (тэгами) событий в расписании | Создание | `POST` | `{{baseUrl}}/api/external/v2/tags/create` |
| 26 | Работа с темами (тэгами) событий в расписании | Редактирование | `PUT` | `{{baseUrl}}/api/external/v2/tags/update/{id}` |
| 27 | Работа с темами (тэгами) событий в расписании | Удаление | `DELETE` | `{{baseUrl}}/api/external/v2/tags/delete/{id}` |
| 28 | Работа с материалами (ссылками) к событию в расписании | Создание | `POST` | `{{baseUrl}}/api/external/v2/sessions/{sessionId}/attachments/create` |
| 29 | Работа с материалами (ссылками) к событию в расписании | Редактирование | `PUT` | `{{baseUrl}}/api/external/v2/sessions/{sessionId}/attachments/update/{id}` |
| 30 | Работа с материалами (ссылками) к событию в расписании | Удаление | `DELETE` | `{{baseUrl}}/api/external/v2/sessions/{sessionId}/attachments/delete/{id}` |
| 31 | Геймификация | Ручное начисление баллов | `POST` | `{{baseUrl}}/api/external/v2/gamification/add-manual-charge` |
| 32 | Геймификация | Передача данных о ручном начислении во внешнюю систему | `POST` | `{your api path}` |
| 33 | Синхронизация пользователей посредством загрузки CSV файла | Загрузка CSV файла | `POST` | `{{baseUrl}}/api/external/v2/users/import/{sourceId}/csv` |
| 34 | Работа с каталогами / Работа с корневыми разделами каталогов | Получение списка корневых разделов каталогов | `GET` | `{{baseUrl}}/api/external/v2/catalogs` |
| 35 | Работа с каталогами / Работа с корневыми разделами каталогов | Получение списка элементов каталога | `GET` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}` |
| 36 | Работа с каталогами / Работа с корневыми разделами каталогов | Создание корневого раздела каталога | `POST` | `{{baseUrl}}/api/external/v2/catalogs` |
| 37 | Работа с каталогами / Работа с корневыми разделами каталогов | Редактирование корневого раздела каталога | `PUT` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}` |
| 38 | Работа с каталогами / Работа с корневыми разделами каталогов | Удаление корневого раздела каталога | `DELETE` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}` |
| 39 | Работа с каталогами / Работа с участниками | Добавление участников в раздел каталога | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/attendees` |
| 40 | Работа с каталогами / Работа с участниками | Удаление участника из раздела каталога | `DELETE` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/attendees/{{catalogElementId}}` |
| 41 | Работа с каталогами / Работа с группами | Добавление групп в каталог | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/groups` |
| 42 | Работа с каталогами / Работа с группами | Удаление группы из каталога | `DELETE` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/groups/{{catalogElementId}}` |
| 43 | Работа с каталогами / Работа с файлами | Загрузка файла | `POST` | `{{baseUrl}}/api/external/v2/files/upload` |
| 44 | Работа с каталогами / Работа с файлами | Добавление файла в каталог | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/files` |
| 45 | Работа с каталогами / Работа с файлами | Удаление файла из каталога | `DELETE` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/files/{{catalogElementId}}` |
| 46 | Работа с каталогами / Работа с ссылками | Создание новой ссылки в каталоге | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/links` |
| 47 | Работа с каталогами / Работа с ссылками | Удаление ссылки из каталога | `DELETE` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/links/{{catalogElementId}}` |
| 48 | Работа с каталогами / Работа с текстом | Добавление текста  в каталог | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/texts` |
| 49 | Работа с каталогами / Работа с текстом | Удаление текста из каталога | `DELETE` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/texts/{{catalogElementId}}` |
| 50 | Работа с каталогами / Работа с текстом (Text 2.0) | Добавление текста  в каталог | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/gravity-editor` |
| 51 | Работа с каталогами / Работа с текстом (Text 2.0) | Удаление текста из каталога | `DELETE` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/gravity-editor/{{catalogElementId}}` |
| 52 | Работа с каталогами / Работа с наставником | Добавление наставника в каталог | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/mentor` |
| 53 | Работа с каталогами / Работа с наставником | Удаление наставника из каталога | `DELETE` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/mentor/{{catalogElementId}}` |
| 54 | Работа с каталогами / Работа с видео | Загрузка видео | `POST` | `{{baseUrl}}/api/external/v2/videos/upload` |
| 55 | Работа с каталогами / Работа с видео | Добавление видео в каталог | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/videos` |
| 56 | Работа с каталогами / Работа с видео | Удаление видео из каталога | `DELETE` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/videos/{{catalogElementId}}` |
| 57 | Работа с каталогами / Работа с папками (вложенными разделами каталога) | Добавление папки в раздел каталога | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/folders` |
| 58 | Работа с каталогами / Работа с папками (вложенными разделами каталога) | Редактирование папки | `PUT` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/folders/{{folderId}}` |
| 59 | Работа с каталогами / Работа с папками (вложенными разделами каталога) | Удаление папки из раздела каталога | `DELETE` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/folders/{{folderId}}` |
| 60 | Работа с каталогами | Изменение порядка корневых разделов каталогов | `PUT` | `{{baseUrl}}/api/external/v2/catalogs/order` |
| 61 | Работа с каталогами | Изменение порядка элементов каталога | `PUT` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/content/order` |
| 62 | Работа с каталогами | Массовое удаление элементов каталога | `PUT` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/content/deleteBulk` |
| 63 | Работа с каталогами | Добавление корневого раздела каталога или папки в меню | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/menu/add` |
| 64 | Работа с каталогами | Удаление корневого раздела каталога или папки из меню | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/menu/delete` |
| 65 | [Experimental feature] Работа с курсами / [Experimental feature] Работа с заданиями | Импорт контента в задание | `PUT` | `{{baseUrl}}/api/external/v2/task-contents/{{taskContentId}}` |
| 66 | [Experimental feature] Работа с курсами / [Experimental feature] Работа с опросами и тестами | Импорт контента опроса/теста | `PUT` | `{{baseUrl}}/api/external/v2/polls/{{pollId}}` |
| 67 | [Experimental feature] Работа с курсами / [Experimental feature] Работа с общей структурой | Импорт общей структуры курса | `POST` | `{{baseUrl}}/api/external/v2/courses` |
| 68 | [Experimental feature] Работа с курсами / [Experimental feature] Работа с общей структурой | Финализировать курс | `POST` | `{{baseUrl}}/api/external/v2/courses/{{courseId}}/finalize` |
| 69 | [Experimental feature] Работа с курсами / [Experimental feature] Работа с файлами | Загрузка изображений | `POST` | `{{baseUrl}}/api/external/v2/images/upload?generateThumbnails=true` |
| 70 | [Experimental feature] Работа с курсами / [Experimental feature] Работа с файлами | Загрузить вложений к заданию | `POST` | `{{baseUrl}}/api/external/v2/task-contents/attachments/upload` |
| 71 | [Experimental feature] Работа с курсами / [Experimental feature] Работа с файлами | Загрузить SCORM курс в этап | `POST` | `{{baseUrl}}/api/external/v2/courses/{{courseId}}/stages/{{stageId}}/scorm/{{scormId}}/upload` |

## Подробная документация

## Аутентификация и авторизация

Для использования External API версии v2 и выше необходимо в каждом запросе отправлять в заголовке Authorization специальный Bearer токен. Для его получения нужно отправить запрос. Срок жизни токена составляет 1 час. Описание необходимых полей для запроса представлено ниже.

## Описание полей

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| client_id | string | идентификатор ключа |
| client_secret | string | пароль для ключа |

Для получения `client_id` и `client_secret` необходимо обратиться в контент-отдел Eventicious.

**Краткая карта методов раздела**

| Действие | Method | URL |
|---|---|---|
| Получение токена | `POST` | `{{baseUrl}}/connect/token` |

### Получение токена

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/connect/token` |
| Авторизация | Без Bearer; получение токена |

**Пример тела запроса**

| Key | Value | Type |
|---|---|---|
| `grant_type` | `client_credentials` | `text` |
| `client_id` | `{{client_id}}` | `text` |
| `client_secret` | `{{client_secret}}` | `text` |

**Пример ответа**

_В коллекции нет примера ответа._

## Работа с пользователями

## **Примечания**:

1. Профиль пользователя можно кастомизировать. Доступны переименование, скрытие и создание полей. Переименование полей не влияет на возможность передавать данные по API, однако при настройке нужно ориентироваться на исходное название поля. Для созданных дополнительных полей передача данных по API на данный момент невозможна.

2. Если в программе обучения включена функция автопубликации пользователей, то количество запросов на любые изменения пользователей (create / update / delete) ограничено 10 запросами в минуту.

3. Один запрос каждого типа может содержать не более 200 пользователей.


## **Описание полей**

*обязательное поле

**read-only поле (нельзя использовать в запросах на создание и редактирование)

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| id* | int | идентификатор пользователя в вашей системе (externalID в Eventicious) |
| firstName* | string | имя |
| lastName* | string | фамилия |
| email | string | email |
| phone | string | телефон |
| region | string | регион |
| location | string | город |
| company | string | название компании |
| division | string | подразделение или филиал |
| department | string | отдел |
| position | string | должность |
| description | string | о сотруднике |
| interests | string | интересы |
| addInfo | string | доп. поле для внесения информации о сотруднике |
| date1 | date | поле для задания произвольной даты - даты рождения, даты приема на работу и т.п. |
| date2 | date | поле для задания произвольной даты - даты рождения, даты приема на работу и т.п. |
| externalImagePath | string | ссылка на файл с фотографией пользователя (URL) |
| language | string | язык, на котором происходит редактирование (только для PUT запросов) |
| aclGroupsIds | int | массив ID групп пользователя в вашей системе (предварительно группы должны быть созданы, см. раздел Работа с группами) |
| showEmail** | bool | показывать email другим пользователям |
| showPhone** | bool | показывать телефон другим пользователям |
| qrCode** | string | строка для генерации QR-кода пользователя |
| pinCode** | string | ID пользователя (индивидуальный код доступа в приложение) |
| privateInfo | string | личная информация (доступна только этому пользователю после авторизации в приложении) |
| moderated** | bool | пользователь прошел премодерацию |
| confirmed** | bool | пользователь авторизовался в приложении |
| autoLogin** | string | автоматически сгенерированный логин |

**Краткая карта методов раздела**

| Действие | Method | URL |
|---|---|---|
| Создание | `POST` | `{{baseUrl}}/api/external/v2/users/create` |
| Редактирование | `PATCH` | `{{baseUrl}}/api/external/v2/users/update` |
| Удаление | `DELETE` | `{{baseUrl}}/api/external/v2/users/delete` |

### Создание

Позволяет создать сразу несколько новых пользователей.

В ответе возвращается следующая информация о пользователе:

- pinCode — ID пользователя (персональный код доступа в приложение)

- qrCode - Строка для генерации QR-кода пользователя

- autoLogin - Автологин пользователя

- Внешний ID пользователя

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/users/create` |
| Авторизация | Authorization: Bearer {bearer_token} |
| Headers из коллекции | `Content-Type: application/json` |

**Пример тела запроса**

```json
{
    "users": [
        {
            "id": 1,
            "firstName": "First Name Example",
            "lastName": "Last Name Example",
            "company": "Company Example",
            "division": "Division Example",
            "department": "Department Example",
            "position": "Position Example",
            "region": "Region Example",
            "location": "Location Example",
            "email": "example@example.com",
            "phone": "+79999999999",
            "description": "Description Example: <ul><li>marked list</li></ul> <ol><li>numeric list</li></ol> <strong>bold</strong> <em>italic</em> <span style=\"text-decoration: underline\">underline</span> <a title=\"header\" href=\"https://ya.ru/\">hyperlink</a>",
            "externalImagePath": "https://www.w3schools.com/w3images/avatar2.png",
            "date1": "2019-08-10",
            "privateInfo": "Private info",
            "aclGroupIds": [
                100,
                200,
                300
            ]
        },
        {
            "id": 2,
            "firstName": "First Name Example",
            "lastName": "Last Name Example",
            "company": "Company Example",
            "division": "Division Example",
            "department": "Department Example",
            "position": "Position Example",
            "region": "Region Example",
            "location": "Location Example",
            "email": "example@example.com",
            "phone": "+79999999999",
            "description": "Description Example: <ul><li>marked list</li></ul> <ol><li>numeric list</li></ol> <strong>bold</strong> <em>italic</em> <span style=\"text-decoration: underline\">underline</span> <a title=\"header\" href=\"https://ya.ru/\">hyperlink</a>",
            "externalImagePath": "https://www.w3schools.com/w3images/avatar2.png",
            "date1": "2019-08-10",
            "privateInfo": "Private info",
            "aclGroupIds": [
                100,
                200,
                300
            ]
        }
    ]
}
```

**Пример ответа**

**1. Массовое создание**

```json
{
    "users": [
        {
            "id": 1,
            "pinCode": "1013",
            "autoLogin": "itp2vwbl",
            "qrCode": "BEGIN:VCARD\nVERSION:3.0\nN:Last Name Example;First Name Example;;;\nFN:First Name Example Last Name Example\nORG:Company Example\nTITLE:Position Example\nTEL:+79999999999\nEMAIL:example@example.com\nX-EVQR:v2\\,First Name Example Last Name Example\\,3280433\\,97ED4E35DDE080F50C85\nEND:VCARD\n"
        },
        {
            "id": 2,
            "pinCode": "1014",
            "autoLogin": "24irv9xq",
            "qrCode": "BEGIN:VCARD\nVERSION:3.0\nN:Last Name Example;First Name Example;;;\nFN:First Name Example Last Name Example\nORG:Company Example\nTITLE:Position Example\nTEL:+79999999999\nEMAIL:example@example.com\nX-EVQR:v2\\,First Name Example Last Name Example\\,3280434\\,292497A617883046C058\nEND:VCARD\n"
        }
    ]
}
```

### Редактирование

Позволяет изменять информацию о нескольких пользователях одновременно.

В ответе возвращается следующая информация о пользователе:

- pinCode — ID пользователя (персональный код доступа в приложение)

- qrCode - Строка для генерации QR-кода пользователя

- autoLogin - Автологин пользователя

- Внешний ID пользователя

| Параметр | Значение |
|---|---|
| Method | `PATCH` |
| URL | `{{baseUrl}}/api/external/v2/users/update` |
| Авторизация | Authorization: Bearer {bearer_token} |
| Headers из коллекции | `Content-Type: application/json` |

**Пример тела запроса**

```json
{
    "users": [
        {
            "id": 1,
            "firstName": "First Name Example",
            "lastName": "Last Name Example",
            "company": "Company Example",
            "division": "Division Example",
            "department": "Department Example",
            "position": "Position Example",
            "region": "Region Example",
            "location": "Location Example",
            "email": "example@example.com",
            "phone": "+79999999999",
            "description": "Description Example: <ul><li>marked list</li></ul> <ol><li>numeric list</li></ol> <strong>bold</strong> <em>italic</em> <span style=\"text-decoration: underline\">underline</span> <a title=\"header\" href=\"https://ya.ru/\">hyperlink</a>",
            "externalImagePath": "https://www.w3schools.com/w3images/avatar2.png",
            "date1": "2019-08-10",
            "privateInfo": "Private info",
            "aclGroupIds": [
                100,
                200,
                300
            ]
        },
        {
            "id": 2,
            "firstName": "First Name Example",
            "lastName": "Last Name Example",
            "company": "Company Example",
            "division": "Division Example",
            "department": "Department Example",
            "position": "Position Example",
            "region": "Region Example",
            "location": "Location Example",
            "email": "example@example.com",
            "phone": "+79999999999",
            "description": "Description Example: <ul><li>marked list</li></ul> <ol><li>numeric list</li></ol> <strong>bold</strong> <em>italic</em> <span style=\"text-decoration: underline\">underline</span> <a title=\"header\" href=\"https://ya.ru/\">hyperlink</a>",
            "externalImagePath": "https://www.w3schools.com/w3images/avatar2.png",
            "date1": "2019-08-10",
            "privateInfo": "Private info",
            "aclGroupIds": [
                100,
                200,
                300
            ]
        }
    ]
}
```

**Пример ответа**

**1. Массовое обновление**

- Статус: `200` OK

```json
{
    "users": [
        {
            "id": 1,
            "pinCode": "1013",
            "autoLogin": "itp2vwbl",
            "qrCode": "BEGIN:VCARD\nVERSION:3.0\nN:Last Name Example;First Name Example;;;\nFN:First Name Example Last Name Example\nORG:Company Example\nTITLE:Position Example\nTEL:+79999999999\nEMAIL:example@example.com\nX-EVQR:v2\\,First Name Example Last Name Example\\,3280433\\,97ED4E35DDE080F50C85\nEND:VCARD\n"
        },
        {
            "id": 2,
            "pinCode": "1014",
            "autoLogin": "24irv9xq",
            "qrCode": "BEGIN:VCARD\nVERSION:3.0\nN:Last Name Example;First Name Example;;;\nFN:First Name Example Last Name Example\nORG:Company Example\nTITLE:Position Example\nTEL:+79999999999\nEMAIL:example@example.com\nX-EVQR:v2\\,First Name Example Last Name Example\\,3280434\\,292497A617883046C058\nEND:VCARD\n"
        }
    ]
}
```

### Удаление

Позволяет удалить сразу несколько пользователей.

| Параметр | Значение |
|---|---|
| Method | `DELETE` |
| URL | `{{baseUrl}}/api/external/v2/users/delete` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Пример тела запроса**

```json
{
    "userIds": [ 2005, 2006, 3 ]
}
```

**Пример ответа**

**1. Массовое удаление**

```json
{
    "userIds": [ 1, 2, 3 ]
}
```

## Блокировка пользователей

Описанные ниже методы позволяют осуществлять массовое блокирование и разблокирование пользователей. При нобходимости закрытия доступа к системе пользователь может быть заблокирован.

Один запрос может включать не более 200 пользователей.

**Краткая карта методов раздела**

| Действие | Method | URL |
|---|---|---|
| Блокировка | `POST` | `{{baseUrl}}/api/external/v2/users/block` |
| Разблокировка | `POST` | `{{baseUrl}}/api/external/v2/users/unblock` |

### Блокировка

Позволяет заблокировать пользователей с указанными идентификаторами `{id}.`

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/users/block` |
| Авторизация | Authorization: Bearer {bearer_token} |
| Headers из коллекции | `Content-Type: application/json` |

**Пример тела запроса**

```json
{
  "userIds": [
      1,
      2,
      3
  ]
}
```

**Пример ответа**

**1. Блокировка**

- Статус: `200` OK

```json
{
    "userIds": [
        1,
        2,
        3
    ]
}
```

### Разблокировка

Позволяет разблокировать пользователей с указанными идентификаторами `{id}.`

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/users/unblock` |
| Авторизация | Authorization: Bearer {bearer_token} |
| Headers из коллекции | `Content-Type: application/json` |

**Пример тела запроса**

```json
{
  "userIds": [
      1,
      2,
      3
  ]
}
```

**Пример ответа**

**1. Разблокировка**

- Статус: `200` OK

```json
{
    "userIds": [
        1,
        2,
        3
    ]
}
```

## Работа с группами пользователей

На платформе Talent Rocks есть возможность объединять пользователей в произвольные группы (группы обучения, группы по отделам, подразделениям, городам и т.п.). Описанные ниже методы позволяют управлять группами пользователей.

## Описание полей

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| id | int | идентификатор группы в вашей системе |
| name | string | название группы пользователей |

**Краткая карта методов раздела**

| Действие | Method | URL |
|---|---|---|
| Создание | `POST` | `{{baseUrl}}/api/external/v2/aclgroups/create` |
| Редактирование | `PUT` | `{{baseUrl}}/api/external/v2/aclgroups/update/{id}` |
| Удаление | `DELETE` | `{{baseUrl}}/api/external/v2/aclgroups/delete/{id}` |
| Список групп | `GET` | `{{baseUrl}}/api/external/v2/aclgroups` |
| Добавление (удаление) пользователей в группы пользователей | `POST` | `{{baseUrl}}/api/external/v2/aclgroups/users/move` |

### Создание

Позволяет создать группу пользователей.

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/aclgroups/create` |
| Авторизация | Authorization: Bearer {bearer_token} |
| Headers из коллекции | `Content-Type: application/json` |

**Пример тела запроса**

```json
{
    "id": {id},
    "name": "Group Name"
}
```

**Пример ответа**

**1. Создание**

- Статус: `200` OK

```json
{
    "id": 1,
    "name": "Group Name"
}
```

### Редактирование

Позволяет отредактировать группу пользователей с идентификатором `{id}.`

| Параметр | Значение |
|---|---|
| Method | `PUT` |
| URL | `{{baseUrl}}/api/external/v2/aclgroups/update/{id}` |
| Авторизация | Authorization: Bearer {bearer_token} |
| Headers из коллекции | `Content-Type: application/json` |

**Пример тела запроса**

```json
{
    "name": "Updated GroupName"
}
```

**Пример ответа**

**1. Редактирование**

- Статус: `200` OK

```json
{
    "id": 1,
    "name": "Updated Group Name"
}
```

### Удаление

Позволяет удалить группу пользователей с идентификатором `{id}.`

| Параметр | Значение |
|---|---|
| Method | `DELETE` |
| URL | `{{baseUrl}}/api/external/v2/aclgroups/delete/{id}` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Тело запроса:** не требуется / не указано.

**Пример ответа**

**1. Удаление**

- Статус: `200` OK

```json
{
    "success": true
}
```

### Список групп

Позволяет получить список всех групп программы обучения, кроме системных. В поле id указывается идентификатор группы в вашей системе. Если для группы этот параметр не настроен, вместо идентификатора будет указан null.

| Параметр | Значение |
|---|---|
| Method | `GET` |
| URL | `{{baseUrl}}/api/external/v2/aclgroups` |
| Авторизация | Authorization: Bearer {bearer_token} |
| Headers из коллекции | `Content-Type: application/json` |

**Тело запроса:** не требуется / не указано.

**Пример ответа**

**1. Список групп**

- Статус: `200` OK

```json
{
    "groups": [
        {
            "id": 3,
            "name": "Group Name 1"
        },
        {
            "id": null,
            "name": "Group Name 2"
        }
    ]
}
```

### Добавление (удаление) пользователей в группы пользователей

Позволяет добавлять/удалять сразу нескольких пользователей из групп пользователей.

Максимальное количество пользователей в одном запросе: 200

## Описание полей

| Property | **Type** | **Comment** |
| --- | --- | --- |
| userIds | int\[\] | массив идентификаторов пользователей в событии |
| groupIdsAddTo | int\[\] | массив идентификаторов групп пользователей, в которые будут добавлены пользователи |
| groupIdsRemoveFrom | int\[\] | массив идентификаторов групп пользователей, из которых будут удалены пользователи |

## Пример

Запрос из примера добавит трех пользователей с идентификаторами 1, 2 и 3 сразу в две группы пользователей - с идентификаторами 1 и 2, а затем удалит этих же пользователей из групп пользователей с идентификаторами 3 и 4.

Важно! В запросе должны быть указаны все поля. Если вы не хотите добавлять / удалять пользователей из групп, то укажите в данном поле пустой список. Пример:

``` json
{
  "userIds":[1,2,3],
  "groupIdsAddTo":[1,2],
  "groupIdsRemoveFrom":[]
}

 ```

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/aclgroups/users/move` |
| Авторизация | Authorization: Bearer {bearer_token} |
| Headers из коллекции | `Content-Type: application/json` |

**Пример тела запроса**

```json
{
    "userIds": [
        1,
        2,
        3
    ],
    "groupIdsAddTo": [
        1,
        2
    ],
    "groupIdsRemoveFrom": [
        3,
        4
    ]
}
```

**Пример ответа**

**1. Добавление (удаление) участников в группы участников**

- Статус: `200` OK

_Пустое тело ответа или пример не указан._

## Работа с наставниками

## Описание полей

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| mentorId | int | идентификатор наставника |
| menteeIds | int\[\] | идентификаторы подопечных |

**Краткая карта методов раздела**

| Действие | Method | URL |
|---|---|---|
| Назначение наставника подопечным | `POST` | `{{baseUrl}}/api/external/v2/users/mentor` |
| Удаление наставника у подопечных | `DELETE` | `{{baseUrl}}/api/external/v2/users/mentor` |

### Назначение наставника подопечным

Добавляет наставнику {mentorId} подопечных {menteeIds}

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/users/mentor` |
| Авторизация | Authorization: Bearer {bearer_token} |
| Headers из коллекции | `Content-Type: application/json` |

**Пример тела запроса**

```json
{
    "mentorId":  {mentorId},
    "menteeIds": [
		{menteeId_1},
		{menteeId_2}
	]
}
```

**Пример ответа**

_В коллекции нет примера ответа._

### Удаление наставника у подопечных

Удаляет наставника {mentorId} у подопечных из списка {menteeIds}

| Параметр | Значение |
|---|---|
| Method | `DELETE` |
| URL | `{{baseUrl}}/api/external/v2/users/mentor` |
| Авторизация | Authorization: Bearer {bearer_token} |
| Headers из коллекции | `Content-Type: application/json` |

**Пример тела запроса**

```json
{
    "mentorId":  {mentorId},
    "menteeIds": [
		{menteeId_1},
		{menteeId_2}
	]
}
```

**Пример ответа**

_В коллекции нет примера ответа._

## Работа с ролями

Данная группа методов позволяет назначать и снимать роли с пользователей.

Максимальное количество пользователей в одном запросе: 200


## Описание полей

| Property | Type | Comment |
| --- | --- | --- |
| groupId | int | Идентификатор группы в вашей системе |
| userId | int | Идентификатор пользователя в вашей системе |
| roleId | int | Идентификатор роли.
Доступные значения:
1 - Куратор
2 - Руководитель |

В случае, если:

- Пользователя не существует в системе

- Группы не существует в системе

- Роли не существует в системе

- Пользователь не состоит в указанной группе


вся операция завершается ошибкой. В ответе будет указан список сущностей, спровоцировавших ошибку.

**Краткая карта методов раздела**

| Действие | Method | URL |
|---|---|---|
| Назначение роли | `POST` | `{{baseUrl}}/api/external/v2/aclgroups/roles/add` |
| Снятие роли | `POST` | `{{baseUrl}}/api/external/v2/aclgroups/roles/remove` |

### Назначение роли

Позволяет назначить роли на пользователей в указанных группах пользователей.

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/aclgroups/roles/add` |
| Авторизация | Authorization: Bearer {bearer_token} |
| Headers из коллекции | `Content-Type: application/json` |

**Пример тела запроса**

```json
{
    "roleInfo":[
        {
            "groupId":1,
            "userId":1,
            "roleIds":[1, 2]
        },
        {
            "groupId":2,
            "userId":3,
            "roleIds":[2]
        }
    ]
}
```

**Пример ответа**

**1. Назначение руководителей**

- Статус: `200` OK

_Пустое тело ответа или пример не указан._

### Снятие роли

Позволяет снять роли с пользователей в указанных группах пользователей.

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/aclgroups/roles/remove` |
| Авторизация | Authorization: Bearer {bearer_token} |
| Headers из коллекции | `Content-Type: application/json` |

**Пример тела запроса**

```json
{
    "roleInfo":[
        {
            "groupId":1,
            "userId":1,
            "roleIds":[1, 2]
        },
        {
            "groupId":2,
            "userId":3,
            "roleIds":[2]
        }
    ]
}
```

**Пример ответа**

**1. Снятие руководителей**

- Статус: `200` OK

_Пустое тело ответа или пример не указан._

## Синхронизация изменений пользователей с внешней системой

## Примечания:

1. На платформе Talent Rocks есть возможность синхронизации изменений пользователей с внешней системой. При любом изменении пользователя, из клиентского приложения или панели администрирования отправляется запрос на заданный url.

2. Свяжитесь с службой поддержки Talent Rocks и сообщите url-адрес, который необходимо вызывать для оповещения об изменении пользователей, например: [https://yoursystem.com/eventicious_callback](https://) . При создании/изменении/редактировании пользователей будут вызываться разные методы.

**Краткая карта методов раздела**

| Действие | Method | URL |
|---|---|---|
| Создание | `POST` | `{your api base path}/create` |
| Редактирование | `PUT` | `{your api base path}/update/{id}` |
| Удаление | `DELETE` | `{your api base path}/delete/{id}` |

### Создание

Вызывается при создании пользователя в нашей системе.

**Примечание:** при создании мы не знаем id пользователя в вашей системе, поэтому данный метод ожидает ответа от вашего сервера с id пользователя в вашей системе.

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{your api base path}/create` |
| Авторизация | No auth в коллекции |

**Пример тела запроса**

```json
{
    "firstName": "sample string 3",
    "lastName": "sample string 4",
    "company": "sample string 5",
    "position": "sample string 6",
    "location": "sample string 7",
    "externalImagePath": "https://eventicious.com/images/some_img.png",
    "interests": "sample string 8",
    "addInfo": "sample string 9",
    "email": "sample string 10",
    "showEmail": false,
    "description": "sample string 11",
    "phone": "+79999999999",
    "showPhone": false,
    "language": "ru-RU",
    "pinCode": "438822",
    "confirmed": true,
    "moderated": true,
    "privateInfo": "sample string 12",
    "division": "sample string 13",
    "department": "sample string 14",
    "region": "sample string 15",
    "date1": "2019-07-20",
    "date2": "2019-07-20",
    "qrCode": "BEGIN:VCARD\nVERSION:3.0\nN:Майская;Анфиса;;;\nFN:Анфиса Майская\nX-EVQR:v2\\,Анфиса Майская\\,1941844\\,81165A5BA3599EA80B45\nEND:VCARD\n",
    "autoLogin": "227naznw",
    "aclGroupsIds": [
        100,
        200
    ]
}
```

**Пример ответа**

**1. Создание**

- Статус: `200` OK

```json
{
    "id": 1234
}
```

### Редактирование

Вызывается при редактировании пользователя в нашей системе.

| Параметр | Значение |
|---|---|
| Method | `PUT` |
| URL | `{your api base path}/update/{id}` |
| Авторизация | No auth в коллекции |

**Пример тела запроса**

```json
{
    "id": 1,
    "firstName": "sample string 3",
    "lastName": "sample string 4",
    "company": "sample string 5",
    "position": "sample string 6",
    "location": "sample string 7",
    "externalImagePath": "https://eventicious.com/images/some_img.png",
    "interests": "sample string 8",
    "addInfo": "sample string 9",
    "email": "sample string 10",
    "showEmail": false,
    "description": "sample string 11",
    "phone": "+79999999999",
    "showPhone": false,
    "language": "ru-RU",
    "pinCode": "438822",
    "confirmed": true,
    "moderated": true,
    "privateInfo": "sample string 12",
    "division": "sample string 13",
    "department": "sample string 14",
    "region": "sample string 15",
    "date1": "2019-07-20",
    "date2": "2019-07-21",
    "qrCode": "BEGIN:VCARD\nVERSION:3.0\nN:Майская;Анфиса;;;\nFN:Анфиса Майская\nX-EVQR:v2\\,Анфиса Майская\\,1941844\\,81165A5BA3599EA80B45\nEND:VCARD\n",
    "autoLogin": "227naznw",
    "aclGroupsIds": [
        100,
        200
    ]
}
```

**Пример ответа**

**1. Редактирование**

- Статус: `200` OK

_Пустое тело ответа или пример не указан._

### Удаление

Вызывается при удалении пользователя в нашей системе.

| Параметр | Значение |
|---|---|
| Method | `DELETE` |
| URL | `{your api base path}/delete/{id}` |
| Авторизация | No auth в коллекции |

**Тело запроса:** не требуется / не указано.

**Пример ответа**

**1. Удаление**

- Статус: `200` OK

_Пустое тело ответа или пример не указан._

## Работа с событиями в расписании

**ВАЖНО**: События в расписании не должны пересекаться по времени и месту с уже существующим событием. При наличии пересекающихся по времени и месту событий при публикации контента в панели администрирования будет возникать ошибка.


## Описание полей

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| id | int | идентификатор события в вашей системе |
| title | string | название события |
| description | string | описание события |
| startTime | DateTime? | время начала |
| endTime | DateTime? | время окончания |
| tagIds | int\[\] | массив id тем (тэгов) |
| speakerIds | int\[\] | Массив id тренеров (коучей) |
| locationIds | int\[\] | массив id локаций (залов, аудиторий) |
| type | int | тип события
0 - доклад (сессия, семинар, вебинар и т.д.)
1 - кофе-брейк, обед или другое общее событие
2 - филлер (небольшое объявление без указания времени)

У кофе-брейка и филлера нет описания, для них не указываются тренеры — только плашка с названием в расписании.

Для филлеров также не отображается время (используется только для задания позиции в расписании), таким образом можно создавать события-уведомления без указания конкретного времени. |
| externalImagePath | string | ссылка на изображение для события в расписании. Отображается на экране деталей события, используется только для событий типа "Доклад" |
| aclGroupsIds | int\[\] | массив ID групп пользователей в вашей системе (предварительно группы должны быть созданы, см. раздел Работа с группами пользователей). Событие будет отображаться только для авторизованных пользователей, входящих в указанные группы. |
| language | string | язык, на котором происходит редактирование (только для PUT запросов) |

**Краткая карта методов раздела**

| Действие | Method | URL |
|---|---|---|
| Создание | `POST` | `{{baseUrl}}/api/external/v2/sessions/create` |
| Редактирование | `PUT` | `{{baseUrl}}/api/external/v2/sessions/update/{id}` |
| Удаление | `DELETE` | `{{baseUrl}}/api/external/v2/sessions/delete/{id}` |

### Создание

Позволяет создать событие в расписании.

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/sessions/create` |
| Авторизация | Authorization: Bearer {bearer_token} |
| Headers из коллекции | `Content-Type: application/json` |

**Пример тела запроса**

```json
{
    "id": 1,
    "title": "Title Example",
    "description": "Description Example: <ul><li>marked list</li></ul> <ol><li>numeric list</li></ol> <strong>bold</strong> <em>italic</em> <span style=\"text-decoration: underline\">underline</span> <a title=\"header\" href=\"https://ya.ru/\">hyperlink</a>",
    "startTime": "2022-02-14T13:00",
    "endTime": "2022-02-14T15:00",
    "externalImagePath": "https://www.w3schools.com/html/pic_trulli.jpg",
    "color": "#FF3B30",
    "tagIds": [
        1
    ],
    "speakersIds": [
        3
    ],
    "locationsIds": [
        1
    ],
    "aclGroupsIds":[
        1
    ],
    "type": 0
}
```

**Пример ответа**

**1. Событие уже существует**

- Статус: `400` Bad Request

```json
{
    "message": "Session with this id already exists in the database"
}
```

**2. Создание**

- Статус: `200` OK

```json
{
    "id": 1,
    "title": "Title Example",
    "description": "Description Example: <ul><li>marked list</li></ul> <ol><li>numeric list</li></ol> <strong>bold</strong> <em>italic</em> <span style=\"text-decoration: underlin\">underline</span> <a title=\"header\" href=\"https://ya.ru/\">hyperlink</a>",
    "startTime": "2022-02-14T13:00:00",
    "endTime": "2022-02-14T15:00:00",
    "displayStartTime": null,
    "displayEndTime": null,
    "color": "#FF3B30",
    "speakersIds": [
        3
    ],
    "locationsIds": [
        1
    ],
    "aclGroupsIds": [],
    "tagIds": [
        1
    ],
    "dayId": 108608,
    "type": 0,
    "externalImagePath": "https://www.w3schools.com/html/pic_trulli.jpg",
    "externalThumbnailPath": null,
    "language": "ru-RU"
}
```

### Редактирование

Позволяет отредактировать событие в расписании с идентификатором {id}.

| Параметр | Значение |
|---|---|
| Method | `PUT` |
| URL | `{{baseUrl}}/api/external/v2/sessions/update/{id}` |
| Авторизация | Authorization: Bearer {bearer_token} |
| Headers из коллекции | `Content-Type: application/json` |

**Пример тела запроса**

```json
{
    "title": "Updated Title Example",
    "description": "Updated Description Example",
    "startTime": "2022-02-14T13:00",
    "endTime": "2022-02-14T15:00",
    "color": "#FF3B30",
    "tagIds": [
        1
    ],
    "speakersIds": [
        4
    ],
    "locationsIds": [
        1
    ],
    "aclGroupsIds":[
        1
    ],
    "type": 0
}
```

**Пример ответа**

**1. Редактирование**

- Статус: `200` OK

```json
{
    "id": 1,
    "title": "Updated Title Example",
    "description": "Updated Description Example",
    "startTime": "2022-02-14T13:00:00",
    "endTime": "2022-02-14T15:00:00",
    "displayStartTime": null,
    "displayEndTime": null,
    "color": "#FF3B30",
    "speakersIds": [
        4
    ],
    "locationsIds": [
        1
    ],
    "aclGroupsIds": [],
    "tagIds": [
        1
    ],
    "dayId": 108608,
    "type": 0,
    "externalImagePath": "https://www.w3schools.com/html/pic_trulli.jpg",
    "externalThumbnailPath": null,
    "language": "ru-RU"
}
```

### Удаление

Позволяет удалить событие в расписании с идентификатором {id}.

| Параметр | Значение |
|---|---|
| Method | `DELETE` |
| URL | `{{baseUrl}}/api/external/v2/sessions/delete/{id}` |
| Авторизация | Authorization: Bearer {bearer_token} |
| Headers из коллекции | `Content-Type: application/json` |

**Тело запроса:** не требуется / не указано.

**Пример ответа**

**1. Удаление**

- Статус: `200` OK

```json
{
    "success": true
}
```

## Работа с локациями в расписании

## Описание полей

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| id | int | идентификатор локации в вашей системе |
| name | string | название локации |
| position* | int | порядковый номер локации, должен быть уникальным. |
| language | string | язык, на котором происходит редактирование (только для PUT запросов) |

*cистема не проверяет корректность задания порядковых номеров локаций. В приложении, если используется многопоточное расписание, локации отображаются в соответствии с порядковыми номерами.

**Краткая карта методов раздела**

| Действие | Method | URL |
|---|---|---|
| Создание | `POST` | `{{baseUrl}}/api/external/v2/locations/create` |
| Редактирование | `PUT` | `{{baseUrl}}/api/external/v2/locations/update/{id}` |
| Удаление | `DELETE` | `{{baseUrl}}/api/external/v2/locations/delete/{id}` |

### Создание

Позволяет создать локацию для событий в расписании.

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/locations/create` |
| Авторизация | Authorization: Bearer {bearer_token} |
| Headers из коллекции | `Content-Type: application/json` |

**Пример тела запроса**

```json
{
    "id": 1,
    "position": 3,
    "name": "Location Name Example"
}
```

**Пример ответа**

**1. Создание**

- Статус: `200` OK

```json
{
    "id": 1,
    "name": "Location Name Example",
    "position": 3,
    "language": "ru-RU"
}
```

### Редактирование

Позволяет отредактировать созданную локацию с идентификатором `{id}.`

| Параметр | Значение |
|---|---|
| Method | `PUT` |
| URL | `{{baseUrl}}/api/external/v2/locations/update/{id}` |
| Авторизация | Authorization: Bearer {bearer_token} |
| Headers из коллекции | `Content-Type: application/json` |

**Пример тела запроса**

```json
{
    "position": 3,
    "name": "Updated Location Name Example",
    "language": "ru"
}
```

**Пример ответа**

**1. Редактирование**

- Статус: `200` OK

```json
{
    "id": 1,
    "name": "Updated Location Name Example",
    "position": 3,
    "language": "ru-RU"
}
```

### Удаление

Позволяет удалить локацию с идентификатором `{id}.`

| Параметр | Значение |
|---|---|
| Method | `DELETE` |
| URL | `{{baseUrl}}/api/external/v2/locations/delete/{id}` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Тело запроса:** не требуется / не указано.

**Пример ответа**

**1. Удаление**

- Статус: `200` OK

```json
{
    "success": true
}
```

## Работа с темами (тэгами) событий в расписании

К событиям в расписании можно указывать темы (Бизнес, Экономика, Обучение и т.п.). Описанные ниже методы позволяют управлять этими темами.

### Описание полей

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| id | int | идентификатор темы в вашей системе |
| name | string | название темы |
| color | int | цвет темы, строка в hex формате, например `#ABCDEF` Если параметра "color" нет, или он не валиден, используется цвет `#FF3B30` |
| visibilityFlag | int | отображение темы в сетке расписания, может принимать значения 0 и 1. 0 - не отображать тему в расписании (будет отображаться только в деталях события в расписании), 1 - отображать тему в расписании на плашке события. Если этого параметра нет или он невалиден, будет использовано значение 0 |
| language | string | язык, на котором происходит редактирование (только для PUT запросов) |

**Краткая карта методов раздела**

| Действие | Method | URL |
|---|---|---|
| Создание | `POST` | `{{baseUrl}}/api/external/v2/tags/create` |
| Редактирование | `PUT` | `{{baseUrl}}/api/external/v2/tags/update/{id}` |
| Удаление | `DELETE` | `{{baseUrl}}/api/external/v2/tags/delete/{id}` |

### Создание

Позволяет создать тему для событий в расписании.

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/tags/create` |
| Авторизация | Authorization: Bearer {bearer_token} |
| Headers из коллекции | `Content-Type: application/json` |

**Пример тела запроса**

```json
{
    "id": 1,
    "name": "Name Example",
    "color": "#111",
    "visibilityFlag": 1
}
```

**Пример ответа**

**1. Создание**

- Статус: `200` OK

```json
{
    "id": 1,
    "color": "#111",
    "name": "Name Example",
    "visibilityFlag": 1,
    "language": "ru-RU"
}
```

### Редактирование

Позволяет отредактировать тему с идентификатором `{id}`.

| Параметр | Значение |
|---|---|
| Method | `PUT` |
| URL | `{{baseUrl}}/api/external/v2/tags/update/{id}` |
| Авторизация | Authorization: Bearer {bearer_token} |
| Headers из коллекции | `Content-Type: application/json` |

**Пример тела запроса**

```json
{
    "name": "Updated Russian Name Example",
    "color": "#222",
    "language": "ru"
}
```

**Пример ответа**

**1. Редактирование**

- Статус: `200` OK

```json
{
    "id": 1,
    "color": "#222",
    "name": "Updated Russian Name Example",
    "visibilityFlag": 1,
    "language": "ru-RU"
}
```

### Удаление

Позволяет удалить тему с идентификатором `{id}`.

| Параметр | Значение |
|---|---|
| Method | `DELETE` |
| URL | `{{baseUrl}}/api/external/v2/tags/delete/{id}` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Тело запроса:** не требуется / не указано.

**Пример ответа**

**1. Удаление**

- Статус: `200` OK

```json
{
    "success": true
}
```

## Работа с материалами (ссылками) к событию в расписании

К событиям в расписании типа "Доклад" можно прикреплять материалы и ссылки (презентация по выступлению, ссылка на сайт тренера и т.п.). Описанные ниже методы позволяют управлять прикрепляемыми материалами.

## Описание полей

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| id* | int | идентификатор материала в вашей системе |
| title* | string | название материала |
| url* | string | ссылка на материал |
| language | string | язык, на котором происходит редактирование (только для PUT запросов) |
| sessionId | int | идентификатор события в вашей системе |

*обязательные поля

**Краткая карта методов раздела**

| Действие | Method | URL |
|---|---|---|
| Создание | `POST` | `{{baseUrl}}/api/external/v2/sessions/{sessionId}/attachments/create` |
| Редактирование | `PUT` | `{{baseUrl}}/api/external/v2/sessions/{sessionId}/attachments/update/{id}` |
| Удаление | `DELETE` | `{{baseUrl}}/api/external/v2/sessions/{sessionId}/attachments/delete/{id}` |

### Создание

Позволяет создать вложение к событию с идентификатором `{sessionId}`.

Идентификатор создаваемого вложения должен быть уникальным в рамках всей программы обучения.

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/sessions/{sessionId}/attachments/create` |
| Авторизация | Authorization: Bearer {bearer_token} |
| Headers из коллекции | `Content-Type: application/json` |

**Пример тела запроса**

```json
{
    "id": 1,
    "title": "Title Example",
    "url": "https://www.w3schools.com/html/pic_trulli.jpg"
}
```

**Пример ответа**

**1. Создание**

- Статус: `200` OK

```json
{
    "id": 1,
    "sessionId": 1,
    "title": "Title Example",
    "language": "ru-RU",
    "url": "https://www.w3schools.com/html/pic_trulli.jpg"
}
```

### Редактирование

Позволяет отредактировать вложение с идентификатором `{id}` в событии c идентификатором `{sessionId}`.

| Параметр | Значение |
|---|---|
| Method | `PUT` |
| URL | `{{baseUrl}}/api/external/v2/sessions/{sessionId}/attachments/update/{id}` |
| Авторизация | Authorization: Bearer {bearer_token} |
| Headers из коллекции | `Content-Type: application/json` |

**Пример тела запроса**

```json
{
    "title": "Updated Title Example",
    "url": "https://www.w3schools.com/html/pic_trulli.jpg",
    "language": "ru-RU"
}
```

**Пример ответа**

**1. Редактирование**

- Статус: `200` OK

```json
{
    "id": 1,
    "title": "Updated Title Example",
    "language": "ru-RU",
    "url": "https://www.w3schools.com/html/pic_trulli.jpg"
}
```

### Удаление

Позволяет удалить вложение с идентификатором `{id}` в событии с идентификатором `{sessionId}`.

| Параметр | Значение |
|---|---|
| Method | `DELETE` |
| URL | `{{baseUrl}}/api/external/v2/sessions/{sessionId}/attachments/delete/{id}` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Тело запроса:** не требуется / не указано.

**Пример ответа**

**1. Удаление**

- Статус: `200` OK

```json
{
    "success": true
}
```

## Геймификация

## Описание полей

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| externalId | int | Внешний ID пользователя. |
| scores | int | Количество баллов для начисления. Целое число, которое может быть как положительным, так и отрицательным. Отрицательное значение может использоваться для списания баллов. |
| reason | string | Причина начисления баллов. Указывается в виде строки текста, например: “Заполнение формы с рекомендацией”. |

**Краткая карта методов раздела**

| Действие | Method | URL |
|---|---|---|
| Ручное начисление баллов | `POST` | `{{baseUrl}}/api/external/v2/gamification/add-manual-charge` |
| Передача данных о ручном начислении во внешнюю систему | `POST` | `{your api path}` |

### Ручное начисление баллов

Ручное начисление баллов с указанием причины начисления.

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/gamification/add-manual-charge` |
| Авторизация | Authorization: Bearer {bearer_token} |
| Headers из коллекции | `Content-Type: application/json` |

**Пример тела запроса**

```json
{
    "externalId": 456,
    "scores": 123,
    "reason": "Причина начисления баллов"
}
```

**Пример ответа**

**1. Ручное начисление баллов**

- Статус: `200` OK

_Пустое тело ответа или пример не указан._

### Передача данных о ручном начислении во внешнюю систему

На платформе Talent Rocks есть возможность синхронизации ручных начислений баллов пользователей с внешней системой. При любом начислении баллов из панели администрирования или с помощью QR gamification сканера ([Android](https://play.google.com/store/apps/details?id=com.eventicious.qr.gamification&pli=1) или [iOS](https://apps.apple.com/ru/app/gamification-qr-scanner/id1467162092)) отправляется запрос на заданный url.

## Подготовка к работе

Свяжитесь с службой поддержки Talent Rocks и сообщите url-адрес, который необходимо вызывать для оповещения о ручном начислении, например: [https://yoursystem.com/eventicious_callback](https://yoursystem.com/eventicious_callback).

## Описание

Передача данных о ручном начислении во внешнюю систему. Может использоваться как для начисления баллов через панель администрирования, так и при работе со сканером QR gamification.

## Описание полей

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| value* | string | Количество баллов для начисления. Целое число, которое может быть как положительным, так и отрицательным. Отрицательное значение может использоваться для списания баллов. |
| reason* | int | Причина начисления баллов. Указывается в виде строки текста, например: “Заполнение формы с рекомендацией”. |
| externalId | int | Внешний ID пользователя. |
| firstName* | string | Имя |
| lastName* | string | Фамилия |
| imagePath | string | ссылка на файл с фотографией пользователя (URL) |

_*Обязательное поле_

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{your api path}` |
| Авторизация | No auth в коллекции |

**Пример тела запроса**

```json
{
  "value": 3,
  "reason": "Описание причины",
  "externalId": 99,
  "firstName": "Иван",
  "lastName": "Иванов",
  "imagePath": null
}
```

**Пример ответа**

**1. Передача данных о ручном начислении во внешнюю систему**

- Статус: `200` OK

_Пустое тело ответа или пример не указан._

## Синхронизация пользователей посредством загрузки CSV файла

На платформе Talent Rocks есть возможность синхронизации списка пользователей со сторонней системой путём загрузки списка пользователей в виде CSV файла.

## Подготовка к работе

Свяжитесь со службой поддержки Talent Rocks для получения информации о требуемом формате CSV файла. Вам будет выдан уникальный параметр `sourceId`, который используется в методе для загрузки CSV файла.

Синхронизация пользователей осуществляется по расписанию раз в день. В случае загрузки нескольких CSV файлов - синхронизация будет осуществлена по последнему загруженному файлу.

Логика синхронизации пользователей:

- Если пользователь есть в загруженном файле, но отсутствует на платформе Talent Rocks - на платформе Talent Rocks создается новый пользователь.

- Если пользователь ранее присутстовал в файле, но при очередной синхронизации отсутствует - пользователь удаляется из платформы Talent Rocks.

- Если пользователь есть и в файле, и на платформе Talent Rocks - на платформе Talent Rocks обновляется информация о пользователе в соответствии с указанным в файле.

**Краткая карта методов раздела**

| Действие | Method | URL |
|---|---|---|
| Загрузка CSV файла | `POST` | `{{baseUrl}}/api/external/v2/users/import/{sourceId}/csv` |

### Загрузка CSV файла

Загрузка CSV файла со списком пользователей, который будет использоваться для синхронизации.

Требования к файлу:

- кодировка UTF-8

- разделитель ','

- размер не более 100 МБ

- формат даты YYYY-MM-DD


Список возможных ответов сервера представлен в примере запроса.

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/users/import/{sourceId}/csv` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Пример тела запроса**

| Key | Type | Value/src |
|---|---|---|
| `File` | `file` | `None` |

**Пример ответа**

**1. Успешная загрузка CSV файла**

- Статус: `200` OK

```json
{"status":"success"}
```

**2. Успешная загрузка CSV файла с предупреждением**

- Статус: `200` OK

```json
{
    "status":"success",
    "message":"The provided csv import file does not contain some optional fields: '{comma_separated_missing_optional_fields_names}'"
}
```

**3. Неуспешная загрузка CSV файла**

- Статус: `400` Bad Request

```json
{
  "type": "BadRequestException",
  "title": "Bad Request",
  "status": 400,
  "detail": "{validation_fail_reason}",
  "traceId": "{trace_identifier}",
  "message": "{validation_fail_reason}"
}
```

**4. Превышение допустимой частоты запросов**

- Статус: `400` Bad Request

```json
{
  "type": "TooManyRequestsException",
  "status": 429,
  "detail": "Too many requests sent in a given amount of time.",
  "traceId": "{trace_identifier}",
  "message": "Too many requests sent in a given amount of time."
}
```

**5. Возможность синхронизации пользователей не активирована**

- Статус: `500` Internal Server Error

```json
{
  "type": "StatusCodeException",
  "title": "An error occurred while processing your request.",
  "status": 500,
  "detail": "Forbidden - User sync feature is disabled.",
  "traceId": "{trace_identifier}",
  "message": "Forbidden - User sync feature is disabled."
}
```

**6. Источник синхронизации не найден**

- Статус: `500` Internal Server Error

```json
{
  "type": "AttendeesImportValidationError",
  "title": "An error occurred while processing your request.",
  "status": 500,
  "detail": "Import source was not found.",
  "traceId": "{trace_identifier}",
  "message": "Import source was not found."
}
```

**7. Источник синхронизации деактивирован**

- Статус: `500` Internal Server Error

```json
{
  "type": "StatusCodeException",
  "title": "An error occurred while processing your request.",
  "status": 500,
  "detail": "User import source with id {sourceId} is disabled.",
  "traceId": "{trace_identifier}",
  "message": "User import source with id {sourceId} is disabled."
}
```

**8. Неуспешная обработка CSV файла**

- Статус: `500` Internal Server Error

```json
{
  "type": "AttendeesImportValidationError",
  "title": "An error occurred while processing your request.",
  "status": 500,
  "detail": "{fail_reason}",
  "traceId": "{trace_identifier}",
  "message": "{fail_reason}"
}
```

**9. Обработка CSV файла с пустой первой строкой**

- Статус: `500` Internal Server Error

```json
{
  "type": "AttendeesImportValidationError",
  "title": "An error occurred while processing your request.",
  "status": 500,
  "detail": "The provided csv import file is empty",
  "traceId": "{trace_identifier}",
  "message": "The provided csv import file is empty"
}
```

**10. Обработка CSV файла с отсутствующими обязательными столбцами**

- Статус: `500` Internal Server Error

```json
{
  "type": "AttendeesImportValidationError",
  "title": "An error occurred while processing your request.",
  "status": 500,
  "detail": "The provided csv import file does not contain some required fields: '{comma_separated_missing_required_fields}'",
  "traceId": "{trace_identifier}",
  "message": "The provided csv import file does not contain some required fields: '{comma_separated_missing_required_fields}'"
}
```

## Работа с каталогами

Общие правила валидации:
Нельзя добавлять участников в корневой каталог, который создан автоматически для курсов (в папки можно).

Папки это некорневые каталоги. Работа с каталогом - API корневых каталогов, Работа с папками - API некорневых каталогов, остальные запросы, использующие id каталогов, универсальны.

**Краткая карта методов раздела**

| Действие | Method | URL |
|---|---|---|
| Работа с корневыми разделами каталогов / Получение списка корневых разделов каталогов | `GET` | `{{baseUrl}}/api/external/v2/catalogs` |
| Работа с корневыми разделами каталогов / Получение списка элементов каталога | `GET` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}` |
| Работа с корневыми разделами каталогов / Создание корневого раздела каталога | `POST` | `{{baseUrl}}/api/external/v2/catalogs` |
| Работа с корневыми разделами каталогов / Редактирование корневого раздела каталога | `PUT` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}` |
| Работа с корневыми разделами каталогов / Удаление корневого раздела каталога | `DELETE` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}` |
| Работа с участниками / Добавление участников в раздел каталога | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/attendees` |
| Работа с участниками / Удаление участника из раздела каталога | `DELETE` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/attendees/{{catalogElementId}}` |
| Работа с группами / Добавление групп в каталог | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/groups` |
| Работа с группами / Удаление группы из каталога | `DELETE` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/groups/{{catalogElementId}}` |
| Работа с файлами / Загрузка файла | `POST` | `{{baseUrl}}/api/external/v2/files/upload` |
| Работа с файлами / Добавление файла в каталог | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/files` |
| Работа с файлами / Удаление файла из каталога | `DELETE` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/files/{{catalogElementId}}` |
| Работа с ссылками / Создание новой ссылки в каталоге | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/links` |
| Работа с ссылками / Удаление ссылки из каталога | `DELETE` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/links/{{catalogElementId}}` |
| Работа с текстом / Добавление текста  в каталог | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/texts` |
| Работа с текстом / Удаление текста из каталога | `DELETE` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/texts/{{catalogElementId}}` |
| Работа с текстом (Text 2.0) / Добавление текста  в каталог | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/gravity-editor` |
| Работа с текстом (Text 2.0) / Удаление текста из каталога | `DELETE` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/gravity-editor/{{catalogElementId}}` |
| Работа с наставником / Добавление наставника в каталог | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/mentor` |
| Работа с наставником / Удаление наставника из каталога | `DELETE` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/mentor/{{catalogElementId}}` |
| Работа с видео / Загрузка видео | `POST` | `{{baseUrl}}/api/external/v2/videos/upload` |
| Работа с видео / Добавление видео в каталог | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/videos` |
| Работа с видео / Удаление видео из каталога | `DELETE` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/videos/{{catalogElementId}}` |
| Работа с папками (вложенными разделами каталога) / Добавление папки в раздел каталога | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/folders` |
| Работа с папками (вложенными разделами каталога) / Редактирование папки | `PUT` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/folders/{{folderId}}` |
| Работа с папками (вложенными разделами каталога) / Удаление папки из раздела каталога | `DELETE` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/folders/{{folderId}}` |
| Изменение порядка корневых разделов каталогов | `PUT` | `{{baseUrl}}/api/external/v2/catalogs/order` |
| Изменение порядка элементов каталога | `PUT` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/content/order` |
| Массовое удаление элементов каталога | `PUT` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/content/deleteBulk` |
| Добавление корневого раздела каталога или папки в меню | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/menu/add` |
| Удаление корневого раздела каталога или папки из меню | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/menu/delete` |

### Работа с корневыми разделами каталогов

Картинки по ссылкам должны иметь размер не более 10 МБ

## Описание полей

*обязательное поле

Задаваемые:

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| name* | string | Название каталога |
| description* | string | Описание каталога |
| isHtmlText | bool | Параметр определяющий, парсить ли теги в описании каталога |
| coverImageUrl | string | Ссылка на картинку-обложку каталога. Картинка будет обрезана и загружена на сервер |
| menuOrder | int | Порядок отображения в меню, если каталог добавлен в меню |
| externalId | string | Внешний идентификатор для произвольного использования в клиентских системах |

Только возвращающиеся:

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| id | int | Внутренний идентификатор каталога |
| type | string | Всегда Catalog |
| updatedDate | DateTime | Время последнего редактирования |
| order | int | Порядковый номер отображения в списке каталогов |
| newItemsCanBeAdded | bool | Параметр, определяющий возможность добавления в папку новых элементов |
| coverImageUrl | string | Ссылка на превью картинки-обложки каталога |
| fullCoverImageUrl | string | Ссылка на картинку-обложку каталога |
| isMenuItem | bool | Параметр определяющий, отображается ли этот каталог в меню |
| items | ExternalCatalogElementResponse\[\] | Элементы каталога |

Поля viewOptions, textLogoImageUrl, textLogoImageUrl, parentCatalogId, isOffline, isCourseItem либо не заполняются в данных запросах, либо не имеют практического смысла в External API

**Краткая карта методов раздела**

| Действие | Method | URL |
|---|---|---|
| Получение списка корневых разделов каталогов | `GET` | `{{baseUrl}}/api/external/v2/catalogs` |
| Получение списка элементов каталога | `GET` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}` |
| Создание корневого раздела каталога | `POST` | `{{baseUrl}}/api/external/v2/catalogs` |
| Редактирование корневого раздела каталога | `PUT` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}` |
| Удаление корневого раздела каталога | `DELETE` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}` |

#### Получение списка корневых разделов каталогов

Позволяет получить список всех корневых разделов каталогов данной программы обучения. Список включает как обычные разделы каталогов, так и разделы каталогов, созданные для курсов (разделы информационных этапов).

| Параметр | Значение |
|---|---|
| Method | `GET` |
| URL | `{{baseUrl}}/api/external/v2/catalogs` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Тело запроса:** не требуется / не указано.

**Пример ответа**

**1. Получение списка каталогов**

- Статус: `200` OK

```json
[
    {
        "parentCatalogId": null,
        "isHtmlText": false,
        "isOffline": false,
        "isCourseItem": true,
        "newItemsCanBeAdded": false,
        "coverImageUrl": null,
        "fullCoverImageUrl": null,
        "description": null,
        "isMenuItem": false,
        "items": null,
        "id": 124336,
        "type": "Catalog",
        "name": "My course",
        "updatedDate": "2026-02-06T01:44:44.2430000Z",
        "order": 0,
        "externalId": null
    },
    {
        "parentCatalogId": null,
        "isHtmlText": false,
        "isOffline": false,
        "isCourseItem": false,
        "newItemsCanBeAdded": true,
        "coverImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-1.png",
        "fullCoverImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-1.png",
        "description": "",
        "isMenuItem": false,
        "items": null,
        "id": 127254,
        "type": "Catalog",
        "name": "qwe",
        "updatedDate": "2026-02-25T23:57:44.0020000Z",
        "order": 0,
        "externalId": null
    },
    {
        "parentCatalogId": null,
        "isHtmlText": true,
        "isOffline": false,
        "isCourseItem": false,
        "newItemsCanBeAdded": true,
        "coverImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-2.png",
        "fullCoverImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-2.png",
        "description": "<p><em>Catalog description</em></p>",
        "isMenuItem": true,
        "items": null,
        "id": 127068,
        "type": "Catalog",
        "name": "Catalog name",
        "updatedDate": "2026-02-25T23:57:44.0020000Z",
        "order": 1,
        "externalId": null
    },
    {
        "parentCatalogId": null,
        "isHtmlText": false,
        "isOffline": false,
        "isCourseItem": false,
        "newItemsCanBeAdded": true,
        "coverImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-3.png",
        "fullCoverImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-3.png",
        "description": "Updated catalog description",
        "isMenuItem": false,
        "items": null,
        "id": 127270,
        "type": "Catalog",
        "name": "My catalog (updated)",
        "updatedDate": "2026-02-26T02:31:56.3940000Z",
        "order": 15,
        "externalId": "updatedCatalogExternalId"
    },
    {
        "parentCatalogId": null,
        "isHtmlText": true,
        "isOffline": false,
        "isCourseItem": false,
        "newItemsCanBeAdded": true,
        "coverImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-1.png",
        "fullCoverImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-1.png",
        "description": "<p><em>Catalog description</em></p>",
        "isMenuItem": false,
        "items": null,
        "id": 127874,
        "type": "Catalog",
        "name": "Catalog name",
        "updatedDate": "2026-03-03T01:43:05.3440000Z",
        "order": 16,
        "externalId": "CatalogExternalId"
    }
]
```

#### Получение списка элементов каталога

Позволяет получить каталог со всеми его элементами.

| Параметр | Значение |
|---|---|
| Method | `GET` |
| URL | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Тело запроса:** не требуется / не указано.

**Пример ответа**

**1. Получение списка элементов каталога**

- Статус: `200` OK

```json
{
    "viewOptions": null,
    "textLogoImageUrl": null,
    "fullLogoImageUrl": null,
    "parentCatalogId": null,
    "isHtmlText": true,
    "isOffline": false,
    "isCourseItem": false,
    "newItemsCanBeAdded": true,
    "coverImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-1.png",
    "fullCoverImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-1.png",
    "description": "<p><em>Catalog description</em></p>",
    "isMenuItem": false,
    "items": [
        {
            "$type": "ExternalCatalogAttendeeResponse",
            "attendeeId": 3258988,
            "firstName": "1",
            "lastName": "2",
            "companyName": null,
            "position": null,
            "imagePath": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-2.png",
            "catalogId": 127874,
            "id": 116637,
            "type": "Attendee",
            "name": null,
            "updatedDate": "2026-03-03T01:43:50.0780000Z",
            "order": 1,
            "externalId": "555555"
        },
        {
            "$type": "ExternalCatalogGroupResponse",
            "groupId": 389772,
            "friendlyName": "mygroup",
            "catalogId": 127874,
            "id": 116639,
            "type": "Group",
            "name": "mygroup",
            "updatedDate": "2026-03-03T01:44:21.1110000Z",
            "order": 2,
            "externalId": "111111"
        },
        {
            "$type": "ExternalCatalogFileResponse",
            "url": "https://s3.yandexcloud.net/ev-env-test-yandex/events/d774a9f4-446f-42ed-83bc-765841d04653/catalogs/d0a35515-6328-41b9-8d06-dcf7c59345c4.bin",
            "fileId": 35040,
            "catalogId": 127874,
            "id": 116641,
            "type": "File",
            "name": "1.bin",
            "updatedDate": "2026-03-03T01:45:16.3410000Z",
            "order": 3,
            "externalId": "fileExternalId"
        },
        {
            "$type": "ExternalCatalogLinkResponse",
            "url": "https://talentrocks.ru",
            "file": null,
            "openInWebController": false,
            "textLogoThumbnailUrl": "https://s3.yandexcloud.net/ev-env-test-yandex/events/d774a9f4-446f-42ed-83bc-765841d04653/images/191cb2ea-433d-4a74-9a21-2875b9cb9b2e-image",
            "fullLogoThumbnailUrl": "https://s3.yandexcloud.net/ev-env-test-yandex/events/d774a9f4-446f-42ed-83bc-765841d04653/images/9fd81b92-b99f-4e23-b9c6-aa143b2dc8e1-image",
            "textLogoImageUrl": "https://s3.yandexcloud.net/ev-env-test-yandex/events/d774a9f4-446f-42ed-83bc-765841d04653/images/191cb2ea-433d-4a74-9a21-2875b9cb9b2e-image",
            "fullLogoImageUrl": "https://s3.yandexcloud.net/ev-env-test-yandex/events/d774a9f4-446f-42ed-83bc-765841d04653/images/9fd81b92-b99f-4e23-b9c6-aa143b2dc8e1-image",
            "viewOptions": "textOnly",
            "catalogId": 127874,
            "id": 116643,
            "type": "Link",
            "name": "my link",
            "updatedDate": "2026-03-03T01:46:40.3780000Z",
            "order": 4,
            "externalId": "linkExternalId"
        },
        {
            "$type": "ExternalCatalogTextResponse",
            "text": "<p>I'm a text</p>",
            "catalogId": 127874,
            "id": 116645,
            "type": "Text",
            "name": null,
            "updatedDate": "2026-03-03T01:47:56.6240000Z",
            "order": 5,
            "externalId": "textExternalId"
        },
        {
            "$type": "ExternalCatalogFolderResponse",
            "viewOptions": "textAndImage",
            "textLogoImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-3.png",
            "fullLogoImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-3.png",
            "parentCatalogId": 127874,
            "isHtmlText": true,
            "isOffline": false,
            "isCourseItem": false,
            "newItemsCanBeAdded": true,
            "coverImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-1.png",
            "fullCoverImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-1.png",
            "description": "<p><em>my folder description</em></p>",
            "isMenuItem": false,
            "items": null,
            "id": 127876,
            "type": "Catalog",
            "name": "my folder",
            "updatedDate": "2026-03-03T01:50:47.3660000Z",
            "order": 7,
            "externalId": "folderExternalId"
        }
    ],
    "id": 127874,
    "type": "Catalog",
    "name": "Catalog name",
    "updatedDate": "2026-03-03T01:43:05.3440000Z",
    "order": 16,
    "externalId": "CatalogExternalId"
}
```

#### Создание корневого раздела каталога

Позволяет создать корневой раздел каталога.
Картинки по ссылкам должны иметь размер не более 10 МБ и типы: image/jpeg, image/png

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/catalogs` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Пример тела запроса**

```json
{
    "name": "Catalog photo test",
    "description": "<p><em>Catalog description</em></p>",
    "isHtmlText": true,
    "coverImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-1.png",
    "menuOrder": 10,
    "externalId": "CatalogExternalId"
}
```

**Пример ответа**

**1. Создание каталога**

- Статус: `200` OK

```json
{
    "catalogId": 127874
}
```

#### Редактирование корневого раздела каталога

Позволяет изменить поля корневого раздела каталога.

| Параметр | Значение |
|---|---|
| Method | `PUT` |
| URL | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Пример тела запроса**

```json
{
    "name": "My catalog (updated)",
    "description": "Updated catalog description",
    "isHtmlText": false,
    "coverImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-2.png",
    "externalId": "updatedCatalogExternalId"
}
```

**Пример ответа**

**1. Редактирование каталога**

- Статус: `200` OK

```json
{
    "catalogId": 127874
}
```

#### Удаление корневого раздела каталога

Позволяет удалить корневой раздел каталога со всеми вложенными разделами (папками).

| Параметр | Значение |
|---|---|
| Method | `DELETE` |
| URL | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Тело запроса:** не требуется / не указано.

**Пример ответа**

**1. Удаление каталога**

- Статус: `200` OK

```json
{
    "viewOptions": null,
    "textLogoImageUrl": null,
    "fullLogoImageUrl": null,
    "parentCatalogId": null,
    "isHtmlText": false,
    "isOffline": false,
    "isCourseItem": false,
    "newItemsCanBeAdded": true,
    "coverImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-1.png",
    "fullCoverImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-1.png",
    "description": "Updated catalog description",
    "isMenuItem": false,
    "items": [],
    "id": 127874,
    "type": "Catalog",
    "name": "My catalog (updated)",
    "updatedDate": "2026-03-03T01:58:07.4370000Z",
    "order": 0,
    "externalId": "updatedCatalogExternalId"
}
```

### Работа с участниками

## Описание полей

*обязательное поле

Задаваемые:

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| externalId | int* | Внешний идентификатор участника |
| order | int | Порядковый номер отображения в списке элементов каталога |

Только возвращающиеся:

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| catalogId | int | Внутренний идентификатор каталога |
| id | int | Внутренний идентификатор элемента |
| type | string | Всегда Attendee |
| name | string | Всегда null |
| updatedDate | DateTime | Время последнего редактирования |
| attendeeId | string | Внутренний идентификатор участника |
| firstName | string | Имя |
| lastName | string | Фамилия |
| companyName | string | Организация |
| position | string | Должность |
| imagePath | string | Ссылка на аватар |

**Краткая карта методов раздела**

| Действие | Method | URL |
|---|---|---|
| Добавление участников в раздел каталога | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/attendees` |
| Удаление участника из раздела каталога | `DELETE` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/attendees/{{catalogElementId}}` |

#### Добавление участников в раздел каталога

Позволяет добавить элемент с типом "Участник" в каталог.
Участники добавляются по externalId. Для обратной совместимости с существующими записями он здесь типа number, в отличие от большинства элементов, где он типа string.

Можно одновременно добавить несколько участников.

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/attendees` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Пример тела запроса**

```json
{
    "attendees": [
        {
            "externalId": 555555,
            "order": 1
        }
    ]
}
```

**Пример ответа**

**1. Добавление участников в каталог**

- Статус: `200` OK

```json
{
    "catalogElementIds": [
        116636
    ]
}
```

#### Удаление участника из раздела каталога

Позволяет удалить элемент с типом "Участник" из каталога.

| Параметр | Значение |
|---|---|
| Method | `DELETE` |
| URL | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/attendees/{{catalogElementId}}` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Тело запроса:** не требуется / не указано.

**Пример ответа**

**1. Удаление участника из каталога**

- Статус: `200` OK

```json
{
    "attendeeId": 3258988,
    "firstName": "1",
    "lastName": "2",
    "companyName": null,
    "position": null,
    "imagePath": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-1.png",
    "catalogId": 127874,
    "id": 116636,
    "type": "Attendee",
    "name": null,
    "updatedDate": "2026-03-03T01:43:33.8360000Z",
    "order": 1,
    "externalId": "555555"
}
```

### Работа с группами

## Описание полей

*обязательное поле

Задаваемые:

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| externalId | int* | Внешний идентификатор группы |
| order | int | Порядковый номер отображения в списке элементов каталога |

Только возвращающиеся:

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| catalogId | int | Внутренний идентификатор каталога |
| id | int | Внутренний идентификатор элемента |
| type | string | Всегда Group |
| name | string | Название группы |
| updatedDate | DateTime | Время последнего редактирования |
| groupId | string | Внутренний идентификатор группы |
| friendlyName | string | Название группы (копия name) |

**Краткая карта методов раздела**

| Действие | Method | URL |
|---|---|---|
| Добавление групп в каталог | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/groups` |
| Удаление группы из каталога | `DELETE` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/groups/{{catalogElementId}}` |

#### Добавление групп в каталог

Позволяет добавить элемент с типом "Группа" в каталог.
Группы добавляются по externalId. Для обратной совместимости с существующими записями он здесь типа number, в отличие от большинства элементов, где он типа string.

Можно одновременно добавить несколько групп.

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/groups` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Пример тела запроса**

```json
{
    "groups": [
        {
            "externalId": 111111,
            "order": 2
        }
    ]
}
```

**Пример ответа**

**1. Добавление групп в каталог**

- Статус: `200` OK

```json
{
    "catalogElementIds": [
        116638
    ]
}
```

#### Удаление группы из каталога

Позволяет удалить элемент с типом "Группа" из каталога.

| Параметр | Значение |
|---|---|
| Method | `DELETE` |
| URL | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/groups/{{catalogElementId}}` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Тело запроса:** не требуется / не указано.

**Пример ответа**

**1. Удаление группы из каталога**

- Статус: `200` OK

```json
{
    "groupId": 389772,
    "friendlyName": "mygroup",
    "catalogId": 127874,
    "id": 116638,
    "type": "Group",
    "name": "mygroup",
    "updatedDate": "2026-03-03T01:44:05.0800000Z",
    "order": 2,
    "externalId": "111111"
}
```

### Работа с файлами

## Описание полей

*обязательное поле

Задаваемые:

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| fileId* | int | Внутренний идентификатор файла |
| externalId | string | Внешний идентификатор для произвольного использования в клиентских системах |
| order | int | Порядковый номер отображения в списке элементов каталога |

Только возвращающиеся:

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| catalogId | int | Внутренний идентификатор каталога |
| id | int | Внутренний идентификатор элемента |
| type | string | Всегда File |
| name | string | Имя файла |
| updatedDate | DateTime | Время последнего редактирования |
| url | string | Ссылка на скачивание файла |

**Краткая карта методов раздела**

| Действие | Method | URL |
|---|---|---|
| Загрузка файла | `POST` | `{{baseUrl}}/api/external/v2/files/upload` |
| Добавление файла в каталог | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/files` |
| Удаление файла из каталога | `DELETE` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/files/{{catalogElementId}}` |

#### Загрузка файла

Позволяет загрузить файл в файловое хранилище. Максимальный размер 512 МБ, максимальное количество: 1
Удаления файла с сервера в настоящий момент нет

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/files/upload` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Пример тела запроса**

| Key | Type | Value/src |
|---|---|---|
| `` | `file` | `/C:/Users/Administrator/Desktop/1.bin` |

**Пример ответа**

**1. Загрузка файла**

- Статус: `200` OK

```json
{
    "fileIds": [
        35040
    ]
}
```

#### Добавление файла в каталог

Позволяет добавить элемент с типом "Файл" в каталог.
Файлы добавляются по Id, который возвращается при загрузке файла. Можно одновременно добавить несколько файлов.

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/files` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Пример тела запроса**

```json
{
    "files": [
        {
            "fileId": 35040,
            "externalId": "fileExternalId",
            "order": 3
        }
    ]
}
```

**Пример ответа**

**1. Добавление файла в каталог**

- Статус: `200` OK

```json
{
    "catalogElementIds": [
        116640
    ]
}
```

#### Удаление файла из каталога

Позволяет удалить элемент с типом "Файл" из каталога.

| Параметр | Значение |
|---|---|
| Method | `DELETE` |
| URL | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/files/{{catalogElementId}}` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Тело запроса:** не требуется / не указано.

**Пример ответа**

**1. Удаление файла из каталога**

- Статус: `200` OK

```json
{
    "url": "https://s3.yandexcloud.net/ev-env-test-yandex/events/d774a9f4-446f-42ed-83bc-765841d04653/catalogs/d0a35515-6328-41b9-8d06-dcf7c59345c4.bin",
    "fileId": 35040,
    "catalogId": 127874,
    "id": 116640,
    "type": "File",
    "name": "1.bin",
    "updatedDate": "2026-03-03T01:44:58.9770000Z",
    "order": 3,
    "externalId": "fileExternalId"
}
```

### Работа с ссылками

Картинки по ссылкам должны иметь размер не более 10 МБ

## Описание полей

*обязательное поле

Задаваемые:

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| name* | string | Название ссылки |
| viewOptions* | string | Режим отображения в каталоге
"imageOnly" - только FullLogo,
"textOnly" - только название,
"textAndImage" - название и TextLogo |
| textLogoImageUrl(* - при textAndImage) | string | Ссылка на картинку-обложку для textAndImage режима. Картинка будет обрезана и загружена на сервер |
| fullLogoImageUrl(* - при imageOnly) | string | Ссылка на картинку-обложку для imageOnly режима. Картинка будет обрезана и загружена на сервер |
| url* | string | Ссылка |
| openInWebController | bool | Установите true, если на стороннем сервисе по ссылке требуется авторизация |
| externalId | string | Внешний идентификатор для произвольного использования в клиентских системах |
| order | int | Порядковый номер отображения в списке элементов каталога |

Только возвращающиеся:

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| catalogId | int | Внутренний идентификатор каталога |
| id | int | Внутренний идентификатор элемента |
| type | string | Всегда Link |
| updatedDate | DateTime | Время последнего редактирования |
| file | string | Всегда null. Вероятно наследие загрузки веб архива |
| textLogoThumbnailUrl | string | Ссылка на превью картинки-обложки для textAndImage режима |
| textLogoImageUrl | string | Ссылка на картинку-обложку для textAndImage режима |
| fullLogoThumbnailUrl | string | Ссылка на превью картини-обложки для imageOnly режима |
| fullLogoImageUrl | string | Ссылка на картинку-обложку для imageOnly режима |

**Краткая карта методов раздела**

| Действие | Method | URL |
|---|---|---|
| Создание новой ссылки в каталоге | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/links` |
| Удаление ссылки из каталога | `DELETE` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/links/{{catalogElementId}}` |

#### Создание новой ссылки в каталоге

Позволяет добавить элемент с типом "Ссылка" в каталог.

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/links` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Пример тела запроса**

```json
{
  "name": "my link",
  "viewOptions": "textOnly",
  "textLogoImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-3.png",
  "fullLogoImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-3.png",
  "url": "https://talentrocks.ru",
  "openInWebController": false,
  "externalId": "linkExternalId",
  "order": 4
}
```

**Пример ответа**

**1. Создание новой ссылки в каталоге**

- Статус: `200` OK

```json
{
    "catalogElementId": 116642
}
```

#### Удаление ссылки из каталога

Позволяет удалить элемент с типом "Ссылка" из каталога.

| Параметр | Значение |
|---|---|
| Method | `DELETE` |
| URL | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/links/{{catalogElementId}}` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Тело запроса:** не требуется / не указано.

**Пример ответа**

**1. Удаление ссылки из каталога**

- Статус: `200` OK

```json
{
    "url": "https://talentrocks.ru",
    "file": null,
    "openInWebController": false,
    "textLogoThumbnailUrl": "https://s3.yandexcloud.net/ev-env-test-yandex/events/d774a9f4-446f-42ed-83bc-765841d04653/images/8081fc93-54da-4f79-b595-ca7e40d959ca-image",
    "fullLogoThumbnailUrl": "https://s3.yandexcloud.net/ev-env-test-yandex/events/d774a9f4-446f-42ed-83bc-765841d04653/images/c2c10fa7-9cbc-4abd-b0f1-d53bdac2d509-image",
    "textLogoImageUrl": "https://s3.yandexcloud.net/ev-env-test-yandex/events/d774a9f4-446f-42ed-83bc-765841d04653/images/8081fc93-54da-4f79-b595-ca7e40d959ca-image",
    "fullLogoImageUrl": "https://s3.yandexcloud.net/ev-env-test-yandex/events/d774a9f4-446f-42ed-83bc-765841d04653/images/c2c10fa7-9cbc-4abd-b0f1-d53bdac2d509-image",
    "viewOptions": "textOnly",
    "catalogId": 127874,
    "id": 116642,
    "type": "Link",
    "name": "my link",
    "updatedDate": "2026-03-03T01:46:02.9670000Z",
    "order": 4,
    "externalId": "linkExternalId"
}
```

### Работа с текстом

## Описание полей

*обязательное поле

Задаваемые:

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| text* | string | Текст |
| externalId | string | Внешний идентификатор для произвольного использования в клиентских системах |
| order | int | Порядковый номер отображения в списке элементов каталога |

Только возвращающиеся:

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| catalogId | int | Внутренний идентификатор каталога |
| id | int | Внутренний идентификатор элемента |
| type | string | Всегда Text |
| name | string | Всегда null |
| updatedDate | DateTime | Время последнего редактирования |

**Краткая карта методов раздела**

| Действие | Method | URL |
|---|---|---|
| Добавление текста  в каталог | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/texts` |
| Удаление текста из каталога | `DELETE` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/texts/{{catalogElementId}}` |

#### Добавление текста  в каталог

Позволяет добавить элемент с типом "Текст" в каталог.

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/texts` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Пример тела запроса**

```json
{
    "text": "<p>I'm a text</p>",
    "externalId": "textExternalId",
    "order": 5
}
```

**Пример ответа**

**1. Добавление текста  в каталог**

- Статус: `200` OK

```json
{
    "catalogElementId": 116644
}
```

#### Удаление текста из каталога

Позволяет удалять элемент с типом "Текст" из каталога.

| Параметр | Значение |
|---|---|
| Method | `DELETE` |
| URL | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/texts/{{catalogElementId}}` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Тело запроса:** не требуется / не указано.

**Пример ответа**

**1. Удаление текста из каталога**

- Статус: `200` OK

```json
{
    "text": "<p>I'm a text</p>",
    "catalogId": 127874,
    "id": 116644,
    "type": "Text",
    "name": null,
    "updatedDate": "2026-03-03T01:47:45.8750000Z",
    "order": 5,
    "externalId": "textExternalId"
}
```

### Работа с текстом (Text 2.0)

## Описание полей

*обязательное поле

Задаваемые:

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| text* | string | Текст в формате GravityJson |
| externalId | string | Внешний идентификатор для произвольного использования в клиентских системах |
| order | int | Порядковый номер отображения в списке элементов каталога |

Только возвращающиеся:

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| catalogElementId | int | Внутренний идентификатор элемента |

**Краткая карта методов раздела**

| Действие | Method | URL |
|---|---|---|
| Добавление текста  в каталог | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/gravity-editor` |
| Удаление текста из каталога | `DELETE` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/gravity-editor/{{catalogElementId}}` |

#### Добавление текста  в каталог

## Позволяет добавить элемент с типом "Text 2.0" в каталог.

### Что такое GravityJson

GravityJson — это JSON-представление документа в формате [ProseMirror](https://prosemirror.net/). Структура полностью совместима со стандартной моделью ProseMirror document, поэтому для генерации содержимого можно использовать любую ProseMirror-совместимую библиотеку.

---

### Как подготовить содержимое

#### Шаг 1. Подготовьте Markdown

Переведите ваш контент в Markdown. Используйте доступные инструменты в зависимости от исходного формата.

#### Шаг 2. Конвертируйте Markdown в ProseMirror JSON

Поскольку GravityJson является ProseMirror-совместимым форматом, подойдёт любая соответствующая библиотека.

Результат конвертации — должен получиться объект вида `{"type": "doc", "content": [...]}`.

#### Шаг 3. Экранируйте JSON

Поле `text` принимает **строку**, содержащую JSON. Все двойные кавычки внутри строки должны быть экранированы (`"` → `\"`).

В большинстве языков достаточно стандартной сериализации строки.

> При ручном составлении запроса можно воспользоваться онлайн-инструментом: [https://www.freeformatter.com/json-escape.html](https://www.freeformatter.com/json-escape.html)


Формат поля `text`:
(Внутри "content" может располагаться несколько элементов Text 2.0)

``` json
{
    "type": "doc",
    "content": [
        {
            "type": "paragraph",
            "attrs": {
                "data-line": null
            },
            "content": [
                {
                    "type": "text",
                    "text": "Simple text"
                }
            ]
        }
    ]
}

 ```

## Формат поддерживаемых элементов Text 2.0

## 1\. Paragraph — Простой абзац

**Описание:** Базовый текстовый блок.

**Атрибуты:**

- `data-line` — номер строки в исходном Markdown или `null`


**Пример:**

``` json
{
    "type": "paragraph",
    "attrs": {
        "data-line": null
    },
    "content": [
        {
            "type": "text",
            "text": "Это обычный текстовый абзац без какого-либо форматирования."
        }
    ]
}

 ```

---

## 2\. Paragraph с переносом строки (hard_break)

**Описание:** Принудительный перенос строки внутри абзаца.

**Пример:**

``` json
{
    "type": "paragraph",
    "attrs": {
        "data-line": null
    },
    "content": [
        {
            "type": "text",
            "text": "Первая строка абзаца."
        },
        {
            "type": "hard_break"
        },
        {
            "type": "text",
            "text": "Вторая строка того же абзаца после переноса."
        }
    ]
}

 ```

---

## 3\. Heading — Заголовок

**Описание:** Заголовки шести уровней.

**Атрибуты:**

- `level` — уровень заголовка: `1` | `2` | `3` | `4` | `5` | `6`

- `id` — якорный идентификатор: строка или `""`

- `data-line` — номер строки или `null`


**Пример — все уровни:**

``` json
[
    {
        "type": "heading",
        "attrs": { "id": "h1", "level": 1, "data-line": null },
        "content": [{ "type": "text", "text": "Заголовок первого уровня" }]
    },
    {
        "type": "heading",
        "attrs": { "id": "h2", "level": 2, "data-line": null },
        "content": [{ "type": "text", "text": "Заголовок второго уровня" }]
    },
    {
        "type": "heading",
        "attrs": { "id": "h3", "level": 3, "data-line": null },
        "content": [{ "type": "text", "text": "Заголовок третьего уровня" }]
    },
    {
        "type": "heading",
        "attrs": { "id": "h4", "level": 4, "data-line": null },
        "content": [{ "type": "text", "text": "Заголовок четвёртого уровня" }]
    },
    {
        "type": "heading",
        "attrs": { "id": "h5", "level": 5, "data-line": null },
        "content": [{ "type": "text", "text": "Заголовок пятого уровня" }]
    },
    {
        "type": "heading",
        "attrs": { "id": "h6", "level": 6, "data-line": null },
        "content": [{ "type": "text", "text": "Заголовок шестого уровня" }]
    }
]

 ```

---

## 4\. Bullet list — Маркированный список

**Описание:** Список с маркерами.

**Атрибуты** **`list_item`**:

- `data-line` — номер строки или `null`


**Пример:**

``` json
{
    "type": "bullet_list",
    "attrs": {
    },
    "content": [
        {
            "type": "list_item",
            "attrs": { "markup": null, "data-line": null },
            "content": [
                {
                    "type": "paragraph",
                    "attrs": { "data-line": null },
                    "content": [{ "type": "text", "text": "Купить продукты в магазине" }]
                }
            ]
        },
        {
            "type": "list_item",
            "attrs": { "markup": null, "data-line": null },
            "content": [
                {
                    "type": "paragraph",
                    "attrs": { "data-line": null },
                    "content": [{ "type": "text", "text": "Позвонить врачу и записаться на приём" }]
                }
            ]
        },
        {
            "type": "list_item",
            "attrs": { "markup": null, "data-line": null },
            "content": [
                {
                    "type": "paragraph",
                    "attrs": { "data-line": null },
                    "content": [{ "type": "text", "text": "Забрать посылку с почты" }]
                }
            ]
        }
    ]
}

 ```

---

## 5\. Ordered list — Нумерованный список

**Описание:** Список с порядковыми номерами.

**Пример:**

``` json
{
    "type": "ordered_list",
    "attrs": {
    },
    "content": [
        {
            "type": "list_item",
            "attrs": { "markup": null, "data-line": null },
            "content": [
                {
                    "type": "paragraph",
                    "attrs": { "data-line": null },
                    "content": [{ "type": "text", "text": "Открыть терминал" }]
                }
            ]
        },
        {
            "type": "list_item",
            "attrs": { "markup": null, "data-line": null },
            "content": [
                {
                    "type": "paragraph",
                    "attrs": { "data-line": null },
                    "content": [{ "type": "text", "text": "Перейти в директорию проекта" }]
                }
            ]
        },
        {
            "type": "list_item",
            "attrs": { "markup": null, "data-line": null },
            "content": [
                {
                    "type": "paragraph",
                    "attrs": { "data-line": null },
                    "content": [{ "type": "text", "text": "Запустить команду установки зависимостей" }]
                }
            ]
        }
    ]
}

 ```

---

## 6\. Link — Гиперссылка

**Описание:** Ссылка оформляется как `mark` типа `link` на текстовом узле.

**Атрибуты mark** **`link`**:

- `href` — URL адрес ссылки

- `title` — всплывающая подсказка: строка или `null`


**Пример:**

``` json
{
    "type": "paragraph",
    "attrs": { "data-line": null },
    "content": [
        {
            "type": "text",
            "text": "Подробнее читайте в "
        },
        {
            "type": "text",
            "marks": [
                {
                    "type": "link",
                    "attrs": {
                        "href": "https://gravity-ui.com/docs",
                        "title": "Документация Gravity UI"
                    }
                }
            ],
            "text": "официальной документации"
        },
        {
            "type": "text",
            "text": " на сайте разработчика."
        }
    ]
}

 ```

---

## 7\. Emoji — Эмодзи

**Описание:** Встроенный emoji по GitHub shortcode.

**Атрибуты:**

- `markup` — shortcode emoji без двоеточий: `"smile"`, `"heart"`, `"fire"`, `"rocket"`, `"warning"`, `"tada"`, `"thumbsup"`, `"star"`, `"eyes"`, `"check"` и др.


**Содержимое** **`content`**:

- `text` — Unicode символ emoji: `"😄"`, `"❤️"`, `"🔥"`, `"🚀"`, `"⚠️"`, `"🎉"`, `"👍"`, `"⭐"`, `"👀"`, `"✅"`


### Примеры shortcode → символ

| `markup` | Символ | `markup` | Символ |
| --- | --- | --- | --- |
| `smile` | 😄 | `heart` | ❤️ |
| `grinning` | 😀 | `thumbsup` | 👍 |
| `laughing` | 😆 | `thumbsdown` | 👎 |
| `blush` | 😊 | `clap` | 👏 |
| `wink` | 😉 | `fire` | 🔥 |
| `cry` | 😢 | `star` | ⭐ |
| `sob` | 😭 | `sparkles` | ✨ |
| `angry` | 😠 | `warning` | ⚠️ |
| `thinking` | 🤔 | `check` | ✅ |
| `tada` | 🎉 | `x` | ❌ |
| `rocket` | 🚀 | `bulb` | 💡 |
| `eyes` | 👀 | `memo` | 📝 |
| `100` | 💯 | `white_check_mark` | ✅ |

> Полный список shortcode совместим со стандартом [emoji-cheat-sheet](https://github.com/ikatyang/emoji-cheat-sheet).


**Пример — несколько emoji в абзаце:**

``` json
{
    "type": "paragraph",
    "attrs": { "data-line": null },
    "content": [
        {
            "type": "emoji",
            "attrs": { "markup": "rocket" },
            "content": [{ "type": "text", "text": "🚀" }]
        },
        {
            "type": "text",
            "text": " Проект запущен! "
        },
        {
            "type": "emoji",
            "attrs": { "markup": "tada" },
            "content": [{ "type": "text", "text": "🎉" }]
        },
        {
            "type": "text",
            "text": " Поздравляем всю команду! "
        },
        {
            "type": "emoji",
            "attrs": { "markup": "thumbsup" },
            "content": [{ "type": "text", "text": "👍" }]
        }
    ]
}

 ```

---

## 8\. Image — Изображение

**Описание:** Встроенный (inline) узел для вставки изображения. Отображается внутри абзаца как inline-элемент.

**Атрибуты:**

- `src` — URL изображения (обязательный): строка

- `alt` — альтернативный текст для скринридеров и случая, когда изображение не загрузилось: строка или `null`

- `title` — всплывающая подсказка (tooltip) при наведении курсора: строка или `null`

- `width` — ширина изображения

- `height` — высота изображения


**Пример:**

``` json
{
    "type": "paragraph",
    "attrs": { "data-line": null },
    "content": [
        {
            "type": "image",
            "attrs": {
                "src": "https://gravity-ui.com/images/logo.png",
                "alt": "Логотип Gravity UI",
                "title": "Перейти на сайт Gravity UI"
            }
        }
    ]
}

 ```

---

## 9\. Text marks — Стили текста

### 9.1. `strong` — Жирный

**Атрибуты:**

- `data-markup`: `"**"` (звёздочки) | `"__"` (подчёркивания)


``` json
{
    "type": "paragraph",
    "attrs": { "data-line": null },
    "content": [
        {
            "type": "text",
            "marks": [
                { "type": "strong", "attrs": { "data-markup": "**" } }
            ],
            "text": "Этот текст выделен жирным через двойные звёздочки"
        }
    ]
}

 ```

``` json
{
    "type": "paragraph",
    "attrs": { "data-line": null },
    "content": [
        {
            "type": "text",
            "marks": [
                { "type": "strong", "attrs": { "data-markup": "__" } }
            ],
            "text": "Этот текст выделен жирным через двойные подчёркивания"
        }
    ]
}

 ```

---

### 9.2. `em` — Курсив

**Атрибуты:**

- `data-markup`: `"\\\\\\\\\*"` (звёздочка) | `"_"` (подчёркивание)


``` json
{
    "type": "paragraph",
    "attrs": { "data-line": null },
    "content": [
        {
            "type": "text",
            "marks": [
                { "type": "em", "attrs": { "data-markup": "*" } }
            ],
            "text": "Этот текст написан курсивом через звёздочку"
        }
    ]
}

 ```

``` json
{
    "type": "paragraph",
    "attrs": { "data-line": null },
    "content": [
        {
            "type": "text",
            "marks": [
                { "type": "em", "attrs": { "data-markup": "_" } }
            ],
            "text": "Этот текст написан курсивом через подчёркивание"
        }
    ]
}

 ```

---

### 9.3. `ins` — Подчёркнутый

**Атрибуты:** отсутствуют.

``` json
{
    "type": "paragraph",
    "attrs": { "data-line": null },
    "content": [
        {
            "type": "text",
            "marks": [
                { "type": "ins" }
            ],
            "text": "Этот текст подчёркнут"
        }
    ]
}

 ```

---

### 9.4. `color` — Цвет текста

**Атрибуты:**

- `color`: `"red"` | `"green"` | `"blue"` | `"orange"` | `"yellow"` | `"cyan"` | `"violet"` | любой CSS-цвет


#### Поддерживаемые именованные цвета

| Значение | Цвет | Значение | Цвет |
| --- | --- | --- | --- |
| `red` | Красный | `purple` | Фиолетовый |
| `orange` | Оранжевый | `pink` | Розовый |
| `yellow` | Жёлтый | `brown` | Коричневый |
| `green` | Зелёный | `gray` | Серый |
| `blue` | Синий | `black` | Чёрный |
|  |  | `white` | Белый |

``` json
{
    "type": "paragraph",
    "attrs": { "data-line": null },
    "content": [
        {
            "type": "text",
            "marks": [{ "type": "color", "attrs": { "color": "red" } }],
            "text": "Красный текст"
        },
        { "type": "text", "text": ", " },
        {
            "type": "text",
            "marks": [{ "type": "color", "attrs": { "color": "green" } }],
            "text": "зелёный текст"
        },
        { "type": "text", "text": ", " },
        {
            "type": "text",
            "marks": [{ "type": "color", "attrs": { "color": "blue" } }],
            "text": "синий текст"
        },
        { "type": "text", "text": ", " },
        {
            "type": "text",
            "marks": [{ "type": "color", "attrs": { "color": "orange" } }],
            "text": "оранжевый текст"
        },
        { "type": "text", "text": ", " },
        {
            "type": "text",
            "marks": [{ "type": "color", "attrs": { "color": "yellow" } }],
            "text": "жёлтый текст"
        },
        { "type": "text", "text": ", " },
        {
            "type": "text",
            "marks": [{ "type": "color", "attrs": { "color": "cyan" } }],
            "text": "голубой текст"
        },
        { "type": "text", "text": ", " },
        {
            "type": "text",
            "marks": [{ "type": "color", "attrs": { "color": "violet" } }],
            "text": "фиолетовый текст"
        },
        { "type": "text", "text": ", " },
        {
            "type": "text",
            "marks": [{ "type": "color", "attrs": { "color": "#E91E63" } }],
            "text": "произвольный CSS-цвет (#E91E63)"
        }
    ]
}

 ```

---

### 9.5. Комбинирование marks

Несколько меток можно объединять в одном массиве `marks`.

**Возможные комбинации:**

| Комбинация | Описание |
| --- | --- |
| `strong` + `em` | Жирный курсив |
| `strong` + `ins` | Жирный подчёркнутый |
| `em` + `ins` | Курсив подчёркнутый |
| `strong` + `em` + `ins` | Жирный курсив подчёркнутый |
| `strong` + `color` | Жирный цветной |
| `em` + `color` | Курсив цветной |
| `ins` + `color` | Подчёркнутый цветной |
| `strong` + `ins` + `color` | Жирный подчёркнутый цветной |
| `link` + `strong` | Жирная ссылка |

``` json
{
    "type": "paragraph",
    "attrs": { "data-line": null },
    "content": [
        {
            "type": "text",
            "marks": [
                { "type": "strong", "attrs": { "data-markup": "**" } },
                { "type": "em", "attrs": { "data-markup": "*" } }
            ],
            "text": "Жирный курсив"
        },
        { "type": "text", "text": ", " },
        {
            "type": "text",
            "marks": [
                { "type": "strong", "attrs": { "data-markup": "**" } },
                { "type": "ins" }
            ],
            "text": "жирный подчёркнутый"
        },
        { "type": "text", "text": ", " },
        {
            "type": "text",
            "marks": [
                { "type": "em", "attrs": { "data-markup": "*" } },
                { "type": "ins" }
            ],
            "text": "курсив подчёркнутый"
        },
        { "type": "text", "text": ", " },
        {
            "type": "text",
            "marks": [
                { "type": "strong", "attrs": { "data-markup": "**" } },
                { "type": "em", "attrs": { "data-markup": "*" } },
                { "type": "ins" }
            ],
            "text": "жирный курсив подчёркнутый"
        },
        { "type": "text", "text": ", " },
        {
            "type": "text",
            "marks": [
                { "type": "strong", "attrs": { "data-markup": "**" } },
                { "type": "color", "attrs": { "color": "violet" } }
            ],
            "text": "жирный фиолетовый"
        },
        { "type": "text", "text": ", " },
        {
            "type": "text",
            "marks": [
                { "type": "ins" },
                { "type": "color", "attrs": { "color": "green" } }
            ],
            "text": "подчёркнутый зелёный"
        },
        { "type": "text", "text": ", " },
        {
            "type": "text",
            "marks": [
                {
                    "type": "link",
                    "attrs": {
                        "href": "https://gravity-ui.com",
                        "title": null,
                        "is-placeholder": false,
                        "raw-link": false
                    }
                },
                { "type": "strong", "attrs": { "data-markup": "**" } }
            ],
            "text": "жирная ссылка"
        }
    ]
}

 ```

---

## 10\. Полный пример документа

Все типы элементов в одном документе.

``` json
{
    "type": "doc",
    "content": [
        {
            "type": "heading",
            "attrs": {
                "level": 1,
                "data-line": null,
                "id": "main",
                "folded": null
            },
            "content": [
                {
                    "type": "text",
                    "text": "Руководство по работе с редактором"
                }
            ]
        },
        {
            "type": "heading",
            "attrs": {
                "level": 2,
                "data-line": null,
                "id": "intro",
                "folded": false
            },
            "content": [
                {
                    "type": "text",
                    "text": "Введение"
                }
            ]
        },
        {
            "type": "paragraph",
            "attrs": {
                "data-line": null
            },
            "content": [
                {
                    "type": "text",
                    "text": "Этот редактор поддерживает "
                },
                {
                    "type": "text",
                    "marks": [
                        {
                            "type": "strong",
                            "attrs": {
                                "data-markup": "**"
                            }
                        }
                    ],
                    "text": "богатое форматирование текста"
                },
                {
                    "type": "text",
                    "text": ". Вы можете писать "
                },
                {
                    "type": "text",
                    "marks": [
                        {
                            "type": "em",
                            "attrs": {
                                "data-markup": "*"
                            }
                        }
                    ],
                    "text": "курсивом"
                },
                {
                    "type": "text",
                    "text": ", использовать "
                },
                {
                    "type": "text",
                    "marks": [
                        {
                            "type": "ins"
                        }
                    ],
                    "text": "подчёркивание"
                },
                {
                    "type": "text",
                    "text": " и добавлять "
                },
                {
                    "type": "text",
                    "marks": [
                        {
                            "type": "color",
                            "attrs": {
                                "color": "red"
                            }
                        }
                    ],
                    "text": "цветной текст"
                },
                {
                    "type": "text",
                    "text": "."
                }
            ]
        },
        {
            "type": "heading",
            "attrs": {
                "level": 2,
                "data-line": null,
                "id": "media",
                "folded": null
            },
            "content": [
                {
                    "type": "text",
                    "text": "Медиаматериалы"
                }
            ]
        },
        {
            "type": "paragraph",
            "attrs": {
                "data-line": null
            },
            "content": [
                {
                    "type": "text",
                    "text": "Встраиваемые изображения:"
                }
            ]
        },
        {
            "type": "paragraph",
            "attrs": {
                "data-line": null
            },
            "content": [
                {
                    "type": "image",
                    "attrs": {
                        "src": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-1.png",
                        "alt": "Sample",
                        "title": "Пример",
                        "height": "200",
                        "width": "200",
                        "loading": null,
                        "id": null,
                        "fillWidth": false
                    }
                }
            ]
        },
        {
            "type": "heading",
            "attrs": {
                "level": 2,
                "data-line": null,
                "id": "links",
                "folded": null
            },
            "content": [
                {
                    "type": "text",
                    "text": "Полезные ссылки"
                }
            ]
        },
        {
            "type": "paragraph",
            "attrs": {
                "data-line": null
            },
            "content": [
                {
                    "type": "text",
                    "marks": [
                        {
                            "type": "link",
                            "attrs": {
                                "href": "http://google.com",
                                "title": null,
                                "is-placeholder": false,
                                "raw-link": false
                            }
                        }
                    ],
                    "text": "Поиск в Гугле"
                },
                {
                    "type": "text",
                    "text": " "
                },
                {
                    "type": "emoji",
                    "attrs": {
                        "markup": "star"
                    },
                    "content": [
                        {
                            "type": "text",
                            "text": "⭐"
                        }
                    ]
                }
            ]
        },
        {
            "type": "heading",
            "attrs": {
                "level": 3,
                "data-line": null,
                "id": "features",
                "folded": null
            },
            "content": [
                {
                    "type": "text",
                    "text": "Возможности редактора"
                }
            ]
        },
        {
            "type": "bullet_list",
            "attrs": {
                "tight": true,
                "markup": "-"
            },
            "content": [
                {
                    "type": "list_item",
                    "attrs": {
                        "markup": null,
                        "data-line": null
                    },
                    "content": [
                        {
                            "type": "paragraph",
                            "attrs": {
                                "data-line": null
                            },
                            "content": [
                                {
                                    "type": "text",
                                    "text": "Поддержка заголовков шести уровней"
                                }
                            ]
                        }
                    ]
                },
                {
                    "type": "list_item",
                    "attrs": {
                        "markup": null,
                        "data-line": null
                    },
                    "content": [
                        {
                            "type": "paragraph",
                            "attrs": {
                                "data-line": null
                            },
                            "content": [
                                {
                                    "type": "text",
                                    "text": "Маркированные и нумерованные списки"
                                }
                            ]
                        }
                    ]
                },
                {
                    "type": "list_item",
                    "attrs": {
                        "markup": null,
                        "data-line": null
                    },
                    "content": [
                        {
                            "type": "paragraph",
                            "attrs": {
                                "data-line": null
                            },
                            "content": [
                                {
                                    "type": "text",
                                    "text": "Вставка изображений, emoji и гиперссылок"
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "type": "heading",
            "attrs": {
                "level": 3,
                "data-line": null,
                "id": "steps",
                "folded": null
            },
            "content": [
                {
                    "type": "text",
                    "text": "Шаги для начала работы"
                }
            ]
        },
        {
            "type": "ordered_list",
            "attrs": {
                "order": 1,
                "tight": false,
                "markup": "."
            },
            "content": [
                {
                    "type": "list_item",
                    "attrs": {
                        "markup": null,
                        "data-line": null
                    },
                    "content": [
                        {
                            "type": "paragraph",
                            "attrs": {
                                "data-line": null
                            },
                            "content": [
                                {
                                    "type": "text",
                                    "text": "Установите пакет через менеджер зависимостей"
                                }
                            ]
                        }
                    ]
                },
                {
                    "type": "list_item",
                    "attrs": {
                        "markup": null,
                        "data-line": null
                    },
                    "content": [
                        {
                            "type": "paragraph",
                            "attrs": {
                                "data-line": null
                            },
                            "content": [
                                {
                                    "type": "text",
                                    "text": "Подключите компонент редактора в ваше приложение"
                                }
                            ]
                        }
                    ]
                },
                {
                    "type": "list_item",
                    "attrs": {
                        "markup": null,
                        "data-line": null
                    },
                    "content": [
                        {
                            "type": "paragraph",
                            "attrs": {
                                "data-line": null
                            },
                            "content": [
                                {
                                    "type": "text",
                                    "text": "Настройте начальное содержимое и обработчики событий"
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "type": "heading",
            "attrs": {
                "level": 4,
                "data-line": null,
                "id": "note",
                "folded": null
            },
            "content": [
                {
                    "type": "text",
                    "text": "Важное замечание"
                }
            ]
        },
        {
            "type": "paragraph",
            "attrs": {
                "data-line": null
            },
            "content": [
                {
                    "type": "emoji",
                    "attrs": {
                        "markup": "warning"
                    },
                    "content": [
                        {
                            "type": "text",
                            "text": "⚠️"
                        }
                    ]
                },
                {
                    "type": "text",
                    "text": " Всегда сохраняйте резервную копию данных."
                },
                {
                    "type": "hard_break"
                },
                {
                    "type": "emoji",
                    "attrs": {
                        "markup": "fire"
                    },
                    "content": [
                        {
                            "type": "text",
                            "text": "🔥"
                        }
                    ]
                },
                {
                    "type": "text",
                    "text": " Горячие клавиши значительно ускоряют работу. "
                },
                {
                    "type": "text",
                    "marks": [
                        {
                            "type": "strong",
                            "attrs": {
                                "data-markup": "**"
                            }
                        },
                        {
                            "type": "color",
                            "attrs": {
                                "color": "red"
                            }
                        }
                    ],
                    "text": "Не игнорируйте предупреждения системы!"
                }
            ]
        }
    ]
}

 ```

Тот же документ, но в формате markdown

``` md
# Руководство по работе с редактором {#main}
##+ Введение {#intro}
Этот редактор поддерживает **богатое форматирование текста**. Вы можете писать *курсивом*, использовать ++подчёркивание++ и добавлять {red}(цветной текст).
## Медиаматериалы {#media}
Встраиваемые изображения:
![Sample](https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-1.png "Пример" =200x200)
## Полезные ссылки {#links}
[Поиск в Гугле](http://google.com) :star:
### Возможности редактора {#features}
- Поддержка заголовков шести уровней
- Маркированные и нумерованные списки
- Вставка изображений, emoji и гиперссылок
### Шаги для начала работы {#steps}
1. Установите пакет через менеджер зависимостей
2. Подключите компонент редактора в ваше приложение
3. Настройте начальное содержимое и обработчики событий
#### Важное замечание {#note}
:warning: Всегда сохраняйте резервную копию данных.\
:fire: Горячие клавиши значительно ускоряют работу. **{red}(Не игнорируйте предупреждения системы!)**

 ```

---

## Сводная таблица всех параметров

| Тип | Параметр | Возможные значения |
| --- | --- | --- |
| `heading` | `level` | `1` `2` `3` `4` `5` `6` |
| `image` | `src` | любой URL изображения |
| `image` | `alt` | строка / `null` |
| `image` | `title` | строка / `null` |
| `emoji` | `markup` | `"smile"` `"heart"` `"fire"` `"rocket"` `"warning"` `"tada"` `"thumbsup"` `"star"` `"eyes"` `"check"` и др. |
| mark `strong` | `data-markup` | `"**"` / `"__"` |
| mark `em` | `data-markup` | `"\\\\\\\\\\\\\\\\\\\\\*"` / `"_"` |
| mark `ins` | — | нет атрибутов |
| mark `color` | `color` | `"red"` `"green"` `"blue"` `"orange"` `"yellow"` `"cyan"` `"violet"` / любой CSS-цвет |
| mark `link` | `href` | любой URL |
| mark `link` | `title` | строка / `null` |

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/gravity-editor` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Пример тела запроса**

```json
{
    "text": "{\"type\":\"doc\",\"content\":[{\"type\":\"heading\",\"attrs\":{\"level\":1,\"data-line\":null,\"id\":\"main\",\"folded\":null},\"content\":[{\"type\":\"text\",\"text\":\"Руководство по работе с редактором\"}]},{\"type\":\"heading\",\"attrs\":{\"level\":2,\"data-line\":null,\"id\":\"intro\",\"folded\":false},\"content\":[{\"type\":\"text\",\"text\":\"Введение\"}]},{\"type\":\"paragraph\",\"attrs\":{\"data-line\":null},\"content\":[{\"type\":\"text\",\"text\":\"Этот редактор поддерживает \"},{\"type\":\"text\",\"marks\":[{\"type\":\"strong\",\"attrs\":{\"data-markup\":\"**\"}}],\"text\":\"богатое форматирование текста\"},{\"type\":\"text\",\"text\":\". Вы можете писать \"},{\"type\":\"text\",\"marks\":[{\"type\":\"em\",\"attrs\":{\"data-markup\":\"*\"}}],\"text\":\"курсивом\"},{\"type\":\"text\",\"text\":\", использовать \"},{\"type\":\"text\",\"marks\":[{\"type\":\"ins\"}],\"text\":\"подчёркивание\"},{\"type\":\"text\",\"text\":\" и добавлять \"},{\"type\":\"text\",\"marks\":[{\"type\":\"color\",\"attrs\":{\"color\":\"red\"}}],\"text\":\"цветной текст\"},{\"type\":\"text\",\"text\":\".\"}]},{\"type\":\"heading\",\"attrs\":{\"level\":2,\"data-line\":null,\"id\":\"media\",\"folded\":null},\"content\":[{\"type\":\"text\",\"text\":\"Медиаматериалы\"}]},{\"type\":\"paragraph\",\"attrs\":{\"data-line\":null},\"content\":[{\"type\":\"text\",\"text\":\"Встраиваемые изображения:\"}]},{\"type\":\"paragraph\",\"attrs\":{\"data-line\":null},\"content\":[{\"type\":\"image\",\"attrs\":{\"src\":\"https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-1.png\",\"alt\":\"Sample\",\"title\":\"Пример\",\"height\":\"200\",\"width\":\"200\",\"loading\":null,\"id\":null,\"fillWidth\":false}}]},{\"type\":\"heading\",\"attrs\":{\"level\":2,\"data-line\":null,\"id\":\"links\",\"folded\":null},\"content\":[{\"type\":\"text\",\"text\":\"Полезные ссылки\"}]},{\"type\":\"paragraph\",\"attrs\":{\"data-line\":null},\"content\":[{\"type\":\"text\",\"marks\":[{\"type\":\"link\",\"attrs\":{\"href\":\"http://google.com\",\"title\":null,\"is-placeholder\":false,\"raw-link\":false}}],\"text\":\"Поиск в Гугле\"},{\"type\":\"text\",\"text\":\" \"},{\"type\":\"emoji\",\"attrs\":{\"markup\":\"star\"},\"content\":[{\"type\":\"text\",\"text\":\"⭐\"}]}]},{\"type\":\"heading\",\"attrs\":{\"level\":3,\"data-line\":null,\"id\":\"features\",\"folded\":null},\"content\":[{\"type\":\"text\",\"text\":\"Возможности редактора\"}]},{\"type\":\"bullet_list\",\"attrs\":{\"tight\":true,\"markup\":\"-\"},\"content\":[{\"type\":\"list_item\",\"attrs\":{\"markup\":null,\"data-line\":null},\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"data-line\":null},\"content\":[{\"type\":\"text\",\"text\":\"Поддержка заголовков шести уровней\"}]}]},{\"type\":\"list_item\",\"attrs\":{\"markup\":null,\"data-line\":null},\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"data-line\":null},\"content\":[{\"type\":\"text\",\"text\":\"Маркированные и нумерованные списки\"}]}]},{\"type\":\"list_item\",\"attrs\":{\"markup\":null,\"data-line\":null},\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"data-line\":null},\"content\":[{\"type\":\"text\",\"text\":\"Вставка изображений, emoji и гиперссылок\"}]}]}]},{\"type\":\"heading\",\"attrs\":{\"level\":3,\"data-line\":null,\"id\":\"steps\",\"folded\":null},\"content\":[{\"type\":\"text\",\"text\":\"Шаги для начала работы\"}]},{\"type\":\"ordered_list\",\"attrs\":{\"order\":1,\"tight\":false,\"markup\":\".\"},\"content\":[{\"type\":\"list_item\",\"attrs\":{\"markup\":null,\"data-line\":null},\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"data-line\":null},\"content\":[{\"type\":\"text\",\"text\":\"Установите пакет через менеджер зависимостей\"}]}]},{\"type\":\"list_item\",\"attrs\":{\"markup\":null,\"data-line\":null},\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"data-line\":null},\"content\":[{\"type\":\"text\",\"text\":\"Подключите компонент редактора в ваше приложение\"}]}]},{\"type\":\"list_item\",\"attrs\":{\"markup\":null,\"data-line\":null},\"content\":[{\"type\":\"paragraph\",\"attrs\":{\"data-line\":null},\"content\":[{\"type\":\"text\",\"text\":\"Настройте начальное содержимое и обработчики событий\"}]}]}]},{\"type\":\"heading\",\"attrs\":{\"level\":4,\"data-line\":null,\"id\":\"note\",\"folded\":null},\"content\":[{\"type\":\"text\",\"text\":\"Важное замечание\"}]},{\"type\":\"paragraph\",\"attrs\":{\"data-line\":null},\"content\":[{\"type\":\"emoji\",\"attrs\":{\"markup\":\"warning\"},\"content\":[{\"type\":\"text\",\"text\":\"⚠️\"}]},{\"type\":\"text\",\"text\":\" Всегда сохраняйте резервную копию данных.\"},{\"type\":\"hard_break\"},{\"type\":\"emoji\",\"attrs\":{\"markup\":\"fire\"},\"content\":[{\"type\":\"text\",\"text\":\"🔥\"}]},{\"type\":\"text\",\"text\":\" Горячие клавиши значительно ускоряют работу. \"},{\"type\":\"text\",\"marks\":[{\"type\":\"strong\",\"attrs\":{\"data-markup\":\"**\"}},{\"type\":\"color\",\"attrs\":{\"color\":\"red\"}}],\"text\":\"Не игнорируйте предупреждения системы!\"}]}]}",
    "externalId": "textExternalId",
    "order": 5
}
```

**Пример ответа**

**1. Добавление текста  в каталог**

- Статус: `200` OK

```json
{
    "catalogElementId": 116644
}
```

#### Удаление текста из каталога

Позволяет удалять элемент с типом "Текст 2.0" из каталога.

| Параметр | Значение |
|---|---|
| Method | `DELETE` |
| URL | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/gravity-editor/{{catalogElementId}}` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Тело запроса:** не требуется / не указано.

**Пример ответа**

**1. Удаление текста из каталога**

- Статус: `200` OK

```json
{
    "id": 116644,
    "type": "GravityEditorContent",
    "name": null,
    "updatedDate": "2026-03-03T01:47:45.8750000Z",
    "order": 5,
    "externalId": "textExternalId"
}
```

### Работа с наставником

## Описание полей

*обязательное поле

Задаваемые:

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| externalId | string | Внешний идентификатор для произвольного использования в клиентских системах |
| order | int | Порядковый номер отображения в списке элементов каталога |

Только возвращающиеся:

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| catalogId | int | Внутренний идентификатор каталога |
| id | int | Внутренний идентификатор элемента |
| type | string | Всегда Mentor |
| name | string | Всегда null |
| updatedDate | DateTime | Время последнего редактирования |

**Краткая карта методов раздела**

| Действие | Method | URL |
|---|---|---|
| Добавление наставника в каталог | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/mentor` |
| Удаление наставника из каталога | `DELETE` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/mentor/{{catalogElementId}}` |

#### Добавление наставника в каталог

Позволяет добавить элемент с типом "Наставник" в каталог.

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/mentor` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Пример тела запроса**

```json
{
    "order": 5,
    "externalId": "mentorExternalId"
}
```

**Пример ответа**

**1. Добавление наставника в каталог**

- Статус: `200` OK

```json
{
    "catalogElementId": 118271
}
```

#### Удаление наставника из каталога

Позволяет удалять элемент с типом "Наставник" из каталога.

| Параметр | Значение |
|---|---|
| Method | `DELETE` |
| URL | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/mentor/{{catalogElementId}}` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Тело запроса:** не требуется / не указано.

**Пример ответа**

**1. Удаление наставника из каталога**

- Статус: `200` OK

```json
{
    "catalogId": 128217,
    "id": 117001,
    "type": "Mentor",
    "name": null,
    "updatedDate": "2026-03-05T01:24:17.9290000Z",
    "order": 5,
    "externalId": "mentorExternalId"
}
```

### Работа с видео

## Описание полей

*обязательное поле

Задаваемые:

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| videoId* | int | Внутренний идентификатор файла видео |
| externalId | string | Внешний идентификатор для произвольного использования в клиентских системах |
| order | int | Порядковый номер отображения в списке элементов каталога |

Только возвращающиеся:

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| catalogId | int | Внутренний идентификатор каталога |
| id | int | Внутренний идентификатор элемента |
| type | string | Всегда File |
| name | string | Имя файла |
| updatedDate | DateTime | Время последнего редактирования |
| url | string | Ссылка на скачивание файла |

**Краткая карта методов раздела**

| Действие | Method | URL |
|---|---|---|
| Загрузка видео | `POST` | `{{baseUrl}}/api/external/v2/videos/upload` |
| Добавление видео в каталог | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/videos` |
| Удаление видео из каталога | `DELETE` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/videos/{{catalogElementId}}` |

#### Загрузка видео

Позволяет загрузить видео в файловое хранилище. Максимальный размер 2 ГБ, максимальное количество: 1

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/videos/upload` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Пример тела запроса**

| Key | Type | Value/src |
|---|---|---|
| `` | `file` | `/C:/Users/Administrator/Desktop/1756448063_looped_1756448063.mp4` |

**Пример ответа**

**1. Загрузка видео**

- Статус: `200` OK

```json
{
    "videoId": 61740
}
```

#### Добавление видео в каталог

Позволяет добавить элемент с типом "Видео" в каталог.
Видео добавляются по Id, который возвращается при загрузке файла.

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/videos` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Пример тела запроса**

```json
{
    "name": "My video",
    "videoId": 61740,
    "fullLogoImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-3.png",
    "externalId": "videoExternalId",
    "order": 7
}
```

**Пример ответа**

**1. Добавление видео в каталог**

- Статус: `200` OK

```json
{
    "catalogElementId": 118556
}
```

#### Удаление видео из каталога

Позволяет удалить элемент с типом "Видео" из каталога.

| Параметр | Значение |
|---|---|
| Method | `DELETE` |
| URL | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/videos/{{catalogElementId}}` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Тело запроса:** не требуется / не указано.

**Пример ответа**

_В коллекции нет примера ответа._

### Работа с папками (вложенными разделами каталога)

Картинки по ссылкам должны иметь размер не более 10 МБ

## Описание полей

*обязательное поле

Редактируемые:

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| name* | string | Имя папки |
| description* | string | Описание папки |
| isHtmlText | bool | Параметр определяющий, парсить ли теги в описании каталога |
| coverImageUrl | string | Ссылка на картинку-обложку папки. Картинка будет обрезана и загружена на сервер |
| viewOptions | string | Режим отображения папки в каталоге
"imageOnly" - только изображение (FullLogo),
"textOnly" - только текст (название папки),
"textAndImage" - текст (название папки) и изображение (TextLogo) |
| textLogoImageUrl | string | Ссылка на картинку-обложку для textAndImage режима. Картинка будет обрезана и загружена на сервер |
| fullLogoImageUrl | string | Ссылка на картинку-обложку для imageOnly режима. Картинка будет обрезана и загружена на сервер |
| externalId | string | Внешний идентификатор для произвольного использования в клиентских системах |
| order | int | Порядковый номер отображения в списке элементов каталога |
| aclGroupsExternalIds | int\[\] | массив ID групп в вашей системе (предварительно группы должны быть созданы, см. раздел Работа с группами), по которым ограничивается доступ к содержимому этой папки |

Только возвращающиеся:

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| parentCatalogId | int | Внутренний идентификатор родительского каталога/папки |
| id | int | Внутренний идентификатор папки |
| type | string | Всегда Catalog |
| updatedDate | DateTime | Время последнего редактирования |
| newItemsCanBeAdded | bool | Параметр, определяющий возможность добавления в папку новых элементов |
| coverImageUrl | string | Ссылка на превью картинки-обложки |
| fullCoverImageUrl | string | Ссылка на картинку-обложку |
| textLogoImageUrl | string | Ссылка на картинку-обложку для textAndImage режима |
| fullLogoImageUrl | string | Ссылка на картинку-обложку для imageOnly режима |
| isMenuItem | bool | Параметр определяюший, отображается ли этот каталог в меню |
| items | ExternalCatalogElementResponse\[\] | Элементы каталога |
| aclGroupsExternalIds | int\[\] | массив ID групп в вашей системе (предварительно группы должны быть созданы, см. раздел Работа с группами), по которым ограничивается доступ к содержимому этой папки |

Поля isOffline, isCourseItem либо не заполняются в данных запросах, либо не имеют практического смысла в External API

**Краткая карта методов раздела**

| Действие | Method | URL |
|---|---|---|
| Добавление папки в раздел каталога | `POST` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/folders` |
| Редактирование папки | `PUT` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/folders/{{folderId}}` |
| Удаление папки из раздела каталога | `DELETE` | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/folders/{{folderId}}` |

#### Добавление папки в раздел каталога

Позволяет добавить элемент с типом "Папка" в каталог.

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/folders` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Пример тела запроса**

```json
{
    "name": "my folder",
    "description": "<p><em>my folder description</em></p>",
    "isHtmlText": true,
    "coverImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-3.png",
    "externalId": "folderExternalId",
    "aclGroupsExternalIds": [1],
    "viewOptions": "textAndImage",
    "textLogoImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-2.png",
    "fullLogoImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-2.png",
    "order": 8
}
```

**Пример ответа**

**1. Добавление папки в каталог**

- Статус: `200` OK

```json
{
    "catalogElementId": 128982
}
```

#### Редактирование папки

Позволяет изменить поля элемента с типом "Папка".

| Параметр | Значение |
|---|---|
| Method | `PUT` |
| URL | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/folders/{{folderId}}` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Пример тела запроса**

```json
{
    "name": "updated name",
    "description": "updated description",
    "isHtmlText": false,
    "coverImageUrl": "",
    "viewOptions": "textOnly",
    "aclGroupsExternalIds": [2],
    "textLogoImageUrl": "",
    "fullLogoImageUrl": "",
    "order": 18
}
```

**Пример ответа**

**1. Редактирование папки**

- Статус: `200` OK

```json
{
    "catalogElementId": 128984
}
```

#### Удаление папки из раздела каталога

Позволяет удалить элемент с типом "Папка" из каталога.

| Параметр | Значение |
|---|---|
| Method | `DELETE` |
| URL | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/elements/folders/{{folderId}}` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Тело запроса:** не требуется / не указано.

**Пример ответа**

**1. Удаление папки из каталога**

- Статус: `200` OK

```json
{
    "viewOptions": "textAndImage",
    "textLogoImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-2.png",
    "fullLogoImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-2.png",
    "parentCatalogId": 128976,
    "isHtmlText": true,
    "isOffline": false,
    "isCourseItem": false,
    "newItemsCanBeAdded": true,
    "coverImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-3.png",
    "fullCoverImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-3.png",
    "description": "<p><em>my folder description</em></p>",
    "isMenuItem": false,
    "items": null,
    "id": 128983,
    "type": "Catalog",
    "name": "my folder",
    "updatedDate": "2026-03-13T02:55:05.9440000Z",
    "order": 8,
    "externalId": "folderExternalId"
}
```

### Изменение порядка корневых разделов каталогов

Позволяет изменить порядок каталогов в списке каталогов (не в меню).
Данный запрос изменяет каталогам поле order в соответствии с их порядком в запросе, начиная с 1. В запросе должны быть айди всех имеющихся каталогов в эвенте

## Описание полей

*обязательное поле

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| CatalogIds* | int\[\] | Внутренние идентификаторы каталогов (только корневых) |

(должны быть указаны все корневые каталоги эвента)

| Параметр | Значение |
|---|---|
| Method | `PUT` |
| URL | `{{baseUrl}}/api/external/v2/catalogs/order` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Пример тела запроса**

```json
{
  "CatalogIds": [
    127874,
    127270,    
    127068,
    127254,
    124336
  ]
}
```

**Пример ответа**

**1. Изменение порядка каталогов**

- Статус: `200` OK

_Пустое тело ответа или пример не указан._

### Изменение порядка элементов каталога

Позволяет изменить порядок элементов в списке элементов каталога.
Данный запрос изменяет элементам поле order в соответствии с их порядком в запросе, начиная с 1. В запросе должны быть айди всех имеющихся элементов в каталоге

## Описание полей

*обязательное поле

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| id* | int | Внутренний идентификатор элемента |
| type* | string | Тип элемента |

(должны быть указаны все элементы каталога)

| Параметр | Значение |
|---|---|
| Method | `PUT` |
| URL | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/content/order` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Пример тела запроса**

```json
{
    "orderedItems": [
        {
            "id": 127876,
            "type": "Catalog"
        },
        {
            "id": 116645,
            "type": "Text"
        },
        {
            "id": 116643,
            "type": "Link"
        },
        {
            "id": 116641,
            "type": "File"
        },
        {
            "id": 116639,
            "type": "Group"
        },
        {
            "id": 116637,
            "type": "Attendee"
        }
    ]
}
```

**Пример ответа**

**1. Изменение порядка элементов каталога**

- Статус: `200` OK

_Пустое тело ответа или пример не указан._

### Массовое удаление элементов каталога

Позволяет удалить несколько элементов каталога.

## Описание полей

*обязательное поле

| **Property** | **Type** | **Comment** |
| --- | --- | --- |
| subcatalogIds | int\[\] | Внутренние идентификаторы папок |
| elementIds | int\[\] | Внутренние идентификаторы элементов |

| Параметр | Значение |
|---|---|
| Method | `PUT` |
| URL | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/content/deleteBulk` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Пример тела запроса**

```json
{
    "subcatalogIds": [
        127876
    ],
    "elementIds": [
        116647,
        116645,
        116643,
        116641,
        116639,
        116637
    ]
}
```

**Пример ответа**

**1. Массовое удаление элементов каталога**

- Статус: `200` OK

```json
[
    {
        "$type": "ExternalCatalogTextResponse",
        "text": "<p>I'm a text</p>",
        "catalogId": 127874,
        "id": 116645,
        "type": "Text",
        "name": null,
        "updatedDate": "2026-03-03T01:55:28.7440000Z",
        "order": 2,
        "externalId": "textExternalId"
    },
    {
        "$type": "ExternalCatalogLinkResponse",
        "url": "https://talentrocks.ru",
        "file": null,
        "openInWebController": false,
        "textLogoThumbnailUrl": "https://s3.yandexcloud.net/ev-env-test-yandex/events/d774a9f4-446f-42ed-83bc-765841d04653/images/191cb2ea-433d-4a74-9a21-2875b9cb9b2e-image",
        "fullLogoThumbnailUrl": "https://s3.yandexcloud.net/ev-env-test-yandex/events/d774a9f4-446f-42ed-83bc-765841d04653/images/9fd81b92-b99f-4e23-b9c6-aa143b2dc8e1-image",
        "textLogoImageUrl": "https://s3.yandexcloud.net/ev-env-test-yandex/events/d774a9f4-446f-42ed-83bc-765841d04653/images/191cb2ea-433d-4a74-9a21-2875b9cb9b2e-image",
        "fullLogoImageUrl": "https://s3.yandexcloud.net/ev-env-test-yandex/events/d774a9f4-446f-42ed-83bc-765841d04653/images/9fd81b92-b99f-4e23-b9c6-aa143b2dc8e1-image",
        "viewOptions": "textOnly",
        "catalogId": 127874,
        "id": 116643,
        "type": "Link",
        "name": "my link",
        "updatedDate": "2026-03-03T01:55:28.7440000Z",
        "order": 3,
        "externalId": "linkExternalId"
    },
    {
        "$type": "ExternalCatalogFileResponse",
        "url": "https://s3.yandexcloud.net/ev-env-test-yandex/events/d774a9f4-446f-42ed-83bc-765841d04653/catalogs/d0a35515-6328-41b9-8d06-dcf7c59345c4.bin",
        "fileId": 35040,
        "catalogId": 127874,
        "id": 116641,
        "type": "File",
        "name": "1.bin",
        "updatedDate": "2026-03-03T01:55:28.7440000Z",
        "order": 4,
        "externalId": "fileExternalId"
    },
    {
        "$type": "ExternalCatalogGroupResponse",
        "groupId": 389772,
        "friendlyName": "mygroup",
        "catalogId": 127874,
        "id": 116639,
        "type": "Group",
        "name": "mygroup",
        "updatedDate": "2026-03-03T01:55:28.7440000Z",
        "order": 5,
        "externalId": "111111"
    },
    {
        "$type": "ExternalCatalogAttendeeResponse",
        "attendeeId": 3258988,
        "firstName": "1",
        "lastName": "2",
        "companyName": null,
        "position": null,
        "imagePath": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-3.png",
        "catalogId": 127874,
        "id": 116637,
        "type": "Attendee",
        "name": null,
        "updatedDate": "2026-03-03T01:55:28.7440000Z",
        "order": 6,
        "externalId": "555555"
    },
    {
        "$type": "ExternalCatalogFolderResponse",
        "viewOptions": "textAndImage",
        "textLogoImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-1.png",
        "fullLogoImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-1.png",
        "parentCatalogId": 127874,
        "isHtmlText": true,
        "isOffline": false,
        "isCourseItem": false,
        "newItemsCanBeAdded": true,
        "coverImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-2.png",
        "fullCoverImageUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-2.png",
        "description": "<p><em>my folder description</em></p>",
        "isMenuItem": false,
        "items": null,
        "id": 127876,
        "type": "Catalog",
        "name": "my folder",
        "updatedDate": "2026-03-03T01:55:28.6900000Z",
        "order": 0,
        "externalId": "folderExternalId"
    }
]
```

### Добавление корневого раздела каталога или папки в меню

Позволяет добавить каталог или папку в меню.


Нельзя добавить и удалить из меню любые каталоги и папки курсов

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/menu/add` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Пример тела запроса**

```json
{}
```

**Пример ответа**

**1. Добавление каталога или папки в меню**

- Статус: `200` OK

_Пустое тело ответа или пример не указан._

### Удаление корневого раздела каталога или папки из меню

Позволяет удалить каталог или папку из меню.

Нельзя добавить и удалить из меню любые каталоги и папки курсов

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/catalogs/{{catalogId}}/menu/delete` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Пример тела запроса**

```json
{}
```

**Пример ответа**

**1. Удаление каталога или папки из меню**

- Статус: `200` OK

_Пустое тело ответа или пример не указан._

## [Experimental feature] Работа с курсами

Данная группа методов позволяет импортировать готовый курс, последовательно загрузив его основную информацию и все связанные сущности, такие как: этапы, опросы/тесты, задания и SCORM-курсы.

API импорта курсов предоставляет возможность использовать ранее загруженные файлы и изображения, по их идентификаторам, в качестве обложек и вложений для элементов создаваемого курса. Поскольку при создании элементов курса в API нет возможности передать одновременно JSON payload и файлы в одном запросе, рекомендуется предварительно загрузить все необходимые файлы через соответствующее API и сохранить их идентификаторы для последующего использования.

- Для предварительной загрузки изображений перед импортом курса нужно воспользоваться эндпоинтом "Загрузка изображений" (`POST /api/external/v2/images/upload`).

- Для предварительной загрузки файлов-вложений (для задания) нужно воспользоваться эндпоинтом "Загрузка вложений к заданию" (`POST /api/external/v2/task-contents/attachments/upload`).


### Общий порядок импорта курса:

1. Предварительная загрузка изображений и файлов через запросы, описанные выше. Запросы поддерживают множественную загрузку: макс. 10 файлов изображений и макс. 5 для вложений задания (на каждый запрос).

2. Создание курса через запрос "Импорт общей структуры курса" (`POST /api/external/v2/courses`). На этом этапе ответом эндпоинта будет структура курса, содержащая идентификаторы всех созданных элементов (самого курса, его этапов, каталогов, тестов, опросов, заданий и т.д.).

3. Импорт содержимого тестов, опросов, заданий и загрузка архива SCORM-курса, используя их идентификаторы, возвращенные в п.2 через соответствующие запросы в произвольном порядке:

    - "Загрузить SCORM курс в этап" (`POST /api/external/v2/courses/{courseId}/stages/{stageId}/scorm/{scormId}/upload`).

    - "Импорт контента в задание" из группы "Работа с заданиями" (`PUT /api/external/v2/task-contents/{taskContentId}`).

    - "Импорт контента опроса/теста" из группы "Работа с опросами и тестами" (`PUT /api/external/v2/polls/{pollId}`).

4. Финализировать импортированный курс с помощью запроса "Финализировать курс" (`POST /api/external/v2/courses/{courseId}/finalize`).


### Примечания:

- При импорте общей структуры курса (п.2) существует возможность передать его внешний идентификатор (свойство `externalId`), который может быть произвольной строкой. В случае попытки повторного импорта курса с тем же идентификатором, API вернет ошибку.

- При создании каждого этапа во время импорта курса, для такого этапа будет автоматически создан и привязан новый каталог, название которого будет совпадать с названием соответствующего этапа.

- После импорта первоначальной структуры (п.2) данный курс будет находиться в статусе Draft (флаг `IsDraft=true` в БД). Курсы в статусе Draft не отображаются в админке до их финализации.

- При создании общей структуры курса в п.2, а также при импортировании содержимого опросов/тестов/заданий, свойства, именование которых заканчивается на "`…FileId`" (наприммер, `coverImageFileId`, `imageFileId`и т.д.) принимают идентификаторы загруженных ранее изображений.

- При импорте содержимого заданий, в пейлоаде есть свойство `attachmentFileIds`, которое принимает массив идентификаторов файлов, загруженных ранее, и позволяет связать их с заданием как вложения.

- При финализации курса происходит валидация данных на предмет достаточности для отображения в админке. Если валидация не прошла - эндпоинт финализации вернёт ошибку. Для снятия флага `IsDraft` курс должен соответствовать минимальным критериям:

    - У курса должен быть хотя бы 1 этап.

    - При наличии SCORM этапов, для всех них должны быть загружены scorm-архивы.

    - Для этапов-заданий в БД должно быть создано соответствующее задание (может оставаться пустым, т.е. без полей, с дефолтными настройками).

    - Для простых этапов, если завершением этапа является тест или опрос - такой тест или опрос должен быть создан в БД (может не содержать контента и иметь настройки по умолчанию).

**Краткая карта методов раздела**

| Действие | Method | URL |
|---|---|---|
| [Experimental feature] Работа с заданиями / Импорт контента в задание | `PUT` | `{{baseUrl}}/api/external/v2/task-contents/{{taskContentId}}` |
| [Experimental feature] Работа с опросами и тестами / Импорт контента опроса/теста | `PUT` | `{{baseUrl}}/api/external/v2/polls/{{pollId}}` |
| [Experimental feature] Работа с общей структурой / Импорт общей структуры курса | `POST` | `{{baseUrl}}/api/external/v2/courses` |
| [Experimental feature] Работа с общей структурой / Финализировать курс | `POST` | `{{baseUrl}}/api/external/v2/courses/{{courseId}}/finalize` |
| [Experimental feature] Работа с файлами / Загрузка изображений | `POST` | `{{baseUrl}}/api/external/v2/images/upload?generateThumbnails=true` |
| [Experimental feature] Работа с файлами / Загрузить вложений к заданию | `POST` | `{{baseUrl}}/api/external/v2/task-contents/attachments/upload` |
| [Experimental feature] Работа с файлами / Загрузить SCORM курс в этап | `POST` | `{{baseUrl}}/api/external/v2/courses/{{courseId}}/stages/{{stageId}}/scorm/{{scormId}}/upload` |

### [Experimental feature] Работа с заданиями

## Описание полей

> Свойства, отмеченные знаком *, являются обязательными. Знак ** означает условную обязательность (подробности — в столбце «Comment»).


### Корневой объект: `ExternalTaskContentsImportRequest`

| Property | Type | Comment |
| --- | --- | --- |
| `coverImageFileId` | `int` | ID файла обложки задания |
| `title` * | `string` | Заголовок задания |
| `description` | `string` | Описание задания |
| `settings` * | `TaskContentSettings` | Настройки задания |
| `attachmentFileIds` | `int[]` | Список ID файлов-вложений |
| `fields` | `Field[]` | Список полей задания |

---

## `TaskContentSettings`

| Property | Type | Comment |
| --- | --- | --- |
| `screenInfo` | `ScreenInfo` | Настройки экранов задания |
| `reviewInfo` | `ReviewInfo` | Настройки проверки (ревью) задания |
| `completionInfo` | `CompletionInfo` | Настройки прохождения задания |
| `notificationInfo` | `NotificationInfo` | Настройки уведомлений |

---

## `ScreenInfo`

| Property | Type | Comment |
| --- | --- | --- |
| `showScore` | `bool` | Показывать ли количество набранных баллов |
| `completedTitle` | `string` | Сообщение на экране принятого задания |
| `rejectedTitle` | `string` | Сообщение на экране отправленного на доработку задания |
| `inReviewTitle` | `string` | Сообщение на экране задания на проверке |

---

## `ReviewInfo`

| Property | Type | Comment |
| --- | --- | --- |
| `isReviewRequired` | `bool` | Обязательно ли задание для проверки |
| `duplicateInEmail` | `bool` | Дублировать ли уведомление о проверке задания писмом на email |
| `takePartInRating` | `bool` | Участвует ли задание в рейтинге |
| `maxScore` | `int` | Максимальное количество баллов. Должно быть ≥ 0 |

---

## `CompletionInfo`

| Property | Type | Comment |
| --- | --- | --- |
| `canBeRetaken` | `bool` | Разрешить ли проходить задание повторно |

---

## `NotificationInfo`

| Property | Type | Comment |
| --- | --- | --- |
| `isEnabled` | `bool` | Включены ли уведомления о получении задания на проверку |
| `sendToCurator` | `bool` | Отправлять ли уведомление куратору |
| `sendToLeader` | `bool` | Отправлять ли уведомление руководителю |
| `sendToMentor` | `bool` | Отправлять ли уведомлени наставнику |
| `text` ** | `string` | Текст уведомления. Обязателен при `isEnabled = true` |
| `duplicateInEmail` | `bool` | Дублировать ли уведомление на email. |

---

## `Field` (поле, элемент массива `fields`)

| Property | Type | Comment |
| --- | --- | --- |
| `title` * | `string` | Название поля. Не пустой; макс. **500** символов |
| `description` | `string` | Комментарий. Макс. **500** символов |
| `type` * | `string` (enum) | Тип поля: `"String"`, `"Text"`, `"Url"`, `"Attachment"`, `"AttachmentOrUrl"`, `"Select"`, `"SelectUser"` |
| `required` | `bool` | Является ли поле обязательным для заполнения пользователем |
| `settings` ** | `FieldSettings` | Настройки поля. Обязательно при `type = "Select"` или `type = "SelectUser"` |

---

## `FieldSettings`

Для `type = "Select"`

| Property | Type | Comment |
| --- | --- | --- |
| `multiSelect` | `bool` | Разрешён ли множественный выбор |
| `options` * | `FieldOptions[]` | Список вариантов выбора. Не пустой. Каждый элемент должен иметь непустое значение `value` |

Для `type = "SelectUser"`

| Property | Type | Comment |
| --- | --- | --- |
| groups | `int[]` | External Id групп из которых можно выбирать участников |

---

## `FieldOptions`

| Property | Type | Comment |
| --- | --- | --- |
| `order` | `int` | Порядок отображения варианта |
| `value` * | `string` | Текст варианта. Не пустой |

---

## Перечисления (Enums)

### `FieldType`

| Значение | Описание |
| --- | --- |
| `String` | Строка (короткий текст) |
| `Text` | Текст |
| `Url` | Ссылка |
| `Attachment` | Файл |
| `AttachmentOrUrl` | Файл или ссылка |
| `Select` | Список |
| `SelectUser` | Список участников |

**Краткая карта методов раздела**

| Действие | Method | URL |
|---|---|---|
| Импорт контента в задание | `PUT` | `{{baseUrl}}/api/external/v2/task-contents/{{taskContentId}}` |

#### Импорт контента в задание

Позволяет загрузить весь контент в ранее созданное задание по его Id.

### Параметры запроса:

- `taskContentId` - Id контента задания

| Параметр | Значение |
|---|---|
| Method | `PUT` |
| URL | `{{baseUrl}}/api/external/v2/task-contents/{{taskContentId}}` |
| Авторизация | Authorization: Bearer {bearer_token} |
| Headers из коллекции | `Accept-Language: {{locale}}` |

**Пример тела запроса**

```json
{
    "coverImageFileId": 265820,
    "Title": "Test stage (task)",
    "description": "<p>Description for the task content.</p>",
    "settings": {
        "screenInfo": {
            "showScore": false,
            "completedTitle": "Задание принято",
            "rejectedTitle": "Задание возвращено на доработку",
            "inReviewTitle": "Задание отправлено на проверку"
        },
        "reviewInfo": {
            "isReviewRequired": true,
            "duplicateInEmail": false,
            "takePartInRating": true,
            "maxScore": 98
        },
        "completionInfo": {
            "canBeRetaken": true
        },
        "notificationInfo": {
            "isEnabled": true,
            "sendToCurator": true,
            "sendToLeader": true,
            "sendToMentor": true,
            "text": "Task completed!",
            "duplicateInEmail": false
        }
    },
    "attachmentFileIds": [
        331,
        332
    ],
    "fields": [
        {
            "title": "Поле 1",
            "description": "Комментарий к полю 1.",
            "type": "String",
            "required": true
        },
        {
            "title": "Поле 2",
            "description": "Комментарий к полю 2.",
            "type": "Text",
            "required": true
        },
        {
            "title": "Поле 3",
            "description": "Комментарий к полю 3.",
            "type": "Url",
            "required": false
        },
        {
            "title": "Поле 4",
            "description": "Комментарий к полю 4.",
            "type": "Attachment",
            "required": false
        },
        {
            "title": "Поле 5",
            "description": "Комментарий к полю 5.",
            "type": "AttachmentOrUrl",
            "required": false
        },
        {
            "title": "Поле 6",
            "description": "Комментарий к полю 6.",
            "type": "Select",
            "required": false,
            "settings": {
                "multiSelect": true,
                "options": [
                    {
                        "order": 1,
                        "value": "Первый"
                    },
                    {
                        "order": 2,
                        "value": "Второй"
                    },
                    {
                        "order": 3,
                        "value": "Третий"
                    }
                ]
            }
        },
        {
            "title": "Поле 7",
            "description": "Комментарий к полю 7.",
            "type": "SelectUser",
            "required": false,
            "settings": {
                "groups": [ 111 ]
            }
        }
    ]
}
```

**Пример ответа**

**1. Импорт контента в задание**

- Статус: `200` OK

```json
{
    "id": 71,
    "title": "Test stage import_16/4 (task)",
    "description": "<p>Description for the task content import_16.</p>",
    "coverUrl": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-1.png",
    "isReviewRequired": true,
    "maxScore": 98,
    "showScore": false,
    "active": false,
    "access": "Everyone",
    "groups": [],
    "canBeRetaken": true,
    "allowEdit": false,
    "isIncludedInRating": true,
    "duplicateInEmail": false,
    "screenInfo": {
        "completedTitle": "Задание принято",
        "rejectedTitle": "Задание возвращено на доработку",
        "inReviewTitle": "Задание отправлено на проверку"
    },
    "notificationInfo": {
        "isEnabled": true,
        "sendToCurator": true,
        "sendToLeader": true,
        "sendToMentor": true,
        "text": "{LastName} {FirstName-1} sent the task \"{TaskName}\" for review",
        "duplicateInEmail": false
    },
    "fields": [
        {
            "id": 116,
            "title": "Поле 1",
            "description": "Комментарий к полю 1.",
            "type": "String",
            "required": true,
            "multiSelect": null,
            "settings": null
        },
        {
            "id": 116,
            "title": "Поле 1",
            "description": "Комментарий к полю 1.",
            "type": "String",
            "required": true,
            "multiSelect": null,
            "settings": null
        },
        {
            "id": 117,
            "title": "Поле 2",
            "description": "Комментарий к полю 2.",
            "type": "Text",
            "required": true,
            "multiSelect": null,
            "settings": null
        },
        {
            "id": 117,
            "title": "Поле 2",
            "description": "Комментарий к полю 2.",
            "type": "Text",
            "required": true,
            "multiSelect": null,
            "settings": null
        },
        {
            "id": 118,
            "title": "Поле 3",
            "description": "Комментарий к полю 3.",
            "type": "Link",
            "required": false,
            "multiSelect": null,
            "settings": null
        },
        {
            "id": 118,
            "title": "Поле 3",
            "description": "Комментарий к полю 3.",
            "type": "Link",
            "required": false,
            "multiSelect": null,
            "settings": null
        },
        {
            "id": 119,
            "title": "Поле 4",
            "description": "Комментарий к полю 4.",
            "type": "Attachment",
            "required": false,
            "multiSelect": null,
            "settings": null
        },
        {
            "id": 119,
            "title": "Поле 4",
            "description": "Комментарий к полю 4.",
            "type": "Attachment",
            "required": false,
            "multiSelect": null,
            "settings": null
        },
        {
            "id": 120,
            "title": "Поле 5",
            "description": "Комментарий к полю 5.",
            "type": "AttachmentOrLink",
            "required": false,
            "multiSelect": null,
            "settings": null
        },
        {
            "id": 120,
            "title": "Поле 5",
            "description": "Комментарий к полю 5.",
            "type": "AttachmentOrLink",
            "required": false,
            "multiSelect": null,
            "settings": null
        },
        {
            "id": 121,
            "title": "Поле 6",
            "description": "Комментарий к полю 6.",
            "type": "Select",
            "required": false,
            "multiSelect": true,
            "settings": {
                "multiSelect": true,
                "options": [
                    {
                        "order": 1,
                        "value": "Первый"
                    },
                    {
                        "order": 2,
                        "value": "Второй"
                    },
                    {
                        "order": 3,
                        "value": "Третий"
                    }
                ]
            }
        },
        {
            "id": 122,
            "title": "Поле 7",
            "description": "Комментарий к полю 7.",
            "type": "SelectUser",
            "required": false,
            "settings": {
                "groups": [ 111 ]
            }
        }
    ]
}
```

### [Experimental feature] Работа с опросами и тестами

## Описание полей

> Свойства, отмеченные знаком *, являются обязательными. Знак ** означает условную обязательность (подробности — в столбце «Comment»).


### Корневой объект: `ExternalPollImportRequest`

| Property | Type | Comment |
| --- | --- | --- |
| `name` | `string` | Название опроса/теста. Макс. **500** символов |
| `type` * | `string` (enum) | Тип: `"Common"`, `"SessionRating"`, `"TestWithoutAnswers"`, `"TestWithAnswers"`. |
| `isAuthRequired` | `bool` | Обязательна ли авторизация для прохождения |
| `canSkipQuestions` ** | `bool` | Можно ли пропускать вопросы. Обязательно при `type` = `"Common"` |
| `showRightAnswerAfterAnswerComplete` ** | `bool` | Показывать ли правильные ответы после ответа. Обязательно при `type` = `"TestWithAnswers"` |
| `showRightAnswerAfterTestComplete` ** | `bool` | Показывать ли правильные ответы после завершения теста. Обязательно при `type` = `"TestWithAnswers"` |
| `showRightAnswerType` ** | `string` (enum) | Тип отображения правильных ответов: `"OnlyAttendee"`(только результаты участника), `"AttendeeWithTotal"`(результаты участника и общие). Обязательно при `type` = `"TestWithAnswers"` |
| `overrideGlobalSettings` | `bool` | Перезаписать ли глобальные настройки |
| `sendPushOnStart` | `bool` | Отправлять ли уведомления при запуске |
| `duplicateInEmail` | `bool` | Дублировать ли уведомление на email |
| `showResults` | `bool` | Показывать ли результаты |
| `canBeRetaken` | `bool` | Можно ли пройти повторно |
| `shuffleQuestions` ** | `bool` | Перемешивать ли вопросы. Обязательно при `type` = `"TestWithAnswers"` |
| `shuffleOptions` ** | `bool` | Перемешивать ли варианты ответов. Обязательно при `type` = `"TestWithAnswers"` |
| `isQuestionRandomSetEnabled` ** | `bool` | Включён ли случайный набор вопросов. Обязательно при `type` = `"TestWithAnswers"` |
| `questionRandomSetSize` ** | `int` | Размер случайного набора вопросов. Обязательно и > 0 при `isQuestionRandomSetEnabled` = `true` |
| `questionRandomSetScore` ** | `int` | Балл за случайный набор вопросов. Обязательно и ≥ 0 при `isQuestionRandomSetEnabled` = `true` |
| `screens` * | `ExternalPollScreen[]` | Список экранов опроса/теста. Должен содержать хотя бы один элемент |
| `resultScreenSettings` * | `ExternalPollResultScreenSettings` | Настройки экрана результатов |

---

## `ExternalPollScreen`

| Property | Type | Comment |
| --- | --- | --- |
| `title` * | `string` | Заголовок экрана. Не пустой; макс. **1500** символов |
| `canHaveMultipleQuestions` | `bool` | Может ли экран содержать несколько вопросов |
| `questions` * | `ExternalPollQuestion[]` | Список вопросов на экране. Должен содержать хотя бы один элемент |

---

## `ExternalPollQuestion`

| Property | Type | Comment |
| --- | --- | --- |
| `text` * | `string` | Текст вопроса. Не пустой; макс. **1500** символов |
| `type` * | `string` (enum) | Тип вопроса: `"FreeText"`(короткий текст), `"SingleSelect"`(удиничный выбор), `"MultiSelect"`(множественный выбор), `"Stars"`(оценка) |
| `imageFileId` | `int` | ID файла изображения для вопроса |
| `options` ** | `ExternalPollQuestionOptions[]` | Варианты ответа. Обязательны и не пусты при любом `type`, кроме `"FreeText"` |

---

## `ExternalPollQuestionOptions`

| Property | Type | Comment |
| --- | --- | --- |
| `rate` | `int` | Балл варианта ответа |
| `isRight` | `bool` | Является ли вариант правильным ответом |
| `imageFileId` | `int` | ID файла изображения варианта ответа |
| `optionData` | `ExternalPollQuestionOptionData` | Данные варианта ответа (текст или числовой диапазон) |

---

## `ExternalPollQuestionOptionData`

| Property | Type | Comment |
| --- | --- | --- |
| `text` ** | `string` | Текст варианта ответа. Обязателен, если `min`, `max`, `current` не заданы; макс. **1500** символов |
| `min` ** | `int` | Минимальная оценка. Обязательно, если `text` не задан. Должно быть ≤ `max` |
| `max` ** | `int` | Максимальная оценка. Обязательно, если `text` не задан. Должно быть ≥ `min` |
| `current` ** | `int` | Текущая оценка. Обязательно, если `text` не задан. Должно быть в диапазоне \[`min`; `max`\] |

> **Правило:** Указывается **либо** `text`, **либо** набор `min` + `max` + `current`. Если `text` не задан, все три числовых поля обязательны.


---

## `ExternalPollResultScreenSettings`

| Property | Type | Comment |
| --- | --- | --- |
| `topic` | `string` | Заголовок экрана результатов. Макс. **100** символов |
| `comment` | `string` | Комментарий к экрану результатов. Макс. **400** символов |
| `showRates` ** | `bool` | Показывать ли количество набранных баллов. Для `type` = `"Common"` должно быть `false` или не задано; для остальных типов — обязательно |
| `rateRanges` ** | `ExternalPollResultScreenRateRange[]` | Диапазоны баллов. Обязателен и не пуст при `showRates` = `true` |
| `locale` | `string` | Язык информации на экране результатов |

---

## `ExternalPollResultScreenRateRange`

| Property | Type | Comment |
| --- | --- | --- |
| `start` * | `int` | Начало диапазона. Должно быть ≥ 0 |
| `end` | `int` | Конец диапазона. Если задан — должен быть ≥ `start` |
| `comment` | `string` | Комментарий к диапазону. Макс. **400** символов |

---

## Перечисления (Enums)

### `PollModelType`

| Значение | Числовой код | Описание |
| --- | --- | --- |
| `Common` | 0 | Опрос |
| `SessionRating` | 1 | Оценка сессии |
| `TestWithoutAnswers` | 2 | Тест без правильных ответов |
| `TestWithAnswers` | 3 | Тест с правильными ответами |

### `ShowAnswersTypeModel`

| Значение | Числовой код | Описание |
| --- | --- | --- |
| `OnlyAttendee` | 0 | Только результаты участника |
| `AttendeeWithTotal` | 1 | Результаты участника и общие результаты |

### `PollQuestionTypeEnum`

| Значение | Сериализованное значение | Описание |
| --- | --- | --- |
| `FreeText` | `"freetext"` | Короткий текстовый ответ |
| `SingleSelect` | `"singleselect"` | Единичный выбор |
| `MultiSelect` | `"multiselect"` | Множественный выбор |
| `Stars` | `"stars"` | Оценка |

**Краткая карта методов раздела**

| Действие | Method | URL |
|---|---|---|
| Импорт контента опроса/теста | `PUT` | `{{baseUrl}}/api/external/v2/polls/{{pollId}}` |

#### Импорт контента опроса/теста

Позволяет загрузить весь контент в ранее созданный при импорте курса пустой тест/опрос.

### Параметры запроса:

- `pollId` - Id теста/опроса

| Параметр | Значение |
|---|---|
| Method | `PUT` |
| URL | `{{baseUrl}}/api/external/v2/polls/{{pollId}}` |
| Авторизация | Authorization: Bearer {bearer_token} |
| Headers из коллекции | `Accept-Language: {{locale}}` |

**Пример тела запроса**

```json
{
    "name": "Test poll",
    "type": "common",
    "isAuthRequired": false,
    "canSkipQuestions": true,
    "canBeRetaken": true,
    "overrideGlobalSettings": false,
    "sendPushOnStart": false,
    "duplicateInEmail": false,
    "showResults": false,
    "resultScreenSettings": {
        "topic": "Спасибо за участие!",
        "comment": ""
    },
    "screens": [
        {
            "title": "Test question group",
            "canHaveMultipleQuestions": true,
            "questions": [
                {
                    "text": "Your favorite meal ?",
                    "type": "freetext",
                    "imageFileId": 266300,
                    "options": []
                },
                {
                    "text": "How many times a day do you usually eat ?",
                    "type": "singleselect",
                    "imageFileId": 266307,
                    "options": [
                        {
                            "optionData": {
                                "text": "1"
                            },
                            "rate": null,
                            "isRight": false,
                            "imageFileId": 266299
                        },
                        {
                            "optionData": {
                                "text": "2"
                            },
                            "rate": null,
                            "isRight": false,
                            "imageFileId": 266297
                        },
                        {
                            "optionData": {
                                "text": "3"
                            },
                            "rate": null,
                            "isRight": false,
                            "imageFileId": 266294
                        },
                        {
                            "optionData": {
                                "text": "More than 3"
                            },
                            "rate": null,
                            "isRight": false,
                            "imageFileId": 266303
                        }
                    ]
                },
                {
                    "text": "Choose your favorite fruits",
                    "type": "multiselect",
                    "imageFileId": 266306,
                    "options": [
                        {
                            "optionData": {
                                "text": "Apple"
                            },
                            "rate": null,
                            "isRight": false,
                            "imageFileId": 266304
                        },
                        {
                            "optionData": {
                                "text": "Pomegranate"
                            },
                            "rate": null,
                            "isRight": false,
                            "imageFileId": 266293
                        },
                        {
                            "optionData": {
                                "text": "Melon"
                            },
                            "rate": null,
                            "isRight": false,
                            "imageFileId": 266291
                        },
                        {
                            "optionData": {
                                "text": "Pear"
                            },
                            "rate": null,
                            "isRight": false,
                            "imageFileId": 266300
                        },
                        {
                            "optionData": {
                                "text": "Banana"
                            },
                            "rate": null,
                            "isRight": false,
                            "imageFileId": 266307
                        }
                    ]
                },
                {
                    "text": "Rate the chicken curry",
                    "type": "stars",
                    "imageFileId": 266299,
                    "options": [
                        {
                            "optionData": {
                                "min": 2,
                                "max": 10,
                                "current": 2
                            },
                            "rate": 0,
                            "isRight": false,
                            "imageFileId": 266297
                        }
                    ]
                }
            ]
        }
    ]
}
```

**Пример ответа**

**1. Импорт контента опроса**

- Статус: `200` OK

```json
{
    "resultsScreenSettings": {
        "showRates": false,
        "rateRanges": []
    },
    "resultsScreenSettingsLocalizations": [
        {
            "locale": "ru",
            "comment": "",
            "topic": "Спасибо за участие!",
            "rateRanges": []
        }
    ],
    "activationMode": 0,
    "activationDate": null,
    "isAuthRequired": false,
    "canSkipQuestions": true,
    "overrideGlobalSettings": false,
    "sendPushOnStart": false,
    "duplicateInEmail": false,
    "showResults": false,
    "publishReason": 0,
    "uuid": "7f0b24a9-abfa-4b91-abb1-3000c2338bab",
    "screens": [
        {
            "pollId": 109,
            "title": "Test question group",
            "canHaveMultipleQuestions": true,
            "order": 1,
            "questions": [
                {
                    "screenId": 178,
                    "text": "Your favorite meal ?",
                    "order": 1,
                    "type": 0,
                    "imageURL": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-3.png",
                    "imageFileId": null,
                    "options": [],
                    "id": 285,
                    "createdDate": "2026-03-06T13:04:44.602Z",
                    "updatedDate": "2026-03-06T13:04:44.602Z",
                    "isDeleted": false
                },
                {
                    "screenId": 178,
                    "text": "How many times a day do you usually eat ?",
                    "order": 2,
                    "type": 1,
                    "imageURL": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-3.png",
                    "imageFileId": null,
                    "options": [
                        {
                            "optionData": "{\"text\":\"1\"}",
                            "order": 1,
                            "rate": null,
                            "isRight": false,
                            "imageURL": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-3.png",
                            "imageFileId": null,
                            "questionId": 0,
                            "id": 762,
                            "createdDate": "2026-03-06T13:04:44.602Z",
                            "updatedDate": "2026-03-06T13:04:44.602Z",
                            "isDeleted": false
                        },
                        {
                            "optionData": "{\"text\":\"2\"}",
                            "order": 2,
                            "rate": null,
                            "isRight": false,
                            "imageURL": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-3.png",
                            "imageFileId": null,
                            "questionId": 0,
                            "id": 763,
                            "createdDate": "2026-03-06T13:04:44.602Z",
                            "updatedDate": "2026-03-06T13:04:44.602Z",
                            "isDeleted": false
                        },
                        {
                            "optionData": "{\"text\":\"3\"}",
                            "order": 3,
                            "rate": null,
                            "isRight": false,
                            "imageURL": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-3.png",
                            "imageFileId": null,
                            "questionId": 0,
                            "id": 764,
                            "createdDate": "2026-03-06T13:04:44.602Z",
                            "updatedDate": "2026-03-06T13:04:44.602Z",
                            "isDeleted": false
                        },
                        {
                            "optionData": "{\"text\":\"More than 3\"}",
                            "order": 4,
                            "rate": null,
                            "isRight": false,
                            "imageURL": "https://storage.yandexcloud.net/ev-env-test-yandex/images/public/sample-3.png",
                            "imageFileId": null,
                            "questionId": 0,
                            "id": 765,
                            "createdDate": "2026-03-06T13:04:44.602Z",
                            "updatedDate": "2026-03-06T13:04:44.602Z",
                            "isDeleted": false
                        }
                    ],
                    "id": 286,
                    "createdDate": "2026-03-06T13:04:44.602Z",
                    "updatedDate": "2026-03-06T13:04:44.602Z",
                    "isDeleted": false
                },
                {
                    "screenId": 178,
                    "text": "Choose your favorite fruits",
                    "order": 3,
                    "type": 2,
                    "imageURL": "https://storage.yandexcloud.net/ev-env-test-yand
...
```
_Ответ укорочен в MD, полный пример есть в исходной Postman-коллекции._

**2. Импорт контента теста без правильных ответов**

- Статус: `200` OK

```json
{
    "resultsScreenSettings": {
        "showRates": true,
        "rateRanges": [
            {
                "guid": "f1bcf24a-8b6e-4d84-90d7-ba10cd7f585f",
                "start": 0,
                "end": 25
            },
            {
                "guid": "6f92bec3-d302-4ddf-b478-8bb77f9109c0",
                "start": 26,
                "end": 50
            },
            {
                "guid": "b0c58926-c522-4fed-8ec0-0b4bdbc32e13",
                "start": 51,
                "end": 75
            },
            {
                "guid": "374c542e-58a6-487e-b376-68fb14a4efcd",
                "start": 76,
                "end": 100
            },
            {
                "guid": "8067812d-5085-42b2-ae40-9c2e78e79374",
                "start": 101,
                "end": null
            }
        ]
    },
    "resultsScreenSettingsLocalizations": [
        {
            "locale": "ru",
            "comment": "",
            "topic": "",
            "rateRanges": [
                {
                    "rangeGuid": "f1bcf24a-8b6e-4d84-90d7-ba10cd7f585f",
                    "comment": "Вы можете лучше!"
                },
                {
                    "rangeGuid": "6f92bec3-d302-4ddf-b478-8bb77f9109c0",
                    "comment": "Неплохой результат!"
                },
                {
                    "rangeGuid": "b0c58926-c522-4fed-8ec0-0b4bdbc32e13",
                    "comment": "Хороший результат!"
                },
                {
                    "rangeGuid": "374c542e-58a6-487e-b376-68fb14a4efcd",
                    "comment": "Отличный результат!"
                },
                {
                    "rangeGuid": "8067812d-5085-42b2-ae40-9c2e78e79374",
                    "comment": "Превосходно!"
                }
            ]
        }
    ],
    "activationMode": 0,
    "activationDate": null,
    "isAuthRequired": false,
    "canSkipQuestions": false,
    "overrideGlobalSettings": false,
    "sendPushOnStart": false,
    "duplicateInEmail": false,
    "showResults": false,
    "publishReason": 0,
    "uuid": "2852cfb1-ea37-46d3-8272-c3281beea030",
    "screens": [
        {
            "pollId": 110,
            "title": "What is your favorite movie ?",
            "canHaveMultipleQuestions": false,
            "order": 1,
            "questions": [
                {
                    "screenId": 179,
                    "text": "What is your favorite movie ?",
                    "order": 1,
                    "type": 0,
                    "imageURL": null,
                    "imageFileId": null,
                    "options": [],
                    "id": 289,
                    "createdDate": "2026-03-06T13:05:44.547Z",
                    "updatedDate": "2026-03-06T13:05:44.547Z",
                    "isDeleted": false
                }
            ],
            "id": 179,
            "createdDate": "2026-03-06T13:05:44.547Z",
            "updatedDate": "2026-03-06T13:05:44.547Z",
            "isDeleted": false
        },
        {
            "pollId": 110,
            "title": "What is your favorite genre ?",
            "canHaveMultipleQuestions": false,
            "order": 2,
            "questions": [
                {
                    "screenId": 180,
                    "text": "What is your favorite genre ?",
                    "order": 1,
                    "type": 2,
                    "imageURL": null,
                    "imageFileId": null,
                    "options": [
                        {
                            "optionData": "{\"text\":\"Horror\"}",
                            "order": 1,
                            "rate": 1,
                            "isRight": false,
                            "imageURL": null,
                            "imageFileId": null,
                            "questionId": 0,
                            "id": 772,
                            "createdDate": "2026-03-06T13:05:44.547Z",
                            "updatedDate": "2026-03-06T13:05:44.547Z",
                            "isDeleted": false
                        },
                        {
                            "optionData": "{\"text\":\"Drama\"}",
                            "order": 2,
                            "rate": 2,
                            "isRight": false,
                            "imageURL": null,
                            "imageFileId": null,
                            "questionId": 0,
                            "id": 773,
                            "createdDate": "2026-03-06T13:05:44.547Z",
                            "updatedDate": "2026-03-06T13:05:44.547Z",
                            "isDeleted": false
                        },
                        {
                            "optionData": "{\"text\":\"Situation comedy\"}",
                            "order": 3,
                            "rate": 3,
                            "isRight": false,
...
```
_Ответ укорочен в MD, полный пример есть в исходной Postman-коллекции._

**3. Импорт контента теста с правильными ответами**

- Статус: `200` OK

```json
{
    "resultsScreenSettings": {
        "showRates": true,
        "rateRanges": [
            {
                "guid": "10896e82-2232-4bdf-a200-3cc299fb66f6",
                "start": 0,
                "end": 25
            },
            {
                "guid": "f4ba8e29-0544-4906-afe5-9b412b45a834",
                "start": 26,
                "end": 50
            },
            {
                "guid": "effc331a-81f5-4b24-9084-9ed7a9fb49fc",
                "start": 51,
                "end": 75
            },
            {
                "guid": "f4cd4511-d853-4a2d-82f8-3ea56fbdd985",
                "start": 76,
                "end": null
            }
        ]
    },
    "resultsScreenSettingsLocalizations": [
        {
            "locale": "ru",
            "comment": "",
            "topic": "",
            "rateRanges": [
                {
                    "rangeGuid": "10896e82-2232-4bdf-a200-3cc299fb66f6",
                    "comment": "Вы можете лучше!"
                },
                {
                    "rangeGuid": "f4ba8e29-0544-4906-afe5-9b412b45a834",
                    "comment": "Неплохой результат!"
                },
                {
                    "rangeGuid": "effc331a-81f5-4b24-9084-9ed7a9fb49fc",
                    "comment": "Хороший результат!"
                },
                {
                    "rangeGuid": "f4cd4511-d853-4a2d-82f8-3ea56fbdd985",
                    "comment": "Отличный результат!"
                }
            ]
        }
    ],
    "activationMode": 0,
    "activationDate": null,
    "isAuthRequired": false,
    "canSkipQuestions": false,
    "overrideGlobalSettings": false,
    "sendPushOnStart": false,
    "duplicateInEmail": false,
    "showResults": false,
    "publishReason": 0,
    "uuid": "0ceeaae1-c2b6-4eb6-91e9-936184104bcc",
    "screens": [
        {
            "pollId": 112,
            "title": "What TV series is this picture relates to ?",
            "canHaveMultipleQuestions": false,
            "order": 1,
            "questions": [
                {
                    "screenId": 182,
                    "text": "What TV series is this picture relates to ?",
                    "order": 1,
                    "type": 1,
                    "imageURL": null,
                    "imageFileId": null,
                    "options": [
                        {
                            "optionData": "{\"text\":\"How I met your mom\"}",
                            "order": 1,
                            "rate": null,
                            "isRight": false,
                            "imageURL": null,
                            "imageFileId": null,
                            "questionId": 0,
                            "id": 782,
                            "createdDate": "2026-03-06T13:08:58.351Z",
                            "updatedDate": "2026-03-06T13:08:58.351Z",
                            "isDeleted": false
                        },
                        {
                            "optionData": "{\"text\":\"Friends\"}",
                            "order": 2,
                            "rate": null,
                            "isRight": false,
                            "imageURL": null,
                            "imageFileId": null,
                            "questionId": 0,
                            "id": 783,
                            "createdDate": "2026-03-06T13:08:58.351Z",
                            "updatedDate": "2026-03-06T13:08:58.351Z",
                            "isDeleted": false
                        },
                        {
                            "optionData": "{\"text\":\"Big Bang Theory\"}",
                            "order": 3,
                            "rate": null,
                            "isRight": false,
                            "imageURL": null,
                            "imageFileId": null,
                            "questionId": 0,
                            "id": 784,
                            "createdDate": "2026-03-06T13:08:58.351Z",
                            "updatedDate": "2026-03-06T13:08:58.351Z",
                            "isDeleted": false
                        },
                        {
                            "optionData": "{\"text\":\"Squid game\"}",
                            "order": 4,
                            "rate": 10,
                            "isRight": true,
                            "imageURL": null,
                            "imageFileId": null,
                            "questionId": 0,
                            "id": 785,
                            "createdDate": "2026-03-06T13:08:58.351Z",
                            "updatedDate": "2026-03-06T13:08:58.351Z",
                            "isDeleted": false
                        }
                    ],
                    "id": 292,
                    "createdDate": "2026-03-06T13:08:58.351Z",
                    "updat
...
```
_Ответ укорочен в MD, полный пример есть в исходной Postman-коллекции._

### [Experimental feature] Работа с общей структурой

## Описание полей

> Свойства, отмеченные знаком *, являются обязательными. Знак ** означает условную обязательность (подробности — в столбце «Comment»).


### Корневой объект: `ExternalCourseCreateRequest`

| Property | Type | Comment |
| --- | --- | --- |
| `name` * | `string` | Название курса. Не пустое; макс. **100** символов |
| `description` | `string` | Описание курса |
| `coverImageFileId` * | `int` | ID файла обложки курса. Не может быть равен 0; должен быть существующим в системе |
| `coverImageThumbnailFileId` * | `int` | ID файла миниатюры обложки курса. Не может быть равен 0; должен быть существующим в системе |
| `settings` * | `ExternalCourseSettings` | Настройки курса (прогресс, финальный экран, срок выполнения, режим прохождения и т.д.) |
| `stages` | `ExternalCourseStage[]` | Список этапов курса |
| `externalId` | `string` | Внешний идентификатор курса |

---

## `ExternalCourseSettings`

| Property | Type | Comment |
| --- | --- | --- |
| `progress` * | `ExternalCourseProgress` | Настройки прогресса выполнения курса |
| `finalScreen` * | `ExternalCourseFinalScreen` | Настройки финального экрана курса |
| `deadline` * | `ExternalCourseDeadline` | Настройки сроков выполнения курса |
| `isFreeOrderAllowed` | `bool` | Разрешен ли произвольный порядок прохождения этапов |

---

## `ExternalCourseProgress`

| Property | Type | Comment |
| --- | --- | --- |
| `isEnabled` | `bool` | Включен ли показ прогресса прохождения на экране курса в приложении |
| `hintText` ** | `string` | Текст прогресс бара в приложении. Обязателен при `isEnabled = true`; макс. **400** символов |

---

## `ExternalCourseFinalScreen`

| Property | Type | Comment |
| --- | --- | --- |
| `isEnabled` | `bool` | Включен ли финальный экран |
| `title` ** | `string` | Заголовок финального экрана. Обязателен при `isEnabled = true`; макс. **100** символов |
| `text` | `string` | Текст сообщения финального экрана. Макс. **400** символов |

---

## `ExternalCourseDeadline`

| Property | Type | Comment |
| --- | --- | --- |
| `isEnabled` | `bool` | Включен ли срок выполнения (дедлайн) |
| `fixedDeadlineDate` ** | `datetime` | Фиксированная дата дедлайна. Обязательно при `isEnabled = true`, если не заданы `relativeDeadlineUnits` + `relativeDeadlineValue` |
| `relativeDeadlineUnits` ** | `string` (enum) | Единицы относительного дедлайна: `"Days"`, `"Weeks"`, `"Months"`. Обязательно совместно с `relativeDeadlineValue`, если `fixedDeadlineDate` не задана и `isEnabled = true` |
| `relativeDeadlineValue` ** | `int` | Числовое значение относительного дедлайна. От **1** до **99** |
| `notificationSettings` * | `ExternalCourseNotificationSettings` | Настройки уведомлений о сроке выполнения курса |

**Правило:** Если `isEnabled = true`, необходимо указать **либо** `fixedDeadlineDate`, **либо** пару `relativeDeadlineUnits` + `relativeDeadlineValue`.

---

## `ExternalCourseNotificationSettings`

| Property | Type | Comment |
| --- | --- | --- |
| `isEnabled` | `bool` | Включены ли уведомления о сроке выполнения курса |
| `localizedText` ** | `object` (`Dictionary`) | Локализованный текст уведомления. Ключ — код языка, значение — текст. Обязателен при `isEnabled = true`; ключи: `"ru-RU"`, `"en-US"`; значения: не пустые, макс. **400** символов |
| `duplicateInEmail` | `bool` | Дублировать ли уведомление на email |
| `sendingPeriods` ** | `ExternalCourseNotificationSendingPeriod[]` | Периоды отправки уведомлений. Обязательно при `isEnabled = true`; макс. **5** периодов |

### Поддерживаемые языковые коды (`localizedText` ключи)

| Код | Язык |
| --- | --- |
| `ru-RU` | Русский |
| `en-US` | Английский |

---

## `ExternalCourseNotificationSendingPeriod`

| Property | Type | Comment |
| --- | --- | --- |
| `unit` * | `string` (enum) | Единица периода: `"Days"`, `"Weeks"`, `"Months"` |
| `value` * | `int` | Числовое значение периода. От **1** до **99** |

---

## `ExternalCourseStage` (этап, элемент массива `stages`)

| Property | Type | Comment |
| --- | --- | --- |
| `name` * | `string` | Название этапа. Не пустое; макс. **100** символов |
| `comment` | `string` | Комментарий к этапу. Макс. **150** символов |
| `type` * | `string` (enum) | Тип этапа: `"Common"` , `"Scorm"` , `"Task"` |
| `settings` ** | `ExternalCourseStageSettings` | Настройки этапа. Обязательно, если `type` = `"Common"` или `"Scorm"` |
| `taskContent` ** | `ExternalCourseStageTaskContent` | Объект задания. Обязательно, если `type` = `"Task"` |

---

## `ExternalCourseStageTaskContent`

| Property | Type | Comment |
| --- | --- | --- |
| `title` | `string` | Заголовок задания |

---

## `ExternalCourseStageSettings`

| Property | Type | Comment |
| --- | --- | --- |
| `transition` | `ExternalCourseStageTransition` | Настройки завершения этапа |
| `finalMessage` * | `ExternalCourseStageFinalMessage` | Настройки сообщения после прохождения этапа |
| `scormSettings` | `ExternalCourseStageScormSettings` | Настройки SCORM курса (только для этапов типа Scorm) |

---

## `ExternalCourseStageFinalMessage`

| Property | Type | Comment |
| --- | --- | --- |
| `isEnabled` | `bool` | Включено сообщение после прохождения этапа |
| `title` ** | `string` | Заголовок сообщения после прохождения этапа. Обязателен при `isEnabled = true`; макс. **100** символов |
| `text` | `string` | Текст сообщения после прохождения этапа. Макс. **150** символов |

---

## `ExternalCourseStageTransition`

| Property | Type | Comment |
| --- | --- | --- |
| `conditionType` * | `string` (enum) | Условие перехода: `"CheckInformation"` , `"PassPoll"` , `"PassTest"` |
| `pollButtonNameOverride` | `string` | Название кнопки для перехода к опросу/тесту |
| `pollPoints` | `int` | Количество баллов для завершения этапа |
| `poll` ** | `ExternalCourseStagePoll` | Настройки опроса/теста. Обязательно, если `conditionType = "PassPoll"` или `conditionType = "PassTest"` |

**Правило:** Если `conditionType` = `"PassPoll"` или `"PassTest"`, свойство `poll` обязательно и поле `poll.name` должно быть заполнено.

---

## `ExternalCourseStagePoll`

| Property | Type | Comment |
| --- | --- | --- |
| `name` * | `string` | Название опроса/теста. Не пустое |

---

## `ExternalCourseStageScormSettings`

| Property | Type | Comment |
| --- | --- | --- |
| `useFixedScores` | `bool` | Использовать ли фиксированное количество баллов |
| `fixedScores` ** | `double` | Фиксированное количество баллов. Обязательно и ≥ 0, если `useFixedScores = true` |

---

## Перечисления (Enums)

### `StageType`

| Значение | Числовой код | Описание |
| --- | --- | --- |
| `Common` | 0 | Обычный этап |
| `Scorm` | 1 | SCORM-этап |
| `Task` | 2 | Этап-задание |

### `RelativePeriodUnits`

| Значение | Числовой код | Описание |
| --- | --- | --- |
| `Days` | 1 | Дни |
| `Weeks` | 2 | Недели |
| `Months` | 3 | Месяцы |

### `TransitionCondition`

| Значение | Числовой код | Описание |
| --- | --- | --- |
| `CheckInformation` | 0 | Ознакомиться с информацией |
| `PassPoll` | 1 | Пройти опрос |
| `PassTest` | 2 | Пройти тест |

**Краткая карта методов раздела**

| Действие | Method | URL |
|---|---|---|
| Импорт общей структуры курса | `POST` | `{{baseUrl}}/api/external/v2/courses` |
| Финализировать курс | `POST` | `{{baseUrl}}/api/external/v2/courses/{{courseId}}/finalize` |

#### Импорт общей структуры курса

Позволяет создать общую структуру курса со всеми связанными элементами (этапы, задания, тесты, опросы) применяя их базовые настройки по умолчанию в большинстве случаев (кроме SCORM-этапа, где можно сразу задать настройку баллов).

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/courses` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Пример тела запроса**

```json
{
    "name": "Test course",
    "description": "<p>Description for my test course.</p>",
    "coverImageFileId": 186375,
    "coverImageThumbnailFileId": 186376,
    "settings": {
        "progress": {
            "isEnabled": true,
            "hintText": "Completion progress"
        },
        "finalScreen": {
            "isEnabled": true,
            "title": "Congratulations!",
            "text": "You have successfully completed all the stages."
        },
        "deadline": {
            "isEnabled": true,
            "fixedDeadlineDate": "2027-02-28",
            "relativeDeadlineUnits": "months",
            "relativeDeadlineValue": 5,
            "notificationSettings": {
                "isEnabled": true,
                "localizedText": {
                    "en-US": "The deadline for the «{CourseName}» test course is approaching. Make sure you complete it by {DeadlineDate}.",
                    "ru-RU": "Приближается срок выполнения тестового курса «{CourseName}». Успейте его пройти по {DeadlineDate}."
                },
                "duplicateInEmail": false,
                "sendingPeriods": [
                    {
                        "unit": "months",
                        "value": 3
                    },
                    {
                        "unit": "weeks",
                        "value": 2
                    },
                    {
                        "unit": "days",
                        "value": 1
                    }
                ]
            }
        },
        "isFreeOrderAllowed": true
    },
    "stages": [
        {
            "name": "Test stage 1 (regular)",
            "comment": "Comment for the stage 1.",
            "type": "common",
            "settings": {
                "transition": {
                    "conditionType": "checkinformation"
                },
                "finalMessage": {
                    "isEnabled": true,
                    "title": "Этап пройден",
                    "text": "Вы можете переходить к следующему этапу."
                }
            }
        },
        {
            "name": "Test stage 2 (regular)",
            "comment": "Comment for the stage 2.",
            "type": "common",
            "settings": {
                "transition": {
                    "conditionType": "passpoll",
                    "pollButtonNameOverride": "Пройти опрос",
                    "pollPoints": 100,
                    "poll": {
                        "name": "Тестовый опрос 2"
                    }
                },
                "finalMessage": {
                    "isEnabled": true,
                    "title": "Этап пройден",
                    "text": "Вы можете переходить к следующему этапу."
                }
            }
        },
        {
            "name": "Test stage 3 (regular)",
            "comment": "Comment for the stage 3.",
            "type": "common",
            "settings": {
                "transition": {
                    "conditionType": "passtest",
                    "pollButtonNameOverride": "Пройти тест",
                    "pollPoints": 100,
                    "poll": {
                        "name": "Тестовый тест 3"
                    }
                },
                "finalMessage": {
                    "isEnabled": true,
                    "title": "Этап пройден",
                    "text": "Вы можете переходить к следующему этапу."
                }
            }
        },
        {
            "name": "Test stage 4 (task)",
            "comment": "Comment for the stage 4.",
            "type": "task",
            "taskContent": {
                "title": "Тестовое задание 4"
            }
        },
        {
            "name": "Test stage 5 (scorm)",
            "comment": "Comment for the stage 5.",
            "type": "scorm",
            "settings": {
                "finalMessage": {
                    "isEnabled": true,
                    "title": "Этап пройден",
                    "text": "Вы можете переходить к следующему этапу."
                }
            }
        },
        {
            "name": "Test stage 6 (scorm)",
            "comment": "Comment for the stage 6.",
            "type": "scorm",
            "settings": {
                "finalMessage": {
                    "isEnabled": true,
                    "title": "Этап пройден",
                    "text": "Вы можете переходить к следующему этапу."
                },
                "scormSettings":{
                    "useFixedScores": true,
                    "fixedScores": 104
                }
            }
        }
    ],
    "externalId": "1B47UWL"
}
```

**Пример ответа**

**1. Импорт общей структуры курса**

- Статус: `200` OK

```json
{
    "id": 92,
    "name": "Test course import_15",
    "courseCatalog": {
        "id": 289,
        "name": "Test course import_15"
    },
    "stages": [
        {
            "id": 211,
            "name": "Test stage import_15/1 (regular)",
            "type": "Common",
            "catalog": {
                "id": 290,
                "name": "Test stage import_15/1 (regular)"
            },
            "taskContent": null,
            "poll": null,
            "scormId": null
        },
        {
            "id": 212,
            "name": "Test stage import_15/2 (regular)",
            "type": "Common",
            "catalog": {
                "id": 291,
                "name": "Test stage import_15/2 (regular)"
            },
            "taskContent": null,
            "poll": {
                "id": 107,
                "name": "Тестовый опрос import_15/2"
            },
            "scormId": null
        },
        {
            "id": 213,
            "name": "Test stage import_15/3 (regular)",
            "type": "Common",
            "catalog": {
                "id": 292,
                "name": "Test stage import_15/3 (regular)"
            },
            "taskContent": null,
            "poll": {
                "id": 108,
                "name": "Тестовый тест import_15/3"
            },
            "scormId": null
        },
        {
            "id": 214,
            "name": "Test stage import_15/4 (task)",
            "type": "Task",
            "catalog": {
                "id": 293,
                "name": "Test stage import_15/4 (task)"
            },
            "taskContent": {
                "id": 70,
                "title": "Test stage import_15/4 (task)"
            },
            "poll": null,
            "scormId": null
        },
        {
            "id": 215,
            "name": "Test stage import_15/5 (scorm)",
            "type": "Scorm",
            "catalog": {
                "id": 294,
                "name": "Test stage import_15/5 (scorm)"
            },
            "taskContent": null,
            "poll": null,
            "scormId": 38
        },
        {
            "id": 216,
            "name": "Test stage import_15/6 (scorm)",
            "type": "Scorm",
            "catalog": {
                "id": 295,
                "name": "Test stage import_15/6 (scorm)"
            },
            "taskContent": null,
            "poll": null,
            "scormId": 39
        }
    ]
}
```

#### Финализировать курс

Позволяет финализировать (перевести из статуса Draft) курс по его Id. После финализации курс будет отображаться в админке.

### Параметры запроса:

- `courseId` - Id курса

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/courses/{{courseId}}/finalize` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Тело запроса:** не требуется / не указано.

**Пример ответа**

**1. Финализировать курс**

- Статус: `200` OK

_Пустое тело ответа или пример не указан._

### [Experimental feature] Работа с файлами

**Краткая карта методов раздела**

| Действие | Method | URL |
|---|---|---|
| Загрузка изображений | `POST` | `{{baseUrl}}/api/external/v2/images/upload?generateThumbnails=true` |
| Загрузить вложений к заданию | `POST` | `{{baseUrl}}/api/external/v2/task-contents/attachments/upload` |
| Загрузить SCORM курс в этап | `POST` | `{{baseUrl}}/api/external/v2/courses/{{courseId}}/stages/{{stageId}}/scorm/{{scormId}}/upload` |

#### Загрузка изображений

Позволяет загрузить изображения в файловое хранилище. Максимальное количество загружаемых изображений - 10 за каждый вызов. Допустимые форматы изображений: `.jpg` и `.png`

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/images/upload?generateThumbnails=true` |
| Авторизация | Authorization: Bearer {bearer_token} |
| Headers из коллекции | `EventiciousRequestInfo: {"eventId":"43580","applicationId":"0","languageId":"1","appLanguageId":"0"}` |

**Пример тела запроса**

| Key | Type | Value/src |
|---|---|---|
| `` | `file` | `None` |

**Пример ответа**

**1. Загрузка изображений**

- Статус: `200` OK

```json
{
    "uploadedImages": [
        {
            "fileId": 186374,
            "fileName": "krotek.png",
            "thumbnailFileId": 186377
        },
        {
            "fileId": 186375,
            "fileName": "really_kid.jpg",
            "thumbnailFileId": 186376
        }
    ]
}
```

#### Загрузить вложений к заданию

Позволяет загрузить в файловое хранилище файлы-вложения для заданий. Максимальное количество загружаемых файлов за каждый вызов - 5.

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/task-contents/attachments/upload` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Пример тела запроса**

| Key | Type | Value/src |
|---|---|---|
| `` | `file` | `/C:/Users/urusov/Downloads/squid_game.jpg` |
| `` | `file` | `/C:/Users/urusov/Downloads/really_kid.jpg` |
| `` | `file` | `/C:/Users/urusov/Downloads/retrograde.png` |

**Пример ответа**

**1. Загрузить вложений к заданию**

- Статус: `200` OK

```json
[
    {
        "id": 11,
        "name": "BrandSource-Price-Scraping-Logs-2018-07-20.pdf",
        "url": "https://s3.yandexcloud.net/ev-env-dev/events/d8b1e95d-9d37-47e9-ad1a-745861162df3/tasks/task-content/attachments/BrandSource-Price-Scraping-Logs-2018-07-20.pdf"
    },
    {
        "id": 12,
        "name": "BrandSource-Price-Scraping-Troubleshooting-2018-08-02.pdf",
        "url": "https://s3.yandexcloud.net/ev-env-dev/events/d8b1e95d-9d37-47e9-ad1a-745861162df3/tasks/task-content/attachments/BrandSource-Price-Scraping-Troubleshooting-2018-08-02.pdf"
    }
]
```

#### Загрузить SCORM курс в этап

Позволяет загрузить Zip архив со SCORM курсом и связать его с указанным этапом.

### Параметры запроса:

- `courseId` - Id курса

- `stageId` - Id этапа

- `scormId` - Id SCORM курса

| Параметр | Значение |
|---|---|
| Method | `POST` |
| URL | `{{baseUrl}}/api/external/v2/courses/{{courseId}}/stages/{{stageId}}/scorm/{{scormId}}/upload` |
| Авторизация | Authorization: Bearer {bearer_token} |

**Пример тела запроса**

| Key | Type | Value/src |
|---|---|---|
| `` | `file` | `AJv6YmNeo/scorm.zip` |

**Пример ответа**

_В коллекции нет примера ответа._
