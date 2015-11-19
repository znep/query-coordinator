function FlyoutFactory(element) {
  var padding = 10;
  var hoverables = Array.prototype.slice.apply(document.querySelectorAll('[data-flyout]'));

  hoverables.forEach(function(hoverable) {
    var flyout = document.querySelector('#' + hoverable.getAttribute('data-flyout'));

    hoverable.addEventListener('mouseover', function() {
      flyout.classList.remove('flyout-hidden');
      var node = hoverable;
      var left = 0;
      var top = 0;

      do {
        left += node.offsetLeft;
        top += node.offsetTop;
      } while ((node = node.offsetParent) !== null);

      left = left + hoverable.offsetWidth / 2;
      top = top + hoverable.offsetHeight + padding;

      flyout.style.left = left + 'px';
      flyout.style.top = top + 'px';
    });

    hoverable.addEventListener('mouseout', function() {
      flyout.classList.add('flyout-hidden');
    });
  });

}
