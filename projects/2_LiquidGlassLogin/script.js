/* --------------- tilt effect --------------- */
(function () {
  var card    = document.getElementById('tiltCard');
  var maxTilt = 18;

  function handleMove (evt) {
    var rect     = card.getBoundingClientRect();
    var x        = evt.clientX - rect.left;
    var y        = evt.clientY - rect.top;
    var centerX  = rect.width  / 2;
    var centerY  = rect.height / 2;

    var rotateY = ((x - centerX) / centerX) * maxTilt;
    var rotateX = -((y - centerY) / centerY) * maxTilt;

    card.style.transform =
      'perspective(600px) rotateX(' + rotateX + 'deg) rotateY(' +
      rotateY + 'deg) scale(1.03)';
  }

  function handleLeave () {
    card.style.transform =
      'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)';
  }

  card.addEventListener('mousemove', handleMove, false);
  card.addEventListener('mouseleave', handleLeave, false);
})();

/* --------------- button ripple --------------- */
(function () {
  var button = document.querySelector('.glass-button');

  if (!button) return;

  button.addEventListener('click', function (evt) {
    // remove any old ripple nodes
    var old = button.querySelector('.click-gradient');
    if (old) old.remove();

    // create a new ripple
    var ripple = document.createElement('span');
    ripple.className = 'click-gradient';
    button.appendChild(ripple);

    // position it where the user clicked
    var rect = button.getBoundingClientRect();
    ripple.style.left = (evt.clientX - rect.left) + 'px';
    ripple.style.top  = (evt.clientY - rect.top)  + 'px';
  });
})();
