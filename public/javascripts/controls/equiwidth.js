;(function($)
{
    $.fn.equiWidth = function(options)
    {
        var opts = $.extend({}, $.fn.equiWidth.defaults, options);

        return this.each(function()
        {
            var $container = $(this),
                $children  = $container.find(opts.childSelector),
                length     = $children.length,
                percentWidth = (99 - (opts.marginPercent  * (length - 1))
                                   - (opts.paddingPercent * length)) / length;

            $children.css('width', percentWidth + '%');
        });
    };

    $.fn.equiWidth.defaults = {
        childSelector: '> div',
        marginPercent: 1,
        paddingPercent: 2
    };
})(jQuery);
