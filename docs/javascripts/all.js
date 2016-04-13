//= require vendor/prism
//= require vendor/styleguide

document.addEventListener('DOMContentLoaded', function() {
  /**
   * Fancy demo stuff.
   * Make the responsive navbar collapse to a smaller version.
   */
  function collapse(event) {
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
        collapse({pageY: document.scrollingElement.scrollTop});
      });
    });
  });

  collapse({pageY: document.scrollingElement.scrollTop});
});
