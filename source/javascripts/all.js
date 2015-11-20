//= require_tree .

document.addEventListener('DOMContentLoaded', function() {
	//var dd = new DropDown( document.querySelector('#dd') );
  //var du = new DropDown( document.querySelector('#du') );

  var modalFactory = new ModalFactory( document );
  var toggleFactory = new ToggleFactory( document );
  var flyoutFactory = new FlyoutFactory( document );
  var flannelFactory = new FlannelFactory( document );
  var menuFactory = new MenuFactory( document );

  document.addEventListener('click', function() {
		// all dropdowns
    var dropdowns = document.querySelectorAll('.dropdown')
    for (var i = 0; i < dropdowns.length; i++) {
      dropdowns[i].classList.remove('active');
    }
	});


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

  document.addEventListener('wheel', collapse);
  collapse({pageY: document.scrollingElement.scrollTop});
});
