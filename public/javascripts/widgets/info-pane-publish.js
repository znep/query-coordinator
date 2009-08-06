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
                .keyup(function() { updatePublishCode($publishPane)})
                .keypress(function (event)
                {
                    if ((event.which < 48 || event.which > 57) && !(event.which == 8 || event.which == 0))
                    {
                        // Disallow non-numeric input in width/height fields
                        return false;
                    }
                });
            $(config.variationSelector).change(function() { updatePublishCode($publishPane) });
            $(config.previewLinkSelector).click(function (event)
            {
                event.preventDefault();
                var $link = $(this);
                var width = $(config.widthSelector).val();
                var height = $(config.heightSelector).val();
                if (parseInt(width,10) < 425 || parseInt(height,10) < 344 || width == '' || height == '')
                {
                    return;
                }
                window.open(
                    $link.attr('href') + "?width=" + width + "&height=" + height + "&variation=" + $(config.variationSelector).val(), 
                    "Preview", "location=no,menubar=no,resizable=no,status=no,toolbar=no");
            });
            
            updatePublishCode($publishPane);
        });
        
        // Update copyable publish code and live preview from template/params
        function updatePublishCode($publishPane)
        {
            var config = $publishPane.data('config-infoPanePublish');
            
            // detemplatize publish code template if it exists
            if ($(config.textareaSelector).length > 0)
            {
                var width = $(config.widthSelector).val();
                var height = $(config.heightSelector).val();
                $(config.textareaSelector).text($(config.templateSelector).val()
                        .replace('#width#', width)
                        .replace('#height#', height)
                        .replace('#variation#', $(config.variationSelector).val()));

                // Restrict size to >= 425x344 px
                if (parseInt(width,10) < 425 || parseInt(height,10) < 344 || width == '' || height == '')
                {
                    $(config.sizeErrorSelector).removeClass('hide');
                    $(config.textareaSelector).attr('disabled', true);
                    $(config.previewLinkSelector).addClass('disabled');
                }
                else
                {
                    $(config.sizeErrorSelector).addClass('hide');
                    $(config.textareaSelector).removeAttr('disabled');
                    $(config.previewLinkSelector).removeClass('disabled');
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
