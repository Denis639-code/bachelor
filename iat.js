// =========================
// FRONTEND (JavaScript)
// =========================

let stages;
fetch("http://localhost:5000/flowerInsect", { method: "GET" })
  .then((u) => u.json())
  .then((json) => {
    stages = json;
  });

let currentStage = 0;
let currentItem = 0;
let startTime = 0;
let results = [];

const wordDiv = document.getElementById("word");
const categoryDiv = document.getElementById("categories");
const instructions = document.getElementById("instructions");
const Button = document.getElementById("button");

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

Button.addEventListener("click", function () {
  Button.style.display = "none";
  wordDiv.style.display = "block";
  categoryDiv.style.display = "block";
  startStage();
});

function startStage() {
  const stage = stages[currentStage];
  currentItem = 0;
  stage.items = shuffle(stage.items);

  categoryDiv.textContent = `${stage.l_category} | ${stage.r_category}`;
  instructions.textContent = `Stage: ${stage.name}`;

  showNextItem();
}

function showNextItem() {
  if (currentItem >= stages[currentStage].items.length) {
    currentStage++;

    if (currentStage >= stages.length) {
      finishTest();
      return;
    }

    startStage();
    return;
  }

  const item = stages[currentStage].items[currentItem];

  if (item.img) {
    wordDiv.innerHTML = `<img src="${item.img}" style="max-width:200px;">`;
  } else {
    wordDiv.textContent = item.name;
  }

  startTime = performance.now();
}

function recordResponse(side) {
  const stage = stages[currentStage];
  const itemObj = stage.items[currentItem];
  const item = itemObj.name;

  const correctSide = stage.l_items.includes(item) ? "left" : "right";

  if (side !== correctSide) {
    instructions.textContent = "Forkert! Prøv igen.";
    return;
  }

  const timeTaken = performance.now() - startTime;

  results.push({
    stage: stage.name,
    item: item,
    side: side,
    time: timeTaken,
  });

  currentItem++;
  instructions.textContent = `Stage: ${stage.name}`;
  showNextItem();
}

// keyboard input
document.addEventListener("keydown", function (event) {
  if (event.key === "ArrowLeft") recordResponse("left");
  if (event.key === "ArrowRight") recordResponse("right");
});

// d-score

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std(arr) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
}

function computeDScore(results) {
  const valid = results.filter((r) => r.time >= 300 && r.time <= 10000);

  const compatible = valid
    .filter((r) => r.stage === "Combined 1")
    .map((r) => r.time);

  const incompatible = valid
    .filter((r) => r.stage === "Final Stage")
    .map((r) => r.time);

  const sd = std(compatible.concat(incompatible));

  return (mean(incompatible) - mean(compatible)) / sd;
}

// retrying function

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function sendWithRetry(data, retries = 5) {
  
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch("http://localhost:5000/save_results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        return true;
      }
      console.log(`Server error ${res.status}, retry ${i + 1}`);

    } catch (err) {
      console.log("Network error, retrying...", err);
    }
    instructions.textContent = ` Data request failed. Trial ${i}. Retrying...`;
    await sleep(2000*i);
  }

  throw new Error("Failed after retries");
}


//end test

async function finishTest() {
  const dScore = computeDScore(results);
    wordDiv.textContent = "";
    categoryDiv.textContent = "";

  let interpretation = "";
  instructions.textContent = "Testen er færdig!";
  await sleep(4000)
  if (sendWithRetry(results)) {
  if (dScore > 0.5) interpretation = "Stærk association: Flowers + Good";
  else if (dScore > 0.2) interpretation = "Moderat association: Flowers + Good";
  else if (dScore < -0.5) interpretation = "Stærk association: Flowers + Bad";
  else if (dScore < -0.2) interpretation = "Moderat association: Flowers + Bad";
  else interpretation = "Ingen stærk bias";
  instructions.textContent = `D-score: ${dScore.toFixed(2)}`;
  categoryDiv.textContent = interpretation;

  }

  instructions.textContent = `D-score: ${dScore.toFixed(2)}`;
  categoryDiv.textContent = interpretation;

  sendWithRetry(results)
    .then((data) => console.log("Saved:", data))
    .catch((err) => console.error(err));
}
