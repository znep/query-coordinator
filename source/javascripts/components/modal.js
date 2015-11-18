function Modal(element) {
  this.root = element;
  this.dismissals = Array.prototype.slice.apply(element.querySelectorAll('[data-modal-dismiss]'));
  this.openers = Array.prototype.slice.apply(element.querySelectorAll('[data-modal]'));
  this.attachEvents();
}

Modal.prototype = {
  attachEvents: function() {
    this.dismissals.forEach(function (dismissal) {
      dismissal.addEventListener('click', this.dismiss.bind(this));
    }, this);

    this.openers.forEach(function (opener) {
      opener.addEventListener('click', this.open.bind(this));
    }, this);
  },
  open: function(event) {
    var modal = event.target.getAttribute('data-modal');
    modal = this.root.querySelector('#' + modal);
    modal.classList.remove('modal-hidden');
  },
  dismiss: function(event) {
    var target = event.target;
    var targetIsCurrentTarget = event.target === event.currentTarget;

    if (targetIsCurrentTarget) {
      do {
        if (target.classList.contains('modal')) {
          return target.classList.add('modal-hidden');
        }
      } while((target = target.parentNode) !== this.root);
    }
  }
};
