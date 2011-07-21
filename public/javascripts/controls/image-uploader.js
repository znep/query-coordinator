// DEPENDECIES: ajax-upload
//
// Transforms a file field tag into an ajax uploader, which
// refreshes the specified image div upon ajax completion

;(function($)
{
    var i = 0;

    $.fn.imageUploader = function(options)
    {
        var opts = $.extend({}, $.fn.imageUploader.defaults, options);

        this.quickEach(function()
        {
            var $fileField = this;
            var $container = $fileField.closest(opts.containerSelector);
            var $image     = opts.$image || $container.find(opts.imageSelector);
            var $error     = opts.$error || $container.find(opts.errorSelector);
            var $throbber  = opts.$throbber || $container.find(opts.throbberSelector);

            $button = $.tag({tagName: 'a', 'class': 'button ' + (opts.buttonClass || ''),
                contents: opts.buttonText});

            $fileField.replaceWith($button);

             new AjaxUpload($button, {
                action       : $fileField.attr(opts.dataKey),
                autoSubmit   : true,
                name         : opts.name + (i++),
                responseType : 'json',
                onSubmit     : function (file, ext)
                {
                    if (!(ext && /^(jpg|png|jpeg|gif|tif|tiff)$/i.test(ext)))
                    {
                        $error.show();
                        return false;
                    }
                    $error.hide();
                    $throbber.show();
                    opts.loading($container);
                },
                onComplete: function (file, response)
                {
                    opts.success($container, $image, response);
                    $throbber.hide();
                    $image.animate({opacity: 0}, {complete: function()
                        {
                            var url = opts.urlProcessor(response);
                            url += ((url.indexOf('?') == -1) ? '?' : '&') +
                                   '?_=' + new Date().getTime();

                            $('<img/>').attr('src', url)
                            .load(function() {
                                $image
                                    .empty()
                                    .append($(this))
                                    .animate({opacity: 1});
                            });
                        }
                    });
                }
            });
        });
        return this;
    };

    $.fn.imageUploader.defaults = {
        buttonText        : 'Upload Image',
        containerSelector : '.line',
        dataKey           : 'data-endpoint',
        errorSelector     : '.imageError',
        imageSelector     : '.ajaxImage',
        name              : 'ajaxImageUploader',
        loading           : function($container) { $container.addClass('working') },
        success           : function($container) { $container.removeClass('working') },
        throbberSelector  : '.uploadIndicator',
        urlProcessor      : function(response) {
            return '/api/assets/' + response.id;
        }
    };
})(jQuery);
