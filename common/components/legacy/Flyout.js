module.exports = function FlyoutFactory(element) {
  var hoverables = Array.prototype.slice.apply(element.querySelectorAll('[data-flyout]'));

  if (element.hasAttribute('data-flyout')) {
    hoverables.push(element);
  }

  if (hoverables.length <= 0) {
    console.warn('FlyoutFactory: Unable to locate any hoverable elements.');
  }

  hoverables.forEach(function(hoverable) {
    var flyout = element.querySelector(`#${hoverable.getAttribute('data-flyout')}`);
    var show = function() {
      flyout.classList.remove('flyout-hidden');
    };

    var reposition = function() {
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

    window.addEventListener('scroll', reposition);
    window.addEventListener('wheel', reposition);

    hoverable.addEventListener('mouseover', function() {
      show();
      reposition();
    });

    hoverable.addEventListener('mouseout', function() {
      flyout.classList.add('flyout-hidden');
    });
  });
};
