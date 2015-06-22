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
            'view[name]': $.t('screens.edit_metadata.dataset_title_error'),
            'view[attributionLink]': $.t('screens.edit_metadata.source_link_error'),
            "view[metadata[customRdfClass]]": $.t('screens.edit_metadata.custom_error')
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
                        error.appendTo(element.closest('.line'));
                }
            }
    });

    $form.on('change', 'input, select', function(event)
    {
        $form.find('.submitButton').toggleClass('disabled', !$form.valid());
    });

    var toggleFunction = $('html').hasClass('ie7') ?
        'toggle' : 'slideToggle';
    $('.toggleFieldsetLink').click(function(event)
    {
        event.preventDefault();
        $(event.target)
            .toggleClass('expanded collapsed')
            .closest('.customFieldsetWrapper')
            .find('.customFieldset')
                [toggleFunction]();
    });

    var $uploadLink = $.tag({
        tagName: 'a', 'href': '#upload', contents: $.t('screens.edit_metadata.upload_new_attachment'), 'class': 'button uploadLink'
    });

    $('#attachment_new').replaceWith($uploadLink);
    $('.newAttachmentLabel').html('&nbsp;');
    $('.attachments').attachmentsEditor();

    var initCustomRdf = function()
    {
        var $rdfClass = $form.find('#view_metadata_rdfClass');
        // non-tabular dataset, no rdf
        if ($rdfClass.length <= 0) { return; }

        var val = $form.find('#view_metadata_customRdfClass').val();
        var cboVal = $rdfClass.val();

        if (val != $.t('screens.edit_metadata.none') && !$.isBlank(val) && val != cboVal)
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
            // this clears meta.rdfClass when metadata persist
            $rdfClass.append($("<option/>").attr('value', "")).val("");
        }
    };

    // Now we're ready to uniform everything
    $('select').uniform();

    // Default submit button styling is really inconsistent
    $('.submitButton')
        .hide()
        .after($.tag({
            tagName: 'a', 'class': 'button submitButton',
            contents: $.t('screens.edit_metadata.save'), title: $.t('screens.edit_metadata.save_changes'), href: '#submit'
        }));
    $('.submitButton').click(function(event)
    {
        event.preventDefault();
        if ($(this).is('.disabled'))
        { return; }
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
            $(this).find('a').text($.t('screens.edit_metadata.list'));
            $cbo.hide();
            var $txt = $cbo.next('input');
            if ($txt.val()==$.t('screens.edit_metadata.none'))
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
            $(this).find('a').text($.t('screens.edit_metadata.custom'));
            $cbo.show();
            $cbo.next('input').addClass('hide');
            // hide custom rdf error
            $cbo.parent().find('label.error').hide();
        }
    });

    initCustomRdf();

    // Access points aka HREF aka external sources aka external datasets
    var $existingSources = $form.find('.existingExternalSource');
    var sourceCount = $existingSources.length;
    var updateRemoveLinks = function()
    {
        if (sourceCount == 1)
        {
            $existingSources
                .find('.removeExternalSource')
                .addClass('disabled');
        }
    };
    updateRemoveLinks();

    $form.find('.removeExternalSource').click(function(event)
    {
        event.preventDefault();
        if ($(this).hasClass('disabled')) { return; }

        if (confirm($.t('screens.edit_dataset.external_confirm')))
        {
            var $line = $(this).closest('.line');
            $line.slideUp(300, function() {
                $line.remove();
            });
            sourceCount--;
            updateRemoveLinks();
        }
    });

    $('.customImage #custom_image').imageUploader({
        $image: $('.customImageContainer'),
        success: function($container, $image, response) {
            $image.closest('.line').removeClass('hide');
            $('.iconUrlField').val('fileId:' + response.file);
        },
        urlProcessor: function(response) {
            if (!_.isEmpty(response.file))
            {
                return '/api/views/'+ blist.viewId + '/files/' + response.file+'?size=medium';
            }
            else
            {
                return '/api/assets/' + response.id + '?s=medium';
            }
        }
    });
    $('.customImage #delete_custom_image').uniform();
});
