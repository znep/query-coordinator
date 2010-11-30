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

            if (!config.forceExpander &&
                ($.isBlank($content.text()) || (fullHeight == $content.height())))
            { $expand.hide(); }

            $expand.addClass(config.expanderCollapsedClass);

            $expand.click(function(event)
            {
                event.preventDefault();

                if ($expand.hasClass(config.expanderCollapsedClass))
                {
                    config.preExpandCallback($expander);
                    // need to expand; measure how tall
                    var baseHeight = $content.css('height');
                    $content
                        .removeClass('collapsed')
                        .css('height', '');
                    var targetHeight = $content.height();
                    $expander.removeClass('collapsed');
                    $content
                        .css('height', baseHeight)
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
                    $content.addClass('collapsed').css('height', '');
                    var baseHeight = $content.height();
                    $content.removeClass('collapsed');
                    $content
                        .animate({
                            height: baseHeight
                        },
                        function()
                        {
                            // Un-set display so natural CSS styling can take effect
                            $content.css('display', '');
                            $content.addClass('collapsed');
                            $expander.addClass('collapsed');
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
        forceExpander: false,
        moveExpandTrigger: false,
        preExpandCallback: function($expander) {},
        resizeFinishCallback: function() {}
    };

})(jQuery);
