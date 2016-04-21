var velocity = require('velocity-animate');

$.Velocity.defaults.duration = 320;
$.Velocity.defaults.easing = [.645, .045, .355, 1];

module.exports = function(el, options) {
  var parent = el.parentElement;
  var collapsedHeight = null;
  var originalHeight = parent.getBoundingClientRect().height;

  var dotdotdotOptions = {
    after: '.collapse-toggle.more',
    watch: true,
    callback: function(isTruncated) {
      var parentHeight = parent.getBoundingClientRect().height;
      if (isTruncated && parentHeight !== originalHeight) {
        parent.dataset.collapsed = true;
        collapsedHeight = collapsedHeight || parentHeight;
      } else {
        var toggles = Array.prototype.slice.call(el.querySelectorAll('.collapse-toggle'));
        toggles.forEach(function(toggle) {
          toggle.style.display = 'none';
        });
      }
    }
  };

  for (var prop in options) {
    dotdotdotOptions[prop] = options[prop];
  }

  function collapse() {
    $(el).dotdotdot(dotdotdotOptions);
  }

  $(el).find('.collapse-toggle').click(function(event) {
    event.preventDefault();

    if (parent.dataset.collapsed) {
      delete parent.dataset.collapsed;

      // Reset dotdotdot
      el.dispatchEvent(new Event('destroy'));
      el.style.height = 'auto';

      parent.style.height = collapsedHeight + 'px';

      velocity(parent, {
        height: originalHeight
      });
    } else {
      velocity(parent, {
        height: collapsedHeight
      }, collapse);
    }
  });

  collapse();
};
