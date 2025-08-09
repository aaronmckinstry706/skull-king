// Main JavaScript logic for the Skull King PWA

const gameState = {
  players: ["Alice", "Bob"],
  rounds: []
};

const uiState = {
  expandedRounds: new Set([-1]) // -1 for player editor
};

function createPlayer() {
  return {
    bid: 0,
    actual: 0,
    bonuses: {
      mermaid: 0,
      pirate: 0,
      skullking: 0,
      nonTrump14: 0,
      trump14: 0
    }
  };
}

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
    gameState.rounds.forEach(r => r.players.push(createPlayer()));
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
    if (round.ignored) section.classList.add("disabled");

    const header = document.createElement("div");
    header.className = "accordion-header";
    header.dataset.roundIndex = roundIndex;

    const title = document.createElement("span");
    title.textContent = `Round ${roundIndex + 1}`;
    title.className = "round-title";

    const ignoreWrapper = document.createElement("span");
    ignoreWrapper.className = "ignore-checkbox";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = !round.ignored;
    checkbox.onchange = () => {
      round.ignored = !checkbox.checked;
      if (round.ignored) {
        uiState.expandedRounds.delete(roundIndex);
      }
      updateCumulativeScores();
    };

    ignoreWrapper.appendChild(checkbox);
    header.append(title, ignoreWrapper);

    header.onclick = (e) => {
      // Prevent toggle if clicking on the checkbox, its label/area, or if disabled
      if (e.target.tagName === "INPUT" || e.target.closest(".ignore-checkbox") || round.ignored) {
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
    if (!round.ignored && uiState.expandedRounds.has(roundIndex)) body.classList.add("open");

    const headerRow = document.createElement("div");
    headerRow.className = "score-row score-header";
    
    ["Player", "Bid", "Actual", "Score", "Cumulative"].forEach(text => {
      const span = document.createElement("span");
      span.textContent = text;
      headerRow.appendChild(span);
    });
    
    body.appendChild(headerRow);
    
    round.players.forEach((playerData, playerIndex) => {
      // Ensure bonuses object exists with default values for each player
      playerData.bonuses = {
        mermaid: 0,
        pirate: 0,
        skullking: 0,
        nonTrump14: 0,
        trump14: 0,
        ...playerData.bonuses
      };

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
      bidInput.disabled = round.ignored;
    
      const actualInput = document.createElement("input");
      actualInput.type = "number";
      actualInput.value = playerData.actual;
      actualInput.oninput = () => {
        playerData.actual = parseInt(actualInput.value || "0");
        renderAllRounds();
      };
      actualInput.disabled = round.ignored;
    
      const scoreSpan = document.createElement("span");
      const score = computeScore(playerData, roundIndex);
      scoreSpan.textContent = score;
    
      const cumulativeSpan = document.createElement("span");
      const cumulative = getCumulativeScore(playerIndex, roundIndex);
      cumulativeSpan.textContent = cumulative;
    
      row.append(name, bidInput, actualInput, scoreSpan, cumulativeSpan);
      body.appendChild(row);

      const bonusRow = document.createElement("div");
      bonusRow.className = "bonus-row";
      
      // Bonus buttons config
      const bonuses = [
        { key: "mermaid", label: "🧜", value: 20 },
        { key: "pirate", label: "⚔️", value: 30 },
        { key: "skullking", label: "☠️", value: 40 },
        { key: "nonTrump14", label: "🔸14", value: 10 },
        { key: "trump14", label: "🏴‍☠️14", value: 20 },
      ];
      
      bonuses.forEach(({ key, label }) => {
        const container = document.createElement("div");
        container.className = "bonus-counter";
      
        const dec = document.createElement("button");
        dec.textContent = "−";
        dec.onclick = () => {
          playerData.bonuses[key] = Math.max(0, (playerData.bonuses[key] || 0) - 1);
          renderAllRounds();
        };
        dec.disabled = round.ignored;
      
        const count = document.createElement("span");
        count.textContent = `${label} ${playerData.bonuses[key] || 0}`;
      
        const inc = document.createElement("button");
        inc.textContent = "+";
        inc.onclick = () => {
          playerData.bonuses[key] = (playerData.bonuses[key] || 0) + 1;
          renderAllRounds();
        };
        inc.disabled = round.ignored;
      
        container.append(dec, count, inc);
        bonusRow.appendChild(container);
      });
      
      body.appendChild(bonusRow);
    });

    if (roundIndex < gameState.rounds.length - 1) {
      const nextBtn = document.createElement("button");
      nextBtn.textContent = "Next Round";
      nextBtn.onclick = () => {
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
      nextBtn.disabled = round.ignored;

      body.appendChild(nextBtn);
    }

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
    total += computeScore(p, i);
  }
  return total;
}

function addRound() {
  gameState.rounds.push({
    ignored: false,
    players: gameState.players.map(() => createPlayer())
  });
}

function computeScore(player, roundIndex) {
  const { bid, actual, bonuses } = player;
  let base = 0;
  if (bid === 0)
    base = (bid === actual ? 1 : -1)*(roundIndex + 1)*10;
  else
    base = bid === actual ? 20 * bid : -10 * Math.abs(bid - actual);
  let bonus =
    (bonuses?.mermaid ?? 0) * 20 +
    (bonuses?.pirate ?? 0) * 30 +
    (bonuses?.skullking ?? 0) * 40 +
    (bonuses?.nonTrump14 ?? 0) * 10 +
    (bonuses?.trump14 ?? 0) * 20;
  return base + bonus;
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
        },
        render: function() {
            renderPlayerEditor();
            for (let i = 0; i < 10; ++i)
                addRound();
            renderAllRounds();
        }
    };

    app.init();
});
