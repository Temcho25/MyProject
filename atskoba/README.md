# Atskoba (აწყობა) — сайт студии

3D/motion-сайт студии Atskoba с портфолио реальных проектов.

- `npm install` → `npm run dev` (локально) → `npm run build` (папка `dist/`).
- Стек: Vite, three.js (стеклянная скульптура, орбита экранов, спираль-шоурил), GSAP ScrollTrigger, Lenis.
- Проекты портфолио: `src/projects.js`. Скриншоты: `public/work/` (сняты с живых деплоев Vercel).
- Контакт для кнопки «Обсудить проект»: `CONTACT` в начале `src/main.js`.
- Тексты RU в `index.html`, EN в `src/i18n.js` (переключатель RU/EN в шапке).
- Раскадровка: `STORYBOARD.md`.

## Страницы и языки
- `index.html` — главная (герой, шоурил, 3 избранные работы, услуги, процесс, контакт).
- `portfolio/index.html` — все 20 работ с фильтрами.
- Языки: грузинский по умолчанию, RU и EN — переключатель в шапке (`?lang=ru|en`). Тексты: `src/i18n.js`, описания проектов — `src/projects.js`.
