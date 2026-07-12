/**
 * =============================================================================
 *                   МОДУЛЬ ЛИДЕРБОРДА (ТАБЛИЦЫ РЕКОРДОВ)
 * =============================================================================
 *
 * Этот файл реализует полноценную систему лидерборда для игры на чистом
 * HTML/CSS/JS, предназначенной для публикации на Яндекс Игры.
 *
 * =============================================================================
 * АРХИТЕКТУРА МОДУЛЯ
 * =============================================================================
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  Leaderboard (главный класс)                                    │
 * ├─────────────────────────────────────────────────────────────────┤
 * │  - Хранит рекорды игроков в localStorage                       │
 * │  - Генерирует случайных ботов с реалистичными именами и фото    │
 * │  - Создаёт и управляет DOM-элементами таблицы                  │
 * │  - Показывает анимацию "Новый рекорд!"                         │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * =============================================================================
 * СТРУКТУРА ДАННЫХ (как всё хранится в localStorage)
 * =============================================================================
 *
 *  Ключ                    │  Значение
 * ─────────────────────────┼─────────────────────────────────────────────────
 *  "ldb_bestScore"         │  Число — лучший счёт текущего игрока
 *  "ldb_playerName"        │  Строка — имя игрока (спрашивается один раз)
 *  "ldb_scores"            │  JSON-массив из 50+ записей {name, score, date}
 * ─────────────────────────┴─────────────────────────────────────────────────
 *
 * =============================================================================
 * ИСПОЛЬЗОВАНИЕ В ИГРЕ
 * =============================================================================
 *
 *  1. Инициализация:         const lb = new Leaderboard();
 *
 *  2. Сохранить результат:   lb.saveScore(1500);
 *                            // Вернёт объект { isNewBest: true/false, rank: 3 }
 *
 *  3. Показать таблицу:      lb.show();
 *
 *  4. Скрыть таблицу:        lb.hide();
 *
 *  5. Получить данные для своей отрисовки:   lb.getLeaderboardData();
 *                            // Вернёт массив записей, отсортированных по убыванию
 *
 * =============================================================================
 */

/**
 * =============================================================================
 *                    СПИСОК ИМЁН БОТОВ (84 персонажа)
 * =============================================================================
 *
 * Эти имена взяты из оригинального проекта Ball Blast.
 * Для каждого бота можно задать путь к аватарке (фото).
 * Если фото не нужно — оставьте строку пустой, будет показана иконка по умолчанию.
 *
 * 💡 СОВЕТ: Если хотите использовать свои изображения, положите их в папку
 *    assets/bots/ и укажите пути ниже.
 */
