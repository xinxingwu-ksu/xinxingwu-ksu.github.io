document.addEventListener("click", function(e){
  var btn = e.target.closest(".reveal-btn");
  if(!btn) return;

  var id = btn.getAttribute("data-answer");
  var box = document.getElementById(id);
  if(!box) return;

  var isHidden = (box.style.display === "" || box.style.display === "none");

  box.style.display = isHidden ? "block" : "none";
  btn.textContent = isHidden ? "Hide Answer" : "Show Answer";
});

(function () {

  function initializeFire() {

    document.querySelectorAll(".shadeboxAnt").forEach(function (box) {

      const canvas = box.querySelector(".fireCanvas");

      if (!canvas) return;

      // Prevent duplicate initialization
      if (canvas.dataset.fireInitialized) return;

      canvas.dataset.fireInitialized = "true";

      const ctx = canvas.getContext("2d");

      /* ===== Adjustable parameters ===== */

	  
	  const fireSize = 0.45;
	  const lapDuration = 80;
      const trailLength = 100;

      /* ================================= */

      let W, H, x, y, w, h;

      function resize() {

        const b = box.getBoundingClientRect();
        const c = canvas.getBoundingClientRect();

        const d = Math.min(window.devicePixelRatio || 1, 2);

        W = c.width;
        H = c.height;

        x = b.left - c.left + 0.5;
        y = b.top - c.top + 0.5;

        w = b.width - 1;
        h = b.height - 1;

        canvas.width = W * d;
        canvas.height = H * d;

        ctx.setTransform(d, 0, 0, d, 0, 0);
      }

      new ResizeObserver(resize).observe(box);

      resize();

      /* Position along the rectangle edge */

      function point(s) {

        const p = 2 * (w + h);

        s = ((s % p) + p) % p;

        // Top edge
        if (s < w)
          return [x + s, y];

        // Right edge
        s -= w;

        if (s < h)
          return [x + w, y + s];

        // Bottom edge
        s -= h;

        if (s < w)
          return [x + w - s, y + h];

        // Left edge
        return [x, y + h - (s - w)];
      }

      /* Irregular natural movement */

      function noise(t) {

        return Math.sin(t) * 0.52
             + Math.sin(t * 2.31 + 2) * 0.3
             + Math.sin(t * 4.73 + 1) * 0.18;
      }

      /* Draw an individual flame */

      function tongue(
        t, dx, width, height,
        lean, phase, opacity, inner
      ) {

        const n = noise(t * 9 + phase);
        const m = noise(t * 13 + phase + 3);

        let H = height * (1 + 0.22 * n);
        let R = width * (1 + 0.12 * m);
        let L = lean + 3 * n;

        const g = ctx.createLinearGradient(
          dx, 1, dx + L, -H
        );

        if (inner) {

          // Bright inner flame
          g.addColorStop(0, "#fff7bf");
          g.addColorStop(0.35, "#ffffdf");
          g.addColorStop(0.68, "#ffd32b");
          g.addColorStop(1, "rgba(255,144,0,0)");

        } else {

          // Orange outer flame
          g.addColorStop(0, "#ffab18");
          g.addColorStop(0.25, "#ffcf36");
          g.addColorStop(0.55, "#ff8b09");
          g.addColorStop(0.8, "rgba(255,66,0,0.85)");
          g.addColorStop(1, "rgba(210,38,0,0.05)");

        }

        ctx.globalAlpha = opacity;
        ctx.fillStyle = g;

        ctx.beginPath();

        ctx.moveTo(dx - R * 0.9, 0);

        ctx.bezierCurveTo(
          dx - R * 1.3, -H * 0.25,
          dx - R * 0.6 + L * 0.3, -H * 0.46,
          dx + L * 0.35 - R * 0.27, -H * 0.62
        );

        ctx.bezierCurveTo(
          dx + L * 0.5 + R * 0.16, -H * 0.78,
          dx + L - R * 0.15, -H * 0.82,
          dx + L, -H
        );

        ctx.bezierCurveTo(
          dx + L + R * 0.22, -H * 0.68,
          dx + R + L * 0.3, -H * 0.48,
          dx + R * 0.92, -H * 0.21
        );

        ctx.quadraticCurveTo(
          dx + R * 0.8, 3,
          dx - R * 0.9, 0
        );

        ctx.fill();

        ctx.globalAlpha = 1;
      }

      /* Animation */

      const start = performance.now();

      function frame(now) {

        // Skip hidden rectangles
        if (!(w > 0 && h > 0) || !box.getClientRects().length) {
          requestAnimationFrame(frame);
          return;
        }

        const t = (now - start) / 1000;

        const p = 2 * (w + h);

        const s = (t / lapDuration % 1) * p + 20;

        ctx.clearRect(0, 0, W, H);

        /* Burning trail along the rectangle */

        for (let i = trailLength; i >= 1; i--) {

          const a = point(s - i);
          const b = point(s - i + 1);

          const v = 1 - i / (trailLength + 1);

          ctx.beginPath();

          ctx.moveTo(...a);
          ctx.lineTo(...b);

          ctx.strokeStyle =
            `rgba(255,${Math.round(70 + 140 * v)},30,${v * 0.8})`;

          ctx.lineWidth = 1 + v;

          ctx.stroke();
        }

        /* Current fire position */

        const [px, py] = point(s);

        ctx.save();

        ctx.translate(px, py);

        /* Smaller fire */

        ctx.scale(fireSize, fireSize);

        /* Gentle wind */

        const wind = -3 + 5 * noise(t * 2.2);

        /* Outer flames */

        tongue(t, -2, 8, 19, wind - 2, 1, 0.75, false);

        tongue(t, 3, 7, 23, wind + 3, 3, 0.82, false);

        tongue(t, -4, 5, 13, wind - 2, 6, 0.9, false);

        tongue(t, 0, 7, 18, wind, 9, 0.98, false);

        /* Bright inner flames */

        tongue(t, 1, 4.8, 13, wind * 0.6, 5, 1, true);

        tongue(t, -2, 3.4, 9, wind * 0.4, 7, 0.9, true);

        /* Tiny floating sparks */

        for (let i = 0; i < 4; i++) {

          const age = (t * 0.8 + i * 0.293) % 1;

          if (age > 0.85)
            continue;

          const sx =
            (i - 2) * 1.4
            + wind * age
            - 9 * age
            + 2 * Math.sin(age * 5 + i);

          const sy = -9 - age * (19 + i * 3);

          ctx.globalAlpha =
            Math.sin(age * Math.PI) * 0.85;

          ctx.fillStyle =
            i % 2 ? "#ffac39" : "#ffe48b";

          ctx.beginPath();

          ctx.arc(
            sx,
            sy,
            0.85 * (1 - age) + 0.25,
            0,
            Math.PI * 2
          );

          ctx.fill();
        }

        ctx.restore();

        requestAnimationFrame(frame);
      }

      requestAnimationFrame(frame);

    });

  }

  /* Initialize after HTML is loaded */

  if (document.readyState === "loading") {

    document.addEventListener(
      "DOMContentLoaded",
      initializeFire
    );

  } else {

    initializeFire();

  }

})();