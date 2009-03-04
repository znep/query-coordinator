(function($) {
// Hooks up a show/hide button to a given panel.
$.fn.blistPanelExpander = function(options) {
  var opts = $.extend({}, $.fn.blistPanelExpander.defaults, options);

  return this.each(function() {
    var $this = $(this);

    // Support for the Metadata Plugin.
    var o = $.meta ? $.extend({}, opts, $this.data()) : opts;
    
    $this.find(opts.expanderLinkSelector).click(function()
    {
        $(this).closest(opts.expandContainerSelector)
            .find(opts.expandablePanelSelector)
            .toggle("fast", opts.expandCompleteCallback);

        $(this).text($(this).text() == "Hide" ? "Show" : "Hide");
    });

  });
};

// default options
$.fn.blistPanelExpander.defaults = {
    expandContainerSelector: ".expandContainer",
    expandablePanelSelector: ".expandable",
    expanderLinkSelector: ".expander" 
};

})(jQuery);
