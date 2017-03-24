blist.namespace.fetch('blist.util.sizing');

blist.util.sizing.cachedInfoPaneHeight = 0;

// Protect $
(function($) {

  // Automatically fit the given elements to the height of the document,
  // taking into account other items in the flow.
  $.fn.blistFitWindow = function(options) {
    var opts = $.extend({}, $.fn.blistFitWindow.defaults, options);
    var isFitting = false;

    return this.each(function() {
      var $this = $(this);

      var naturalHeight = $this.height('auto').height();

      // First size content to full document height, to make sure it is the
      //  largest thing on the page and causing the overflow
      $this.height($(document).height());

      // Fix for IE7. If this line isn't here, IE7 will not resize properly.
      $this.height();

      var adjustedHeight = $(document).height();
      if ($this.parents(opts.columnSelector).
        find(opts.isExpandedSelector).length > 0) {
        adjustedHeight -= $(opts.expandableSelector).height();
        adjustedHeight += opts.cachedExpandableSelectorHeight;
      }

      var newHeight = Math.max(0,
        $this.height() - (adjustedHeight -
          Math.max($('body').minSize().height,
            $(window).height())));
      // Are we fitting (adding a scroll bar)?
      // If so, stash this so all fit windows account for the footer.
      isFitting = isFitting || newHeight < naturalHeight;
      newHeight = isFitting ? newHeight + $(opts.footerSelector).height() :
        newHeight;

      // Then clip it by how much the document overflows the window
      $this.height(newHeight);
    });
  };

  // default options
  $.fn.blistFitWindow.defaults = {
    columnSelector: '.scrollContentColumn',
    expandableSelector: '#infoPane:not(:empty)',
    // was: #infoPane:not(:empty):has(.expanded) -- 6.7 seconds saved with 50 comments.
    isExpandedSelector: '#infoPane .expanded:visible',
    cachedExpandableSelectorHeight: 0,
    footerSelector: '#footer'
  };

  // Stretch an element to fit inside of a containing element.
  $.fn.blistStretchWindow = function(options) {
    var opts = $.extend({}, $.fn.blistStretchWindow.defaults, options);

    return this.each(function() {
      var $this = $(this);
      var $container = $(opts.stretchContainerSelector);

      // Size the element back to its natural height.
      $this.height('auto');

      // Size the container element back to its natural height, then cache
      // the result.
      $container.height('auto');
      var naturalContainerHeight = $container.height();

      // Size the element to the height of the container.
      $this.height($container.height());

      // Clip the element by how much bigger the element is than
      // the original (natural) height of the container.
      $this.height(
        Math.max($this.height() - ($container.height() - naturalContainerHeight))
      );
    });
  };

  $.fn.blistStretchWindow.defaults = {
    stretchContainerSelector: '.bodyExterior'
  };

})(jQuery);
