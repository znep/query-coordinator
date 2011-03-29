$(function()
{

// DATA OPS
var formToViewMetadata = function(metadataForm)
{
    var viewData = metadataForm.view;
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
    if (metadataForm.privacy == 'public')
    {
        viewData.flags = ['dataPublicRead'];
    }

    return viewData;
}

// WIZARD (outdented for readability)
var $wizard = $('.newDatasetWizard');
$wizard.wizard({
    cancelPath: '/profile',
    paneConfig: {

        'selectType': {
            disableButtons: [ 'next' ],
            onInitialize: function($pane, config, state, command)
            {
                // tooltips
                $pane.find('.newKindList > li > a').each(function()
                {
                    var $this = $(this);
                    $this.socrataTip({ message: $this.attr('title').clean(),
                        shrinkToFit: false, killTitle: true });
                });

                // actions
                $pane.find('.newKindList a.create').click(function(event)
                {
                    event.preventDefault();

                    state.type = 'blist';
                    command.next('metadata');
                });
                $pane.find('.newKindList a.upload').click(function(event)
                {
                    event.preventDefault();

                    state.type = 'blist';
                    command.next('uploadFile');
                });
                $pane.find('.newKindList a.mapLayer').click(function(event)
                {
                    event.preventDefault();

                    state.type = 'esri';
                    command.next('metadata');
                });
                $pane.find('.newKindList a.blobby').click(function(event)
                {
                    event.preventDefault();

                    state.type = 'blobby';
                    command.next('uploadFile');
                });
            },
            onActivate: function($pane, config)
            {
                // size the select list by how many items it contains (or it won't center)
                var $newKindList = $pane.find('.newKindList');
                var $newKindListItems = $newKindList.children();
                $newKindList.width($newKindListItems.filter(':last').outerWidth(true) * $newKindListItems.length -
                    ($newKindListItems.filter(':last').outerWidth(true) - $newKindListItems.filter(':first').outerWidth(true)));
            }
        },



        'uploadFile': {
            disableButtons: [ 'next' ],
            onActivate: function($pane, config, state, command)
            {
                if (!_.isUndefined(state.ajaxUpload))
                {
                    // destroy the old ajaxupload as best we can if it's there.
                    state.ajaxUpload.disable();
                    $(state.ajaxUpload._button).remove();
                    delete state.ajaxUpload;
                }

                // update text
                var isBlist = state.type == 'blist';
                $pane.find('.headline').text('Please choose a file to ' + (isBlist ? 'import' : 'upload'));
                $pane.find('.uploadFileFormats').toggle(isBlist);

                // uploader
                var uploadEndpoint = '/imports.txt';
                if (state.type == 'blobby')
                    uploadEndpoint += '?type=blobby';

                var $uploadFileButton = $pane.find('.uploadFileButton');
                var $uploadThrobber = $pane.find('.uploadThrobber');
                var uploader = blist.fileUploader({
                    element: $uploadFileButton[0],
                    action: uploadEndpoint,
                    multiple: false,
                    onSubmit: function(id, fileName)
                    {
                        var ext = (fileName.indexOf('.') >= 0) ? fileName.replace(/.*\./, '') : '';
                        if (!((state.type == 'blobby') || (ext && /^(tsv|csv|xml|xls|xlsx)$/i.test(ext))))
                        {
                            $pane.find('.uploadFileName')
                                .val('Please choose a CSV, TSV, XML, XLS, or XLSX file.')
                                .addClass('error');
                            return false;
                        }

                        $pane.find('.uploadFileName')
                            .val(fileName)
                            .removeClass('error');

                        $uploadThrobber.slideDown()
                                       .find('.text').text('Uploading your file...');
                    },
                    onProgress: function(id, fileName, loaded, total)
                    {
                        if (loaded < total)
                            $uploadThrobber.find('.text').text('Uploading your file (' +
                                                               (Math.round(loaded / total * 10) / 10) + '% of ' +
                                                               uploader._formatSize(total) + ')...');
                        else
                            $uploadThrobber.find('.text').text('Analyzing your file...');
                    },
                    onComplete: function(id, fileName, response)
                    {
                        if (response.error == true)
                        {
                            $uploadThrobber.slideUp();
                            $pane.find('.uploadFileName')
                                .val('There was a problem ' + ((state.type == 'blobby') ? 'uploading' : 'importing') +
                                     ' that file. Please make sure it is valid.')
                                .addClass('error');
                            return false;
                        }

                        // if it happens too fast it's bewildering
                        setTimeout(function()
                        {
                            $uploadThrobber.slideUp();
                            $pane.find('.uploadFileName').val('No file selected yet.');
                            state.submittedView = new Dataset(response);
                            command.next('metadata');
                        }, 1000);
                    }
                });
            }
        },



        'metadata': {
            uniform: true,
            onInitialize: function($pane, paneConfig, state)
            {
                // general validation
                $('.newDatasetForm').validate({
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
                $pane.find(".metadataForm .customRequired").each(function()
                {
                    $(this).find('input[type="text"]').rules('add', {
                        required: {
                            depends: function(element) {
                                return $(element).is(':visible');
                            }
                        }
                    });
                });

                // hide/show sections based on new dataset type
                if (state.type == 'esri')
                    $pane.find('.metadataForm > div:not(.mapLayerMetadata, .attachmentsMetadata, .privacyMetadata)').hide();
                else
                    $pane.find('.mapLayerMetadata').hide();

                // collapsible custom metadata sections
                var toggleFunction = ($.browser.msie && ($.browser.majorVersion == 7)) ?
                    'toggle' : 'slideToggle';
                $pane.find('.toggleFieldsetLink').click(function(event)
                {
                    event.preventDefault();
                    $(event.target)
                        .toggleClass('expanded collapsed')
                        .closest('.customFieldsetWrapper')
                        .find('.customFieldset')[toggleFunction]();
                });

                // cc cascade
                $pane.find('#view_licenseId').change(function(event)
                {
                    var $this = $(this);
                    if ($(this).val() == 'CC')
                    {
                        $this.attr('name', '');
                        $pane.find('#view_ccLicenseId').attr('name', 'view[licenseId]');
                        $pane.find('.creativeCommonsLine').slideDown();
                        $pane.find('#view_attribution')
                            .prev('label').addClass('required').end()
                            .rules('add', {
                                required: true,
                                messages: { required: 'You must specify the data provider (attribution) in a Creative Commons license.' }
                            });
                    }
                    else
                    {
                        $this.attr('name', 'view[licenseId]');
                        $pane.find('#view_ccLicenseId').attr('name', '');
                        $pane.find('.creativeCommonsLine').slideUp();
                        $pane.find('#view_attribution')
                            .prev('label').removeClass('required').end()
                            .rules('remove');
                    }
                });

                // attachments
                $pane.find('.attachments').attachmentsEditor();
            },
            onActivate: function($pane, config, state)
            {
                if ($.subKeyDefined($, 'uniform.update'))
                    $.uniform.update($pane.find(':radio, :checkbox, select'));

                // update display for upload/import if necessary
                if (!_.isUndefined(state.submittedView))
                {
                    $pane.find('.headline').html('Please describe &ldquo;' +
                        $.htmlEscape(state.submittedView.name) + '.&rdquo;');
                    $pane.find('#view_name').val(state.submittedView.name).blur();
                }

                // render an error message if we have one
                if (!_.isUndefined(state.error))
                {
                    $pane.find('.flash').text(state.error)
                                        .removeClass('warning notice')
                                        .addClass('error');
                }
                else
                {
                    $pane.find('.flash').empty().removeClass('warning notice error');
                }
            },
            onNext: function($pane, state)
            {
                delete state.error; // presumably errors have been resolved
                state.metadataForm = $('.newDatasetForm').serializeObject();
                return 'working';
            },
            onPrev: function($pane, state)
            {
                if (!_.isUndefined(state.submittedView))
                    state.submittedView.remove();
                return;
            }
        },



        'working': {
            disabledButtons: [ 'cancel', 'prev', 'next' ],
            onActivate: function($pane, config, state, command)
            {
                // fire things off
                var viewData = formToViewMetadata(state.metadataForm);

                var successCallback = function(createdView)
                {
                    setTimeout(function()
                    {
                        state.submittedView = createdView;
                        command.next('finish');
                    }, 2000);
                };

                var errorCallback = function(request)
                {
                    // it's a bit bewildering if it happens too fast.
                    setTimeout(function()
                    {
                        state.error = (request.status == 500) ?
                                        'An unknown error has occurred. Please try again in a bit.' :
                                        JSON.parse(request.responseText).message;
                        command.prev();
                    }, 2000);
                };

                var saveFormMetadata = function()
                {
                    if (_.isUndefined(state.submittedView))
                    {
                        new Dataset(viewData).saveNew(successCallback, errorCallback);
                    }
                    else
                    {
                        state.submittedView.update(viewData);
                        state.submittedView.save(successCallback, errorCallback);
                    }
                };

                if ((state.type == 'blist') || (state.type  == 'blobby'))
                {
                    saveFormMetadata();
                }
                else if (state.type == 'esri')
                {
                    Dataset.createFromMapLayerUrl(viewData.esri_src, function(createdView)
                    {
                        state.submittedView = createdView;

                        // preserve metadata
                        if (!_.isUndefined(viewData.metadata))
                            $.extend(true, viewData.metadata, createdView.metadata);

                        saveFormMetadata();
                    }, errorCallback);
                }
            }
        },



        'finish': {
            disabledButtons: [ 'cancel', 'prev' ],
            isFinish: true,
            onNext: function($pane, state)
            {
                state.submittedView.redirectTo();
                return false;
            }
        }
    }
});

// PAGE THREE: WORKING
    // activate
    $('.workingPane').bind('wizard-paneActivated', function()
    {
        submitMetadata();
        $('.wizardButtons .cancel, .wizardButtons .prev, .wizardButtons .next').fadeOut();
    });
});
