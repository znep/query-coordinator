/*
 * JQuery Equi-width plug-in: Takes a container and properly sizes children
 * to take up the full width. Uses existing padding and margins.
 *
 * @author aiden.scandella@socrata.com, 9 Aug. 2010
 */

(function($)
{
    $.fn.equiWidth = function(options)
    {
        var opts = $.extend({}, $.fn.equiWidth.defaults, options);

        return this.each(function()
        {
            var $container = $(this),
                $children  = $container.find(opts.childSelector),
                length     = $children.length;

            var doResize = function($container)
            {
                var marginSelector = opts.firstChildIsUnique ? 1 : 0,
                    margin         = $children.eq(marginSelector).outerWidth(true) -
                                     $children.eq(marginSelector).outerWidth(),
                    padding        = $children.first().outerWidth() -
                                     $children.first().width(),
                    totalMargins   = opts.firstChildIsUnique ?
                        ((length - 1) * margin) : (length * margin);

                $children.width(
                    ($container.width() - 1 - totalMargins - (length * padding))
                    / length
                );
            };

            if (opts.bindResize)
            {
                $(window).bind('resize', function(event)
                { doResize($container); });
            }

            if (opts.resizeNow)
            { doResize($container); }

            $(this).bind('resize', function(event)
            { doResize($container); });
        });
    };

    $.fn.equiWidth.defaults = {
        bindResize: true,
        childSelector: '> div',
        // If the first child has different padding
        firstChildIsUnique: true,
        // Whether or not to trigger an initial resize once plugin is up
        resizeNow: false
    };
})(jQuery);
