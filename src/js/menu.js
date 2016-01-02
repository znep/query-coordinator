function MenuFactory(element) {
  var menus = Array.prototype.slice.call(element.querySelectorAll('.menu'));
  var toggles = Array.prototype.slice.call(element.querySelectorAll('[data-menu-toggle]'));

  toggles.forEach(function(toggle) {
    toggle.addEventListener('click', function() {
      var menu = element.querySelector('#' + toggle.getAttribute('data-menu-toggle'));
      menu.classList.toggle('active');
    });
  });

  menus.forEach(function(menu) {
    var dismissals = Array.prototype.slice.call(menu.querySelectorAll('[data-menu-dismiss]'));

    dismissals.forEach(function(dismissal) {
      dismissal.addEventListener('click', function() {
        menu.classList.remove('active');
        document.querySelector('[data-menu-toggle="' + menu.id + '"]').classList.remove('active');
      });
    });
  });
}
