/* scrollable widget
 * This will make a menu, or any ul, scrollable.  It should be called on the ul.
 *  The child lis that should scroll should be identified by the selector.,
 *  and the previous and next buttons should be identified by the prevSelector
 *  and nextSelector.  They are assumed to be inside an li in the ul.
 *
 * Params:
 *  selector: jQuery selector to identify the scrollable items
 *
 *  hiddenClass: Class to add to the hidden items (scrolled out of view)
 *
 *  prevSelector: Selector for the button that scrolls up (assumed to be in the ul)
 *
 *  nextSelector: Selector for the button that scrolls down
 *      (assumed to be in the ul)
 *
 *  disabledClass: Class added to prev/next buttons when the menu can no longer
 *      scroll in that direction
 *
 *  numVisible: Number of visible items at once.  If there are less than this,
 *      the buttons will be hidden & all items shown
 */

(function($)
{
    $.fn.scrollable = function(options)
    {
        // build main options before element iteration
        var opts = $.extend({}, $.fn.scrollable.defaults, options);

        // iterate and do stuff to each matched element
        return this.each(function()
        {
            var $this = $(this);
            // build element specific options
            var config = $.meta ? $.extend({}, opts, $this.data()) : opts;
            $this.data("config-scrollable", config);

            if ($this.children(config.selector).length <= config.numVisible)
            {
                $this.find(config.prevSelector).parent().hide();
                $this.find(config.nextSelector).parent().hide();
                return;
            }

            $this.children(config.selector + ':gt(' +
                    (config.numVisible - 1) + ')').addClass(config.hiddenClass);

            updateButtons($this);

            var timerPtr;

            // Repeats a function call on intervals based on the number of
            // iterations passed. Sets the timerPtr variable to the value
            // of the setTimeout pointer so it can be cancelled externally.
            var repeatScroll = function(tickCallback, iterations)
            {
                if (!tickCallback())
                {
                    $(document).unbind('mouseup.scrollable.repeatScroll');
                    return;
                }
                timerPtr = setTimeout(function()
                {
                    repeatScroll(tickCallback, iterations++);
                }, Math.max(100 - iterations * 2, 5));
            };

            // Call stepPrev once for immediate feedback, then kicks off
            // repeatScroll calling stepPrev at each tick.
            $this.find(config.prevSelector).mousedown(function (event)
                {
                    if (!stepPrev($this))
                    {
                        return;
                    }
                    timerPtr = setTimeout(function()
                    {
                        repeatScroll(function()
                        {
                            return stepPrev($this);
                        }, 0);
                    }, 800);
                    $(document).bind('mouseup.scrollable.repeatScroll', function(event)
                    {
                        clearTimeout(timerPtr);
                        $(document).unbind('mouseup.scrollable.repeatScroll');
                    });
                });
            $this.find(config.prevSelector).click(function (event)
            {
                event.stopPropagation();
                event.preventDefault();
            });

            // Call stepNext once for immediate feedback, then kicks off
            // repeatScroll calling stepNext at each tick.
            $this.find(config.nextSelector).mousedown(function (event)
                {
                    if (!stepNext($this))
                    {
                        return;
                    }
                    timerPtr = setTimeout(function()
                    {
                        repeatScroll(function()
                        {
                            return stepNext($this);
                        }, 0);
                    }, 500);
                    $(document).bind('mouseup.scrollable.repeatScroll', function(event)
                    {
                        clearTimeout(timerPtr);
                        $(document).unbind('mouseup.scrollable.repeatScroll');
                    });
                });
            $this.find(config.nextSelector).click(function (event)
            {
                event.stopPropagation();
                event.preventDefault();
            });

            var $activeItem = $this.find(config.activeSelector + ':first');
            while ($activeItem.length > 0 &&
                    $activeItem.hasClass(config.hiddenClass))
            {
                stepNext($this);
            }
        });
    };

    //
    // private functions
    //

    // Logic required to scroll up the menu by one entry.
    function stepPrev($this)
    {
        var config = $this.data("config-scrollable");
        var $prevItem = prevHiddenItem($this);
        if ($prevItem.length > 0)
        {
            $prevItem.removeClass(config.hiddenClass);
            lastShownItem($this).addClass(config.hiddenClass);
            updateButtons($this);
            return true;
        }
        return false;
    };

    // Logic required to scroll down the menu by one entry.
    function stepNext($this)
    {
        var config = $this.data("config-scrollable");
        var $nextItem = nextHiddenItem($this);
        if ($nextItem.length > 0)
        {
            $nextItem.removeClass(config.hiddenClass);
            firstShownItem($this).addClass(config.hiddenClass);
            updateButtons($this);
            return true;
        }
        return false;
    };

    function prevHiddenItem($this)
    {
        var config = $this.data("config-scrollable");
        return firstShownItem($this).prev(config.selector);
    };

    function firstShownItem($this)
    {
        var config = $this.data("config-scrollable");
        return $this.children(config.selector +
            ':not(.' + config.hiddenClass + '):first');
    };

    function lastShownItem($this)
    {
        var config = $this.data("config-scrollable");
        return $this.children(config.selector +
            ':not(.' + config.hiddenClass + '):last');
    };

    function nextHiddenItem($this)
    {
        var config = $this.data("config-scrollable");
        return lastShownItem($this).next(config.selector);
    };

    function updateButtons($this)
    {
        var config = $this.data("config-scrollable");
        if (prevHiddenItem($this).length > 0)
        {
            $this.find(config.prevSelector)
                .parent().removeClass(config.disabledClass);
        }
        else
        {
            $this.find(config.prevSelector)
                .parent().addClass(config.disabledClass);
        }

        if (nextHiddenItem($this).length > 0)
        {
            $this.find(config.nextSelector)
                .parent().removeClass(config.disabledClass);
        }
        else
        {
            $this.find(config.nextSelector)
                .parent().addClass(config.disabledClass);
        }
    };

    //
    // plugin defaults
    //
    $.fn.scrollable.defaults = {
        activeSelector: '.active',
        selector: '.scrollable',
        hiddenClass: 'hidden',
        prevSelector: '.prev a',
        nextSelector: '.next a',
        disabledClass: 'disabled',
        numVisible: 6
    };

})(jQuery);
