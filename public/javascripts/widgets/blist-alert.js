(function($)
{
    $.fn.blistAlert = function(options)
    {
        // build main options before element iteration
        var opts = $.extend({}, $.fn.blistAlert.defaults, options);

        // iterate and do stuff to each matched element
        return this.each(function()
        {
            var $blistAlert = $(this);
            // build element specific options
            var config = $.meta ? $.extend({}, opts, $blistAlert.data()) : opts;
            $blistAlert.data("config-blistAlert", config);

            if (config.message === null) { return; }

            $blistAlert.qtip({content: config.message,
                show: { ready: true, when: { event: 'none' } },
                position: config.position,
                style: config.style,
                hide: { when: { event: 'unfocus' },
                    effect: { type: 'fade', length: 300 } }
            });
            setTimeout(function() { $blistAlert.qtip('hide'); }, 5000);
        });
    };

    //
    // plugin defaults
    //
    $.fn.blistAlert.defaults = {
        message: null,
        position: { corner: { target: 'topMiddle', tooltip: 'bottomLeft' } },
        style: { name: 'blistAlert' }
    };

})(jQuery);