const BOT_NAMES = [
  { name: "aidan",    img: "./assets/bots/aidan.jpg" },
  { name: "aina",     img: "./assets/bots/aina.jpg" },
  { name: "akhmad",   img: "./assets/bots/akhmad.jpg" },
  { name: "alfred",   img: "./assets/bots/alfred.jpg" },
  { name: "alikhan",  img: "./assets/bots/alikhan.jpg" },
  { name: "andrea",   img: "./assets/bots/andrea.jpg" },
  { name: "anna",     img: "./assets/bots/anna.jpg" },
  { name: "ariane",   img: "./assets/bots/ariane.jpg" },
  { name: "bruno",    img: "./assets/bots/bruno.jpg" },
  { name: "carlos",   img: "./assets/bots/carlos.jpg" },
  { name: "carol",    img: "./assets/bots/carol.jpg" },
  { name: "chico",    img: "./assets/bots/chico.jpg" },
  { name: "chloe",    img: "./assets/bots/chloe.jpg" },
  { name: "christine",img: "./assets/bots/christine.jpg" },
  { name: "chyou",    img: "./assets/bots/chyou.jpg" },
  { name: "daniel",   img: "./assets/bots/daniel.jpg" },
  { name: "danielle", img: "./assets/bots/danielle.jpg" },
  { name: "elena",    img: "./assets/bots/elena.jpg" },
  { name: "elliot",   img: "./assets/bots/elliot.jpg" },
  { name: "enrique",  img: "./assets/bots/enrique.jpg" },
  { name: "ernst",    img: "./assets/bots/ernst.jpg" },
  { name: "eskil",    img: "./assets/bots/eskil.jpg" },
  { name: "eva",      img: "./assets/bots/eva.jpg" },
  { name: "evie",     img: "./assets/bots/evie.jpg" },
  { name: "gina",     img: "./assets/bots/gina.jpg" },
  { name: "gloria",   img: "./assets/bots/gloria.jpg" },
  { name: "gonzalo",  img: "./assets/bots/gonzalo.jpg" },
  { name: "hamed",    img: "./assets/bots/hamed.jpg" },
  { name: "harriet",  img: "./assets/bots/harriet.jpg" },
  { name: "isaac",    img: "./assets/bots/isaac.jpg" },
  { name: "joao",     img: "./assets/bots/joao.jpg" },
  { name: "johanna",  img: "./assets/bots/johanna.jpg" },
  { name: "julia",    img: "./assets/bots/julia.jpg" },
  { name: "julie",    img: "./assets/bots/julie.jpg" },
  { name: "justino",  img: "./assets/bots/justino.jpg" },
  { name: "kate",     img: "./assets/bots/kate.jpg" },
  { name: "kweku",    img: "./assets/bots/kweku.jpg" },
  { name: "lana",     img: "./assets/bots/lana.jpg" },
  { name: "leandro",  img: "./assets/bots/leandro.jpg" },
  { name: "lei",      img: "./assets/bots/lei.jpg" },
  { name: "leo",      img: "./assets/bots/leo.jpg" },
  { name: "li",       img: "./assets/bots/li.jpg" },
  { name: "liliana",  img: "./assets/bots/liliana.jpg" },
  { name: "lindsey",  img: "./assets/bots/lindsey.jpg" },
  { name: "lisa",     img: "./assets/bots/lisa.jpg" },
  { name: "lucienne", img: "./assets/bots/lucienne.jpg" },
  { name: "marcelo",  img: "./assets/bots/marcelo.jpg" },
  { name: "margot",   img: "./assets/bots/margot.jpg" },
  { name: "matilda",  img: "./assets/bots/matilda.jpg" },
  { name: "mirko",    img: "./assets/bots/mirko.jpg" },
  { name: "mohammad", img: "./assets/bots/mohammad.jpg" },
  { name: "nicoleta", img: "./assets/bots/nicoleta.jpg" },
  { name: "nicomedes",img: "./assets/bots/nicomedes.jpg" },
  { name: "olga",     img: "./assets/bots/olga.jpg" },
  { name: "olivia",   img: "./assets/bots/olivia.jpg" },
  { name: "osmaro",   img: "./assets/bots/osmaro.jpg" },
  { name: "paul",     img: "./assets/bots/paul.jpg" },
  { name: "paula",    img: "./assets/bots/paula.jpg" },
  { name: "pratibha", img: "./assets/bots/pratibha.jpg" },
  { name: "richard",  img: "./assets/bots/richard.jpg" },
  { name: "ridwan",   img: "./assets/bots/ridwan.jpg" },
  { name: "rizvan",   img: "./assets/bots/rizvan.jpg" },
  { name: "rudolf",   img: "./assets/bots/rudolf.jpg" },
  { name: "shamil",   img: "./assets/bots/shamil.jpg" },
  { name: "sienna",   img: "./assets/bots/sienna.jpg" },
  { name: "sophia",   img: "./assets/bots/sophia.jpg" },
  { name: "sophie",   img: "./assets/bots/sophie.jpg" },
  { name: "tamiko",   img: "./assets/bots/tamiko.jpg" },
  { name: "telman",   img: "./assets/bots/telman.jpg" },
  { name: "thi",      img: "./assets/bots/thi.jpg" },
  { name: "timea",    img: "./assets/bots/timea.jpg" },
  { name: "vanessa",  img: "./assets/bots/vanessa.jpg" },
  { name: "victoria", img: "./assets/bots/victoria.jpg" },
  { name: "wafiyah",  img: "./assets/bots/wafiyah.jpg" },
  { name: "william",  img: "./assets/bots/william.jpg" },
  { name: "xiu",      img: "./assets/bots/xiu.jpg" },
  { name: "yasaman",  img: "./assets/bots/yasaman.jpg" },
  { name: "zara",     img: "./assets/bots/zara.jpg" },
  { name: "zef",      img: "./assets/bots/zef.jpg" },
  { name: "zoe",      img: "./assets/bots/zoe.jpg" }
];

