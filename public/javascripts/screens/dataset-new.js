$(function()
{
    // state representing whether we have uploaded a file
    var submittedView = null;
    var isBlobby = false;
    var datasetType = 'native';

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
            viewData.tags = viewData.tags.split(/\s*,\s*/);
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
        var mapLayerSuccessCallback = function(newDS)
        {
            if (!_.isUndefined(viewData.metadata))
            {
                viewData.metadata = newDS.metadata;
            }
            else
            {
                viewData.metadata = $.extend(true, viewData.metadata, newDS.metadata);
            }
            submittedView.update(viewData);
            submittedView.save(successCallback, errorCallback);
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
            if (datasetType == 'native')
            {
                new Dataset(viewData).saveNew(successCallback, errorCallback);
            }
            else if (datasetType == 'esri')
            {
                Dataset.createFromMapLayerUrl(viewData.esri_src, mapLayerSuccessCallback, errorCallback);
            }
        }
        else
        {
            submittedView.update(viewData);
            submittedView.save(successCallback, errorCallback);
        }
    };

// WIZARD
    $wizard.wizard({
        cancelPath: '/profile',
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
        $('.metadataPane .headline').text('Please describe your data.');

        datasetType = 'native';
        $('.metadataForm > div').show();

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

        $('.metadataForm .mapLayerMetadata').hide();

        $wizard.trigger('wizard-next');
    });
    $('.newKindList a.upload').click(function(event)
    {
        event.preventDefault();
        $('.uploadFilePane .headline').text('Please choose a file to import.');
        $('.uploadFilePane .uploadFileFormats').show();
        isBlobby = false;

        $('.metadataForm .mapLayerMetadata').hide();

        $wizard.trigger('wizard-next');
    });
    $('.newKindList a.mapLayer').click(function(event)
    {
        event.preventDefault();
        $uploadFilePane.remove();

        datasetType = 'esri';
        $('.metadataForm > div:not(.mapLayerMetadata, .attachmentsMetadata, .privacyMetadata)').hide();

        $wizard.trigger('wizard-next');
    });
    $('.newKindList a.blobby').click(function(event)
    {
        event.preventDefault();
        $('.uploadFilePane .headline').text('Please choose a file to upload.');
        $('.uploadFilePane .uploadFileFormats').hide();
        isBlobby = true;

        $('.metadataForm .mapLayerMetadata').hide();

        $wizard.trigger('wizard-next');
    });

    // size the select list by how many items it contains (or it won't center)
    $newKindList = $('.newKindList');
    $newKindListItems = $newKindList.children();
    $newKindList.width($newKindListItems.filter(':last').outerWidth(true) * $newKindListItems.length -
        ($newKindListItems.filter(':last').outerWidth(true) - $newKindListItems.filter(':first').outerWidth(true)));

// PAGE ONE: UPLOAD FILE
    // upload button
    var $uploadFileButton = $('.uploadFileButton');
    var fileName = '';
    var uploader = new AjaxUpload($uploadFileButton, {
        action: $uploadFileButton.attr('href'),
        autoSubmit: true,
        name: 'importFileInput',
        responseType: 'json',
        onChange: function (file, ext)
        {
            if (!(isBlobby || (ext && /^(tsv|csv|xml|xls|xlsx)$/i.test(ext))))
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
                    fileName = file;
            }
        },
        onSubmit: function (file, ext)
        {
            // refresh action url
            var action = $uploadFileButton.attr('href');
            if (isBlobby)
            {
                action += '?type=blobby';
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
                $('.metadataPane .headline').html('Please describe &ldquo;' +
                    $.htmlEscape(fileName) + '.&rdquo;');
                $('.metadataPane #view_name')
                    .val(submittedView.name)
                    .removeClass('prompt');
                $('.uploadFileName').val('No file selected yet.');
            }, 1000);
        }
    });

// PAGE TWO: DATASET METADATA
    $('.metadataPane').bind('wizard-paneActivated', function()
    {
        // sometimes uniform gets confused
        $.uniform.update($(this).find('input'));
    });

    // validation
    $(".newDatasetForm").validate({
        rules: {
            "view[attributionLink]": "customUrl",
            "view[esri_src]": 'customUrl'
        },
        messages: {
            "view[name]": "Dataset name is required.",
            "view[attributionLink]": "That does not appear to be a valid URL.",
            'view[esri_src]': 'A valid ESRI map layer URL is required.'
        }
    });

    // custom metadata validation
    $(".newDatasetForm .customRequired").each(function()
    {
        $(this)
            .find('input[type="text"]')
                .rules('add', {
                    required: {
                        depends: function(element) {
                            return $(element).is(':visible');
                        }
                    }
                });
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
