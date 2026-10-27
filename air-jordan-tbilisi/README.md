# Air Jordan Tbilisi — сайт

Статический сайт без сборки: Three.js (vendor/), собственный скролл-таймлайн.

- `index.html`, `styles.css` — разметка и стили
- `main.js` — скролл → сюжетная ось `s` (0–5), текст, карточки, интерфейс
- `scene.js` — 3D: Air Jordan 1 из 4 деталей (подошва, стелька, верх, шнурки), перекраска «волной», ключевые кадры камеры
- `sound.js` — звук на Web Audio (включается кнопкой)
- `assets/` — модель, расцветки, картинки карточек

Локально: `python3 -m http.server` в этой папке. `?review` — режим проверки без сглаживания.

3D-модели: Air Jordan 1 High — DeezVertz, Nike Dunk Low — kirilldrac78 (Sketchfab, CC BY 4.0), из открытого проекта Shoe Forge (hardikverma22/shoe-forge); расцветки изменены. Фото в assets/photos — из магазина.
