(function($)
{
    $.uploadDialog = function(options)
    {
        var $u = $('#jqmUpload');
        if ($u.length < 1)
        {
            $('body').append('<div id="jqmUpload" class="jqmWindow"></div>');
            $u = $('#jqmUpload');
        }
        return $u.uploadDialog(options);
    };

    $.fn.uploadDialog = function(options)
    {
        // Check if object was already created
        var uploadDialog = $(this[0]).data("uploadDialog");
        if (!uploadDialog)
        {
            uploadDialog = new uploadDialogObj(options, this[0]);
        }
        return uploadDialog;
    };

    var uploadDialogObj = function(options, dom)
    {
        this.settings = $.extend({}, uploadDialogObj.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    $.extend(uploadDialogObj,
    {
        defaults:
        {
        },

        prototype:
        {
            init: function ()
            {
                var currentObj = this;
                var $domObj = currentObj.$dom();
                $domObj.data("uploadDialog", currentObj);

                if ($domObj.contents().length < 1)
                {
                    $domObj.append(
                        '<div class="dialogWrapper modalDialog">' +
                        '<div class="dialogTL">' +
                        '<div class="dialogBR"><div class="dialogBL">' +
                        '<div class="dialogOuter"><div class="dialogBox">' +
                        '<div class="header">' +
                        '<h1>Upload a File</h1>' +
                        '<a href="#close_dialog" class="close jqmClose" ' +
                        'title="Close">Close</a>' +
                        '</div>' +
                        '<div class="modalContentWrapper">' +
                        '<form>' +
                        '<label for="file_upload">File to Upload:</label>' +
                        '<input type="text" readonly="readonly" ' +
                        'disabled="disabled" name="file_upload" />' +
                        '<div class="fileBrowseButtonListContainer">' +
                        '<ul class="actionButtons">' +
                        '<li>' +
                        '<a class="fileBrowseButton">Browse For File</a>' +
                        '</li>' +
                        '</ul>' +
                        '</div>' +
                        '</form>' +
                        '<div class="submitLine clearfix">' +
                        '<div class="error"></div>' +
                        '<div class="submitPending hide">Uploading...</div>' +
                        '<ul class="submitActions">' +
                        '<li><input type="image" name="submit" class="hide" ' +
                        'src="/images/button_ok.png" /></li>' +
                        '<li class="cancelButton">' +
                        '<a class="jqmClose" href="#cancel">' +
                        '<span>Cancel</span>' +
                        '</a>' +
                        '</li>' +
                        '</ul>' +
                        '</div>' +
                        '</div>' +
                        '</div>' +
                        '</div></div>' +
                        '</div></div>' +
                        '</div>' +
                        '</div>');
                    $domObj.jqm({trigger: false, modal: true,
                        onHide: function(hash)
                        {
                            if (currentObj._$uploader)
                            { currentObj._$uploader.destroy(); }
                            hash.w.hide();
                            hash.o.remove();
                            if (currentObj._closeCallback instanceof Function)
                            { currentObj._closeCallback(); }
                        },
                        onShow: function(hash)
                        {
                            hash.o.mousedown(function(e) { e.stopPropagation(); });
                            hash.w.show();
                        }});
                    $domObj.mousedown(function(e) { e.stopPropagation(); });
                }
            },

            // External interface methods
            show: function(uploadURL, fileCallback, closeCallback)
            {
                var currentObj = this;
                currentObj._closeCallback = closeCallback;
                var $domObj = currentObj.$dom();
                $domObj.jqmShow();

                if (!uploadURL.endsWith('.txt'))
                {
                    // Stick a .txt on the end so the server returns the right
                    // thing...
                    if (uploadURL.endsWith('/'))
                    { uploadURL = uploadURL.slice(0, uploadURL.length - 1); }
                    uploadURL += '.txt';
                }

                $domObj.find('input[name="file_upload"]').val('');
                $domObj.find(".submitPending").hide();
                $domObj.find('.submitActions input[name="submit"]').hide();
                $domObj.find(".error").text('');
                var $uploadButton = $domObj.find('.fileBrowseButton');
                currentObj._$uploader = new AjaxUpload($uploadButton, {
                    action: uploadURL,
                    autoSubmit: false,
                    name: 'uploadFileInput',
                    responseType: 'json',
                    onChange: function (file, ext)
                    {
                        $domObj.find('input[name="file_upload"]').val(file);
                        $domObj.find('.submitActions input[name="submit"]')
                            .show();
                        $domObj.find(".error").text('');
                    },
                    onSubmit: function (file, ext)
                    { $domObj.find(".submitPending").show(); },
                    onComplete: function (file, response)
                    {
                        $domObj.find(".submitPending").hide();
                        $domObj.find('.submitActions input[name="submit"]').hide();

                        if (response.error == true)
                        {
                            // New input created; re-hook mousedown
                            $(currentObj._$uploader._input)
                                .mousedown(function(e) { e.stopPropagation(); });
                            $domObj.find('.error').text(response.message);
                            return false;
                        }

                        if (fileCallback instanceof Function)
                        { fileCallback(response.file, file); }
                        $domObj.jqmHide();
                    }
                });
                $(currentObj._$uploader._input)
                    .mousedown(function(e) { e.stopPropagation(); });

                // Form Submit
                $domObj.find('.submitActions input[name="submit"]')
                    .click(function(event)
                    {
                        event.preventDefault();
                        currentObj._$uploader.submit();
                    });
            },

            close: function()
            {
                this.$dom().jqmHide();
            },

            isVisible: function()
            {
                return this.$dom().is(':visible');
            },

            $dom: function()
            {
                if (!this._$dom)
                { this._$dom = $(this.currentDom); }
                return this._$dom;
            }
        }
    });

})(jQuery);
