;(function($) 
{
    // Common code for the publish meta tab.
    $.fn.infoPanePublish = function(options) {
        var opts = $.extend({}, $.fn.infoPanePublish.defaults, options);

        return this.each(function() {
            var $publishPane = $(this);

            // Support for the Metadata Plugin.
            var config = $.meta ? $.extend({}, opts, $publishPane.data()) : opts;
            $publishPane.data("config-infoPanePublish", config);

            $(config.widthSelector + "," + config.heightSelector)
                .keyup(function() { updatePublishCode($publishPane);})
                .keypress(function (event)
                {
                    if ((event.which < 48 || event.which > 57) &&
                        !(event.which == 8 || event.which == 0))
                    {
                        // Disallow non-numeric input in width/height fields
                        return false;
                    }
                });
            $(config.variationSelector).change(function()
                { updatePublishCode($publishPane); });
            $(config.previewLinkSelector).click(function (event)
            {
                event.preventDefault();
                var $link = $(this);
                var width = $(config.widthSelector).val();
                var height = $(config.heightSelector).val();
                if (parseInt(width,10) < 500 || parseInt(height,10) < 425 ||
                    width == '' || height == '')
                {
                    return;
                }
                window.open(
                    $link.attr('href') + "?width=" + width +
                        "&height=" + height,
                    "Preview");
            });

            updatePublishCode($publishPane);
        });

        // Update copyable publish code and live preview from template/params
        function updatePublishCode($publishPane)
        {
            var config = $publishPane.data('config-infoPanePublish');

            // detemplatize publish code template if it exists
            if ($publishPane.find(config.textareaSelector).length > 0)
            {
                var width = $publishPane.find(config.widthSelector).val();
                var height = $publishPane.find(config.heightSelector).val();
                $publishPane.find(config.textareaSelector)
                    .text($publishPane.find(config.templateSelector).val()
                        .replace('#width#', width)
                        .replace('#height#', height));

                // Restrict size to >= 500x425 px
                if (parseInt(width,10) < 500 || parseInt(height,10) < 425 ||
                    width == '' || height == '')
                {
                    $publishPane.find(config.sizeErrorSelector).removeClass('hide');
                    $publishPane.find(config.textareaSelector).attr('disabled', true);
                    $publishPane.find(config.previewLinkSelector).addClass('disabled');
                }
                else
                {
                    $publishPane.find(config.sizeErrorSelector).addClass('hide');
                    $publishPane.find(config.textareaSelector).removeAttr('disabled');
                    $publishPane.find(config.previewLinkSelector).removeClass('disabled');
                }
            }
        };

    };

    // default options
    $.fn.infoPanePublish.defaults = {
        textareaSelector: "#publishCode",
        templateSelector: "#publishCodeTemplate",
        widthSelector: "#publishWidth",
        heightSelector: "#publishHeight",
        variationSelector: "#publishVariation",
        sizeErrorSelector: "#sizeError",
        previewLinkSelector: "#previewWidgetLink"
    };

})(jQuery);
