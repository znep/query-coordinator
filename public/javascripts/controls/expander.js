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

            // don't show if there's no text, or it's only one line
            $content.removeClass('collapsed');
            var fullHeight = $content.height();
            $content.addClass('collapsed');

            if ($.isBlank($content.text()) || (fullHeight == $content.height()))
            { $expand.hide(); }

            $expand.click(function(event)
            {
                event.preventDefault();

                if ($expand.hasClass(config.expanderCollapsedClass))
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
                    $expand.removeClass(config.expanderCollapsedClass)
                           .addClass(config.expanderExpandedClass)
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
                    $expand.removeClass(config.expanderExpandedClass)
                           .addClass(config.expanderCollapsedClass)
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
        expanderCollapsedClass: 'downArrow',
        expanderExpandedClass: 'upArrow',
        expandSelector: '.expand',
        moveExpandTrigger: false,
        resizeFinishCallback: function() {}
    };

})(jQuery);
