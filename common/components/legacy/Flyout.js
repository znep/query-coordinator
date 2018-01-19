import _ from 'lodash';


const reposition = function(hoverable) {
  var flyout = document.querySelector(`#${hoverable.getAttribute('data-flyout')}`);
  var left = 0;
  var top = 0;
  var arrowHeight = 16;
  var flyoutWidth = flyout.offsetWidth;
  var windowWidth = document.body.offsetWidth;
  var hoverableDimensions = hoverable.getBoundingClientRect();

  left = hoverableDimensions.left + (hoverable.offsetWidth / 2);
  top = hoverableDimensions.top + hoverable.offsetHeight + arrowHeight;

  if (left + flyoutWidth > windowWidth) {
    flyout.classList.remove('flyout-right');
    flyout.classList.add('flyout-left');
    left -= flyoutWidth;
  } else {
    flyout.classList.remove('flyout-left');
    flyout.classList.add('flyout-right');
  }

  flyout.style.left = `${left}px`;
  flyout.style.top = `${top}px`;
};

// Don't reposition more often than this (ms).
// It's largely fruitless to render more often than this,
// as modern browsers scroll on a separate GFX thread and don't
// even update the UI thread more than a couple times a second.
// Indeed, if we miss the end of a scroll because we weren't
// notified, we'll get a stale position. In Chrome, this seems
// to happen even if we reposition on every single event.
const scrollRepositionTimeConstant = 350;

const addGlobalEventHandlersOnce = _.once(() => {
  const repositionAll = () => {
    _.each(document.querySelectorAll('[data-flyout]'), reposition);
  };

  // Both throttle and debounce. We want to make sure we _always_ wait a little bit for the final scrolling
  // animation to stop (otherwise we will reposition using an intermediate position). If we just use
  // throttle(), we will not get a delay if only one scroll/wheel event happens. From the documentation:
  //
  // > Note: If leading and trailing options are true, func is invoked on the trailing edge of the timeout
  //   only if the throttled function is invoked *more than once* during the wait timeout. (emphasis ours).
  //
  //   A side benefit of debouncing/throttling is that all heavyweight DOM manipulation is done outside
  //   of the scroll event. This allows the browser to scroll more smoothly (though ideally we'd use
  //   passive event handlers - this is less useful today as other random bits of code already hook scroll
  //   events non-passively).
  const throttled = _.throttle(repositionAll, scrollRepositionTimeConstant, { trailing: false });
  const debounced = _.debounce(repositionAll, scrollRepositionTimeConstant);
  const handleScroll = () => {
    throttled();
    debounced();
  };
  window.addEventListener('scroll', handleScroll);
  window.addEventListener('wheel', handleScroll);
});

module.exports = function FlyoutFactory(element) {
  addGlobalEventHandlersOnce();
  var hoverables = Array.prototype.slice.apply(element.querySelectorAll('[data-flyout]'));

  if (element.hasAttribute('data-flyout')) {
    hoverables.push(element);
  }

  if (hoverables.length <= 0) {
    console.warn('FlyoutFactory: Unable to locate any hoverable elements.');
  }

  hoverables.forEach(function(hoverable) {
    if (hoverable.hasAttribute('flyout-bound')) {
      return;
    } else {
      hoverable.setAttribute('flyout-bound', true);
    }

    var flyout = element.querySelector(`#${hoverable.getAttribute('data-flyout')}`);
    var show = function() {
      flyout.classList.remove('flyout-hidden');
    };

    hoverable.addEventListener('mouseover', function() {
      show();
      reposition(hoverable);
    });

    hoverable.addEventListener('mouseout', function() {
      flyout.classList.add('flyout-hidden');
    });
  });
};
