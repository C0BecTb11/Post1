const buttons = document.querySelectorAll('.nav-button');
const container = document.getElementById('content-container');

buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.target;
    fetch(`sections/${target}.html`) // подгружаем отдельный файл
      .then(response => response.text())
      .then(html => {
        container.innerHTML = html;
      })
      .catch(err => {
        container.innerHTML = `<p>Ошибка загрузки раздела: ${err}</p>`;
      });
  });
});

document.addEventListener("click", function (e) {

  const btn = e.target.closest(".sub-faq-button");
  if (!btn) return;

  const faqContainer = document.getElementById("sub-faq-container");
  if (!faqContainer) return;

  const target = btn.dataset.target;

  fetch(`sections/faq-${target}.html`)
    .then(res => {
      if (!res.ok) {
        faqContainer.innerHTML = `<p>Контент пока не готов.</p>`;
        return;
      }
      return res.text();
    })
    .then(html => {
      if (html) faqContainer.innerHTML = html;
    })
    .catch(err => {
      faqContainer.innerHTML = `<p>Ошибка загрузки подраздела.</p>`;
      console.error(err);
    });

});
