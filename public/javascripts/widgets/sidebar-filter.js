
(function($)
{
    $.fn.filterList = function(options)
    {
        // build main options before element iteration
        var opts = $.extend({}, $.fn.filterList.defaults, options);

        // iterate and do stuff to each matched element
        return this.each(function()
        {
            var $filterList = $(this);
            // build element specific options
            var config = $.meta ? $.extend({}, opts, $filterList.data()) : opts;
            $filterList.data("config-filterList", config);

            $filterList.find('a:not(.expander, ul.menu a)')
                .click(function (event) { filterClickHandler($filterList, event) });
            $filterList.find('a.expander').click(toggleSection);

        });
    };

    //
    // private functions
    //
    var filterClickHandler = function ($filterList, event)
    {
        var config = $filterList.data("config-filterList");
        event.preventDefault();
        var $target = $(event.currentTarget);
        if ($(event.target).is('em'))
        {
            $target.siblings('ul.menu').css('left',
                    $(event.target).position().left + 'px');
            return;
        }

        $filterList.find('a.' + config.hilightClass)
            .removeClass(config.hilightClass);
        $target.addClass(config.hilightClass);

        config.filterClickCallback($target.attr('title'));
        $.Tache.Get({ url: $target.attr('href'),
            success: config.filterSuccessHandler});
    };

    var toggleSection = function (event)
    {
        event.preventDefault();
        $(event.target).parent(".expandableContainer").toggleClass('closed');
    };

    //
    // plugin defaults
    //
    $.fn.filterList.defaults = {
        filterClickCallback: function (title) {},
        filterSuccessHandler: function (returnData) {},
        hilightClass: 'hilight'
    };

})(jQuery);
