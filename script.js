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
