var velocity = require('velocity-animate');

module.exports = function FlannelFactory() {
  var mobileBreakpoint = 420;
  var animationDuration = 300;
  var animationEasing = [.645, .045, .355, 1];
  var padding = 10;
  var hoverables = Array.prototype.slice.apply(document.querySelectorAll('[data-flannel]'));

  function hideFlannel(flannel, hoverable) {
    if (document.body.offsetWidth < mobileBreakpoint) {
      velocity(flannel, {
        left: document.body.offsetWidth
      }, {
        duration: animationDuration,
        easing: animationEasing,
        complete: function() {
          flannel.classList.add('flannel-hidden');
          hoverable.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    } else {
      flannel.classList.add('flannel-hidden');
      hoverable.classList.remove('active');
    }
  }

  function positionFlannel(flannel, hoverable) {
    var node = hoverable;
    var left = 0;
    var top = 0;
    var flannelWidth = flannel.getBoundingClientRect().width;
    var windowWidth = document.body.offsetWidth;

    do {
      left += node.offsetLeft;
      top += node.offsetTop;
    } while ((node = node.offsetParent) !== null);

    left = left + hoverable.offsetWidth / 2;
    top = top + hoverable.offsetHeight + padding;

    if (left + flannelWidth > windowWidth && windowWidth >= mobileBreakpoint) {
      flannel.classList.remove('flannel-right');
      flannel.classList.add('flannel-left');
      left -= flannelWidth;
    } else {
      flannel.classList.remove('flannel-left');
      flannel.classList.add('flannel-right');
    }

    if (windowWidth >= mobileBreakpoint) {
      flannel.style.left = left + 'px';
      flannel.style.top = top + 'px';
      document.body.style.overflow = '';
    } else {
      flannel.style.left = windowWidth + 'px';
      flannel.style.top = 0;
      velocity(flannel, {
        left: 0
      }, {
        duration: animationDuration,
        easing: animationEasing,
        complete: function() {
          document.body.style.overflow = 'hidden';
        }
      });
    }
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
      event.stopPropagation();

      flannel.classList.toggle('flannel-hidden');
      positionFlannel(flannel, hoverable);
    });

    document.body.addEventListener('click', function(event) {
      if (flannel.classList.contains('flannel-hidden')) {
        return;
      }

      var node = event.target;

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

    positionFlannel(flannel, hoverable);
  });
}
