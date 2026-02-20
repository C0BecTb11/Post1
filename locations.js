// locations.js

const LOCATIONS = [
  {
    id: "bunker",
    title: "Гигантский Бункер",
    owner: "<span class='faction-link'>Название фракции</span>",
    img: "images/bunker.jpg",
    coords: { x: 910, y: 440 },
    size: 15, // px, диаметр
    description: `
      <p>
        Это массивное подземное сооружение, построенное для защиты...
        Здесь можно добавить <span class="history-link">историческую ссылку</span>.
      </p>
    `
  },

    // Вход в лабораторию ч
  {
    id: "lab-exit",
    title: "Вход в лабораторию",
    owner: "<span class='faction-link'>Неизвестно / Заброшено</span>",
    img: "images/lab-exit.jpg",
    coords: { x: 644, y: 394 },
    size: 15, // Размер точки (кружка) на карте
    description: `
      <p>
        Тяжелые гермодвери, ведущие в старый лабораторный комплекс. 
        Металл давно покрылся ржавчиной, а системы безопасности обесточены. 
        Кто знает, что скрывается в глубине этих коридоров?
      </p>
    `
  }
];
