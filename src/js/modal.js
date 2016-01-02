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

    document.addEventListener('keyup', function(event) {
      var key = event.which || event.keyCode;

      // ESC
      if (key === 27) {
        var modals = Array.prototype.slice.call(document.querySelectorAll('.modal:not(.modal-hidden)'));
        modals.forEach(function(modal) {
          modal.classList.add('modal-hidden');
        });
      }
    });
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
