;(function($)
{
    $.fn.stars = function(options)
    {
        var opts = $.extend({}, $.fn.stars.defaults, options);

        return this.each(function()
        {
            var $this = $(this);
            $this.addClass('jsEnabled');

            if (!$.isBlank(opts.value))
            {
                $this.attr('data-rating', opts.value);
                $this.attr('title', $.t('controls.common.stars.tooltip', { number: opts.value }));
                $this.find(':radio').eq(parseInt(opts.value)).attr('checked', 'checked');
            }

            $this.on('change', function(e)
            {
                _.defer(function()
                {
                    if (_.isFunction(opts.onChange))
                    { opts.onChange($this.find(':radio:checked').val()); }
                });
            });
        });
    };

    $.fn.stars.defaults = {
        onChange: function(value) {},
        value: null
    };
})(jQuery);
