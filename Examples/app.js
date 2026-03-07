// Scroll-in reveal
(function () {
  var nodes = document.querySelectorAll(".reveal, .card");
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) e.target.classList.add("show");
      });
    },
    { threshold: 0.12 }
  );
  nodes.forEach(function (n) {
    io.observe(n);
  });
})();

// Search + filter
(function () {
  var searchBox = document.getElementById("searchBox");
  var categoryFilter = document.getElementById("categoryFilter");
  var projects = Array.prototype.slice.call(document.querySelectorAll(".project"));
  var sections = Array.prototype.slice.call(document.querySelectorAll("section[data-section]"));

  function norm(s) {
    return (s || "").toLowerCase().trim();
  }

  function apply() {
    var q = norm(searchBox.value);
    var cat = categoryFilter.value;

    projects.forEach(function (card) {
      var title = norm(card.getAttribute("data-title"));
      var tags = norm(card.getAttribute("data-tags"));
      var ccat = norm(card.getAttribute("data-category"));

      var okCat = cat === "all" ? true : ccat === cat;
      var okQ = !q ? true : title.indexOf(q) !== -1 || tags.indexOf(q) !== -1;

      card.style.display = okCat && okQ ? "" : "none";
    });

    // Hide whole sections if all cards inside are hidden
    sections.forEach(function (sec) {
      var anyVisible = false;
      sec.querySelectorAll(".project").forEach(function (card) {
        if (card.style.display !== "none") anyVisible = true;
      });
      sec.style.display = anyVisible ? "" : "none";
    });
  }

  searchBox.addEventListener("input", apply);
  categoryFilter.addEventListener("change", apply);
})();

// Hover tilt / parallax (independent per card)
(function () {
  var cards = document.querySelectorAll(".card");

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  cards.forEach(function (card) {
    var rect = null;
    var isTouch = false;

    card.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "touch") isTouch = true;
    });

    card.addEventListener("pointerenter", function () {
      if (isTouch) return;
      rect = card.getBoundingClientRect();
    });

    card.addEventListener("pointermove", function (e) {
      if (isTouch) return;
      if (!rect) rect = card.getBoundingClientRect();

      var x = (e.clientX - rect.left) / rect.width; // 0..1
      var y = (e.clientY - rect.top) / rect.height; // 0..1

      var rx = clamp((0.5 - y) * 10, -10, 10);
      var ry = clamp((x - 0.5) * 12, -12, 12);

      card.style.transform =
        "perspective(900px) rotateX(" +
        rx +
        "deg) rotateY(" +
        ry +
        "deg) translateY(-2px)";
    });

    card.addEventListener("pointerleave", function () {
      rect = null;
      card.style.transform = "";
    });
  });
})();
