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

            $this.append($inner);
            updateInner($inner, value);

            if (opts.enabled === true)
            {
                $this.addClass('enabled');

                var temporaryValue = value;
                $this.mousemove(function(event)
                {
                    var actualX = event.pageX - $this.offset().left;
                    temporaryValue = Math.ceil(actualX / 19); // star is 19px wide with margin
                    updateInner($inner, temporaryValue);
                });
                $this.mouseleave(function(event)
                {
                    updateInner($inner, value);
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

    var updateInner = function($inner, value)
    {
        // the star is 17 pixels wide, + 2 pixels of right margin
        $inner.width((value * 17) + (Math.floor(value) * 2));
    };

    $.fn.stars.defaults = {
        enabled: true,
        onChange: function(value) {},
        value: 2.5
    };
})(jQuery);