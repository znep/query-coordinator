import _ from 'lodash';
import 'dotdotdot';

var velocity = require('velocity-animate');

velocity.defaults.duration = 320;
velocity.defaults.easing = [0.645, 0.045, 0.355, 1];

module.exports = function(el, options) {
  var $el = $(el);
  var parent = el.parentElement;
  var collapsedHeight = null;
  var originalHeight = parent.getBoundingClientRect().height;
  var expandedCallback = options.expandedCallback;

  var dotdotdotOptions = {
    after: '.collapse-toggle.more',
    watch: true,
    callback: function(isTruncated) {
      var parentHeight = parent.getBoundingClientRect().height;
      if (isTruncated && parentHeight !== originalHeight) {
        parent.dataset.collapsed = true;
        collapsedHeight = collapsedHeight || parentHeight;
      } else {
        var toggles = _.toArray(el.querySelectorAll('.collapse-toggle'));
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
    $el.dotdotdot(dotdotdotOptions);
  }

  $el.find('.collapse-toggle').click(function(event) {
    event.preventDefault();

    if (parent.dataset.collapsed) {
      delete parent.dataset.collapsed;

      // Reset dotdotdot
      $el.trigger('destroy');
      el.style.height = 'auto';

      parent.style.height = `${collapsedHeight}px`;

      velocity(parent, {
        height: originalHeight
      });

      if (_.isFunction(expandedCallback)) {
        expandedCallback();
      }
    } else {
      velocity(parent, {
        height: collapsedHeight
      }, collapse);
    }
  });

  collapse();
};
