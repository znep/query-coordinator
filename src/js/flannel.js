var velocity = require('velocity-animate');

var FlannelFactory = module.exports = function(element) {
  var mobileBreakpoint = 420;
  var padding = 10;
  var hoverables = Array.prototype.slice.apply(document.querySelectorAll('[data-flannel]'));

  hoverables.forEach(function(hoverable) {
    var flannelId = hoverable.getAttribute('data-flannel');
    var flannel = document.querySelector('#' + flannelId);
    var dismissals = Array.prototype.slice.apply(flannel.querySelectorAll('[data-flannel-dismiss]'));

    function hideFlannel() {
      if (document.body.offsetWidth < mobileBreakpoint) {
        velocity(flannel, {
          left: document.body.offsetWidth
        }, {
          duration: 350,
          complete: function() {
            flannel.classList.add('flannel-hidden');
            hoverable.classList.remove('active');
          }
        });

        document.body.style.overflow = '';
      } else {
        flannel.classList.add('flannel-hidden');
        hoverable.classList.remove('active');
      }
    }

    function positionFlannel() {
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
      } else {
        flannel.style.left = windowWidth + 'px';
        flannel.style.top = 0;
        velocity(flannel, {
          left: 0
        }, 350);
        document.body.style.overflow = 'hidden';
      }
    }

    dismissals.forEach(function(dismissal) {
      dismissal.addEventListener('click', hideFlannel);
    });

    hoverable.addEventListener('click', function(event) {
      event.stopPropagation();

      flannel.classList.toggle('flannel-hidden');
      positionFlannel();
    });

    document.body.addEventListener('click', function(event) {
      var node = event.target;

      while (node.parentElement) {
        if (node.id === flannelId) {
          return;
        }

        node = node.parentElement;
      }

      hideFlannel();
    });

    document.body.addEventListener('keyup', function(event) {
      var key = event.which || event.keyCode;

      if (key === 27) {
        hideFlannel();
      }
    });

    window.addEventListener('resize', function() {
      if (!flannel.classList.contains('flannel-hidden')) {
        positionFlannel();
      }
    });
  });
}
