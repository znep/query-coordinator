(function($) {

    // Handle behavior for the selectable lists on the bilsts screen and in the info pane.
    $.fn.blistSelectableList = function(options) {
      var opts = $.extend({}, $.fn.blistSelectableList.defaults, options);

      return this.each(function() 
      {
        var $this = $(this);

        // Support for the Metadata Plugin.
        var o = $.meta ? $.extend({}, opts, $this.data()) : opts;

        // Handle the row hover.
        // Attach to the parent so that the row will remove the highlight when
        // hovering over the scroll bar.
        $this.parent().mousemove( function(event) 
        {
            if (!$(event.target).closest("tr.item").length > 0)
            {
                $this.find("tr.item").removeClass("hover");
            }
            else
            {
                $this.find("tr.item").removeClass("hover");
                $(event.target).closest("tr.item").addClass("hover");
            }
        });
        $this.parent().mouseout( function(event)
        {
            $this.find("tr.item").removeClass("hover");
        });

        $this.click( function(event)
        {
            var $target = $(event.target);
            if ($target.hasClass('expander') || $target.is('a'))
            {
                return;
            }
            else
            {
                $target.closest("tr.item").toggleClass('selected');
                opts.rowSelectionHandler();
            }
        });
      });
    };

    // default options
    $.fn.blistSelectableList.defaults = {
        rowSelectionHandler: function() {}
    };


    // Handle hover behavior for item rows in the grid lists.
    $.fn.blistListHoverItems = function(options) {
        var opts = $.extend({}, $.fn.blistListHoverItems.defaults, options);

        return this.each(function() 
        {
            var $this = $(this);

            // Support for the Metadata Plugin.
            var o = $.meta ? $.extend({}, opts, $this.data()) : opts;

            $this.find(opts.hoverItemSelector).hover(
                function() { $(this).addClass("hover"); },
                function() { $(this).removeClass("hover"); }
            );
        });
    };

    // default options
    $.fn.blistListHoverItems.defaults = {
        hoverItemSelector: "tr.item"
    };

})(jQuery);
