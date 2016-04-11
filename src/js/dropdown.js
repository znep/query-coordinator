var Dropdown = module.exports = function(element) {
  this.dd = element;
  this.orientation = element.getAttribute('data-orientation') || 'bottom';
  this.selectable = element.hasAttribute('data-selectable');
  this.dd.classList.add('dropdown-orientation-' + this.orientation);

  this.placeholder = this.dd.querySelector('span');
  this.opts = Array.prototype.slice.call(this.dd.querySelectorAll('.dropdown-options > li'));
  this.val = '';
  this.index = -1;

  this.initEvents();
}

Dropdown.prototype = {
  initEvents: function() {
    var obj = this;

    obj.dd.addEventListener('click', function(event) {
      event.stopPropagation();
      obj.dd.classList.toggle('active');
      return false;
    });

    obj.opts.forEach(function(opt) {
      opt.addEventListener('click', function(event) {
        event.preventDefault();

        var node = opt;
        var index = 0;

        while ((node = node.previousElementSibling) !== null) {
          index++;
        }

        obj.val = opt.textContent;
        obj.index = index;

        if (obj.selectable) {
          obj.placeholder.innerHTML = opt.innerText.trim();
        }

        return false;
      });
    });
  }
}