/**
 * =============================================================================
 *                    ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
 * =============================================================================
 */

/**
 * Перемешивает массив случайным образом (алгоритм Фишера-Йетса).
 * Используется для того, чтобы боты появлялись в разном порядке.
 *
 * @param {Array} array - массив для перемешивания
 * @returns {Array} - тот же массив, но с перемешанными элементами
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    // Выбираем случайный индекс от 0 до i
    const j = Math.floor(Math.random() * (i + 1));
    // Меняем местами элементы на позициях i и j
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Форматирует число с разделителями тысяч.
 * Например: 1234567 → "1 234 567"
 *
 * @param {number} num - число для форматирования
 * @returns {string} - отформатированная строка
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/**
 * =============================================================================
 *                    ГЛАВНЫЙ КЛАСС ЛИДЕРБОРДА
 * =============================================================================
 */
class Leaderboard {
  /**
   * @param {Object} [options] - настройки лидерборда
   * @param {number} [options.maxEntries=50] - сколько всего записей хранить
   * @param {number} [options.displayCount=10] - сколько записей показывать в таблице
   * @param {number} [options.botCount=50] - сколько ботов генерировать
   * @param {string} [options.storagePrefix="ldb_"] - префикс для ключей localStorage
   * @param {string} [options.containerId="leaderboard-container"] - ID контейнера
   */
  constructor(options = {}) {
    // ─── Настройки ──────────────────────────────────────────────────────────
    this.maxEntries = options.maxEntries || 50;     // Сколько всего записей хранить
    this.displayCount = options.displayCount || 10;  // Сколько показывать в таблице
    this.botCount = options.botCount || 50;          // Количество ботов
    this.storagePrefix = options.storagePrefix || "ldb_";
    this.containerId = options.containerId || "leaderboard-container";

    // ─── Внутреннее состояние ───────────────────────────────────────────────
    this._scores = [];       // Массив всех записей (боты + игрок)
    this._playerName = "Вы"; // Имя текущего игрока (по умолчанию)
    this._playerScore = 0;   // Текущий рекорд игрока
    this._initialized = false; // Флаг инициализации

    // Привязываем методы к контексту, чтобы их можно было использовать
    // как обработчики событий без потери this
    this.saveScore = this.saveScore.bind(this);
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);

