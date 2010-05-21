
(function($)
{
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
                    $(opts.errorMessageSelector).hide();
                    $(opts.uploadIndicator).removeClass('hide');
                },
                onComplete: function(file, response)
                {
                    $(opts.uploadIndicator).addClass('hide');
                    var $li = $('<li class="attachmentItem"/>')
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

                $.ajax({
                    url: $form.attr('action'),
                    type: 'PUT',
                    data: $.json.serialize({
                        metadata: {
                            attachments: attachments
                        }
                    }),
                    dataType: 'json',
                    contentType: 'application/json',
                    success: function(responseData) {
                        opts.successCallback(responseData, opts);
                    }
                });
            });
        });
        
    };

    $.fn.attachmentsEdit.attachmentDefaults = {
        triggerButtonSelector: '.attachmentsSummary dl.actionList>*',
        attachmentsContainerSelector: '.attachmentsSummary',
        listSelector: '.attachmentsEdit .attachmentsList',
        closeButtonSelector: '.closeAttachmentsLink',
        deleteAttachmentSelector: '.deleteAttachmentLink',
        errorMessageContainerSelector: '.attachmentErrorItem',
        errorMessageSelector: '.attachmentErrorMessage',
        uploadAction: '/api/assets',
        uploadIndicator: '.uploadingIndicator',
        uploadLinkSelector: '.uploadNewAttachmentLink',
        openCallback: function() {},
        onChangeAttachment: function(file, extension)
        {
        },
        successCallback: function(responseData, opts)
        {
            if(responseData['error'])
            {
                $(opts.errorMessageSelector).text(responseData['error'])
                    .show();
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
        }
    };

})(jQuery);
