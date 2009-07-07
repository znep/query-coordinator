(function($) {

    // Handle behavior for the selectable lists on the bilsts screen and in the info pane.
    $.fn.blistSelectableList = function(options) {
      var opts = $.extend({}, $.fn.blistSelectableList.defaults, options);

      return this.each(function() 
      {
        var $table = $(this);

        // Support for the Metadata Plugin.
        var o = $.meta ? $.extend({}, opts, $table.data()) : opts;

        // Handle the row hover.
        // Attach to the parent so that the row will remove the highlight when
        // hovering over the scroll bar.
        $table.parent().mousemove( function(event) 
        {
            if (!$(event.target).closest("tr.item").length > 0)
            {
                $table.find("tr.item").removeClass("hover");
            }
            else
            {
                $table.find("tr.item").removeClass("hover");
                $(event.target).closest("tr.item").addClass("hover");
            }
        });
        $table.parent().mouseout( function(event)
        {
            $table.find("tr.item").removeClass("hover");
        });
        
        $table.click( function(event)
        {
            var $target = $(event.target);
            if ($target.hasClass('expander') || $target.is('a') || $target.is('a *') || $target.is('.noselect *'))
            {
                return;
            }
            else
            {
                var $targetRow = $target.closest("tr.item");
                
                if (event.shiftKey) // If shift key down:
                {
                    // Get all selected rows.
                    var $selectedRows = $table.find("tr.item.selected");
                    // If nothing is selected, or if only this row is selected, toggle the selection of this row.
                    if ($selectedRows.length == 0 || ($selectedRows.length == 1 && $targetRow.is(".selected")))
                    {
                        if ($targetRow.is(".selected"))
                            $targetRow.removeClass("selected highlight");
                        else
                            $targetRow.addClass("selected highlight");
                    }
                    else
                    {
                        // Get all rows.
                        var $allRows = $table.find("tr.item:visible");
                        // Find the index of the first selected and target elements.
                        var firstIndex = $allRows.index($selectedRows[0]);
                        var targetIndex = $allRows.index($targetRow);
                        
                        // If targetIndex is greater than firstIndex, select from firstIndex to targetIndex.
                        // Else, select from targetIndex to firstIndex.
                        var startIndex = targetIndex > firstIndex ? firstIndex : targetIndex;
                        var endIndex = targetIndex > firstIndex ? targetIndex : firstIndex;
                        
                        // Deselect all rows.
                        $allRows.removeClass("selected highlight");
                        // Select rows.
                        $allRows.slice(startIndex, endIndex + 1).addClass("selected highlight");
                    }
                }
                else if (event.metaKey) // If control/comman key down:
                {
                    // Toggle the class of the target row.
                    if ($targetRow.is(".selected"))
                        $targetRow.removeClass("selected highlight");
                    else
                        $targetRow.addClass("selected highlight");
                }
                else // Else (no shift or control key down)
                {
                    // Deselect all rows except this one.
                    var rows = $table.find("tr.item").not($targetRow).removeClass("selected highlight");
                    // Toggle the class on this row.
                    if ($targetRow.is(".selected"))
                        $targetRow.removeClass("selected highlight");
                    else
                        $targetRow.addClass("selected highlight");
                }
                // Set the focus so that the shift/meta click won't select any text.
                $table.focus();
                
                opts.rowSelectionHandler($targetRow);
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
            $this.find(opts.clickItemSelector).click(function(event)
            {
                event.preventDefault();
                var $link = $(this).closest(opts.hoverItemSelector).find(opts.actionSelector);
                window.location = $link.attr("href");
            });
        });
    };

    // default options
    $.fn.blistListHoverItems.defaults = {
        hoverItemSelector: "tr.item",
        clickItemSelector: "tr.item td:not(.actionContainer) > *:not(a, :has(a))",
        actionSelector: ".actionContainer a"
    };

})(jQuery);
