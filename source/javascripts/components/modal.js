function ModalFactory(element) {
  this.root = element;
  this.dismissals = Array.prototype.slice.apply(element.querySelectorAll('[data-modal-dismiss]'));
  this.openers = Array.prototype.slice.apply(element.querySelectorAll('[data-modal]'));
  this.attachEvents();
}

ModalFactory.prototype = {
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
    var closeable = target === event.currentTarget &&
      target.classList.contains('modal-overlay');

    do {
      if (target.hasAttribute('data-modal-dismiss') &&
          !target.classList.contains('modal')) {
        closeable = true;
      } else if (target.classList.contains('modal') && closeable) {
        return target.classList.add('modal-hidden');
      } else if (target.classList.contains('modal')){
        return;
      }
    } while((target = target.parentNode) !== this.root);
  }
};
