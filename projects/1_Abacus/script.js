document.addEventListener("DOMContentLoaded", () => {
    const abacusContainer = document.getElementById("abacus");
    const resultDisplay = document.getElementById("value");

    const numRods = 10; // Number of rods
	const placeValues = [1000000000, 100000000, 10000000, 1000000, 100000, 10000, 1000, 100, 10, 1];

    // Generate rods dynamically
    for (let i = 0; i < numRods; i++) {
        const rod = document.createElement("div");
        rod.className = "rod";
        rod.dataset.place = placeValues[i];

        // Upper beads (2 beads)
        const upper = document.createElement("div");
        upper.className = "upper";
        for (let j = 0; j < 2; j++) {
            const bead = document.createElement("div");
            bead.className = "bead";
            upper.appendChild(bead);
        }

        // Lower beads (5 beads)
        const lower = document.createElement("div");
        lower.className = "lower";
        for (let j = 0; j < 5; j++) {
            const bead = document.createElement("div");
            bead.className = "bead";
            lower.appendChild(bead);
        }

        // Assemble the rod
        rod.appendChild(upper);
        rod.appendChild(lower);
        abacusContainer.appendChild(rod);
    }

    // Calculate the total value of the abacus
    function calculateValue() {
        let total = 0;

        const rods = document.querySelectorAll(".rod");
        rods.forEach(rod => {
            const placeValue = parseInt(rod.dataset.place);
            const upperBeads = rod.querySelectorAll(".upper .bead.activeUp").length;
            const lowerBeads = rod.querySelectorAll(".lower .bead.active").length;

            // Each upper bead contributes 5, and each lower bead contributes 1
            const rodValue = upperBeads * 5 + lowerBeads;
            total += rodValue * placeValue;
        });

        resultDisplay.textContent = total;
    }

    // Function to generate beep sound using AudioContext
    function playBeep() {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        oscillator.type = 'sine'; // Type of sound
        oscillator.frequency.setValueAtTime(440, context.currentTime); // Frequency in Hz (440 is A4 note)
        oscillator.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.2); // Sound duration (200ms)
    }

    // Function to handle bead activation and play sound
    function handleBeadClick(bead, section, allBeads) {
        const index = Array.from(allBeads).indexOf(bead);

        if (section === "upper") {
            if (!bead.classList.contains("activeUp")) {
                for (let i = index; i < allBeads.length; i++) {
                    allBeads[i].classList.add("activeUp");
                }
            } else {
                for (let i = 0; i <= index; i++) {
                    allBeads[i].classList.remove("activeUp");
                }
            }
        } else if (section === "lower") {
            if (!bead.classList.contains("active")) {
                for (let i = 0; i <= index; i++) {
                    allBeads[i].classList.add("active");
                }
            } else {
                for (let i = index; i < allBeads.length; i++) {
                    allBeads[i].classList.remove("active");
                }
            }
        }

        // Play the beep sound when the bead is moved
        playBeep();

        calculateValue();
    }

    // Add click listeners to all beads
    const rods = document.querySelectorAll(".rod");
    rods.forEach(rod => {
        const upperBeads = rod.querySelectorAll(".upper .bead");
        const lowerBeads = rod.querySelectorAll(".lower .bead");

        upperBeads.forEach(bead => {
            bead.addEventListener("click", () => handleBeadClick(bead, "upper", upperBeads));
        });

        lowerBeads.forEach(bead => {
            bead.addEventListener("click", () => handleBeadClick(bead, "lower", lowerBeads));
        });
    });
});
