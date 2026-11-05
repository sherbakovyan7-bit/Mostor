# Mostor

Рабочий MVP социальной сети: лента и публикация локальных фото/видео, видеохостинг-интерфейс, мини-игра, сообщения, профиль и адаптивный дизайн.

## Команды

```bash
npm run dev
npm run build
npm run build:exe
npx cap add android
npm run build:apk
```

Собранный веб находится в `dist`, Windows-установщик в `release`, debug APK в `android/app/build/outputs/apk/debug`.

Текущая версия является клиентским MVP и хранит новые данные только до перезагрузки. Для реальной публичной сети необходимы backend, база данных, авторизация, объектное хранилище, обработка видео и moderation API.

## Firebase

Регистрация и общая лента используют Firebase Authentication и Firestore.

1. В Firebase Console откройте `Build -> Authentication -> Sign-in method` и включите `Email/Password`.
2. Откройте `Build -> Firestore Database`, создайте базу данных.
3. В разделе Firestore `Rules` вставьте содержимое `firestore.rules` и нажмите `Publish`.
4. На бесплатном тарифе вложения до 600 КБ сохраняются прямо в Firestore. Firebase Storage не требуется.

После этого зарегистрированные пользователи видят общую ленту на всех устройствах.

## Звонки между разными сетями

WebRTC использует STUN для прямого соединения. Быстрый интернет сам по себе не гарантирует звонок: мобильные операторы и некоторые маршрутизаторы блокируют прямой маршрут. В таком случае необходим TURN-сервер. Пример переменных окружения — в `.env.example`. Для локального запуска создайте `.env.local` с временными TURN-учётными данными. Для GitHub Pages задайте переменные репозитория `MOSTOR_TURN_URL`, `MOSTOR_TURN_USERNAME`, `MOSTOR_TURN_CREDENTIAL` (Settings → Secrets and variables → Actions → Variables) и повторно запустите Pages workflow. Переменные `VITE_*` попадают в публичный JavaScript, поэтому используйте только краткоживущие credentials, выдаваемые TURN-сервисом, а не постоянный секрет сервера.
