// locations.js

const LOCATIONS = [
  {
    id: "bunker",
    title: "Гигантский Бункер",
    owner: "<span class='faction-link'>Название фракции</span>",
    icon: "icon/bunker-icon.png", // Путь к иконке бункера
    img: "images/bunker.jpg",
    coords: { x: 910, y: 440 },
    size: 32, 
    description: `
      <p>
        Это массивное подземное сооружение, построенное для защиты...
        Здесь можно добавить <span class="history-link">историческую ссылку</span>.
      </p>
    `
  },
  {
    id: "lab-exit",
    title: "Вход в лабораторию",
    owner: "<span class='faction-link'>Неизвестно / Заброшено</span>",
    icon: "icon/lab-icon.png", // Путь к иконке лаборатории
    img: "images/lab-exit.jpg",
    coords: { x: 644, y: 394 },
    size: 32,
    description: `
      <p>
        Тяжелые гермодвери, ведущие в старый лабораторный комплекс. 
        Металл давно покрылся ржавчиной, а системы безопасности обесточены. 
        Кто знает, что скрывается в глубине этих коридоров?
      </p>
    `
  }
];
