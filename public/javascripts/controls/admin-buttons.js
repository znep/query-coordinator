(function($)
{
    $.fn.adminButton = function(options)
    {
        var opts = $.extend({}, $.fn.adminButton.defaults, options);

        return this.each(function()
        {
            var $this = $(this);

            $this.click(function(event)
            {
                event.preventDefault();

                if ($this.hasClass('disabled'))
                { return; }

                var $container = $this.closest(opts.containerSelector),
                    $loadingSpinner = $container.find(opts.loadingSelector);

                $container.find(opts.workingSelector).addClass(opts.workingClass);

                $loadingSpinner.insertAfter($this);
                var loadingWidth = ($this.outerWidth(true) -
                                    $loadingSpinner.outerWidth(false)) / 2;

                $loadingSpinner.css('margin-left', loadingWidth)
                               .css('margin-right', loadingWidth);

                $this.hide();

                $.ajax({
                    url: $this.attr('href'),
                    method: 'get',
                    dataType: 'json',
                    success: function(response)
                    {
                        $this.show();
                        $container.find(opts.workingSelector).removeClass(opts.workingClass);

                        if (_.isFunction(opts.callback))
                        { opts.callback(response, $container); }
                    }
                });
            });

        });
    };

    $.fn.adminButton.defaults = {
        containerSelector: 'tr',
        loadingSelector: '.loading',
        workingClass: 'isWorking',
        workingSelector: '.actions'
    };
})(jQuery);
