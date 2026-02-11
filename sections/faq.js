// Проверяем, что контейнер существует
const faqPopup = document.getElementById('faq-popup');
const faqButtons = document.querySelectorAll('.faq-btn');

faqButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;

    switch(action) {
      case 'how-to-join':
        faqPopup.innerHTML = `<h3>Как вступить?</h3>
        <p>Для вступления необходимо заполнить анкету и дождаться одобрения модератора.</p>`;
        break;
      case 'char-template':
        faqPopup.innerHTML = `<h3>Шаблон анкеты персонажа</h3>
        <p>[Здесь будет форма или пример анкеты персонажа]</p>`;
        break;
      case 'faction-template':
        faqPopup.innerHTML = `<h3>Шаблон анкеты фракции</h3>
        <p>[Здесь будет форма или пример анкеты фракции]</p>`;
        break;
    }

    faqPopup.style.display = 'block';
    faqPopup.scrollIntoView({ behavior: 'smooth' });
  });
});