    // Запускаем инициализацию
    this._init();
  }

  // ═════════════════════════════════════════════════════════════════════════
  //                     ПРИВАТНЫЕ МЕТОДЫ (инициализация)
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Инициализация лидерборда:
   *   1. Загружаем данные из localStorage
   *   2. Генерируем ботов (если ещё не сгенерированы)
   *   3. Создаём DOM-элемент таблицы (если есть контейнер на странице)
   *
   * @private
   */
  _init() {
    // Загружаем рекорд игрока
    this._playerScore = this._loadData("bestScore", 0);
    // Загружаем имя игрока (или спрашиваем)
    this._playerName = this._loadData("playerName", "");

    // Загружаем все записи из localStorage
    this._scores = this._loadData("scores", []);

    // Если записей нет — генерируем ботов
    if (this._scores.length === 0) {
      this._generateBots();
    }

    // Обновляем запись игрока (если есть рекорд)
    this._updatePlayerEntry();

    // Создаём DOM-структуру, если контейнер существует
    this._createDOM();

    this._initialized = true;
    console.log("[Leaderboard] Инициализирован. Записей:", this._scores.length);
  }

  /**
   * Генерирует массив ботов со случайными очками.
   * Каждый бот получает случайное имя из списка BOT_NAMES.
   *
   * Очки распределяются так, чтобы они выглядели правдоподобно:
   *   - Большинство ботов имеют очки в диапазоне 50–5000
   *   - Некоторые "топовые" боты могут иметь >10000
   *
   * @private
   */
  _generateBots() {
    console.log("[Leaderboard] Генерирую ботов...");

    // Перемешиваем список имён, чтобы каждый раз был разный порядок
    const shuffledNames = shuffleArray([...BOT_NAMES]);

    // Берём нужное количество имён
    const namesToUse = shuffledNames.slice(0, this.botCount);

    // Для каждого имени создаём запись
    const bots = namesToUse.map((botData) => {
      // Генерируем случайные очки по экспоненциальному распределению:
      //   - Math.random() даёт 0..1
      //   - Возводим в квадрат, чтобы сместить в сторону меньших значений
      //   - Умножаем на 15000 (максимум)
      //   - Прибавляем 50 (минимум)
      // В итоге: большинство ботов получат 50–5000, некоторые >10000
      const rawScore = Math.random() * Math.random() * 15000 + 50;
      const score = Math.floor(rawScore);

      return {
        name: botData.name.charAt(0).toUpperCase() + botData.name.slice(1),
        avatar: botData.img,
        score: score,
        date: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), // случайная дата за последние 30 дней
        isPlayer: false,
        isBot: true
      };
    });

    // Сортируем по убыванию очков
    bots.sort((a, b) => b.score - a.score);

    this._scores = bots;

    // Сохраняем в localStorage
    this._saveData("scores", this._scores);
  }

  /**
   * Обновляет или добавляет запись текущего игрока в таблицу.
   * Если у игрока есть рекорд — он вставляется на своё место по очкам.
   *
   * @private
   */
  _updatePlayerEntry() {
    // Удаляем старую запись игрока (если есть)
    this._scores = this._scores.filter(entry => !entry.isPlayer);

    // Если есть рекорд — добавляем
    if (this._playerScore > 0) {
      this._scores.push({
        name: this._playerName || "Вы",
        avatar: "", // Игрок без аватарки (будет показана иконка)
        score: this._playerScore,
        date: Date.now(),
        isPlayer: true,
        isBot: false
      });
    }

    // Сортируем по убыванию очков
    this._scores.sort((a, b) => b.score - a.score);

    // Ограничиваем количество записей
    if (this._scores.length > this.maxEntries) {
      this._scores = this._scores.slice(0, this.maxEntries);
    }

    // Сохраняем
    this._saveData("scores", this._scores);
  }

  // ═════════════════════════════════════════════════════════════════════════
  //                     РАБОТА С ХРАНИЛИЩЕМ (localStorage)
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Загружает значение из localStorage по ключу с префиксом.
   *
   * @param {string} key - имя ключа (без префикса)
   * @param {*} defaultValue - значение по умолчанию
   * @returns {*} - загруженное значение или defaultValue
   * @private
   */
  _loadData(key, defaultValue) {
    const fullKey = this.storagePrefix + key;
    try {
      const raw = localStorage.getItem(fullKey);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch (e) {
      console.warn(`[Leaderboard] Ошибка загрузки ${fullKey}:`, e);
      return defaultValue;
    }
  }

  /**
   * Сохраняет значение в localStorage по ключу с префиксом.
   *
   * @param {string} key - имя ключа (без префикса)
   * @param {*} value - значение для сохранения
   * @private
   */
  _saveData(key, value) {
    const fullKey = this.storagePrefix + key;
    try {
      localStorage.setItem(fullKey, JSON.stringify(value));
    } catch (e) {
      console.warn(`[Leaderboard] Ошибка сохранения ${fullKey}:`, e);
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  //                     ПУБЛИЧНЫЕ МЕТОДЫ
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Сохраняет результат игрока после завершения уровня.
   *
   * Алгоритм:
   *   1. Проверяем, является ли счёт новым рекордом
   *   2. Если да — обновляем bestScore в localStorage
   *   3. Обновляем запись игрока в таблице
   *   4. Показываем анимацию "Новый рекорд!" (если это рекорд)
   *
   * @param {number} score - набранные очки
   * @returns {Object} - результат:
   *   { isNewBest: boolean, rank: number, score: number }
   *   - isNewBest: true, если это новый рекорд
   *   - rank: позиция в таблице (1 — первое место)
   *   - score: сохранённый счёт
   */
  saveScore(score) {
    // Проверка на валидность
    if (typeof score !== "number" || score < 0 || !isFinite(score)) {
      console.warn("[Leaderboard] Некорректный счёт:", score);
      return { isNewBest: false, rank: -1, score: 0 };
    }

    const oldBest = this._playerScore;
    const isNewBest = score > oldBest;

    // Обновляем рекорд, если нужно
    if (isNewBest) {
      this._playerScore = score;
      this._saveData("bestScore", score);
      console.log(`[Leaderboard] Новый рекорд! ${score}`);
    }

    // Обновляем запись в таблице
    this._updatePlayerEntry();

    // Определяем позицию (ранг)
    const rank = this.getPlayerRank();

    return { isNewBest, rank, score };
  }

  /**
   * Возвращает позицию текущего игрока в таблице лидерборда.
   * Если игрока нет в таблице — возвращает -1.
   *
   * @returns {number} - позиция (1 = первое место) или -1
   */
  getPlayerRank() {
    const idx = this._scores.findIndex(entry => entry.isPlayer);
    return idx >= 0 ? idx + 1 : -1;
  }

  /**
   * Возвращает данные для отрисовки лидерборда.
   * Можно использовать для кастомной отрисовки (например, в Canvas/Phaser).
   *
   * @param {number} [count] - количество записей (по умолчанию displayCount)
   * @returns {Array} - массив записей { name, avatar, score, isPlayer, isBot, rank }
   */
  getLeaderboardData(count = null) {
    const limit = count || this.displayCount;
    const data = [];

    for (let i = 0; i < Math.min(limit, this._scores.length); i++) {
      data.push({
        ...this._scores[i],
        rank: i + 1
      });
    }

    return data;
  }

  /**
   * Получает или устанавливает имя игрока.
   * Если имя не задано — будет показано "Вы".
   *
   * @param {string} [newName] - если передано, устанавливает новое имя
   * @returns {string} - текущее имя игрока
   */
  playerName(newName) {
    if (newName !== undefined) {
      this._playerName = newName.trim() || "Вы";
      this._saveData("playerName", this._playerName);
      this._updatePlayerEntry();
    }
    return this._playerName;
  }

  // ═════════════════════════════════════════════════════════════════════════
  //                     СОЗДАНИЕ DOM-СТРУКТУРЫ ТАБЛИЦЫ
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Создаёт DOM-элементы для отображения таблицы лидерборда.
   * Ищет на странице элемент с id = containerId и помещает таблицу внутрь.
   *
   * @private
   */
  _createDOM() {
    // Ищем контейнер
    this._container = document.getElementById(this.containerId);

    // Если контейнера нет — возможно, его создадут позже.
    // Ничего страшного, таблицу можно показать позже вызовом show()
    if (!this._container) {
      console.log(`[Leaderboard] Контейнер #${this.containerId} не найден. 
        Таблица будет создана при вызове show().`);
      return;
    }

    this._renderTable();
  }

  /**
   * Рендерит HTML-таблицу лидерборда в контейнере.
   *
   * @private
   */
  _renderTable() {
    if (!this._container) return;

    // Получаем данные для отображения
    const entries = this.getLeaderboardData();

    // Строим HTML
    let html = `
      <div class="ldb-overlay">
        <div class="ldb-panel">
          <div class="ldb-header">
            <h2 class="ldb-title">🏆 ТАБЛИЦА ЛИДЕРОВ</h2>
            <button class="ldb-close-btn" id="${this.containerId}-close">✕</button>
          </div>
          <div class="ldb-list">
    `;

    // Для каждой записи создаём строку
    entries.forEach((entry, index) => {
      const rank = index + 1;
      const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
      const isPlayerClass = entry.isPlayer ? " ldb-row--player" : "";
      const avatarHtml = entry.avatar
        ? `<img class="ldb-avatar" src="${entry.avatar}" alt="${entry.name}">`
        : `<div class="ldb-avatar ldb-avatar--default">👤</div>`;
      const scoreStr = formatNumber(entry.score);

      html += `
        <div class="ldb-row${isPlayerClass}" data-rank="${rank}">
          <span class="ldb-medal">${medal}</span>
          ${avatarHtml}
          <span class="ldb-name">${entry.name}</span>
          <span class="ldb-score">${scoreStr}</span>
        </div>
      `;
    });

    html += `
          </div>
          <div class="ldb-footer">
            <span>Яндекс Игры • Всего игроков: ${this._scores.length}</span>
          </div>
        </div>
      </div>
    `;

    this._container.innerHTML = html;

    // Вешаем обработчик на кнопку закрытия
    const closeBtn = document.getElementById(`${this.containerId}-close`);
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.hide());
    }

    // Сохраняем ссылки на элементы
    this._overlay = this._container.querySelector(".ldb-overlay");
    this._panel = this._container.querySelector(".ldb-panel");
  }

  // ═════════════════════════════════════════════════════════════════════════
  //                     УПРАВЛЕНИЕ ВИДИМОСТЬЮ
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Показывает таблицу лидерборда.
   * Если контейнер ещё не был создан — создаёт его.
   */
  show() {
    // Если контейнера нет — создаём новый на лету
    if (!this._container) {
      this._container = document.getElementById(this.containerId);
      if (!this._container) {
        // Создаём контейнер и добавляем в body
        this._container = document.createElement("div");
        this._container.id = this.containerId;
        document.body.appendChild(this._container);
      }
      this._renderTable();
    }

    // Если оверлей ещё не найден (например, таблица пересоздалась)
    if (!this._overlay) {
      this._renderTable();
    }

    // Показываем
    if (this._overlay) {
      this._overlay.classList.add("ldb-overlay--visible");
      this._overlay.style.display = "flex";

      // Анимация появления — небольшая задержка для плавности
      requestAnimationFrame(() => {
        if (this._panel) {
          this._panel.classList.add("ldb-panel--visible");
        }
      });
    }

    console.log("[Leaderboard] Таблица показана");
  }

  /**
   * Скрывает таблицу лидерборда.
   */
  hide() {
    if (this._overlay) {
      this._overlay.classList.remove("ldb-overlay--visible");
      if (this._panel) {
        this._panel.classList.remove("ldb-panel--visible");
      }
      // Через небольшую задержку скрываем display
      setTimeout(() => {
        if (this._overlay && !this._overlay.classList.contains("ldb-overlay--visible")) {
          this._overlay.style.display = "none";
        }
      }, 300);
    }
  }

  /**
   * Показывает анимацию "Новый рекорд!"
   * Вызывается, когда игрок побил свой лучший результат.
   *
   * @param {number} [duration=3000] - длительность анимации в мс
   */
  showNewBestAnimation(duration = 3000) {
    // Создаём элемент для анимации
    const el = document.createElement("div");
    el.className = "ldb-new-best";
    el.innerHTML = `
      <div class="ldb-new-best-content">
        <div class="ldb-new-best-star">⭐</div>
        <div class="ldb-new-best-text">НОВЫЙ РЕКОРД!</div>
        <div class="ldb-new-best-score">${formatNumber(this._playerScore)}</div>
      </div>
    `;

    // Добавляем на страницу
    document.body.appendChild(el);

    // Через небольшую задержку добавляем класс для анимации появления
    requestAnimationFrame(() => {
      el.classList.add("ldb-new-best--visible");
    });

    // Через duration удаляем элемент
    setTimeout(() => {
      el.classList.remove("ldb-new-best--visible");
      el.classList.add("ldb-new-best--hiding");
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 500);
    }, duration);
  }

  /**
   * Сбрасывает все данные лидерборда (для тестирования).
   * Удаляет все записи из localStorage и генерирует новых ботов.
   */
  reset() {
    localStorage.removeItem(this.storagePrefix + "bestScore");
    localStorage.removeItem(this.storagePrefix + "playerName");
    localStorage.removeItem(this.storagePrefix + "scores");
    this._playerScore = 0;
    this._scores = [];
    this._generateBots();
    this._updatePlayerEntry();
    this._renderTable();
    console.log("[Leaderboard] Данные сброшены");
  }
}

// =============================================================================
//                    ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ ВИДИМОСТИ
// =============================================================================
// Чтобы класс был доступен из других скриптов, добавляем его в window.
// После подключения этого файла через <script src="leaderboard.js"></script>
// вы сможете писать:  const lb = new Leaderboard();

window.Leaderboard = Leaderboard;

console.log("%c🏆 Leaderboard module loaded", "font-size: 16px; color: #FFD700;");

// =============================================================================
//                    ЭКСПОРТ ДЛЯ ES-МОДУЛЕЙ
