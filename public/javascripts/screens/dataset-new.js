$(function(){

blist.namespace.fetch('blist.importer');

var submitError = null;

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

    var externalSources = metadataForm.external_sources;
    if (!_.isUndefined(externalSources))
    {
        viewData.metadata || (viewData.metadata = {});
        viewData.metadata.accessPoints || (viewData.metadata.accessPoints = {});
        _.each(externalSources, function(source) {
            var extensionReg = new RegExp(/\.([^\.\/]+)$/);
            var extension = extensionReg.exec(source);
            var key = extension ? extension[1].toLowerCase() : 'unknown';
            viewData.metadata.accessPoints[key] = source;
        });
        // Set the displayType so Dataset knows what it is when creating it
        viewData.displayType = 'href';
    }

    return viewData;
}

// WIZARD (outdented for readability)
var $wizard = $('.newDatasetWizard');
$wizard.wizard({
    onCancel: function($pane, state)
    {
        var redirectToProfile = function()
        {
            window.location.href = $.path('/profile');
        };

        if (!_.isUndefined(state.submittedView))
        {
            // well, if we fail we probably don't have anything we can delete anyway
            state.submittedView.remove(redirectToProfile, redirectToProfile);
        }
        else
        {
            redirectToProfile();
        }

        return false;
    },
    paneConfig: {

        'selectType': {
            disableButtons: [ 'next' ],
            onInitialize: function($pane, config, state, command)
            {
                state.selectTypeTips = [];
                // tooltips
                $pane.find('.newKindList > li > a').each(function()
                {
                    var $this = $(this);
                    state.selectTypeTips.push($this.socrataTip({ message: $this.attr('title').clean(),
                        shrinkToFit: false, killTitle: true }));
                });

                // actions
                $pane.find('.newKindList a.create').click(function(event)
                {
                    event.preventDefault();

                    state.type = 'blist';
                    submitError = null;
                    command.next('metadata');
                });
                $pane.find('.newKindList a.upload').click(function(event)
                {
                    event.preventDefault();

                    state.type = 'blist';
                    state.afterUpload = 'importColumns';
                    submitError = null;
                    command.next('selectUploadType');
                });
                $pane.find('.newKindList a.mapLayer').click(function(event)
                {
                    event.preventDefault();

                    state.type = 'esri';
                    submitError = null;
                    command.next('metadata');
                });
                $pane.find('.newKindList a.shapefile').click(function(event)
                {
                    event.preventDefault();

                    state.type = 'shapefile';
                    state.afterUpload = 'importShapefile';
                    submitError = null;
                    command.next('uploadFile');
                });
                $pane.find('.newKindList a.blobby').click(function(event)
                {
                    event.preventDefault();

                    state.type = 'blobby';
                    submitError = null;
                    command.next('uploadFile');
                });
                $pane.find('.newKindList a.external').click(function(event)
                {
                    event.preventDefault();

                    state.type = 'external';
                    submitError = null;
                    command.next('metadata');
                });
            },
            onActivate: function($pane, config, state)
            {
                // size the select list by how many items it contains (or it won't center)
                var $newKindList = $pane.find('.newKindList').first();
                var $newKindListItems = $newKindList.children();
                var adjust = ($.browser.msie && ($.browser.majorVersion >= 8)) ? 1 : 0;
                if ($newKindListItems.length > 4)
                {
                    var $copy = $newKindList.clone().empty();
                    // grab the fourth and larger elements
                    $newKindListItems.filter(':gt(2)')
                        .appendTo($copy);
                    $newKindList.after($copy);
                }
                $pane.find('.newKindList').each(function(i, list)
                {
                    var $list = $(list);
                    var $items = $($list).children();
                    $list.width($items.filter(':last').outerWidth(true) * $items.length -
                        ($items.filter(':last').outerWidth(true) - $items.filter(':first').outerWidth(true)) +
                        adjust);
                });

                // reactivate tips if we have them
                _.each(state.selectTypeTips || [], function(tip)
                {
                    tip.enable();
                });
            },
            onLeave: function($pane, config, state)
            {
                _.each(state.selectTypeTips || [], function(tip)
                {
                    tip.hide();
                    tip.disable();
                });
            }
        },
        'selectUploadType': {
            disableButtons: [ 'next' ],
            onInitialize: function($pane, config, state, command)
            {
                state.selectTypeTips = [];
                // tooltips
                $pane.find('.uploadTypeList > li > a').each(function()
                {
                    var $this = $(this);
                    state.selectTypeTips.push($this.socrataTip({ message: $this.attr('title').clean(),
                        shrinkToFit: false, killTitle: true }));
                });

                // actions
                $pane.find('.uploadTypeList a.byUpload').click(function(event)
                {
                    event.preventDefault();
                    command.next('uploadFile');
                });
                $pane.find('.uploadTypeList a.byCrossload').click(function(event)
                {
                    event.preventDefault();
                    command.next('crossloadFile');
                });
            },
            onActivate: function($pane, config, state)
            {
                // reactivate tips if we have them
                _.each(state.selectTypeTips || [], function(tip)
                {
                    tip.enable();
                });
            },
            onLeave: function($pane, config, state)
            {
                _.each(state.selectTypeTips || [], function(tip)
                {
                    tip.hide();
                    tip.disable();
                });
            }
        },



        'uploadFile':       blist.importer.uploadFilePaneConfig,
        'crossloadFile':    blist.importer.crossloadFilePaneConfig,
        'importColumns':    blist.importer.importColumnsPaneConfig,
        'importShapefile':  blist.importer.importShapefilePaneConfig,
        'importing':        blist.importer.importingPaneConfig,
        'importWarnings':   blist.importer.importWarningsPaneConfig,



        'metadata': {
            uniform: true,
            onInitialize: function($pane, paneConfig, state)
            {
                // hide/show sections based on new dataset type
                if (state.type == 'esri')
                    $pane.find('.metadataForm > div:not(.mapLayerMetadata, .attachmentsMetadata, .privacyMetadata)').hide();
                else
                {
                    $pane.find('.mapLayerMetadata').hide();
                    if (state.type == 'external')
                        $pane.find('.externalDatasetMetadata').show();
                }

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
                                messages: { required: $.t('screens.dataset_new.errors.missing_data_provider') }
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
                    $pane.find('.headline').html($.t('screens.dataset_new.errors.need_description',
                        { name: $.htmlEscape(state.submittedView.name) }));
                    $pane.find('#view_name').val(state.submittedView.name).removeClass('prompt');
                }

                // render an error message if we have one
                if (!$.isBlank(submitError))
                {
                    $pane.find('.flash').text(submitError)
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
                submitError = null; // presumably errors have been resolved
                state.metadataForm = $('.newDatasetForm').serializeObject();
                return 'working';
            },
            onPrev: function($pane, state)
            {
                if (state.hadWarnings)
                {
                    return; // use default behavior; last pane is real
                }
                else if (!_.isUndefined(state.submittedView))
                {
                    state.submittedView.remove();
                    return 2; // go back two since we've imported.
                }
                return; // use default behavior; last pane is real here too
            }
        },



        'working': {
            disableButtons: [ 'cancel', 'prev', 'next' ],
            onActivate: function($pane, config, state, command)
            {
                $pane.loadingSpinner({showInitially: true});

                // fire things off
                var viewData = formToViewMetadata(state.metadataForm);
                // if the submittedView contains metadata, e.g. the core server
                // populated some fields for us (in the case of shapefiles, this
                // is critical), persist them.
                if (viewData.metadata && state.submittedView && state.submittedView.metadata)
                { $.extend(true, viewData, {metadata: state.submittedView.metadata}); }
                if (viewData.privateMetadata && state.submittedView && state.submittedView.privateMetadata)
                { $.extend(true, viewData, {privateMetadata: state.submittedView.privateMetadata}); }

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
                        try
                        {
                            submitError = (request.status >= 500 && request.status < 600) ?
                                       'An unknown error has occurred. Please try again in a bit.' :
                                       JSON.parse(request.responseText).message;
                        }
                        catch (e)
                        {
                            submitError = $.format("An error {0} has occurred.", request.status);
                        }
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

                if ((state.type == 'blist') || (state.type  == 'blobby') || (state.type == 'external') ||
                    (state.type == 'shapefile'))
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
            disableButtons: [ 'cancel', 'prev' ],
            isFinish: true,
            onNext: function($pane, state)
            {
                state.submittedView.redirectTo({ firstRun: true });
                return false;
            }
        }
    }
});


    // general validation. here because once a validator
    // for a form is created, you can't set a new validator.
    var validator = $('.newDatasetForm').validate({
        rules: {
            "view[attributionLink]": "customUrl",
            "view[esri_src]": 'customUrl',
            'crossload_url': 'customHttpMaybeSUrl'
        },
        messages: {
            "view[name]": $.t('screens.dataset_new.errors.missing_name'),
            "view[attributionLink]": $.t('screens.dataset_new.errors.invalid_url'),
            'view[esri_src]': $.t('screens.dataset_new.errors.missing_eri_url'),
            'crossload_url': $.t('screens.dataset_new.errors.invalid_crossload_url')
        },
        errorPlacement: function (label, $el) {
            $el.closest('.line').append(label);
        }
    });
});
