var velocity = require('velocity-animate');

module.exports = function FlannelFactory() {
  var mobileBreakpoint = 420;
  var animationDuration = 300;
  var animationEasing = [.645, .045, .355, 1];
  var hoverables = Array.prototype.slice.apply(document.querySelectorAll('[data-flannel]'));
  var lastFocusedItem = null;

  function hideFlannel(flannel, hoverable) {
    if (window.innerWidth <= mobileBreakpoint) {
      document.body.classList.remove('modal-open');
      velocity(flannel, {
        left: window.innerWidth
      }, {
        duration: animationDuration,
        easing: animationEasing,
        complete: function() {
          flannel.classList.add('flannel-hidden');
          hoverable.classList.remove('active');
        }
      });
    } else {
      flannel.classList.add('flannel-hidden');
      hoverable.classList.remove('active');
    }

    var elementToFocus = flannel.children[0] || flannel;
    elementToFocus.removeAttribute('tabindex');
    elementToFocus.style.outline = '';

    // Return focus to the last previously focused on element
    if (lastFocusedItem) {
      lastFocusedItem.focus();
      lastFocusedItem = null;
    }
  }

  function positionFlannel(flannel, hoverable) {
    var arrowHeight = 16;
    var left = 0;
    var top = 0;
    var flannelWidth = flannel.getBoundingClientRect().width;
    var bodyWidth = document.body.offsetWidth; // Without scrollbar
    var windowWidth = window.innerWidth; // With scrollbar

    if (windowWidth <= mobileBreakpoint) {
      document.body.classList.add('modal-open');
      flannel.style.left = 0;
      flannel.style.top = 0;
      return;
    }

    var hoverableDimensions = hoverable.getBoundingClientRect();

    left = hoverableDimensions.left + (hoverable.offsetWidth / 2);
    top = hoverableDimensions.top + hoverable.offsetHeight + arrowHeight;

    if (left + flannelWidth > bodyWidth && windowWidth > mobileBreakpoint) {
      flannel.classList.remove('flannel-right');
      flannel.classList.add('flannel-left');
      left -= flannelWidth;
    } else {
      flannel.classList.remove('flannel-left');
      flannel.classList.add('flannel-right');
    }

    flannel.style.left = left + 'px';
    flannel.style.top = top + 'px';
    document.body.classList.remove('modal-open');
  }

  hoverables.forEach(function(hoverable) {
    var flannelId = hoverable.getAttribute('data-flannel');
    var flannel = document.querySelector('#' + flannelId);
    var dismissals = Array.prototype.slice.apply(flannel.querySelectorAll('[data-flannel-dismiss]'));

    dismissals.forEach(function(dismissal) {
      dismissal.addEventListener('click', function() {
        hideFlannel(flannel, hoverable);
      });
    });

    hoverable.addEventListener('click', function(event) {
      var windowWidth = window.innerWidth;
      event.preventDefault();
      event.stopPropagation();

      if (windowWidth > mobileBreakpoint) {
        flannel.classList.toggle('flannel-hidden');
        positionFlannel(flannel, hoverable);
      } else {
        flannel.classList.remove('flannel-hidden');
        flannel.style.left = windowWidth + 'px';
        flannel.style.top = 0;
        document.body.classList.add('modal-open');

        velocity(flannel, {
          left: 0
        }, {
          duration: animationDuration,
          easing: animationEasing
        });
      }

      // Store last focused on element
      lastFocusedItem = document.querySelector(':focus');

      // Shift focus to the flannel
      var elementToFocus = flannel.children[0] || flannel;
      elementToFocus.setAttribute('tabindex', '0');
      elementToFocus.focus();
      elementToFocus.style.outline = 'none';
    });

    var boundPositionFlannel = positionFlannel.bind(null, flannel, hoverable);
    window.addEventListener('scroll', boundPositionFlannel);
    window.addEventListener('wheel', boundPositionFlannel);

    document.body.addEventListener('click', function(event) {
      var node = event.target;

      if (node === hoverable || flannel.classList.contains('flannel-hidden')) {
        return;
      }

      while (node.parentElement) {
        if (node.id === flannelId) {
          return;
        }
        node = node.parentElement;
      }

      hideFlannel(flannel, hoverable);
    });

    document.body.addEventListener('keyup', function(event) {
      var key = event.which || event.keyCode;

      // ESC
      if (key === 27) {
        hideFlannel(flannel, hoverable);
      }
    });

    window.addEventListener('resize', function() {
      if (!flannel.classList.contains('flannel-hidden')) {
        positionFlannel(flannel, hoverable);
      }
    });
  });
}
