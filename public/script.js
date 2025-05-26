const startBtn = document.getElementById("start-btn");
const gameDiv = document.getElementById("game");
const blurredTiles = document.getElementById("blurred-tiles");
const lettersDiv = document.getElementById("letters");
const wordInput = document.getElementById("word-input");
const submitBtn = document.getElementById("submit-btn");
const timerDisplay = document.getElementById("timer");
const scoreDiv = document.getElementById("score");

const BASE_SCORES = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4,
  G: 2, H: 4, I: 1, J: 8, K: 5, L: 1,
  M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1,
  S: 1, T: 1, U: 1, V: 4, W: 4, X: 8,
  Y: 4, Z: 10
};

let timer;
let timeLeft = 180;
let letters = [];
let liveScores = {};


function getGameNumber() {
  const launchDate = new Date("2025-05-26"); // ← set this to your real launch date
  const today = new Date();

  // Strip time from both dates to compare just dates
  launchDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.floor((today - launchDate) / msPerDay);

  return diffDays + 1; // Game #1 starts on launch day
}

document.getElementById("game-id").textContent = getGameNumber();


document.getElementById("game-id").textContent = getGameNumber();


function generateLetters() {
  const vowels = ["A", "E", "I", "O", "U"];
  const consonants = "BCDFGHJKLMNPQRSTVWXYZ".split("");
  letters = [];

  while (letters.length < 2) {
    const randVowel = vowels[Math.floor(Math.random() * vowels.length)];
    if (!letters.includes(randVowel)) letters.push(randVowel);
  }

  while (letters.length < 8) {
    const pool = vowels.concat(consonants);
    const randLetter = pool[Math.floor(Math.random() * pool.length)];
    if (!letters.includes(randLetter)) letters.push(randLetter);
  }

  if (letters.includes("Q") && !letters.includes("U")) {
    for (let i = 0; i < letters.length; i++) {
      if (consonants.includes(letters[i]) && letters[i] !== "Q") {
        letters[i] = "U";
        break;
      }
    }
  }

  letters.forEach(letter => {
    const base = BASE_SCORES[letter] || 0;
    liveScores[letter] = base * 3;
  });
}

function revealLetters() {
  lettersDiv.innerHTML = letters
    .map(letter => {
      return `
        <div class="tile">
          <span class="letter">${letter}</span>
          <span class="score-badge" id="score-${letter}">${liveScores[letter]}</span>
        </div>
      `;
    })
    .join("");
}

function startTimer() {
  timer = setInterval(() => {
    timeLeft--;
    const percent = timeLeft / 180;

    for (let letter of letters) {
      const base = BASE_SCORES[letter] * 3;
      const newScore = Math.max(1, Math.ceil(base * percent));
      const scoreSpan = document.getElementById(`score-${letter}`);

      if (liveScores[letter] !== newScore && scoreSpan) {
        liveScores[letter] = newScore;
        scoreSpan.textContent = newScore;
        scoreSpan.classList.add("flash");
        setTimeout(() => scoreSpan.classList.remove("flash"), 800);
      }
    }

    const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const seconds = String(timeLeft % 60).padStart(2, '0');
    timerDisplay.textContent = `${minutes}:${seconds}`;

    if (timeLeft <= 0) {
      clearInterval(timer);
      submitWord();
    }
  }, 1000);
}

async function submitWord() {
  clearInterval(timer);
  const word = wordInput.value.trim().toUpperCase();

  if (!word) {
    scoreDiv.textContent = "❌ Please enter a word.";
    return;
  }

  const tempLetters = [...letters];
  for (let char of word) {
    if (!tempLetters.includes(char)) {
      scoreDiv.textContent = "❌ Invalid letters used.";
      return;
    }
    tempLetters.splice(tempLetters.indexOf(char), 1);
  }

  const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
  if (!response.ok) {
    scoreDiv.textContent = "❌ Not a valid English word.";
    return;
  }

  let score = 0;
  for (let char of word) {
    score += liveScores[char] || 0;
  }

  scoreDiv.textContent = `✅ "${word}" scored ${score} points!`;
}

startBtn.addEventListener("click", () => {
  blurredTiles.classList.add("hidden");
  startBtn.classList.add("hidden");
  gameDiv.classList.remove("hidden");

  generateLetters();
  revealLetters();
  startTimer();
});

submitBtn.addEventListener("click", submitWord);

