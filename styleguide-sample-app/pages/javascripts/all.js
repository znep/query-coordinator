document.addEventListener('DOMContentLoaded', function() {

  styleguide.attachTo(document);

  /**
   * Fancy demo stuff.
   * Make the responsive navbar collapse to a smaller version.
   */
  function collapse(event) {
    if (!menu) { return; }

    if (event.pageY > 500) {
      navbar.classList.add('responsive-navbar-collapsed');
      buttons.forEach(function(button) {
        button.classList.add('btn-xs');
      });
    } else {
      navbar.classList.remove('responsive-navbar-collapsed');
      buttons.forEach(function(button) {
        button.classList.remove('btn-xs');
      });
    }

    menu.style.marginTop = navbar.offsetHeight + 'px';
  }

  var navbar = document.querySelector('body > .responsive-navbar');
  var buttons = Array.prototype.slice.call(navbar.querySelectorAll('.btn'));
  var menu = document.querySelector('#pagemap');
  var anchors = Array.prototype.slice.call(document.querySelectorAll('.menu a'));

  document.addEventListener('wheel', collapse);
  anchors.forEach(function(anchor) {
    anchor.addEventListener('click', function() {
      setTimeout(function() {
        if (document.scrollingElement) {
          collapse({pageY: document.scrollingElement.scrollTop});
        }
      });
    });
  });

  if (document.scrollingElement) {
    collapse({pageY: document.scrollingElement.scrollTop});
  }
});
