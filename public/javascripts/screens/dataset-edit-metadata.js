;$(function()
{
    // Validation
    var $form = $('#editMetadataForm');
    var $validator = $form.validate({
        rules: {
            'view[name]': 'required',
            'view[attributionLink]': 'customUrl',
            "view[metadata[customRdfClass]]": { url: true }
        },
        messages: {
            'view[name]': 'The dataset must have a title.',
            'view[attributionLink]': 'That does not appear to be a valid url.',
            "view[metadata[customRdfClass]]": 'Custom semantic class must be url.'
        },
        errorPlacement:
            function(error, element) {
                switch (element.get(0).id)
                {
                    case 'view_metadata_customRdfClass':
                        // if rdf combo shows, we do not care about the hidden field
                        if (element.is(':visible'))
                        {
                            error.appendTo(element.parent());
                        }
                        break;
                    default:
                        error.insertAfter(element);
                }
            }
    });

    // Make licensing dropdowns cascading instead.
    //  generate the new dropdown
    var $newLine = $.tag({
        tagName: 'div', 'class': 'line clearfix', contents: [
            { tagName: 'label', 'for': 'view_licenseType', contents: 'License Type' },
            { tagName: 'select', id: 'view_licenseType', name: 'view[licenseId]' }
        ]
    });
    var $licenseType = $newLine.find('#view_licenseType');
    var $licenseId = $('#view_licenseId');
    $licenseId.closest('.line').before($newLine);

    var creativeSelected = $licenseId.val().match(/^CC/);

    //  move over relevant options, choose CC if relevant
    $licenseType.append($licenseId.children('option:first,option[value=CC],option[value=PUBLIC_DOMAIN]'));
    if (creativeSelected)
    {
        $licenseType.val('CC');
    }

    //  wire up
    var updateCascadingDropdown = function()
    {
        if ($licenseType.val() == "CC")
        {
            // Creative commons option; expand cascade
            $licenseId.closest('.line').show();
            $('#view_attribution').siblings('label').addClass('required');
            $("#view_attribution").rules("add", {
                required: true,
                messages: { required: " You must specify the data provider (attribution)."}
            });

            $licenseType.attr('name', '');
            $licenseId.attr('name', 'view[licenseId]');
        }
        else
        {
            // Not creative commons option; collapse cascade
            $licenseId.closest('.line').hide();
            $('#view_attribution').siblings('label').removeClass('required');
            $("#view_attribution").rules("remove");

            $licenseType.attr('name', 'view[licenseId]');
            $licenseId.attr('name', '');
        }
    };
    $licenseType.change(updateCascadingDropdown);
    updateCascadingDropdown();

    var deleteLinkOptions = { tagName: 'a', contents: 'Delete', 'href': '#delete', 'class': 'deleteAttachmentNow' };

    _.each($('.existingAttachments .deleteLinks'), function(link){
        $(link).replaceWith(
            $.tag(deleteLinkOptions));
    });

    $.live('.existingAttachments .deleteAttachmentNow', 'click', function(event){
        event.preventDefault();

        if (confirm('Are you sure you want to delete this attachment?'))
        {
            $(this).closest('li').remove();
        }
    });

    var initCustomRdf = function()
    {
        var $rdfClass = $form.find('#view_metadata_rdfClass');
        // non-tabular dataset, no rdf
        if ($rdfClass.length <= 0) { return; }

        var val = $form.find('#view_metadata_customRdfClass').val();
        var cboVal = $rdfClass.val();

        if (val != '(none)' && !$.isBlank(val) && val != cboVal)
        {
            $form.find('.comboToggle').click();
        }
    };

    // rdfClass has 2 html input behind it - rdfClass and customRdfClass.
    // merge them into one - rdfClass to make downstream saving easy.
    var preSubmitCustomRdf = function()
    {
        var $customRdfClass = $form.find('#view_metadata_customRdfClass');
        var $rdfClass = $form.find('#view_metadata_rdfClass');
        var val;

        // non-tabular dataset, no rdf
        if ($rdfClass.length <= 0) { return; }

        if ($customRdfClass.is(':visible'))
        {
            if (!$validator.element($customRdfClass) && !$.isBlank($customRdfClass.val()))
            {
                // abort merging because customRdfClass is invalid url
                return;
            }

            if (!$form.valid()) { return; }
            val = $customRdfClass.val();
            $rdfClass.append($("<option/>").attr('value', val)).val(val);
        }
        else
        {
            $customRdfClass.val('');
            if (!$form.valid()) { return; }
        }

        // setting name to empty prevent customRdfClass from persisting to metadata.
        $customRdfClass.attr('name', '');
        if ($rdfClass.val().startsWith('_'))
        {
            // this remove meta.rdfClass when metadata persist
            $rdfClass.attr('name', '');
        }
    };

    var $uploadLink = $.tag({
        tagName: 'a', 'href': '#upload', contents: 'Upload New Attachment', 'class': 'button'
    });

    $('#attachment_new').replaceWith($uploadLink);
    $('.newAttachmentLabel').html('&nbsp;');

    var $uploader = new AjaxUpload($uploadLink, {
        action: '/api/assets',
        autoSubmit: true,
        responseType: 'json',
        onSubmit: function (file, extension)
        {
            $('.uploadAttachmentThrobber').show();
        },
        onComplete: function (file, response)
        {
            $('.uploadAttachmentThrobber').hide();
            if (response.error)
            {
                $('.flash').addClass('error')
                    .text(response.message)
                    .fadeIn();
                return;
            }

            $.tag({ tagName: 'li', contents: [
                {tagName: 'input', type: 'hidden', name: 'view[metadata[attachments]][][blobId]',   value: response.id},
                {tagName: 'input', type: 'hidden', name: 'view[metadata[attachments]][][filename]', value: response.nameForOutput},
                {tagName: 'input', type: 'text',   name: 'view[metadata[attachments]][][name]',     value: response.nameForOutput},
                 deleteLinkOptions ]})
                .appendTo('.existingAttachments ul');

            $('.noAttachmentsItem').remove();
        }
    });

    // Now we're ready to uniform everything
    $('select').uniform();

    // Default submit button styling is really inconsistent
    $('.submitButton')
        .hide()
        .after($.tag({
            tagName: 'a', 'class': 'button submitButton',
            contents: 'Save', title: 'Save changes', href: '#submit'
        }));
    $('.submitButton').click(function(event)
    {
        event.preventDefault();
        preSubmitCustomRdf();
        if ($form.valid())
        {
            $form.submit();
        }
    });


    $form.find('.comboToggle').click(function(event)
    {
        event.preventDefault();
        var $cbo = $(this).parent().find('.uniform');

        if ($cbo.is(':visible'))
        {
            $(this).find('a').text('List');
            $cbo.hide();
            var $txt = $cbo.next('input');
            if ($txt.val()=='(none)')
            {
                $txt.val('');
            }

            $txt.removeClass('hide');
            // revalidate custom rdf
            $validator.element($txt);
        }
        else
        {
            // custom rdf class is visible
            $(this).find('a').text('Custom');
            $cbo.show();
            $cbo.next('input').addClass('hide');
            // hide custom rdf error
            $cbo.parent().find('label.error').hide();
        }
    });

    initCustomRdf();
});
