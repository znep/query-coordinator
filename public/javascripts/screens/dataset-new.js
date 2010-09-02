$(function()
{
    // state representing whether we have uploaded a file
    var submittedView = null;
    var isBlobby = false;

    // keep a reference so we don't lose it when we remove from DOM
    var $uploadFilePane = $('.uploadFilePane');

    var $wizard = $('.newDatasetWizard');

// DATA OPS
    var submitMetadata = function()
    {
        var formData = $('.newDatasetForm').serializeObject();
        var viewData = formData.view;
        _.each(viewData, function(value, key)
        {
            if ($.isBlank(value))
            {
                delete viewData[key];
            }
        });

        // manually update some things in JSON
        if (!_.isUndefined(viewData.tags))
        {
            viewData.tags = viewData.tags.split(/,/).map(function(tag) { return tag.trim(); });
        }
        if (formData.privacy == 'public')
        {
            viewData.flags = ['dataPublicRead'];
        }

        // submit things
        var successCallback = function(newDS)
        {
            submittedView = newDS;
            $('.wizardButtons .next').fadeIn();
            $wizard.trigger('wizard-next');
        };
        var errorCallback = function(request)
        {
            // it's a bit bewildering if it happens too fast.
            setTimeout(function()
            {
                $wizard.trigger('wizard-prev');
                $('.wizardButtons .cancel, .wizardButtons .prev, .wizardButtons .next').fadeIn();

                var message = (request.status == 500) ? 'An unknown error has occurred. Please try again in a bit.' :
                    JSON.parse(request.responseText).message;
                $('.metadataPane .flash')
                    .text(message)
                    .removeClass('warning notice')
                    .addClass('error');
            }, 2000);
        };
        if (submittedView === null)
        {
            submittedView = new Dataset(viewData);
            submittedView.saveNew(successCallback, errorCallback);
        }
        else
        {
            submittedView.update(viewData);
            submittedView.save(successCallback, errorCallback);
        }
    };

// WIZARD
    $wizard.wizard({
        cancelPath: '/home',
        finishCallback: function()
        {
            submittedView.redirectTo();
        },
        paneConfig: {
            'selectType': {
                disableButtons: [ 'next' ]
            },
            'uploadFile': {
                disableButtons: [ 'next' ]
            }
        }
    });

    // uniform it all
    $wizard.find(':radio, :checkbox, select').uniform();

// PAGE ZERO: SELECT TYPE
    // activate
    $('.selectTypePane').bind('wizard-paneActivated', function()
    {
        // reset everything, we've gone back to the first page
        $uploadFilePane.insertAfter($('.selectTypePane'));
        $('.metadataPane .flash').removeClass('warning notice error');

        if (submittedView !== null)
        {
            // delete whatever temporary cruft we created
            submittedView.remove();
            submittedView = null;
        }
    });
    // tooltips
    $('.newKindList > li > a').each(function()
    {
        var $this = $(this);
        $this.socrataTip({ message: $this.attr('title').clean(),
            shrinkToFit: false, killTitle: true });
    });

    // actions
    $('.newKindList a.create').click(function(event)
    {
        event.preventDefault();
        $uploadFilePane.remove();

        $wizard.trigger('wizard-next');
    });
    $('.newKindList a.upload').click(function(event)
    {
        event.preventDefault();
        $('.uploadFilePane .headline').text('Please choose a file to import.');
        $('.uploadFilePane .uploadFileFormats').show();
        isBlobby = false;

        $wizard.trigger('wizard-next');
    });
    $('.newKindList a.blobby').click(function(event)
    {
        event.preventDefault();
        $('.uploadFilePane .headline').text('Please choose a file to upload.');
        $('.uploadFilePane .uploadFileFormats').hide();
        isBlobby = true;

        $wizard.trigger('wizard-next');
    });

// PAGE ONE: UPLOAD FILE
    // upload button
    var $uploadFileButton = $('.uploadFileButton');
    var uploader = new AjaxUpload($uploadFileButton, {
        action: $uploadFileButton.attr('href'),
        autoSubmit: true,
        name: 'importFileInput',
        responseType: 'json',
        onChange: function (file, ext)
        {
            if (!(isBlobby || (ext && /^(tsv|csv|xml|xls|xlsx)$/.test(ext))))
            {
                $('.uploadFileName')
                    .val('Please choose a CSV, TSV, XML, XLS, or XLSX file.')
                    .addClass('error');
                return false;
            }
            else
            {
                $('.uploadFileName')
                    .val(file)
                    .removeClass('error');
            }
        },
        onSubmit: function (file, ext)
        {
            // refresh action url
            var action = $uploadFileButton.attr('href');
            if (isBlobby)
            {
                action += '&type=blobby';
            }
            uploader._settings.action = action;

            $('.uploadThrobber').addClass('uploading');
        },
        onComplete: function (file, response)
        {
            $('.uploadThrobber').removeClass('uploading');
            if (response.error == true)
            {
                $('.uploadFileName')
                    .val('There was a problem ' + (isBlobby ? 'uploading' : 'importing') +
                         ' that file. Please make sure it is valid.')
                    .addClass('error');
                return false;
            }

            // if it happens too fast it's bewildering
            setTimeout(function()
            {
                $wizard.trigger('wizard-next');
                submittedView = new Dataset(response);
            }, 1000);
        }
    });

// PAGE TWO: DATASET METADATA
    // validation
    $(".newDatasetForm").validate({
        rules: {
            "view[name]": "required",
            "view[attributionLink]": "customUrl"
        },
        messages: {
            "view[name]": "Dataset name is required.",
            "view[attributionLink]": "That does not appear to be a valid URL."
        }
    });

    // cc cascade
    $('#view_licenseId').change(function(event)
    {
        var $this = $(this);
        if ($(this).val() == 'CC')
        {
            $this.attr('name', '');
            $('#view_ccLicenseId').attr('name', 'view[licenseId]');
            $('.creativeCommonsLine').slideDown();
            $('#view_attribution')
                .prev('label').addClass('required').end()
                .rules('add', {
                    required: true,
                    messages: { required: 'You must specify the data provider (attribution) in a Creative Commons license.' }
                });
        }
        else
        {
            $this.attr('name', 'view[licenseId]');
            $('#view_ccLicenseId').attr('name', '');
            $('.creativeCommonsLine').slideUp();
            $('#view_attribution')
                .prev('label').removeClass('required').end()
                .rules('remove');
        }
    });

    // attachments
    $('.attachments').attachmentsEditor();

// PAGE THREE: WORKING
    // activate
    $('.workingPane').bind('wizard-paneActivated', function()
    {
        submitMetadata();
        $('.wizardButtons .cancel, .wizardButtons .prev, .wizardButtons .next').fadeOut();
    });
});