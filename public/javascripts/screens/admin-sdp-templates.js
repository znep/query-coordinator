(function($)
{
    var sdpTemplatesNS = blist.namespace.fetch('blist.sdpTemplates');

    var parseColor = function(color)
    {
        return color.match(/^rgba/) ? color : ('#' + color);
    };

    $(function()
    {
        // update visual things
        _.each(sdpTemplatesNS.templates, function(template)
        {
            var customization = template.customization = JSON.parse(template.customization);
            var $row = $('.templatesList tbody tr[data-templateid=' + template.uid + ']');

            // check version
            if (template.customization.version !== 1)
            {
                $row.find('.previewNotAvailable').fadeIn();
                $row.find('.makeDefaultButton').addClass('disabled');
            }
            else
            {
                // sub in styles
                $row.find('.previewOuter')
                    .css('background-color', parseColor(customization.frame.color))
                    .css('border-width', customization.frame.border.width.value +
                                         customization.frame.border.width.unit)
                    .css('border-color', parseColor(customization.frame.border.color));
                $row.find('.previewLogo')
                    .css('background-image', 'url(' +
                                             (customization.logo.image.type == 'static' ?
                                             customization.logo.image.href :
                                             '/assets/' + customization.logo.image.href) + ')');
                $row.find('.previewSubheader')
                    .css('background-color', parseColor(customization.toolbar.color));
                $row.find('.previewGridZebra')
                    .css('background-color', parseColor(customization.grid.zebra));
            }
        });

        $('.templatesList').combinationList({
            headerContainerSelector: '.gridListWrapper',
            initialSort: [[0, 0]],
            scrollableBody: false,
            selectable: false,
            sortGrouping: false,
            sortHeaders: {0: {sorter: 'text'}},
            sortTextExtraction: function(node) {
                return $(node).find('.cellInner').text();
            }
        });

        var actionButtonHandler = function(callback)
        {
            return function(event)
            {
                event.preventDefault();

                var $this = $(this);
                if ($this.hasClass('disabled'))
                {
                    return;
                }

                var $row = $this.closest('tr');
                var templateId = $row.attr('data-templateid');

                $row.find('.actions').addClass('isWorking');

                var $loadingSpinner = $row.find('.loading');
                $loadingSpinner.insertAfter($this);
                var loadingWidth = ($this.outerWidth(true) -
                                    $loadingSpinner.outerWidth(false)) / 2;
                $loadingSpinner.css('margin-left', loadingWidth)
                               .css('margin-right', loadingWidth);

                $this.hide();

                $.ajax({
                    url: $this.attr('href'),
                    method: 'get',
                    success: function(response)
                    {
                        $this.show();
                        $row.find('.actions').removeClass('isWorking');
                        callback(response, $row);
                    }
                })
            };
        };
        $.live('.makeDefaultButton', 'click',
            actionButtonHandler(function(response, $row)
            {
                $('.actions').removeClass('isDefault');
                $row.find('.actions').addClass('isDefault');
            }));

        $.live('.deleteTemplateButton', 'click',
            actionButtonHandler(function(response, $row)
            {
                $row.slideUp().remove();
            }));
    });
})(jQuery);