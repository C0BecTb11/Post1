/* ==========================================================================
   1. ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И НАВИГАЦИЯ
   ========================================================================== */
let scale = 1;
let posX = 0;
let posY = 0;
let isDragging = false;

document.addEventListener("DOMContentLoaded", function () {
  console.log("Система Лиорема запущена");

  function playClick() {
    const clickSound = document.getElementById("click-sound");
    if (clickSound) {
      clickSound.currentTime = 0;
      clickSound.play().catch(() => {});
    }
  }

  // Единый обработчик кликов для всего сайта
  document.addEventListener("click", function (e) {
    
    // А) Главные разделы (Лор, Карта и т.д.)
    const mainBtn = e.target.closest(".nav-button.main-nav");
    if (mainBtn) {
      playClick();
      const target = mainBtn.dataset.target;
      fetch(`sections/${target}.html`)
        .then(res => res.text())
        .then(html => {
          document.getElementById('content-container').innerHTML = html;
          if (target === "map") {
            // Инициализация карты после загрузки HTML
            setTimeout(() => {
              centerMap();
              initMapTouch(); // Для телефонов
              initMapMouse(); // Для ПК
              initMapClick();
              drawFactionTerritory();
              initLayerControls();
              drawLocations();
            }, 100);
          }
        });
      return;
    }

    // Б) Подразделы (FAQ и Правила)
    // Теперь один код обрабатывает и правила, и FAQ
    const subBtn = e.target.closest(".sub-faq-button, .sub-rule-button");
    if (subBtn) {
      playClick(); // если нужно звук
      const isFaq = subBtn.classList.contains("sub-faq-button");
      const containerId = isFaq ? "sub-faq-container" : "sub-rules-container";
      const prefix = isFaq ? "faq" : "rules";
      const container = document.getElementById(containerId);

      fetch(`sections/${prefix}-${subBtn.dataset.target}.html`)
        .then(res => res.ok ? res.text() : "<p>Контент в разработке...</p>")
        .then(html => {
          container.innerHTML = html;
          container.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }
  });
});

/* ==========================================================================
   2. ДВИЖОК КАРТЫ (ЗУМ И ПЕРЕМЕЩЕНИЕ)
   ========================================================================== */
function getMap() { return document.getElementById("map-container"); }
function getWrapper() { return document.querySelector(".map-wrapper"); }

function updateMapTransform() {
  const map = getMap();
  if (map) map.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
  updateGrid();
}

function limitPosition() {
  const map = getMap();
  const wrapper = getWrapper();
  if (!map || !wrapper) return;

  const wW = wrapper.offsetWidth;
  const wH = wrapper.offsetHeight;
  const sW = map.offsetWidth * scale;
  const sH = map.offsetHeight * scale;

  if (sW <= wW) posX = (wW - sW) / 2;
  else {
    if (posX > 0) posX = 0;
    if (posX < wW - sW) posX = wW - sW;
  }

  if (sH <= wH) posY = (wH - sH) / 2;
  else {
    if (posY > 0) posY = 0;
    if (posY < wH - sH) posY = wH - sH;
  }
}

// Глобальные переменные для перемещения
let mStartX, mStartY;
let lastDist = 0;

// Зум колесиком (Глобальный, работает только если мы над картой)
document.addEventListener("wheel", function (e) {
  const wrapper = getWrapper();
  if (!wrapper || !wrapper.contains(e.target)) return;

  e.preventDefault();
  const rect = wrapper.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const mapX = (mouseX - posX) / scale;
  const mapY = (mouseY - posY) / scale;

  const delta = e.deltaY > 0 ? -0.2 : 0.2;
  const oldScale = scale;
  scale = Math.min(Math.max(scale + delta, 0.2), 5);

  posX = mouseX - mapX * scale;
  posY = mouseY - mapY * scale;

  limitPosition();
  updateMapTransform();
}, { passive: false });

// ОБРАБОТЧИКИ ДВИЖЕНИЯ (Вынесены из функций инициализации)
window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  posX = e.clientX - mStartX;
  posY = e.clientY - mStartY;
  limitPosition();
  updateMapTransform();
});

