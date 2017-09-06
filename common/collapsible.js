import _ from 'lodash';
import 'dotdotdot';
import 'velocity-animate';

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

  $el.find('.collapse-toggle').
    off('click').
    on('click', (event) => {
      var velocityOptions = {
        duration: 320,
        easing: [0.645, 0.045, 0.355, 1]
      };

      event.preventDefault();

      if (parent.dataset.collapsed) {
        delete parent.dataset.collapsed;

        // Reset dotdotdot
        $el.trigger('destroy');
        el.style.height = 'auto';

        parent.style.height = `${collapsedHeight}px`;

        $(parent).velocity({
          height: originalHeight
        }, velocityOptions);

        if (_.isFunction(expandedCallback)) {
          expandedCallback();
        }
      } else {
        velocityOptions.complete = collapse;

        $(parent).velocity({
          height: collapsedHeight
        }, velocityOptions);
      }
    });

  collapse();
};
