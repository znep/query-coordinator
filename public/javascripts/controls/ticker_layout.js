;(function($)
{
    $.fn.tickerLayout = function(opts)
    {
        var $ticker = this;
        var $tickerChildrenContainer = $ticker.children('.tickerLayoutChildren');
        var $tickerChildren = $tickerChildrenContainer.children();
        var $firstChild = $tickerChildren.first();
        var $currentChildName = $ticker.find('.currentChildName');

        var $activePane = $firstChild;

        var activatePane = function($pane)
        {
            var currentIndex = $pane.prevAll().length;

            if ($.browser.msie && ($.browser.majorVersion < 8))
            {
                // IE7 and older have issues clipping charts correctly.
                $tickerChildren.hide();
                $pane.show();
                $tickerChildrenContainer.height($pane.outerHeight(false));

                // since
                $pane.find('*').resize();
            }
            else
            {
                var totalHeight = 0;
                $pane.prevAll().each(function()
                {
                    totalHeight -= $(this).outerHeight(false);
                });
                $firstChild.stop().animate({ marginTop: totalHeight }, 1000);
                $tickerChildrenContainer.stop().animate({ height: $pane.outerHeight(false) }, 1000);
            }

            $currentChildName.text(opts.childTitles[currentIndex]);
            $('.currentPage').text(currentIndex + 1);

            $activePane = $pane;
        };

        activatePane($activePane);
        $tickerChildren.css('visibility', 'visible');

        // wire up pagers
        var $incrementalPager = $ticker.find('.incrementalPager');
        if ($incrementalPager.length > 0)
        {
            $incrementalPager.find('.prevPageButton').click(function(event)
            {
                event.preventDefault();
                var $prevPane = $activePane.prev();
                if ($prevPane.length === 0)
                {
                    return;
                }
                activatePane($prevPane);
            });
            $incrementalPager.find('.nextPageButton').click(function(event)
            {
                event.preventDefault();
                var $nextPane = $activePane.next();
                if ($nextPane.length === 0)
                {
                    return;
                }
                activatePane($nextPane);
            });
        }
    };
})(jQuery);