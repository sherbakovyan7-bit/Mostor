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
