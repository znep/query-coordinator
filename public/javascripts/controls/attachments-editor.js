// DEPENDENCIES: ajax-upload

;(function($)
{
    var deleteLinkOptions = { tagName: 'a', contents: 'Delete', 'href': '#delete', 'class': 'deleteAttachmentNow' };
    var eventsWired = false;

    $.fn.attachmentsEditor = function()
    {
        this.each(function()
        {
            var $editor = $(this);
            $editor.find('.existingAttachments .deleteLinks').each(function(link){
                $(this).replaceWith(
                    $.tag(deleteLinkOptions));
            });

            if (!eventsWired)
            {
                $.live('.existingAttachments .deleteAttachmentNow', 'click', function(event){
                    event.preventDefault();

                    if (confirm('Are you sure you want to delete this attachment?'))
                    {
                        $(this).closest('li').remove();
                    }
                });
                eventsWired = true;
            }

            var $uploader = new AjaxUpload($editor.find('.uploadLink'), {
                action: '/api/assets',
                autoSubmit: true,
                responseType: 'json',
                onSubmit: function (file, extension)
                {
                    $editor.find('.uploadAttachmentThrobber').show();
                },
                onComplete: function (file, response)
                {
                    $editor.find('.uploadAttachmentThrobber').hide();
                    if (response.error)
                    {
                        $editor.find('.flash').addClass('error')
                            .text(response.message)
                            .fadeIn();
                        return;
                    }

                    $editor
                        .find('.existingAttachments').show()
                        .find('ul').append(
                            $.tag({ tagName: 'li', contents: [
                                {tagName: 'input', type: 'hidden', name: 'view[metadata][attachments][][blobId]',   value: response.id},
                                {tagName: 'input', type: 'hidden', name: 'view[metadata][attachments][][filename]', value: response.nameForOutput},
                                {tagName: 'input', type: 'text',   name: 'view[metadata][attachments][][name]',     value: response.nameForOutput},
                                 deleteLinkOptions ]}));

                    $editor.find('.existingAttachmentsContainer').show();
                    $editor.find('.noAttachmentsItem').remove();
                }
            });
        });
    };

})(jQuery);