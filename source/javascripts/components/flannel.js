function FlannelFactory(element) {
  var padding = 10;
  var hoverables = Array.prototype.slice.apply(document.querySelectorAll('[data-flannel]'));

  hoverables.forEach(function(hoverable) {
    var flannel = document.querySelector('#' + hoverable.getAttribute('data-flannel'));
    var dismissals = Array.prototype.slice.apply(flannel.querySelectorAll('[data-flannel-dismiss]'));

    dismissals.forEach(function(dismissal) {
      dismissal.addEventListener('click', function() {
        flannel.classList.add('flannel-hidden');
        hoverable.classList.remove('active');
      });
    });

    hoverable.addEventListener('click', function() {
      flannel.classList.toggle('flannel-hidden');
      var node = hoverable;
      var left = 0;
      var top = 0;

      do {
        left += node.offsetLeft;
        top += node.offsetTop;
      } while ((node = node.offsetParent) !== null);

      left = left;
      top = top + hoverable.offsetHeight + padding;

      flannel.style.left = left + 'px';
      flannel.style.top = top + 'px';
    });
  });

}