window.addEventListener("mouseup", () => {
  isDragging = false;
  const wrapper = getWrapper();
  if (wrapper) wrapper.style.cursor = "grab";
});

function initMapMouse() {
  const wrapper = getWrapper();
  if (!wrapper) return;

  wrapper.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return; // Только левая кнопка
    isDragging = true;
    mStartX = e.clientX - posX;
    mStartY = e.clientY - posY;
    wrapper.style.cursor = "grabbing";
  });
}

function initMapTouch() {
  const wrapper = getWrapper();
  if (!wrapper) return;

  wrapper.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      const touch = e.touches[0];
      mStartX = touch.clientX - posX;
      mStartY = touch.clientY - posY;
    } else if (e.touches.length === 2) {
      lastDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    }
  }, { passive: false });

  wrapper.addEventListener("touchmove", (e) => {
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      posX = touch.clientX - mStartX;
      posY = touch.clientY - mStartY;
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const zoom = dist / lastDist;
      scale = Math.min(Math.max(scale * zoom, 0.2), 5);
      lastDist = dist;
    }
    limitPosition();
    updateMapTransform();
  }, { passive: false });

  wrapper.addEventListener("touchend", () => { isDragging = false; });
}

/* ==========================================================================
   3. ОТОБРАЖЕНИЕ ОБЪЕКТОВ И СЛОЕВ
   ========================================================================== */
function centerMap() {
  scale = 0.5;
  limitPosition(); 
  updateMapTransform();
}

function updateGrid() {
  const grid = document.querySelector(".map-grid");
  if (!grid) return;
  let size = 30 / scale; // Сетка масштабируется вместе с картой
  grid.style.backgroundSize = `${size}px ${size}px`;
}

function initLayerControls() {
  const checkboxes = document.querySelectorAll(".map-layers-panel input");
  checkboxes.forEach(box => {
    const layer = document.getElementById("layer-" + box.dataset.layer);
    if (layer) layer.style.display = box.checked ? "block" : "none";
    
    box.addEventListener("change", function() {
      const targetLayer = document.getElementById("layer-" + this.dataset.layer);
      if (targetLayer) targetLayer.style.display = this.checked ? "block" : "none";
    });
  });
}

function toggleLayersPanel() {
  const panel = document.getElementById("layers-panel");
  const icon = document.getElementById("toggle-icon");
  if (!panel || !icon) return;

  panel.classList.toggle("collapsed");

  if (panel.classList.contains("collapsed")) {
    icon.innerText = "☰"; // Иконка меню, когда закрыто
  } else {
    icon.innerText = "✖"; // Крестик, когда открыто
  }
}

function drawLocations() {
  const layer = document.getElementById("layer-locations");
  // Проверка на существование слоя и массива данных
  if (!layer || typeof LOCATIONS === "undefined") return;

  layer.innerHTML = ""; // Очищаем слой перед отрисовкой

  LOCATIONS.forEach(loc => {
    // Создаем элемент image для SVG
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "image");

    // Указываем путь к PNG (используем href)
    icon.setAttributeNS("http://www.w3.org/1999/xlink", "href", loc.icon);

    // Центрируем иконку: координаты минус половина размера
    const halfSize = loc.size / 2;
    icon.setAttribute("x", loc.coords.x - halfSize);
    icon.setAttribute("y", loc.coords.y - halfSize);
    
    // Устанавливаем размер
    icon.setAttribute("width", loc.size);
    icon.setAttribute("height", loc.size);

    // Стили и клик
    icon.style.cursor = "pointer";
    icon.addEventListener("click", (e) => {
      e.stopPropagation(); // Чтобы клик не ушел на саму карту
      openLocationModal(loc.id);
    });

    layer.appendChild(icon);
  });
}

/* ==========================================================================
   4. МОДАЛЬНОЕ ОКНО И УТИЛИТЫ
   ========================================================================== */
