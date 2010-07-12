;$(function()
{
    // Validation
    var $form = $('#editMetadataForm');
    $form.validate({
        rules: {
            'view[name]': 'required',
            'view[attributionLink]': 'customUrl'
        },
        messages: {
            'view[name]': 'The dataset must have a title.',
            'view[attributionLink]': 'That does not appear to be a valid url.'
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

    //  move over relevant options
    $licenseType.append($licenseId.children('option:first,option[value=CC],option[value=PUBLIC_DOMAIN]'));

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

        if ($form.valid())
        {
            $form.submit();
        }
    });
});