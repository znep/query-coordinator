(function($)
{
    $.fn.expander = function(options)
    {
        // build main options before element iteration
        var opts = $.extend({}, $.fn.expander.defaults, options);

        // iterate and do stuff to each matched element
        return this.each(function()
        {
            var $expander = $(this);
            // build element specific options
            var config = $.meta ? $.extend({}, opts, $expander.data()) : opts;
            $expander.data("config-expander", config);

            var $content = $expander.find(config.contentSelector);
            var $expand = $expander.find(config.expandSelector);
            if ($.isBlank($content.text()))
            { $expand.hide(); }

            $expand.click(function(event)
            {
                event.preventDefault();
                var $this = $(this);

                if ($this.hasClass('downArrow'))
                {
                    // need to expand; measure how tall
                    $content
                        .removeClass('collapsed')
                        .css('height', null);
                    var targetHeight = $content.height();
                    $content
                        .addClass('collapsed')
                        .animate({
                            height: targetHeight
                        },
                        config.resizeFinishCallback);
                    $this.removeClass('downArrow').addClass('upArrow');
                }
                else
                {
                    // need to collapse
                    $content
                        .animate({
                            height: $content.css('line-height')
                        },
                        config.resizeFinishCallback);
                    $this.removeClass('upArrow').addClass('downArrow');
                }
            });

        });
    };

    //
    // plugin defaults
    //
    $.fn.expander.defaults = {
        contentSelector: '.content',
        expandSelector: '.expand',
        resizeFinishCallback: function() {}
    };

})(jQuery);
