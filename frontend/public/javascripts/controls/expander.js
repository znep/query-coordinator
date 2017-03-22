(function($) {
  $.fn.expander = function(options) {
    // build main options before element iteration
    var opts = $.extend({}, $.fn.expander.defaults, options);

    // iterate and do stuff to each matched element
    return this.each(function() {
      var $expander = $(this);
      // build element specific options
      var config = $.meta ? $.extend({}, opts, $expander.data()) : opts;
      $expander.data('config-expander', config);

      var $content = $expander.find(config.contentSelector);
      var $expand = $expander.find(config.expandSelector);

      // don't show if there's no text, or it's only one line
      $content.removeClass('collapsed');
      var fullHeight = $content.height();
      $content.addClass('collapsed');

      if (!config.forceExpander &&
        ($.isBlank($content.text()) || (fullHeight == $content.height()))) {
        $expand.hide();
        $content.removeClass('collapsed');
        return;
      }

      $expand.addClass(config.expanderCollapsedClass);

      $expand.click(function(event) {
        event.preventDefault();
        var baseHeight;
        if ($expand.hasClass(config.expanderCollapsedClass)) {
          config.preExpandCallback($expander);
          // need to expand; measure how tall
          baseHeight = $content.css('height');
          $content.removeClass('collapsed').css('height', '');
          var targetHeight = $content.height();
          $expander.removeClass('collapsed');
          if (config.animate) {
            $content.css('height', baseHeight).animate({
              height: targetHeight
            },
            config.resizeFinishCallback);
          } else {
            $content.height(targetHeight);
            config.resizeFinishCallback();
          }
          $expand.removeClass(config.expanderCollapsedClass).
            addClass(config.expanderExpandedClass).
            attr('title', $.t('controls.common.expander.collapse'));
        } else {
          // need to collapse
          $content.addClass('collapsed').css('height', '');
          baseHeight = $content.height();
          $content.removeClass('collapsed');
          var finished = function() {
            // Un-set display so natural CSS styling can take effect
            $content.css('display', '');
            $content.addClass('collapsed');
            $expander.addClass('collapsed');
            config.resizeFinishCallback();
          };
          if (config.animate) {
            $content.animate({
              height: baseHeight
            }, finished);
          } else {
            $content.height(baseHeight);
            finished();
          }
          $expand.removeClass(config.expanderExpandedClass).
            addClass(config.expanderCollapsedClass).
            attr('title', $.t('controls.common.expander.expand'));
        }
      });

    });
  };

  //
  // plugin defaults
  //
  $.fn.expander.defaults = {
    animate: true,
    contentSelector: '.content',
    expanderCollapsedClass: 'downArrow',
    expanderExpandedClass: 'upArrow',
    expandSelector: '.expand',
    forceExpander: false,
    moveExpandTrigger: false,
    preExpandCallback: function() {},
    resizeFinishCallback: function() {}
  };

})(jQuery);
