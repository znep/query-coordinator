(function($)
{
    $.uploadDialog = function(options)
    {
        var $u = $('#jqmUpload');
        if ($u.length < 1)
        {
            $('body').append('<div id="jqmUpload" class="' +
                ($.uploadDialog.version == 2 ? 'modalDialog' : 'jqmWindow') +
                '"></div>');
            $u = $('#jqmUpload');
        }
        return $u.uploadDialog(options);
    };
    $.uploadDialog.version = 1;

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
                    var isV2 = $.uploadDialog.version == 2;
                    var content = '';
                    if (!isV2)
                    {
                        content +=
                            '<div class="dialogWrapper modalDialog">' +
                            '<div class="dialogTL">' +
                            '<div class="dialogBR"><div class="dialogBL">' +
                            '<div class="dialogOuter"><div class="dialogBox">';
                    }
                    content +=
                        (isV2 ? '<h2>' : '<div class="header"><h1>') +
                        'Upload a <span class="fileType">File</span>' +
                        (isV2 ? '</h2>' : '</h1>') +
                        '<a href="#close_dialog" class="' +
                        (isV2 ? 'modalDialogClose' : 'close') + ' jqmClose" ' +
                        'title="Close">Close</a>' +
                        (isV2 ? '<div class="loadingOverlay hide"></div>' +
                        '<div class="loadingSpinner hide"></div>' :
                        '</div><div class="modalContentWrapper">') +
                        '<form class="commonForm">' +
                        (isV2 ? '' :
                        '<div class="fileBrowseButtonListContainer">' +
                        '<ul class="actionButtons">' +
                        '<li>' +
                        '<a class="fileBrowseButton">Browse For ' +
                        '<span class="fileType">File</span></a>' +
                        '</li>' +
                        '</ul>' +
                        '</div>') +
                        '<label for="file_upload">' +
                        '<span class="fileType">File</span> to Upload:</label>' +
                        '<input type="text" readonly="readonly" ' +
                        'disabled="disabled" name="file_upload" />' +
                        (isV2 ? $.button({text: 'Browse',
                            className: 'fileBrowseButton'}, true) : '') +
                        '</form>' +
                        (isV2 ? '<div class="mainError"></div>' :
                        '<div class="submitLine clearfix">' +
                        '<div class="error"></div>' +
                        '<div class="submitPending hide">Uploading...</div>') +
                        '<ul class="' + (isV2 ? 'actions' : 'submitActions') +
                        '">' +
                        '<li>' +
                        (isV2 ? $.button({text: 'Upload',
                            className: 'submitAction'}, true) :
                        '<input type="image" name="submit" class="hide" ' +
                        'src="/images/button_ok.png" alt="upload" />') +
                        '</li>' +
                        (isV2 ? '<li>' + $.button({text: 'Cancel',
                        className: 'jqmClose'}, true) + '</li>' :
                        '<li class="cancelButton">' +
                        '<a class="jqmClose" href="#cancel">' +
                        '<span>Cancel</span>' +
                        '</a>' +
                        '</li>') +
                        '</ul>' +
                        (isV2 ? '' : '</div></div>');
                    if (!isV2)
                    {
                        content +=
                            '</div></div>' +
                            '</div></div>' +
                            '</div>' +
                            '</div>';
                    }

                    $domObj.append(content);
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
            show: function(uploadURL, fileCallback, closeCallback, extList,
                fileTypeName)
            {
                var currentObj = this;
                currentObj._closeCallback = closeCallback;
                var $domObj = currentObj.$dom();

                if (!fileTypeName) { fileTypeName = 'File'; }
                $domObj.find('.fileType').text(fileTypeName);

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
                $domObj.find('.submitPending, .loadingSpinner, .loadingOverlay')
                    .addClass('hide');
                $domObj.find('.submitActions input[name="submit"], .submitAction')
                    .hide();
                $domObj.find('.error, .mainError').text('');

                var extRE;
                if (extList instanceof Array && extList.length > 0)
                { extRE = new RegExp('^(' + extList.join('|') + ')$'); }

                var $uploadButton = $domObj.find('.fileBrowseButton');
                currentObj._$uploader = new AjaxUpload($uploadButton,
                {
                    action: uploadURL,
                    autoSubmit: false,
                    name: 'uploadFileInput',
                    responseType: 'json',
                    onChange: function (file, ext)
                    {
                        $domObj.find('input[name="file_upload"]').val(file);
                        if (extRE && !(ext && extRE.test(ext)))
                        {
                            $domObj.find('.error, .mainError')
                                .text('Please choose a file with any of ' +
                                    'these extensions: ' + extList.join(', '));
                            return false;
                        }
                        else
                        {
                            $domObj.find('.error, .mainError').text('');
                            $domObj.find('.submitActions input[name="submit"], ' +
                                '.submitAction').show();
                        }
                    },
                    onSubmit: function (file, ext)
                    { $domObj.find('.submitPending, .loadingSpinner, ' +
                        '.loadingOverlay').removeClass('hide'); },
                    onComplete: function (file, response)
                    {
                        $domObj.find('.submitPending, .loadingSpinner, ' +
                            '.loadingOverlay').addClass('hide');
                        $domObj.find('.submitActions input[name="submit"], ' +
                            '.submitAction').hide();

                        if (response.error == true)
                        {
                            // New input created; re-hook mousedown
                            $(currentObj._$uploader._input)
                                .mousedown(function(e) { e.stopPropagation(); });
                            $domObj.find('.error, .mainError')
                                .text(response.message);
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
                $domObj.find('.submitActions input[name="submit"], .submitAction')
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
