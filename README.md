# Book Review Library v6

React + Vite проект: личная библиотека с отзывами о прочитанных книгах.

## Что есть

- книжные полки с кликабельными корешками;
- модальное окно с отзывом и обложкой;
- Supabase для хранения книг;
- Supabase Storage для загрузки обложек;
- админ-вход;
- добавление, редактирование и удаление книг;
- импорт JSON через ChatGPT;
- оценки по 10-балльной шкале;
- любимые книги;
- GitHub Actions для лёгкого запроса к Supabase несколько раз в неделю.

## Запуск

```bash
npm install
npm run dev
```

## .env

Создай файл `.env` в корне проекта:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ADMIN_EMAILS=your-email@example.com
```

После изменения `.env` перезапусти dev-сервер.

## Supabase

1. Создай проект Supabase.
2. Открой SQL Editor.
3. Вставь содержимое `supabase-setup.sql`.
4. Нажми Run.

Скрипт создаёт таблицу `books`, bucket `book-covers` и загружает стартовый список из 20 книг.

Важно: в SQL есть строка `delete from public.books;` — она удалит старые демо-книги и заменит их новым списком.

## Админка

После входа можно:

- добавить книгу;
- редактировать любую книгу;
- удалить книгу;
- заменить обложку;
- поставить или снять галочку «Любимая книга»;
- заполнить детальные оценки: сюжет, персонажи, стиль, концовка.

## GitHub Pages

Перед деплоем в `vite.config.js` можно указать base под название репозитория:

```js
base: '/book-review-library-v6/',
```

Потом:

```bash
npm run deploy
```

## GitHub Actions для Supabase

Файл уже лежит тут:

```txt
.github/workflows/wake-supabase.yml
```

В GitHub нужно добавить secrets:

```txt
SUPABASE_URL
SUPABASE_ANON_KEY
```
