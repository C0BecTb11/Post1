document.addEventListener("DOMContentLoaded", function () {

  console.log("JS загружен");

  function playClick() {
    const clickSound = document.getElementById("click-sound");
    if (!clickSound) return;

    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
  }

  document.addEventListener("click", function (e) {

    /* ===============================
       1️⃣ Главная навигация
    =============================== */

    const mainBtn = e.target.closest(".nav-button.main-nav");
    if (mainBtn) {

      playClick();

      const container = document.getElementById("content-container");
      if (!container) return;

      const target = mainBtn.dataset.target;

      fetch(`sections/${target}.html`)
        .then(res => res.text())
        .then(html => {
          container.innerHTML = html;
        })
        .catch(err => {
          container.innerHTML = `<p>Ошибка загрузки раздела.</p>`;
          console.error(err);
        });

      return;
    }

    /* ===============================
       2️⃣ Подразделы FAQ
    =============================== */

    const faqBtn = e.target.closest(".sub-faq-button");
    if (faqBtn) {

      playClick();

      const faqContainer = document.getElementById("sub-faq-container");
      if (!faqContainer) return;

      const target = faqBtn.dataset.target;

      fetch(`sections/faq-${target}.html`)
        .then(res => {
          if (!res.ok) {
            faqContainer.innerHTML = `<p>Контент пока не готов.</p>`;
            return null;
          }
          return res.text();
        })
        .then(html => {
          if (!html) return;

          faqContainer.innerHTML = html;

          setTimeout(() => {
            const rect = faqContainer.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const targetY = rect.top + scrollTop - 20;

            window.scrollTo({
              top: targetY,
              behavior: "smooth"
            });
          }, 100);
        })
        .catch(err => {
          faqContainer.innerHTML = `<p>Ошибка загрузки подраздела.</p>`;
          console.error(err);
        });

      return;
    }

    /* ===============================
       3️⃣ Подразделы правил
    =============================== */

    const ruleBtn = e.target.closest(".sub-rule-button");
    if (ruleBtn) {

      playClick();

      const ruleContainer = document.getElementById("sub-rules-container");
      if (!ruleContainer) return;

      const target = ruleBtn.dataset.target;

      fetch(`sections/rules-${target}.html`)
        .then(res => {
          if (!res.ok) {
            ruleContainer.innerHTML = `<p>Контент пока не готов.</p>`;
            return null;
          }
          return res.text();
        })
        .then(html => {
          if (!html) return;

          ruleContainer.innerHTML = html;

          setTimeout(() => {
            const rect = ruleContainer.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const targetY = rect.top + scrollTop - 20;

            window.scrollTo({
              top: targetY,
              behavior: "smooth"
            });
          }, 100);
        })
        .catch(err => {
          ruleContainer.innerHTML = `<p>Ошибка загрузки подраздела.</p>`;
          console.error(err);
        });

      return;
    }

  });

});

/* ===============================
   MAP ZOOM
=============================== */

let currentScale = 1;

document.addEventListener("wheel", function (e) {

  const mapContainer = document.getElementById("map-container");
  if (!mapContainer) return;

  e.preventDefault();

  if (e.deltaY < 0) {
    currentScale += 0.1;
  } else {
    currentScale -= 0.1;
  }

  currentScale = Math.min(Math.max(currentScale, 0.5), 3);

  mapContainer.style.transform = `scale(${currentScale})`;

}, { passive: false });

/* ===============================
   MAP TOUCH CONTROL (MOBILE)
=============================== */

let scale = 1;
let startDistance = 0;
let startScale = 1;
let posX = 0;
let posY = 0;
let startX = 0;
let startY = 0;
let isDragging = false;

document.addEventListener("touchstart", function (e) {

  const map = document.getElementById("map-container");
  if (!map) return;

  if (e.touches.length === 2) {
    // pinch start
    startDistance = getDistance(e.touches[0], e.touches[1]);
    startScale = scale;
  }

  if (e.touches.length === 1) {
    // drag start
    isDragging = true;
    startX = e.touches[0].clientX - posX;
    startY = e.touches[0].clientY - posY;
  }

}, { passive: false });


document.addEventListener("touchmove", function (e) {

  const map = document.getElementById("map-container");
  if (!map) return;

  e.preventDefault();

  if (e.touches.length === 2) {
    // pinch zoom
    const newDistance = getDistance(e.touches[0], e.touches[1]);
    scale = startScale * (newDistance / startDistance);

    scale = Math.min(Math.max(scale, 0.5), 4);

    map.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
  }

  if (e.touches.length === 1 && isDragging) {
    posX = e.touches[0].clientX - startX;
    posY = e.touches[0].clientY - startY;

    map.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
  }

}, { passive: false });


document.addEventListener("touchend", function () {
  isDragging = false;
});


function getDistance(touch1, touch2) {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}
