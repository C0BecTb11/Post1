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
    const subBtn = e.target.closest(".sub-faq-button, .sub-rule-button");
    if (subBtn) {
      playClick(); 
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
      return;
    }

    // В) Вкладки внутри раздела "Лор" (ИСТОРИЯ, ФРАКЦИИ, ПЕРСОНАЖИ, ЛОКАЦИИ)
    const loreBtn = e.target.closest(".lore-btn");
    if (loreBtn) {
      playClick();
      const category = loreBtn.dataset.category;
      loadLoreCategory(category);
      return;
    }

    // Г) Клик по конкретной карточке в сгенерированном Лоре (открываем модалку)
    const loreCard = e.target.closest(".lore-item-card");
    if (loreCard) {
      playClick();
      const id = loreCard.dataset.id;
      openLocationModal(id);
      return;
    }
  });
});

/* ==========================================================================
   1.5 ГЕНЕРАТОР РАЗДЕЛОВ ЛОРА
   ========================================================================== */
function loadLoreCategory(category) {
  const container = document.getElementById("lore-content-area");
  if (!container) return;
  container.innerHTML = ""; 

  // --- ЛОКАЦИИ ---
  if (category === "locations") {
    if (typeof LOCATIONS === "undefined" || LOCATIONS.length === 0) {
      container.innerHTML = "<p style='color: #ff4d4d; text-align: center;'>База локаций пуста или повреждена.</p>";
      return;
    }
    let html = '<h3 style="color: #fff; border-bottom: 1px solid #333; padding-bottom: 10px;">Известные территории:</h3><div class="lore-grid">';
    LOCATIONS.forEach(loc => {
      html += `<div class="info-block info-location lore-item-card" data-id="${loc.id}">
                 <h3 class="info-title" style="color: #00ffcc; margin-top: 0;">${loc.title}</h3>
                 <p class="info-text" style="font-size: 13px; color: #aaa; margin-bottom: 8px;">Владелец: ${loc.owner}</p>
                 <p class="info-text" style="margin: 0; font-size: 12px; color: #888;">Нажмите, чтобы открыть архив...</p>
               </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
  } 
  
  // --- ФРАКЦИИ ---
  else if (category === "factions") {
    if (typeof FACTIONS === "undefined" || FACTIONS.length === 0) {
      container.innerHTML = "<p style='color: #ff4d4d; text-align: center;'>Данные о фракциях недоступны.</p>";
      return;
    }
    let html = '<h3 style="color: #fff; border-bottom: 1px solid #333; padding-bottom: 10px;">Действующие группировки:</h3><div class="lore-grid">';
    FACTIONS.forEach(fac => {
      html += `<div class="info-block info-faction lore-item-card" data-id="${fac.id}">
                 <h3 class="info-title" style="color: #ff006e; margin-top: 0;">${fac.title}</h3>
                 <p class="info-text" style="margin: 0; font-size: 12px; color: #888;">Нажмите, чтобы открыть архив...</p>
               </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
  } 
  
  // --- ЗАГЛУШКА ДЛЯ ОСТАЛЬНОГО ---
  else {
    const names = { history: "История", characters: "Персонажи" };
    container.innerHTML = `<div class="warning-block" style="text-align: center;">Архивы категории «${names[category]}» засекречены.</div>`;
  }
}

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

let mStartX, mStartY;
let lastDist = 0;

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
  scale = Math.min(Math.max(scale + delta, 0.2), 5);

  posX = mouseX - mapX * scale;
  posY = mouseY - mapY * scale;

  limitPosition();
  updateMapTransform();
}, { passive: false });

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
    if (e.button !== 0) return; 
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
  let size = 30 / scale;
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
    icon.innerText = "☰";
  } else {
    icon.innerText = "✖";
  }
}

function drawLocations() {
  const layer = document.getElementById("layer-locations");
  if (!layer || typeof LOCATIONS === "undefined") return;

  layer.innerHTML = "";

  LOCATIONS.forEach(loc => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "image");
    icon.setAttributeNS("http://www.w3.org/1999/xlink", "href", loc.icon);

    const halfSize = loc.size / 2;
    icon.setAttribute("x", loc.coords.x - halfSize);
    icon.setAttribute("y", loc.coords.y - halfSize);
    
    icon.setAttribute("width", loc.size);
    icon.setAttribute("height", loc.size);

    icon.style.cursor = "pointer";
    icon.addEventListener("click", (e) => {
      e.stopPropagation();
      openLocationModal(loc.id);
    });

    layer.appendChild(icon);
  });
}

/* ==========================================================================
   4. МОДАЛЬНОЕ ОКНО, WIKI И УТИЛИТЫ
   ========================================================================== */
let modalHistory = []; // Массив для запоминания истории переходов

