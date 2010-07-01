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

                if ($expand.hasClass('downArrow'))
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
                    $expand.removeClass('downArrow')
                           .addClass('upArrow')
                           .attr('title', 'Click to collapse');
                }
                else
                {
                    // need to collapse
                    $content
                        .animate({
                            height: $content.css('line-height')
                        },
                        function()
                        {
                            // Un-set display so natural CSS styling can take effect
                            $content.css('display', '');
                            config.resizeFinishCallback();
                        });
                    $expand.removeClass('upArrow')
                           .addClass('downArrow')
                           .attr('title', 'Click to expand');
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
