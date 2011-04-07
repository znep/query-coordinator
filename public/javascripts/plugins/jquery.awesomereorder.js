/**
 * awesomereorder — a lightweight, simple, drag-and-drop list reordering plugin
 *  clint tseng (clint@dontexplain.com) — 2011-04-03
 *   Licensed under the WTFPL (http://sam.zoy.org/wtfpl/). Do what
 *   you want, but please do let me know what you think.
 */

;(function($)
{
    $.fn.awesomereorder = function(options)
    {
        options = $.extend({}, options, $.fn.awesomereorder.defaults);

        return this.each(function()
        {
            var $container = $(this),

                // metadata plugin
                localOptions = $.meta ? $.extend({}, options, $container.data()) : options,

                // grab dragged items
                $items = $container.children(localOptions.listItemSelector),

                // determine whether we're vert or horiz
                directionType = (localOptions.directionType == 'auto') ?
                                (($items.css('display') == 'block') || ($items.css('display') == 'list-item') ? 'v' : 'h') :
                                localOptions.directionType,

                // keep track of active item
                $item,

                // keep track of container scroll
                scrollTimer,

                // keep track of item width and height
                cachedWidth, cachedHeight,

                // keep track of our active placeholder
                $placeholder;

            var generatePlaceholder = function()
            {
                return $('<div></div>').data('awesomereorder-placeholder', true)
                                       .width(cachedWidth)
                                       .height(cachedHeight);
            };

            var insertPlaceholder = function($target, direction)
            {
                $placeholder.stop().slideUp('fast', function() { $(this).remove(); });
                $placeholder = generatePlaceholder();
                $target[direction]($placeholder);
                $placeholder.hide().slideDown('fast');
            };

            var checkScroll = function(position)
            {
                
            };

            var checkHover = function(position)
            {
                // calculate initial height
                var containerOffset = $container.position();
                var stackHeight = containerOffset.top - $container.scrollTop() +
                                  parseInt($container.css('margin-top'));

                // run through elements to find a match
                var found = false;
                $container.children($(localOptions.listItemSelector)).each(function()
                {
                    var $candidate = $(this);

                    if (!$candidate.is(':visible'))
                        return;

                    if ($candidate.data('awesomereorder-placeholder'))
                    {
                        stackHeight += $candidate.outerHeight(true);
                        return;
                    }

                    var threshold = $candidate.outerHeight(true) * localOptions.activeRange;

                    if (position.top < (stackHeight + threshold))
                    {
                        if (!$candidate.prev().data('awesomereorder-placeholder'))
                        {
                            insertPlaceholder($candidate, 'before');
                        }
                        found = true;
                        return false; // found it!
                    }

                    stackHeight += $candidate.outerHeight(true);

                    if ((position.top > (stackHeight - threshold)) &&
                        (position.top < stackHeight))
                    {
                        if (!$candidate.next().data('awesomereorder-placeholder'))
                        {
                            insertPlaceholder($candidate, 'after');
                        }
                        found = true;
                        return false; // found it!
                    }
                });

                // if we didn't find anything, we want the bottom of the container
                if (!found && !$container.children(':last-child').data('awesomereorder-placeholder'))
                {
                    insertPlaceholder($container.children(localOptions.listItemSelector).last(), 'after');
                }
            };

            var dropItem = function($helper)
            {
                $placeholder.after($item.show())
                            .remove();
            };

            $items.draggable($.extend({}, {
                addClass: false,
                axis: (directionType == 'v') ? 'y' : undefined,
                helper: 'clone',
                scroll: false,
                start: function(event, ui)
                {
                    $item = $(this);

                    ui.helper.width($item.width());
                    cachedWidth = $item.outerWidth(true);
                    cachedHeight = $item.outerHeight(true);

                    $placeholder = generatePlaceholder();
                    $item.after($placeholder);

                    // IE8 doesn't deal well with the original parent being remove from DOM,
                    // even if you add it to a detached parent to make jQuery < 1.8.9 happy.
                    // So instead of removing the original element, let's just hide it.
                    $item.hide();
                },
                drag: function(event, ui)
                {
                    checkScroll({ left: ui.position.left, top: ui.position.top });
                    checkHover({ left: ui.position.left, top: ui.position.top });
                },
                stop: function(event, ui)
                {
                    //clearInterval(scrollTimer);
                    dropItem(ui.helper);
                }
            }, localOptions.uiDraggableDefaults));
        });
    };

    $.fn.awesomereorder.defaults = {
        activeRange: 0.3,
        directionType: 'auto',
        handleSelector: '.',
        listItemSelector: 'li',
        uiDraggableDefaults: {
            containment: 'parent',
            distance: 5,
            opacity: 0.8
        }
    };
})(jQuery);