function openLocationModal(id, isBack = false) {
  // 1. Ищем ID в Локациях или Фракциях
  let data = null;
  if (typeof LOCATIONS !== "undefined") data = LOCATIONS.find(l => l.id === id);
  if (!data && typeof FACTIONS !== "undefined") data = FACTIONS.find(f => f.id === id);
  
  if (!data) return;

  const titleEl = document.getElementById("location-title");

  // 2. Если мы идем "вперед" (не нажимаем Назад), сохраняем ТЕКУЩУЮ карточку в историю
  if (!isBack && titleEl.dataset.currentId) {
    modalHistory.push(titleEl.dataset.currentId);
  }

  // 3. Заполняем данные
  titleEl.innerText = data.title;
  titleEl.dataset.currentId = id; // Запоминаем ID того, что сейчас открыли
  document.getElementById("location-owner").innerHTML = data.owner || "Неизвестно";
  
  // Умная проверка медиа (Видео или Фото)
  const imgEl = document.getElementById("location-img");
  const videoEl = document.getElementById("location-video");

  if (data.img && data.img.endsWith(".mp4")) {
    imgEl.classList.add("hidden");
    videoEl.src = data.img;
    videoEl.classList.remove("hidden");
    videoEl.play().catch(() => {});
  } else {
    videoEl.classList.add("hidden");
    videoEl.pause();
    imgEl.src = data.img || "images/placeholder.jpg"; // Заглушка, если фото нет
    imgEl.classList.remove("hidden");
  }

  document.getElementById("location-description").innerHTML = data.description;

  // 4. Управляем кнопкой "Назад"
  const backBtn = document.getElementById("modal-back-btn");
  if (modalHistory.length > 0) {
    backBtn.classList.remove("hidden");
  } else {
    backBtn.classList.add("hidden");
  }

  document.getElementById("location-modal").classList.remove("hidden");
}

function goBackModal() {
  if (modalHistory.length > 0) {
    const prevId = modalHistory.pop(); // Достаем последний ID
    openLocationModal(prevId, true); // Открываем его с флагом isBack = true
  }
}

function closeLocationModal() {
  document.getElementById("location-modal").classList.add("hidden");
  modalHistory = []; // Очищаем историю при закрытии
  document.getElementById("location-title").dataset.currentId = ""; // Сбрасываем текущий ID
  
  const videoEl = document.getElementById("location-video");
  if (videoEl) {
    videoEl.pause();
    videoEl.src = "";
  }
}

// 5. Глобальный слушатель для кликов по гиперссылкам внутри описаний
document.addEventListener("click", function(e) {
  if (e.target.classList.contains("lore-link")) {
    const targetId = e.target.dataset.id;
    openLocationModal(targetId);
  }
});

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

  const bluePoints = [ [775, 100], [816, 89], [900, 34], [882, 141], [854, 164], [804, 157], [772, 131] ];
  const bluePolygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  bluePolygon.setAttribute("points", bluePoints.map(p => `${p[0]},${p[1]}`).join(" "));
  bluePolygon.setAttribute("fill", "rgba(0, 102, 255, 0.35)");
  bluePolygon.setAttribute("stroke", "#0066ff");
  bluePolygon.setAttribute("stroke-width", "2");
  layer.appendChild(bluePolygon);

  const redPoints = [ [773, 142], [492, 379], [491, 435], [617, 493], [797, 536], [1019, 626], [1021, 347], [896, 320], [831, 233], [842, 168] ];
  const redPolygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  redPolygon.setAttribute("points", redPoints.map(p => `${p[0]},${p[1]}`).join(" "));
  redPolygon.setAttribute("fill", "rgba(255, 0, 0, 0.35)");
  redPolygon.setAttribute("stroke", "#ff0000");
  redPolygon.setAttribute("stroke-width", "2");
  layer.appendChild(redPolygon);

  const yellowPoints = [ [317, 693], [270, 723], [229, 793], [259, 848], [347, 941], [479, 822], [449, 724] ];
  const yellowPolygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  yellowPolygon.setAttribute("points", yellowPoints.map(p => `${p[0]},${p[1]}`).join(" "));
  yellowPolygon.setAttribute("fill", "rgba(255, 200, 0, 0.35)");
  yellowPolygon.setAttribute("stroke", "#ffc800");
  yellowPolygon.setAttribute("stroke-width", "2");
  layer.appendChild(yellowPolygon);

  const orangePoints = [ [42, 405], [108, 392], [139, 384], [166, 339], [198, 296], [236, 284], [128, 209], [62, 248], [37, 291], [24, 354], [8, 394] ];
  const orangePolygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
  orangePolygon.setAttribute("points", orangePoints.map(p => `${p[0]},${p[1]}`).join(" "));
  orangePolygon.setAttribute("fill", "rgba(255, 140, 0, 0.35)");
  orangePolygon.setAttribute("stroke", "#ff8c00");
  orangePolygon.setAttribute("stroke-width", "2");
  layer.appendChild(orangePolygon);
}
