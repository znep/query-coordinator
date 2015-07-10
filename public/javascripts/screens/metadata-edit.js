
(function($)
{
    $.fn.customFieldAdd = function(options)
    {
        var opts = $.extend({}, $.fn.customFieldEdit.defaults, options||{});

        return this.each(function()
        {
            var $this       = $(this);
            var $trigger    = opts.triggerButton || $(opts.addTriggerSelector);
            var $addPane    = opts.addPane || $(opts.addPaneSelector);
            var $addHint    = opts.addHint || $(opts.addHintSelector);

            $trigger.click(function(event)
            {
                event.preventDefault();

                $addPane.slideDown('normal');
                $addHint.slideUp('normal');
            });
        });

    };

    $.fn.customFieldEdit = function(options)
    {
        var opts = $.extend({}, $.fn.customFieldEdit.defaults, options||{});

        return this.each(function()
        {
            var $this       = $(this);
            var $trigger    = opts.triggerButton || $this.find(opts.triggerButtonSelector);
            var $close      = opts.closeButton || $this.find(opts.closeButtonSelector);
            var $form       = $this.find('form');
            var $label      = $this.find('span.textContent');
            var $textField  = $this.find('input.textValue');
            var $displayPane= $this.find('.textDisplay');
            var $editForm   = opts.editForm || $this.find(opts.editFormSelector);

            $trigger.click(function(event)
            {
                if ($(event.target).is('input') || $(event.target).is('img')
                  || (!$trigger.is('a') && $(event.target).is('a')))
                { return true; }

                event.preventDefault();

                $displayPane.hide();
                $editForm.removeClass('hide');
            });

            $close.click(function(event)
            {
                event.preventDefault();

                $displayPane.show();
                $editForm.addClass('hide');
                $textField.val($label.text());
            });

            $form.submit(function(event)
            {
                event.preventDefault();

                $label.text($textField.val());

                var fieldName  = $.trim($this.find('dt').text() || '');
                if ($.isBlank(fieldName))
                {
                    opts.editErrorCallback('Error: Can not save a custom field with no name.', opts);
                    return false;
                }

                var fieldValue = $.trim($textField.val() || '');

                var customFields = JSON.parse($(opts.viewMetadataSelector).val()) || {};

                if ($.isBlank(customFields.custom_fields))
                {
                    customFields.custom_fields = {};
                }

                if ($.isBlank(fieldValue))
                {
                    delete customFields.custom_fields[fieldName];
                }
                else
                {
                    customFields.custom_fields[fieldName] = fieldValue;
                }

                $.ajax({
                    url: $form.attr('action'),
                    type: 'PUT',
                    data: JSON.stringify({metadata: customFields}),
                    dataType: 'json',
                    contentType: 'application/json',
                    error: function(request, textStatus, error) {
                        opts.editErrorCallback(
                            "An error was encountered saving your metadata. Please retry later.", opts);
                    },
                    success: function(responseData) {
                        opts.editSuccessCallback(responseData, opts, $displayPane, $editForm);
                    }
               });
            });
        });
    };

    $.fn.attachmentsEdit = function(options)
    {
        var opts = $.extend({}, $.fn.attachmentsEdit.attachmentDefaults, options);

        return this.each(function()
        {
            var $this = $(this);
            var $form = $this.find('form');
            var $trigger    = opts.triggerButton || $(opts.triggerButtonSelector);
            var $close      = opts.closeButton || $(opts.closeButtonSelector);
            var $container  = opts.attachmentsContainer || $(opts.attachmentsContainerSelector);
            var $deleteLink = $(opts.deleteAttachmentSelector);
            var $uploadLink = opts.uploadLink || $(opts.uploadLinkSelector);

            $trigger.click(function(event)
            {
                if($(event.target).is('a') && !$trigger.is('a')) { return true; }
                event.preventDefault();
                $this.slideDown('normal');
                $container.slideUp('normal');
                opts.openCallback(event);
            });

            $close.click(function(event)
            {
                event.preventDefault();
                $this.slideUp('normal');
                $container.slideDown('normal');
            });

            $deleteLink.live('click', function(event)
            {
                event.preventDefault();
                if(confirm('Are you sure you want to delete this attachment?'))
                {
                    $(this).closest('li').remove();
                }
            });

            var $uploader = new AjaxUpload($uploadLink, {
                action: opts.uploadAction,
                autoSubmit: true,
                responseType: 'json',
                onChange: opts.onChangeAttachment,
                onSubmit: function(file, extension)
                {
                    $(opts.errorMessageContainerSelector).addClass('hide')
                        .find(opts.errorMessageSelector).hide();
                    $(opts.uploadIndicator).removeClass('hide');
                },
                onComplete: function(file, response)
                {
                    if (response.error)
                    {
                        opts.errorCallback(response.message, opts);
                        return;
                    }
                    $(opts.uploadIndicator).addClass('hide');
                    var $li = $('<li class="attachmentItem"/>')
                        .append('&nbsp;')
                        .append($('<a/>')
                            .attr('href', '#delete_attachment')
                            .attr('class', 'deleteAttachmentLink')
                            .text('Delete').attr('title','Delete Attachment'))
                        .append($('<input/>')
                            .attr('type', 'text').attr('name','name')
                            .val(response.nameForOutput))
                        .append($('<input/>')
                            .attr('type','hidden').attr('name','filename')
                            .val(response.nameForOutput))
                        .append($('<input/>')
                            .attr('type','hidden').attr('name','blobId')
                            .val(response.id));

                    $(opts.listSelector).append($li);
                }
            });

            $this.find('#attachmentsEditSubmitButton').click(function(event)
            {
                event.preventDefault();
                attachments = [];

                // Why jQuery has no serializeToJson I am not sure
                $form.find('.attachmentItem').each(function(i, a)
                {
                    attachment = {};
                    $(this).find('input').each(function(j, input)
                    {
                        attachment[$(input).attr('name')] = $(input).val();
                    });
                    $nameField = $(this).find("input[name='name']");
                    if ($.isBlank($nameField.val()))
                    {
                        $nameField.val($(this).find("input[name='filename']").val());
                    }
                    attachments.push(attachment);
                });

                var metadata = JSON.parse($(opts.viewMetadataSelector).val()) || {};
                metadata.attachments = attachments;

                $.ajax({
                    url: $form.attr('action'),
                    type: 'PUT',
                    data: JSON.stringify({metadata: metadata}),
                    dataType: 'json',
                    contentType: 'application/json',
                    error: function(request, textStatus, error) {
                        opts.errorCallback("An error was encountered saving your attachments. Please retry later.", opts);
                    },
                    success: function(responseData) {
                        opts.successCallback(responseData, opts);
                    }
                });
            });
        });

    };

    $.fn.customFieldEdit.defaults = {
        closeButtonSelector: '.formCancelLink',
        editFormSelector: '.editFieldForm',
        submitButtonSelector: '.customFieldSubmitLink',
        triggerButtonSelector: '.actionList>*',
        addTriggerSelector: '.customFieldAddHint dl>*',
        addPaneSelector: '.customFieldAdd',
        addHintSelector: '.customFieldAddHint',
        viewMetadataSelector: '#viewMetadataJson',
        editSuccessCallback: function(responseData, opts, label, editForm)
        {
            label.show();
            editForm.addClass('hide');
            updateMetaData(opts.viewMetadataSelector, responseData);
        },
        editErrorCallback: function(message, opts)
        {
            alert(message);
        },
        addSuccessCallback: function(responseData, label)
        {
            updateMetaData(opts.viewMetadataSelector, responseData);
        }
    };

    $.fn.attachmentsEdit.attachmentDefaults = {
        triggerButtonSelector: '.attachmentsSummary dl.actionList>*',
        attachmentsContainerSelector: '.attachmentsSummary',
        listSelector: '.attachmentsEdit .attachmentsList',
        closeButtonSelector: '.closeAttachmentsLink',
        deleteAttachmentSelector: '.deleteAttachmentLink',
        errorMessageContainerSelector: '.attachmentErrorItem',
        errorMessageSelector: '.attachmentErrorMessage',
        viewMetadataSelector: '#viewMetadataJson',
        uploadAction: '/api/assets',
        uploadIndicator: '.uploadingIndicator',
        uploadLinkSelector: '.uploadNewAttachmentLink',
        errorCallback: function(message, opts)
        {
            $(opts.uploadIndicator).addClass('hide');
            $(opts.errorMessageContainerSelector).removeClass('hide')
                .find(opts.errorMessageSelector).text($.htmlStrip(message))
                .show();
        },
        openCallback: function() {},
        onChangeAttachment: function(file, extension)
        {
        },
        successCallback: function(responseData, opts)
        {
            if(responseData['error'])
            {
                opts.errorCallback(responseData['message'], opts);
            }

            var $list = $(opts.attachmentsContainerSelector).find('ul');
            $list.empty();
            if(responseData.metadata && responseData.metadata.attachments)
            {
                _.each(responseData.metadata.attachments, function(a, i)
                {
                    var name = a.name || a.filename;
                    $list.append(
                        $('<li class="attachmentItem">').append(
                            $('<a/>')
                                .text(name)
                                .attr('target', '_blank')
                                .attr('href', '/api/assets/' + a.blobId)
                        )
                    );
                });
            }

            $('.attachmentsEdit').slideUp('normal');
            $(opts.attachmentsContainerSelector).slideDown('normal');
            updateMetaData(opts.viewMetadataSelector, responseData);
        }
    };




    var updateMetaData = function(selector, newMeta)
    {
        $(selector).val(JSON.stringify(newMeta.metadata));
    }

})(jQuery);
