(function($)
{
    $.uploadDialog = function(options)
    {
        var $u = $('#jqmUpload');
        if ($u.length < 1)
        {
            $('body').append('<div id="jqmUpload" class="modalDialog"></div>');
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
                    var content = '<h2>' +
                        'Upload a <span class="fileType">File</span>' +
                        '</h2>' +
                        '<a href="#close_dialog" ' +
                        'class="modalDialogClose jqmClose" ' +
                        'title="Close">Close</a>' +
                        '<div class="loadingOverlay hide"></div>' +
                        '<div class="loadingSpinner hide"></div>' +
                        '<form class="commonForm">' +
                        '<label for="file_upload">' +
                        '<span class="fileType">File</span> to Upload:</label>' +
                        '<input type="text" readonly="readonly" ' +
                        'disabled="disabled" name="file_upload" />' +
                        $.button({text: 'Browse',
                            className: 'fileBrowseButton'}, true) +
                        '</form>' +
                        '<div class="mainError"></div>' +
                        '<ul class="actions">' +
                        '<li>' +
                        $.button({text: 'Upload',
                            className: 'submitAction'}, true) +
                        '</li>' +
                        '<li>' + $.button({text: 'Cancel',
                        className: 'jqmClose'}, true) + '</li>' +
                        '</ul>';

                    $domObj.append(content);
                    $domObj.jqm({trigger: false, modal: true,
                        onHide: function(hash)
                        {
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

                    // Form Submit
                    $domObj.find('.submitAction').click(function(event)
                        {
                            event.preventDefault();
                            currentObj._$uploader.submit();
                        });

                    currentObj._$uploader = new AjaxUpload(
                        $domObj.find('.fileBrowseButton'),
                        {
                            action: '',
                            autoSubmit: false,
                            name: 'uploadFileInput',
                            responseType: 'json',
                            onChange: function (file, ext)
                            {
                                $domObj.find('input[name="file_upload"]').val(file);
                                if (!$.isBlank(currentObj._extRE) &&
                                    !(ext && currentObj._extRE.test(ext)))
                                {
                                    $domObj.find('.mainError')
                                        .text('Please choose a file with any of ' +
                                            'these extensions: ' +
                                            currentObj._extList.join(', '));
                                    return false;
                                }
                                else
                                {
                                    $domObj.find('.mainError').text('');
                                    $domObj.find('.submitAction').show();
                                }
                            },
                            onSubmit: function (file, ext)
                            {
                                var uploadInstanceURL =
                                    _.isFunction(currentObj._uploadURL) ?
                                        currentObj._uploadURL(file) :
                                        currentObj._uploadURL;
                                if (!uploadInstanceURL.match(/\.txt$|\.txt\?/))
                                {
                                    // Stick a .txt on the end so the server returns
                                    // the right thing...
                                    if (uploadInstanceURL.endsWith('/'))
                                    {
                                        uploadInstanceURL =
                                            uploadInstanceURL.slice(0,
                                                uploadInstanceURL.length - 1);
                                    }
                                    uploadInstanceURL += '.txt';
                                }
                                currentObj._$uploader._settings.action =
                                    uploadInstanceURL;
                                $domObj.find('.loadingSpinner, ' +
                                    '.loadingOverlay').removeClass('hide');
                            },
                            onComplete: function (file, response)
                            {
                                $domObj.find('.loadingSpinner, ' +
                                    '.loadingOverlay').addClass('hide');
                                $domObj.find('.submitAction').hide();

                                if (response.error == true)
                                {
                                    // New input created; re-hook mousedown
                                    $(currentObj._$uploader._input)
                                        .mousedown(function(e)
                                            { e.stopPropagation(); });
                                    $domObj.find('.mainError')
                                        .text(response.message);
                                    return false;
                                }

                                if (currentObj._fileCallback instanceof Function)
                                {
                                    currentObj._fileCallback(response.file,
                                        file, response);
                                }
                                $domObj.jqmHide();
                            }
                        });
                }
            },

            // External interface methods
            show: function(uploadURL, fileCallback, closeCallback, extList,
                fileTypeName)
            {
                var currentObj = this;
                currentObj._closeCallback = closeCallback;
                var $domObj = currentObj.$dom();

                if (!fileTypeName) { fileTypeName = 'File'; }
                $domObj.find('.fileType').text(fileTypeName);

                $domObj.jqmShow();

                $domObj.find('input[name="file_upload"]').val('');
                $domObj.find('.loadingSpinner, .loadingOverlay').addClass('hide');
                $domObj.find('.submitAction').hide();
                $domObj.find('.mainError').text('');

                // Set up vars that uploader needs
                currentObj._uploadURL = uploadURL;
                currentObj._fileCallback = fileCallback;
                currentObj._extList = extList;
                currentObj._extRE = null;
                if (extList instanceof Array && extList.length > 0)
                { currentObj._extRE = new RegExp('^(' + extList.join('|') + ')$'); }
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
