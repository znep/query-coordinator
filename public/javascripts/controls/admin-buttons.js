;
/*
 * For ajaxing with button-style links. Replaces the working button with a
 * loading spinner of the same size, handles Ajaxing
 */
(function($)
{
    $.fn.adminButton = function(options)
    {
        var opts = $.extend({}, $.fn.adminButton.defaults, options);

        return this.each(function()
        {
            var $this = $(this),
                $form = $this.closest('form');

            $this.click(function(event)
            {
                event.preventDefault();

                if ($this.hasClass('disabled'))
                { return; }

                if (!$.isBlank(opts.confirmationText) && !confirm(opts.confirmationText))
                { return; }

                var $container = $this.closest(opts.containerSelector),
                    $loadingSpinner = $container.find(opts.loadingSelector);

                $container.find(opts.workingSelector).addClass(opts.workingClass);

                $loadingSpinner.insertAfter($this);
                var loadingWidth = ($this.outerWidth(true) -
                                    $loadingSpinner.outerWidth(false)) / 2;

                $loadingSpinner.css('margin-left', loadingWidth)
                               .css('margin-right', loadingWidth);

                $this.addClass('hide');

                $.ajax({
                    url: $form.attr('action'),
                    type: 'post',
                    data: $form.serialize(),
                    dataType: 'json',
                    success: function(response)
                    {
                        $this.removeClass('hide');
                        $container.find(opts.workingSelector).removeClass(opts.workingClass);

                        if (_.isFunction(opts.callback))
                        { opts.callback(response, $container, $this); }
                    }
                });
            });

        });
    };

    $.fn.adminButton.defaults = {
        confirmationText: null,
        containerSelector: 'tr',
        loadingSelector: '.loading',
        workingClass: 'isWorking',
        workingSelector: '.actions'
    };
})(jQuery);
