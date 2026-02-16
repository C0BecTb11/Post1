const clickSound = document.getElementById("click-sound");

function playClick() {
  if (!clickSound) return;
  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});
}

const container = document.getElementById('content-container');

document.addEventListener("click", function (e) {

  /* ===============================
     1️⃣ Главная навигация
  =============================== */

  const mainBtn = e.target.closest(".nav-button.main-nav");
  if (mainBtn) {

    playClick();

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
          return;
        }
        return res.text();
      })
      .then(html => {
        if (html) {
          faqContainer.innerHTML = html;

          // автоскролл
          setTimeout(() => {
            const rect = faqContainer.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const targetY = rect.top + scrollTop - 20;

            window.scrollTo({
              top: targetY,
              behavior: "smooth"
            });
          }, 150);
        }
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
          return;
        }
        return res.text();
      })
      .then(html => {
        if (html) ruleContainer.innerHTML = html;
      })
      .catch(err => {
        ruleContainer.innerHTML = `<p>Ошибка загрузки подраздела.</p>`;
        console.error(err);
      });

    return;
  }

});
