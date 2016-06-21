module.exports = function FlyoutFactory(element) {
  var padding = 10;
  var hoverables = Array.prototype.slice.apply(element.querySelectorAll('[data-flyout]'));

  hoverables.forEach(function(hoverable) {
    var flyout = element.querySelector('#' + hoverable.getAttribute('data-flyout'));

    hoverable.addEventListener('mouseover', function() {
      flyout.classList.remove('flyout-hidden');
      var node = hoverable;
      var left = 0;
      var top = 0;
      var flyoutWidth = flyout.offsetWidth;
      var windowWidth = document.body.offsetWidth;

      do {
        left += node.offsetLeft;
        top += node.offsetTop;
      } while ((node = node.offsetParent) !== null);

      left = left + hoverable.offsetWidth / 2;
      top = top + hoverable.offsetHeight + padding;

      if (left + flyoutWidth > windowWidth) {
        flyout.classList.remove('flyout-right');
        flyout.classList.add('flyout-left');
        left -= flyoutWidth;
      } else {
        flyout.classList.remove('flyout-left');
        flyout.classList.add('flyout-right');
      }

      flyout.style.left = left + 'px';
      flyout.style.top = top + 'px';
    });

    hoverable.addEventListener('mouseout', function() {
      flyout.classList.add('flyout-hidden');
    });
  });

}
