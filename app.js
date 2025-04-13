// Main JavaScript logic for the Skull King PWA
// Adding comment to force deployment
document.addEventListener('DOMContentLoaded', () => {
    const app = {
        init: function() {
            this.bindEvents();
            this.render();
        },
        bindEvents: function() {
            // Add event listeners here
  const nextRoundBtn = document.querySelector(".next-round");
  const table = document.querySelector(".score-table");

  nextRoundBtn.addEventListener("click", () => {
    const rows = document.querySelectorAll(".score-row");

    rows.forEach(row => {
      const input = row.querySelector(".round-input");
      const scoreSpan = row.querySelector(".total-score");

      const roundScore = parseInt(input.value || "0", 10);
      const prevTotal = parseInt(scoreSpan.textContent || "0", 10);

      const newTotal = prevTotal + roundScore;
      scoreSpan.textContent = newTotal;

      input.value = ""; // Clear input for next round
    });
  });
        },
        render: function() {
            // Initial rendering logic here
        }
    };

    app.init();
});