function openLocationModal(id) {
  const loc = LOCATIONS.find(l => l.id === id);
  if (!loc) return;

  document.getElementById("location-title").innerText = loc.title;
  document.getElementById("location-owner").innerHTML = loc.owner;
  document.getElementById("location-img").src = loc.img;
  document.getElementById("location-description").innerHTML = loc.description;
  document.getElementById("location-modal").classList.remove("hidden");
}

function closeLocationModal() {
  document.getElementById("location-modal").classList.add("hidden");
}

function initMapClick() {
  const map = getMap();
  const coordBox = document.getElementById("map-coordinates");
  if (!map || !coordBox) return;

  map.addEventListener("click", function(e) {
    const rect = map.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / scale);
    const y = Math.round((e.clientY - rect.top) / scale);
    coordBox.innerText = `X: ${x} | Y: ${y}`;
  });
}

/* ===============================
   FACTION TERRITORY
=============================== */

function drawFactionTerritory() {

  const layer = document.getElementById("layer-political");
  if (!layer) return;

  layer.innerHTML = "";

  /* ===============================
     1️⃣ СИНЯЯ ТЕРРИТОРИЯ
  =============================== */

  const bluePoints = [
    [775, 100],
    [816, 89],
    [900, 34],
    [882, 141],
    [854, 164],
    [804, 157],
    [772, 131]
  ];

  const bluePolygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");

  bluePolygon.setAttribute(
    "points",
    bluePoints.map(p => `${p[0]},${p[1]}`).join(" ")
  );

  bluePolygon.setAttribute("fill", "rgba(0, 102, 255, 0.35)");
  bluePolygon.setAttribute("stroke", "#0066ff");
  bluePolygon.setAttribute("stroke-width", "2");

  layer.appendChild(bluePolygon);


  /* ===============================
     2️⃣ КРАСНАЯ ТЕРРИТОРИЯ
  =============================== */

  const redPoints = [
    [773, 142],
    [492, 379],
    [491, 435],
    [617, 493],
    [797, 536],
    [1019, 626],
    [1021, 347],
    [896, 320],
    [831, 233],
    [842, 168]
  ];

  const redPolygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");

  redPolygon.setAttribute(
    "points",
    redPoints.map(p => `${p[0]},${p[1]}`).join(" ")
  );

  redPolygon.setAttribute("fill", "rgba(255, 0, 0, 0.35)");
  redPolygon.setAttribute("stroke", "#ff0000");
  redPolygon.setAttribute("stroke-width", "2");

  layer.appendChild(redPolygon);

  /* ===============================
   3️⃣ ЖЁЛТАЯ ТЕРРИТОРИЯ
=============================== */

const yellowPoints = [
  [317, 693],
  [270, 723],
  [229, 793],
  [259, 848],
  [347, 941],
  [479, 822],
  [449, 724]
];

const yellowPolygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");

yellowPolygon.setAttribute(
  "points",
  yellowPoints.map(p => `${p[0]},${p[1]}`).join(" ")
);

yellowPolygon.setAttribute("fill", "rgba(255, 200, 0, 0.35)");
yellowPolygon.setAttribute("stroke", "#ffc800");
yellowPolygon.setAttribute("stroke-width", "2");

layer.appendChild(yellowPolygon);

  /* ===============================
     4️⃣ ОРАНЖЕВАЯ ТЕРРИТОРИЯ
  =============================== */

  const orangePoints = [
    [42, 405],
    [108, 392],
    [139, 384],
    [166, 339],
    [198, 296],
    [236, 284],
    [128, 209],
    [62, 248],
    [37, 291],
    [24, 354],
    [8, 394]
  ];

  const orangePolygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");

  orangePolygon.setAttribute(
    "points",
    orangePoints.map(p => `${p[0]},${p[1]}`).join(" ")
  );

  // Оранжевый цвет с прозрачностью 0.35 и яркой обводкой
  orangePolygon.setAttribute("fill", "rgba(255, 140, 0, 0.35)");
  orangePolygon.setAttribute("stroke", "#ff8c00");
  orangePolygon.setAttribute("stroke-width", "2");

  layer.appendChild(orangePolygon);
}
