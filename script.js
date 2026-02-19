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

      const container = document.getElementById('content-container');
      if (!container) return;

      const target = mainBtn.dataset.target;

      fetch(`sections/${target}.html`)
        .then(res => res.text())
        .then(html => {
          container.innerHTML = html;

          // 🔹 Если это карта — инициализируем её
if (target === "map") {
  setTimeout(() => {
    centerMap();
    initMapTouch();
    initMapClick();
    drawFactionTerritory();
    initLayerControls();
  }, 300);
}

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
   MAP SYSTEM
============================== */
let scale = 1;
let startDistance = 0;
let startScale = 1;

let posX = 0;
let posY = 0;
let startX = 0;
let startY = 0;

let isDragging = false;

function getMap() {
  return document.getElementById("map-container");
}

function getWrapper() {
  return document.querySelector(".map-wrapper");
}

function limitPosition() {
  const map = getMap();
  const wrapper = getWrapper();
  if (!map || !wrapper) return;

  const mapWidth = map.offsetWidth * scale;
  const mapHeight = map.offsetHeight * scale;

  const wrapperWidth = wrapper.offsetWidth;
  const wrapperHeight = wrapper.offsetHeight;

  const minX = Math.min(0, wrapperWidth - mapWidth);
  const minY = Math.min(0, wrapperHeight - mapHeight);

  posX = Math.max(minX, Math.min(0, posX));
  posY = Math.max(minY, Math.min(0, posY));
}

/* ===============================
   MAP AUTO CENTER
============================== */
function centerMap() {
  const map = getMap();
  const wrapper = getWrapper();
  if (!map || !wrapper) return;

  scale = 1;

  const mapWidth = map.offsetWidth;
  const mapHeight = map.offsetHeight;

  const wrapperWidth = wrapper.offsetWidth;
  const wrapperHeight = wrapper.offsetHeight;

  posX = (wrapperWidth - mapWidth) / 2;
  posY = (wrapperHeight - mapHeight) / 2;

  map.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;

  updateGrid();
}

/* ===============================
   MAP WHEEL ZOOM
============================== */
document.addEventListener("wheel", function (e) {
  const map = getMap();
  if (!map) return;

  e.preventDefault();

  if (e.deltaY < 0) scale += 0.1;
  else scale -= 0.1;

  scale = Math.min(Math.max(scale, 1), 5);

  limitPosition();
  updateGrid();

  map.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
}, { passive: false });

/* ===============================
   MAP TOUCH (PINCH + DRAG)
============================== */
function initMapTouch() {
  const wrapper = getWrapper();
  const map = getMap();
  if (!wrapper || !map) return;

  let initialDistance = null;

  wrapper.addEventListener("touchstart", function(e) {
    if (e.touches.length === 2) {
      initialDistance = getDistance(e.touches[0], e.touches[1]);
      startScale = scale;
    }
    if (e.touches.length === 1) {
      isDragging = true;
      startX = e.touches[0].clientX - posX;
      startY = e.touches[0].clientY - posY;
    }
  }, { passive: false });

  wrapper.addEventListener("touchmove", function(e) {
    const map = getMap();
    if (!map) return;

    if (e.touches.length === 2 && initialDistance) {
      e.preventDefault();
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      scale = startScale * (currentDistance / initialDistance);
      scale = Math.min(Math.max(scale, 1), 5);
      limitPosition();
      updateGrid();
    }

    if (e.touches.length === 1 && isDragging) {
      e.preventDefault();
      posX = e.touches[0].clientX - startX;
      posY = e.touches[0].clientY - startY;
      limitPosition();
    }

    map.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
  }, { passive: false });

  wrapper.addEventListener("touchend", function() {
    isDragging = false;
    initialDistance = null;
  });
}

/* ===============================
   MAP CLICK COORDINATES
============================== */
function initMapClick() {
  const wrapper = getWrapper();
  const map = getMap();
  const coordBox = document.getElementById("map-coordinates");
  if (!wrapper || !map || !coordBox) return;

  wrapper.addEventListener("click", function(e) {
    const rect = map.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / scale);
    const y = Math.round((e.clientY - rect.top) / scale);
    coordBox.innerText = `X: ${x} | Y: ${y}`;
  });
}

/* ===============================
   GRID LOD SYSTEM
============================== */
function updateGrid() {
  const grid = document.querySelector(".map-grid");
  if (!grid) return;

  let size = 30;
  if (scale >= 2) size = 15;   // деление на 4
  if (scale >= 3.5) size = 7.5; // ещё на 4

  grid.style.backgroundSize = `${size}px ${size}px`;
}

/* ===============================
   UTILS
============================== */
function getDistance(touch1, touch2) {
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  return Math.hypot(dx, dy);
}

/* ===============================
   FACTION TERRITORY
=============================== */

function drawFactionTerritory() {

  const layer = document.getElementById("layer-political");
  if (!layer) return;

  layer.innerHTML = "";

  const points = [
    [775, 100],
    [816, 89],
    [900, 34],
    [882, 141],
    [854, 164],
    [804, 157],
    [772, 131]
  ];

  const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");

  const pointString = points.map(p => `${p[0]},${p[1]}`).join(" ");

  polygon.setAttribute("points", pointString);
  polygon.setAttribute("fill", "rgba(0, 102, 255, 0.35)");
  polygon.setAttribute("stroke", "#0066ff");
  polygon.setAttribute("stroke-width", "2");

  layer.appendChild(polygon);
}

/* ===============================
   MAP LAYERS SYSTEM
=============================== */

function initLayerControls() {

  const buttons = document.querySelectorAll(".layer-btn");
  const political = document.getElementById("layer-political");
  const icons = document.getElementById("layer-icons");

  if (!buttons.length) return;

  buttons.forEach(btn => {

    btn.addEventListener("click", function() {

      buttons.forEach(b => b.classList.remove("active"));
      this.classList.add("active");

      const layer = this.dataset.layer;

      if (layer === "clean") {
        political.style.display = "none";
        icons.style.display = "none";
      }

      if (layer === "political") {
        political.style.display = "block";
        icons.style.display = "none";
      }

      if (layer === "icons") {
        political.style.display = "none";
        icons.style.display = "block";
      }

    });

  });

}
