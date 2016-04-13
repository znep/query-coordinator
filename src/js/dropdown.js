var DropdownFactory = module.exports = function(element) {
  this.dropdowns = Array.prototype.slice.call(element.querySelectorAll('[data-dropdown]'));
  this.dropdowns.forEach(function(dropdown) {
    new Dropdown(dropdown);
  });
}

var Dropdown = function(element) {
  this.dd = element;
  this.orientation = this.dd.getAttribute('data-orientation') || 'bottom';
  this.selectable = this.dd.hasAttribute('data-selectable');

  this.dd.classList.add('dropdown-orientation-' + this.orientation);

  this.placeholder = this.dd.querySelector('span');
  this.opts = Array.prototype.slice.call(this.dd.querySelectorAll('.dropdown-options > li'));

  this.dd.dataset.value = '';
  this.dd.dataset.index = -1;

  this.initEvents();
};

Dropdown.prototype = {
  initEvents: function() {
    var obj = this;

    obj.dd.addEventListener('click', function(event) {
      event.stopPropagation();
      obj.dd.classList.toggle('active');
      return false;
    });

    if (obj.selectable) {
      obj.opts.forEach(function(opt) {
        opt.addEventListener('click', function(event) {
          event.preventDefault();

          var node = opt;
          var index = 0;

          while ((node = node.previousElementSibling) !== null) {
            index++;
          }

          obj.dd.dataset.value = opt.textContent;
          obj.dd.dataset.index = index;

          obj.placeholder.innerHTML = opt.innerText.trim();

          return false;
        });
      });
    }

    document.addEventListener('click', function() {
      Array.from(document.querySelectorAll('.dropdown')).forEach(function(dropdown) {
        dropdown.classList.remove('active');
      });
    });
  }
}
