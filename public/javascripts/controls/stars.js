;(function($)
{
    $.fn.stars = function(options)
    {
        var opts = $.extend({}, $.fn.stars.defaults, options);

        return this.each(function()
        {
            var $this = $(this);
            var $inner = $.tag({ tagName: 'div', 'class': 'starsControlInner' });
            var value = opts.value;

            $this.attr('title', $.t('controls.common.stars.tooltip', { number: opts.value }));
            $this.empty().append($inner);
            updateInner($inner, value, opts);

            if (opts.enabled === true)
            {
                $this.addClass('enabled');

                var temporaryValue = value;
                $this.mousemove(function(event)
                {
                    var actualX = event.pageX - $this.offset().left;
                    temporaryValue = Math.ceil(actualX / (opts.starWidth + opts.starMargin));
                    updateInner($inner, temporaryValue, opts);
                });
                $this.mouseleave(function(event)
                {
                    updateInner($inner, value, opts);
                });
                $this.click(function(event)
                {
                    if (_.isFunction(opts.onChange) &&
                        (opts.onChange(temporaryValue) !== false))
                    {
                        value = temporaryValue;
                    }
                });
            }
        });
    };

    var updateInner = function($inner, value, opts)
    {
        $inner.width((value * (opts.starWidth)) + (Math.floor(value) * (opts.starMargin)));
    };

    $.fn.stars.defaults = {
        enabled: true,
        onChange: function(value) {},
        starMargin: 2,
        starWidth: 17,
        value: 2.5
    };
})(jQuery);
