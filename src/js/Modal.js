var velocity = require('velocity-animate');

var mobileBreakpoint = 420;
var animationDuration = 300;
var animationEasing = [.645, .045, .355, 1];

var ModalFactory = module.exports = function(element) {
  this.root = element;
  this.dismissals = Array.prototype.slice.apply(element.querySelectorAll('[data-modal-dismiss]'));
  this.openers = Array.prototype.slice.apply(element.querySelectorAll('[data-modal]'));
  this.lastFocusedItem = null;
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
          document.body.classList.remove('modal-open');
          this.restoreFocus(modal);
        }.bind(this));
      }
    }.bind(this));

    window.addEventListener('resize', function() {
      var modals = Array.prototype.slice.call(document.querySelectorAll('.modal:not(.modal-hidden)'));
      modals.forEach(function(modal) {
        this.reposition(modal.querySelector('.modal-container'));
      }.bind(this));
    }.bind(this));
  },

  open: function(event) {
    var modal = event.target.getAttribute('data-modal');
    modal = this.root.querySelector('#' + modal);
    modal.classList.remove('modal-hidden');

    document.body.classList.add('modal-open');

    var windowWidth = window.innerWidth;
    var modalContainer = modal.querySelector('.modal-container');

    if (windowWidth <= mobileBreakpoint) {
      modalContainer.style.left = windowWidth + 'px';

      velocity(modalContainer, {
        left: 0
      }, {
        duration: animationDuration,
        easing: animationEasing
      });
    }

    // Store last focused on element
    this.lastFocusedItem = document.querySelector(':focus');

    // Shift focus to the modal
    var elementToFocus = modalContainer.children[0] || modalContainer;
    elementToFocus.setAttribute('tabindex', '0');
    elementToFocus.focus();
    elementToFocus.style.outline = 'none';

    this.reposition(modalContainer);
  },

  dismiss: function(event) {
    var self = this;
    var target = event.target;

    var closeable = target === event.currentTarget && target.classList.contains('modal-overlay');
    var modal;

    // Find the modal and figure out if it's closeable.
    do {
      if (target.hasAttribute('data-modal-dismiss') &&
          !target.classList.contains('modal')) {
        closeable = true;
      } else if (target.classList.contains('modal')){
        modal = target;
        break;
      }
    } while((target = target.parentNode) !== self.root);

    if (!modal) {
      return;
    }

    function hideModal() {
      if (closeable) {
        document.body.classList.remove('modal-open');
        modal.classList.add('modal-hidden');

        self.restoreFocus(modal);
      }
    }

    var windowWidth = window.innerWidth;
    var modalContainer = modal.querySelector('.modal-container');

    if (windowWidth <= mobileBreakpoint && closeable) {
      velocity(modalContainer, {
        left: windowWidth
      }, {
        duration: animationDuration,
        easing: animationEasing,
        complete: hideModal
      });
    } else {
      hideModal();
    }
  },

  restoreFocus: function(modal) {
    var elementToFocus = modal.querySelector('.modal-container').children[0] || modal;
    elementToFocus.removeAttribute('tabindex');
    elementToFocus.style.outline = '';

    // Return focus to the last previously focused on element
    if (this.lastFocusedItem) {
      this.lastFocusedItem.focus();
      this.lastFocusedItem = null;
    }
  },

  reposition: function(modal) {
    if (modal.classList.contains('modal-hidden')) {
      return;
    }

    var windowWidth = window.innerWidth;

    if (windowWidth > mobileBreakpoint) {
      modal.style.margin = '';
    } else {
      modal.style.margin = 0;
    }
  }
};
