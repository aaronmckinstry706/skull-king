// Main JavaScript logic for the Skull King PWA

const gameState = {
  players: ["Alice", "Bob"],
  rounds: []
};

const uiState = {
  expandedRounds: new Set([-1]) // -1 for player editor
};

function renderPlayerEditor() {
  const container = document.getElementById("player-list");
  container.innerHTML = "";

  const header = document.getElementById("player-header");
  header.onclick = () => {
    container.classList.toggle("open");
  };

  gameState.players.forEach((name, i) => {
    const row = document.createElement("div");
    row.className = "player-row";

    const input = document.createElement("input");
    input.type = "text";
    input.value = name;
    input.addEventListener("input", () => {
      gameState.players[i] = input.value;
      updateRoundPlayerNames();
    });

    const remove = document.createElement("button");
    remove.textContent = "−";
    remove.onclick = () => {
      gameState.players.splice(i, 1);
      gameState.rounds.forEach(r => r.players.splice(i, 1));
      renderPlayerEditor();
      renderAllRounds();
    };

    row.append(input, remove);
    container.appendChild(row);
  });

  const addBtn = document.createElement("button");
  addBtn.textContent = "Add Player";
  addBtn.onclick = () => {
    gameState.players.push(`Player ${gameState.players.length + 1}`);
    gameState.rounds.forEach(r => r.players.push({bid: 0, actual: 0}));
    renderPlayerEditor();
    renderAllRounds();
  };

  container.appendChild(addBtn);
}

function renderAllRounds() {
  const roundsContainer = document.getElementById("rounds-container");
  roundsContainer.innerHTML = "";

  gameState.rounds.forEach((round, roundIndex) => {
    const section = document.createElement("section");
    section.className = "accordion";

    const header = document.createElement("div");
    header.className = "accordion-header";
    header.dataset.roundIndex = roundIndex;

    const ignoreWrapper = document.createElement("span");
    ignoreWrapper.className = "ignore-checkbox";
    
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = round.ignored;
    checkbox.onchange = () => {
      round.ignored = checkbox.checked;
      updateCumulativeScores();
    };
    
    const title = document.createElement("span");
    title.textContent = `Round ${roundIndex + 1}`;

    ignoreWrapper.appendChild(checkbox);
    header.append(ignoreWrapper, title);

    header.onclick = (e) => {
      // Prevent toggle if clicking on the checkbox or its label/area
      if (e.target.tagName === "INPUT" || e.target.closest(".ignore-checkbox")) {
        return;
      }
      if (uiState.expandedRounds.has(roundIndex)) {
        uiState.expandedRounds.delete(roundIndex);
      } else {
        uiState.expandedRounds.add(roundIndex);
      }
      renderAllRounds();
    };

    const body = document.createElement("div");
    body.className = "accordion-body";
    if (uiState.expandedRounds.has(roundIndex)) body.classList.add("open");

    const headerRow = document.createElement("div");
    headerRow.className = "score-row score-header";
    
    ["Player", "Bid", "Actual", "Score", "Cumulative"].forEach(text => {
      const span = document.createElement("span");
      span.textContent = text;
      headerRow.appendChild(span);
    });
    
    body.appendChild(headerRow);
    
    round.players.forEach((playerData, playerIndex) => {
      const row = document.createElement("div");
      row.className = "score-row";
    
      const name = document.createElement("span");
      name.textContent = gameState.players[playerIndex];
    
      const bidInput = document.createElement("input");
      bidInput.type = "number";
      bidInput.value = playerData.bid;
      bidInput.oninput = () => {
        playerData.bid = parseInt(bidInput.value || "0");
        renderAllRounds(); // to recalc scores
      };
    
      const actualInput = document.createElement("input");
      actualInput.type = "number";
      actualInput.value = playerData.actual;
      actualInput.oninput = () => {
        playerData.actual = parseInt(actualInput.value || "0");
        renderAllRounds();
      };
    
      const scoreSpan = document.createElement("span");
      const score = computeScore(playerData.bid, playerData.actual, roundIndex);
      scoreSpan.textContent = score;
    
      const cumulativeSpan = document.createElement("span");
      const cumulative = getCumulativeScore(playerIndex, roundIndex);
      cumulativeSpan.textContent = cumulative;
    
      row.append(name, bidInput, actualInput, scoreSpan, cumulativeSpan);
      body.appendChild(row);
    });

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next Round";
    nextBtn.onclick = () => {
      const isLast = roundIndex === gameState.rounds.length - 1;
      if (isLast) {
        addRound(); // adds one more
      }
    
      uiState.expandedRounds.clear();
      uiState.expandedRounds.add(roundIndex + 1);
      renderAllRounds();

      setTimeout(() => {
        const target = document.querySelector(`[data-round-index="${roundIndex + 1}"].accordion-header`);
        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start",     // aligns the top of the element to the top of the scroll area
            inline: "nearest"
          });
        }
      }, 0);
    };

    body.appendChild(nextBtn);
    section.append(header, body);
    roundsContainer.appendChild(section);
  });
}

function updateCumulativeScores() {
  renderAllRounds();
}

function getCumulativeScore(playerIndex, upToIndex) {
  let total = 0;
  for (let i = 0; i <= upToIndex; i++) {
    const r = gameState.rounds[i];
    if (r.ignored) continue;
    const p = r.players[playerIndex];
    total += computeScore(p.bid, p.actual, i);
  }
  return total;
}

function addRound() {
  gameState.rounds.push({
    ignored: false,
    players: gameState.players.map(() => ({ bid: 0, actual: 0 }))
  });
}

function computeScore(bid, actual, roundIndex) {
  if (bid === 0)
    return (bid === actual ? 1 : -1)*(roundIndex + 1)*10;
  else
    return bid === actual ? 20 * bid : -10 * Math.abs(bid - actual);
}

function updateRoundPlayerNames() {
  renderAllRounds(); // this is fine since it doesn’t clear scroll state unless we change it
}

document.addEventListener('DOMContentLoaded', () => {
    const app = {
        init: function() {
            this.bindEvents();
            this.render();
        },
        bindEvents: function() {
          document.getElementById("add-round-btn").addEventListener("click", () => {
            addRound();
            uiState.expandedRounds.clear();
            uiState.expandedRounds.add(gameState.rounds.length - 1); // open new one
            renderAllRounds();
          });
        },
        render: function() {
            renderPlayerEditor();
            renderAllRounds();
        }
    };

    app.init();
});
