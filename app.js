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
      gameState.rounds.forEach(r => r.scores.splice(i, 1));
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
    gameState.rounds.forEach(r => r.scores.push(0));
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

    round.scores.forEach((score, playerIndex) => {
      const row = document.createElement("div");
      row.className = "score-row";

      const label = document.createElement("span");
      label.textContent = gameState.players[playerIndex];

      const input = document.createElement("input");
      input.type = "number";
      input.value = score;
      input.dataset.roundIndex = roundIndex;
      input.dataset.playerIndex = playerIndex;
      input.oninput = () => {
        round.scores[playerIndex] = parseInt(input.value || "0");
        updateCumulativeScores();
      };

      row.append(label, input);
      body.appendChild(row);
    });

    const totalRow = document.createElement("div");
    const totals = getCumulativeTotals(roundIndex);
    totalRow.textContent = `Cumulative scores: ${totals.join(" / ")}`;
    body.appendChild(totalRow);

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

function getCumulativeTotals(upToRoundIndex) {
  const totals = Array(gameState.players.length).fill(0);
  for (let r = 0; r <= upToRoundIndex; r++) {
    const round = gameState.rounds[r];
    if (!round.ignored) {
      round.scores.forEach((score, i) => totals[i] += score);
    }
  }
  return totals;
}

function addRound() {
  const scores = Array(gameState.players.length).fill(0);
  gameState.rounds.push({ scores, ignored: false });
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
