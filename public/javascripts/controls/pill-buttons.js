(function($)
{
    $.fn.pillButtons = function(config)
    {
        var opts = $.extend({}, $.fn.pillButtons.defaults, config);
        this.each(function()
        {
            var $container = $(this);

            if ($.browser.msie)
            {
                $container
                    .find('li:first-child').addClass('first').end()
                    .find('li:last-child').addClass('last');
            }

            $container.find('a').click(function(event)
            {
                event.preventDefault();

                if (!opts.multiState)
                {
                    $container.find('li a.' + opts.activeClass).removeClass('active');
                    $(this).addClass('active');
                }
                else
                { $(this).toggleClass('active'); }
            });
            $container.find(opts.defaultSelector).addClass(opts.activeClass);
        });
    };

    $.fn.pillButtons.defaults = {
        activeClass: 'active',
        defaultSelector: 'li:first-child a',
        multiState: false
    }
})(jQuery);
