function ToggleFactory(element) {
  var toggles = Array.prototype.slice.apply(element.querySelectorAll('[data-toggle]'));
  this.element = element;

  toggles.forEach(function(toggle) {
    toggle.addEventListener('click', this.toggle.bind(this));
  }, this);
}

ToggleFactory.prototype = {
  toggle: function(event) {
    var target = event.target;

    do {
      if (target.hasAttribute('data-toggle')) {
        return target.classList.toggle('active')
      }
    } while((target = target.parentNode) !== this.element)
  }
}
