const SUPABASE_URL = 'https://eqbdorsomxcqzfjrljho.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxYmRvcnNvbXhjcXpmanJsamhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDEyMDcsImV4cCI6MjA2Mzg3NzIwN30.4AJRlutJB3_SpWMmcz9KGglVlC7YsVR7VbJ6rvKnKcQ';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


const startBtn = document.getElementById("start-btn");
const gameDiv = document.getElementById("game");
const blurredTiles = document.getElementById("blurred-tiles");
const lettersDiv = document.getElementById("letters");
const wordInput = document.getElementById("word-input");
const submitBtn = document.getElementById("submit-btn");
const liveScoreDisplay = document.getElementById("live-score");

wordInput.addEventListener("input", updateLiveScoreDisplay);

const timerDisplay = document.getElementById("timer");

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

function updateLiveScoreDisplay() {
  const word = wordInput.value.trim().toUpperCase();
  const letterCounts = {};

  letters.forEach(l => {
    letterCounts[l] = (letterCounts[l] || 0) + 1;
  });

  let score = 0;
  let valid = true;

  for (let char of word) {
    if (!letterCounts[char]) {
      valid = false;
      break;
    }
    score += liveScores[char] || 0;
    letterCounts[char]--;
  }
  document.getElementById("live-score-number").textContent = score;

}


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


async function generateLetters() {
  const gameNumber = getGameNumber();

  // 1. Check if letters already exist for this game
  const { data, error } = await supabase
  .from('games')
  .select('letters')
  .eq('game_number', gameNumber)
  .single();


  if (data && data.letters) {
    letters = data.letters;
    console.log(`Using existing letters for Game #${gameNumber}`, letters);
  } else {
    // 2. Generate new unique letters
    const vowels = ["A", "E", "I", "O", "U"];
    const consonants = "BCDFGHJKLMNPQRSTVWXYZ".split("");
    letters = [];

    const letterPool = [...vowels, ...consonants];

    // Add 10 unique letters
    while (letters.length < 10) {
      const randLetter = letterPool[Math.floor(Math.random() * letterPool.length)];
      if (!letters.includes(randLetter)) {
        letters.push(randLetter);
      }
    }

    // Ensure at least 3 vowels
    while (letters.filter(l => vowels.includes(l)).length < 3) {
      const consonantIndex = letters.findIndex(l => consonants.includes(l));
      if (consonantIndex !== -1) {
        const randVowel = vowels[Math.floor(Math.random() * vowels.length)];
        letters[consonantIndex] = randVowel;
      }
    }

    // Ensure Q comes with U
    if (letters.includes("Q") && !letters.includes("U")) {
      const replaceIndex = letters.findIndex(l => l !== "Q" && consonants.includes(l));
      if (replaceIndex !== -1) {
        letters[replaceIndex] = "U";
      }
    }

    // 3. Insert into Supabase
    const { error: insertError } = await supabase
      .from('games')
      .insert([{ game_number: gameNumber, letters }]);

    if (insertError) {
      console.error("Error inserting new letters:", insertError);
    } else {
      console.log(`Inserted new letters for Game #${gameNumber}`, letters);
    }
  }

  // 4. Set liveScores
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
    
    updateLiveScoreDisplay();

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

  // ✅ NEW: Check that all letters are from the allowed set
  const allowedLetters = new Set(letters);
  for (let char of word) {
    if (!allowedLetters.has(char)) {
      showError("❌ Word contains letters not in today’s set.");
      return;
    }
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

  clearInterval(timer);

  // Score based on total letter value (can reuse letters!)
  let score = 0;
  for (let char of word) {
    score += liveScores[char] || 0;
  }

  // Save to Supabase
  const { error: scoreError } = await supabase.from('scores').insert([
    {
      game_number: getGameNumber(),
      word,
      score
    }
  ]);
  if (scoreError) console.error("Error saving score:", scoreError);

  window.location.href = `result.html?score=${score}&word=${word}`;
}



startBtn.addEventListener("click", () => {
  blurredTiles.classList.add("hidden");
  startBtn.classList.add("hidden");
  gameDiv.classList.remove("hidden");

  document.getElementById("instructions-box").classList.add("hidden");

  generateLetters().then(() => {
    revealLetters();
    startTimer();
    wordInput.focus();
  });
});

submitBtn.addEventListener("click", submitWord);

const backHomeBtn = document.getElementById("back-home-btn");

backHomeBtn.addEventListener("click", () => {
  clearInterval(timer); // stop timer if running
  timeLeft = 180;
  wordInput.value = "";
  liveScoreDisplay.classList.add("hidden");

  // Reset UI views
  gameDiv.classList.add("hidden");
  blurredTiles.classList.remove("hidden");
  startBtn.classList.remove("hidden");
  document.getElementById("instructions-box").classList.remove("hidden");
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
