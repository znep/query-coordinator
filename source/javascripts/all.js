//= require_tree .

document.addEventListener('DOMContentLoaded', function() {
  if (document.querySelector('#dd')) {
    var dd = new DropDown( document.querySelector('#dd') );
  }

  if (document.querySelector('#du')) {
    var du = new DropDown( document.querySelector('#du') );
  }

  document.addEventListener('click', function() {
    // all dropdowns
    var dropdowns = document.querySelectorAll('.dropdown')
    for (var i = 0; i < dropdowns.length; i++) {
      dropdowns[i].classList.remove('active');
    }
  });

  var modalFactory = new ModalFactory( document );
  var toggleFactory = new ToggleFactory( document );
  var flyoutFactory = new FlyoutFactory( document );
  var flannelFactory = new FlannelFactory( document );
  var menuFactory = new MenuFactory( document );

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
