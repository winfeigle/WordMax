const startBtn = document.getElementById("start-btn");
const gameDiv = document.getElementById("game");
const blurredTiles = document.getElementById("blurred-tiles");
const lettersDiv = document.getElementById("letters");
const wordInput = document.getElementById("word-input");
const submitBtn = document.getElementById("submit-btn");
const timerDisplay = document.getElementById("timer");
const moonIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
    stroke-width="1.5" stroke="currentColor" width="24" height="24">
    <path stroke-linecap="round" stroke-linejoin="round"
      d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75
      0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21
      12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"/>
  </svg>
`;

const sunIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
    stroke-width="1.5" stroke="currentColor" width="24" height="24">
    <path stroke-linecap="round" stroke-linejoin="round"
      d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386
      6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591
      1.591M5.25 12H3m4.227-4.773L5.636
      5.636M15.75 12a3.75 3.75 0 1 1-7.5
      0 3.75 3.75 0 0 1 7.5 0Z"/>
  </svg>
`;


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
  const launchDate = new Date("2025-05-26"); // your real start date
  const today = new Date();
  launchDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((today - launchDate) / msPerDay) + 1;
}

const gameEl = document.getElementById("game-id");
if (gameEl) gameEl.textContent = getGameNumber();


function generateLetters() {
  const vowels = ["A", "E", "I", "O", "U"];
  const consonants = "BCDFGHJKLMNPQRSTVWXYZ".split("");
  letters = [];

  while (letters.filter(l => "AEIOU".includes(l)).length < 3) {
    const randVowel = vowels[Math.floor(Math.random() * vowels.length)];
    if (!letters.includes(randVowel)) letters.push(randVowel);
  }

  while (letters.length < 10) {
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

        scoreSpan.classList.remove("flash");
        void scoreSpan.offsetWidth;
        scoreSpan.classList.add("flash");

        setTimeout(() => scoreSpan.classList.remove("flash"), 1000);
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
  const word = wordInput.value.trim().toUpperCase();
  const errorMessage = document.getElementById("error-message");

  function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.classList.remove("hidden");
  }

  function clearError() {
    errorMessage.textContent = "";
    errorMessage.classList.add("hidden");
  }

  clearError();

  if (!word) {
    showError("❌ Please enter a word.");
    return;
  }

  // Check if the word uses only the given letters
  const letterCounts = {};
  for (let l of letters) letterCounts[l] = (letterCounts[l] || 0) + 1;

  for (let char of word) {
    if (!letterCounts[char]) {
      showError("❌ Invalid letters used.");
      return;
    }
    letterCounts[char]--;
  }

  // Check if it's a valid English word
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
    if (!response.ok) {
      showError("❌ Not a valid English word.");
      return;
    }
  } catch (err) {
    showError("❌ Could not verify word. Please try again.");
    return;
  }

  // Success — stop the timer and calculate score
  clearInterval(timer);

  let score = 0;
  for (let char of word) {
    score += liveScores[char] || 0;
  }

  // Redirect to result page
  window.location.href = `result.html?score=${score}&word=${word}`;
}



startBtn.addEventListener("click", () => {
  blurredTiles.classList.add("hidden");
  startBtn.classList.add("hidden");
  gameDiv.classList.remove("hidden");

  document.getElementById("instructions-box").classList.add("hidden");

  generateLetters();
  revealLetters();
  startTimer();
  wordInput.focus();
});

submitBtn.addEventListener("click", submitWord);


// Theme toggle
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const body = document.body;

function setTheme(mode) {
  if (mode === "light") {
    body.classList.add("light-mode");
    localStorage.setItem("theme", "light");
    themeIcon.innerHTML = moonIcon;
  } else {
    body.classList.remove("light-mode");
    localStorage.setItem("theme", "dark");
    themeIcon.innerHTML = sunIcon;
  }
}

// Load saved theme
const savedTheme = localStorage.getItem("theme");
setTheme(savedTheme === "light" ? "light" : "dark");

// Toggle on click
themeToggle.addEventListener("click", () => {
  const isLight = body.classList.contains("light-mode");
  setTheme(isLight ? "dark" : "light");
});


// Animated tiles on intro screen
const animatedTiles = document.querySelectorAll(".animated-tile");

function randomLetter() {
  const vowels = ["A", "E", "I", "O", "U"];
  const consonants = "BCDFGHJKLMNPQRSTVWXYZ".split("");
  const alphabet = [...consonants, ...vowels, ...vowels]; // Vowels weighted 2x
  return alphabet[Math.floor(Math.random() * alphabet.length)];
}

function randomDelay() {
  return Math.floor(Math.random() * 4000) + 1000; // 1–5s
}

function startRandomCycle(tile) {
  const letterSpan = tile.querySelector(".letter");
  const badgeSpan = tile.querySelector(".score-badge");

  const update = () => {
    const newLetter = randomLetter();
    letterSpan.textContent = newLetter;
    badgeSpan.textContent = BASE_SCORES[newLetter] * 3;
    setTimeout(update, randomDelay());
  };

  update();
}

animatedTiles.forEach(startRandomCycle);
