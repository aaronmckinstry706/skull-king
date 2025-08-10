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
      trump14: 0,
      bidModifier: 0,
      bet: 0
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

    ["Player", "Bid", "Take", "Score", "Cumulative"].forEach(text => {
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
        bidModifier: 0,
        bet: 0,
        ...playerData.bonuses
      };

      const row = document.createElement("div");
      row.className = "score-row";
    
      const name = document.createElement("span");
      name.textContent = gameState.players[playerIndex];
    
      const bidInput = document.createElement("input");
      bidInput.type = "number";
      bidInput.value = playerData.bid;
      bidInput.readOnly = true;
      bidInput.oninput = () => {
        playerData.bid = parseInt(bidInput.value || "0");
        renderAllRounds(); // to recalc scores
      };
      bidInput.disabled = round.ignored;
    
      const actualInput = document.createElement("input");
      actualInput.type = "number";
      actualInput.value = playerData.actual;
      actualInput.readOnly = true;
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
        { key: "mermaid", label: "🧜", max: 2 },
        { key: "pirate", label: "⚔️", max: 6 },
        { key: "skullking", label: "☠️", max: 1 },
        { key: "nonTrump14", label: "14🔸", max: 3 },
        { key: "trump14", label: "14🏴‍☠️", max: 1 },
        { key: "bidModifier", label: "±", values: [-1, 0, 1] },
        { key: "bet", label: "💰", values: [0, 10, 20] }
      ];

      const modifiedBid = playerData.bid + (playerData.bonuses.bidModifier || 0);
      const madeBid = playerData.actual === modifiedBid;

      bonuses.forEach(({ key, label, max, values }) => {
        const container = document.createElement("div");
        container.className = "bonus-counter";
        if (round.ignored) container.classList.add("disabled");

        const labelSpan = document.createElement("span");
        labelSpan.className = "label";
        labelSpan.textContent = label;

        const count = document.createElement("span");
        const current = playerData.bonuses[key] || 0;
        if (key === "bidModifier") {
          count.textContent = current === 0 ? "" : (current > 0 ? `+${current}` : current);
        } else {
          count.textContent = current === 0 ? "" : current;
        }

        if (current !== 0) {
          const affectsScore =
            key === "bidModifier" || key === "bet" ? true : madeBid;
          container.classList.add(affectsScore ? "bonus-active" : "bonus-ignored");
        }

        container.onclick = () => {
          if (round.ignored) return;
          let curr = playerData.bonuses[key] || 0;
          if (values) {
            const idx = values.indexOf(curr);
            playerData.bonuses[key] = values[(idx + 1) % values.length];
          } else {
            playerData.bonuses[key] = (curr + 1) % (max + 1);
          }
          renderAllRounds();
        };

        container.append(labelSpan, count);
        bonusRow.appendChild(container);
      });

      body.appendChild(bonusRow);
    });

    // Navigation buttons to jump between non-ignored rounds
    const prevRoundIndex = (() => {
      for (let i = roundIndex - 1; i >= 0; i--) {
        if (!gameState.rounds[i].ignored) return i;
      }
      return -1;
    })();
    const nextRoundIndex = gameState.rounds.findIndex((r, i) => i > roundIndex && !r.ignored);

    if (prevRoundIndex !== -1 || nextRoundIndex !== -1) {
      const navContainer = document.createElement("div");
      navContainer.className = "round-nav";

      if (prevRoundIndex !== -1) {
        const prevBtn = document.createElement("button");
        prevBtn.textContent = "Previous Round";
        prevBtn.onclick = () => {
          uiState.expandedRounds.clear();
          uiState.expandedRounds.add(prevRoundIndex);
          renderAllRounds();

          setTimeout(() => {
            const target = document.querySelector(
              `[data-round-index="${prevRoundIndex}"].accordion-header`
            );
            if (target) {
              target.scrollIntoView({
                behavior: "smooth",
                block: "start",
                inline: "nearest"
              });
            }
          }, 0);
        };
        prevBtn.disabled = round.ignored;
        navContainer.appendChild(prevBtn);
      }

      if (nextRoundIndex !== -1) {
        const nextBtn = document.createElement("button");
        nextBtn.textContent = "Next Round";
        nextBtn.style.marginLeft = "auto";
        nextBtn.onclick = () => {
          uiState.expandedRounds.clear();
          uiState.expandedRounds.add(nextRoundIndex);
          renderAllRounds();

          setTimeout(() => {
            const target = document.querySelector(
              `[data-round-index="${nextRoundIndex}"].accordion-header`
            );
            if (target) {
              target.scrollIntoView({
                behavior: "smooth",
                block: "start", // aligns the top of the element to the top of the scroll area
                inline: "nearest"
              });
            }
          }, 0);
        };
        nextBtn.disabled = round.ignored;
        navContainer.appendChild(nextBtn);
      }

      body.appendChild(navContainer);
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
  const bidMod = bonuses?.bidModifier ?? 0;
  const bet = bonuses?.bet ?? 0;
  const modifiedBid = bid + bidMod;
  const made = actual === modifiedBid;
  let base = 0;
  if (bid === 0)
    base = (made ? 1 : -1) * (roundIndex + 1) * 10;
  else
    base = made ? 20 * bid : -10 * Math.abs(actual - modifiedBid);
  const bonus = made
    ? (bonuses?.mermaid ?? 0) * 20 +
      (bonuses?.pirate ?? 0) * 30 +
      (bonuses?.skullking ?? 0) * 40 +
      (bonuses?.nonTrump14 ?? 0) * 10 +
      (bonuses?.trump14 ?? 0) * 20 +
      bet
    : -bet;
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
