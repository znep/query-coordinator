var datasetPageNS = blist.namespace.fetch('blist.datasetPage');

blist.datasetPage.adjustSize = function()
{
    $(window).resize();
};

blist.datasetPage.clearTempView = function()
{
    $('#sidebarOptions a.alert').removeClass('alert');
    $('body, #datasetBar').removeClass('unsavedView minorChange');
    datasetPageNS.sidebar.updateEnabledSubPanes();

    // If pill buttons don't match ADT, then hide them
    $('#renderTypeOptions li a:visible').each(function()
    {
        var $a = $(this);
        var type = $.urlParam($a.attr('href'), 'defaultRender');
        if (type == 'richList') { type = 'fatrow'; }
        if (!_.include(blist.dataset.metadata.availableDisplayTypes, type))
        { $a.addClass('hide'); }
    });
};

blist.datasetPage.setTempView = function()
{
    if (blist.dataset.minorChange && !blist.dataset.hasRight('update_view'))
    { return; }

    $('body, #datasetBar').addClass('unsavedView')
        .toggleClass('minorChange', blist.dataset.minorChange);
    // For now unsaved view means something has changed in filter tab
    $('#sidebarOptions .tabFilter a').addClass('alert');
    datasetPageNS.sidebar.updateEnabledSubPanes();
};

blist.datasetPage.updateValidView = function()
{
    $('.invalidView').removeClass('invalidView');
    datasetPageNS.sidebar.updateEnabledSubPanes();
};


(function($)
{
    if (!blist.dataset.valid) { $('body').addClass('invalidView'); }

})(jQuery);

$(function()
{
    // Before we do anything else, clear away the about metadata.
    $('.aboutLoad .aboutDataset').appendTo('#templates');
    $('.aboutLoad').remove();

    // Before we fullscreen, move the footer inside the sizing container.
    $('#siteFooter')
        .addClass('clearfix')
        .appendTo('.siteInnerWrapper');

    $('.outerContainer').fullScreen();

    // Set up pill buttons to change render types
    if ($('#renderTypeOptions').length > 0)
    {
        // Render types
        $('#renderTypeOptions').pillButtons({multiState: true, defaultSelector: null,
            hasClickHandler: function($button)
            {
                return $button.data('popupSelect-tip');
            }
        });
        $.live('#renderTypeOptions a', 'click', function(e)
        {
            e.preventDefault();
            var $button = $(this);
            var rt = $.urlParam($button.attr('href'), 'defaultRender');
            if (rt == 'richList') { rt = 'fatrow'; }

            if ($button.data('popupSelect-tip'))
            { return; }

            var finished = function(id)
            {
                // Would call show on renderTypeManager; but updating the
                // dataset fires an event that RTM listens to. Except that if
                // we have a dt/rt mismatch, then just run a show
                if (blist.dataset.metadata.renderTypeConfig.visible[rt] !=
                    datasetPageNS.rtManager.visibleTypes[rt])
                { datasetPageNS.rtManager.toggle(rt); }
                else if (id)
                {
                    if (id != blist.dataset.id)
                    {
                        var newMD = $.extend({}, blist.dataset.metadata);
                        $.deepSet(newMD, id, 'renderTypeConfig', 'active', rt, 'id');
                        blist.dataset.update({metadata: newMD});
                    }
                    if (datasetPageNS.rtManager.visibleTypes[rt])
                    { datasetPageNS.rtManager.hide(rt); }
                    datasetPageNS.rtManager.show(rt);
                }
                else
                { blist.dataset.toggleRenderType(rt); }
            };

            if ($button.data('noChildren'))
            { finished(); return; }

            blist.dataset.getChildOptionsForType(rt, function(options)
            {
                if (options.length > 1)
                {
                    $button.toggleClass('active', blist.dataset.metadata.renderTypeConfig.visible[rt])
                        .popupSelect({
                        canDeselect: true,
                        choices: options,
                        isSelected: function(option) {
                            var selId = $.deepGetStringField(blist.dataset.metadata,
                                'renderTypeConfig.active.' + rt + '.id');
                            return $.deepGetStringField(blist.dataset.metadata,
                                'renderTypeConfig.visible.' + rt) &&
                                (option.id == selId || $.isBlank(selId) && option.id == blist.dataset.id);
                        },
                        prompt: 'Select a layer:',
                        renderer: function(option) {
                            return option.name;
                        },
                        selectCallback: function(option, checked) {
                            if (checked)
                            { finished(option.id); }
                            else
                            { finished(); }
                            return checked;
                        }
                    }).data('popupSelect-tip').show();

                    $button.data('popupSelect-width', $(window).width());
                    $(window).resize(function()
                    {
                        var width = $(window).width();
                        $button.data('popupSelect-tip')
                            .adjustPosition({ left: width - $button.data('popupSelect-width')});
                        $button.data('popupSelect-width', width);
                    });
                }
                else
                {
                    $button.data('noChildren', true);
                    finished();
                }
            });
        });
    }

    blist.$container.bind('render_type_shown', function(e, newType)
    {
        $('body').addClass(newType + '-renderType');

        if ($('#renderTypeOptions').length > 0)
        {
            var $pb = $('#renderTypeOptions li .' + newType);
            if ($pb.length < 1)
            {
                var $li = $('#renderTypeOptions li .template').parent().clone();
                $pb = $li.find('a').removeClass('template hide').addClass(newType);
                $pb.attr('title', $pb.attr('title').replace('template', newType));
                $pb.attr('href', $.urlParam($pb.attr('href'),
                    'defaultRender', newType));
                $('#renderTypeOptions').prepend($li);
            }
            $pb.addClass('active').removeClass('hide');
        }

        if (!blist.dataset.metadata.renderTypeConfig.visible[newType])
        { blist.dataset.showRenderType(newType); }
    });

    blist.$container.bind('render_type_hidden', function(e, oldType)
    {
        $('body').removeClass(oldType + '-renderType');

        if ($('#renderTypeOptions').length > 0)
        {
            var $pb = $('#renderTypeOptions li .' + oldType);
            if ($pb.length > 0)
            { $pb.removeClass('active'); }
        }

        if (blist.dataset.metadata.renderTypeConfig.visible[oldType])
        { blist.dataset.hideRenderType(oldType); }
    });

    // Initialize all data rendering
    var defRen = $.urlParam(window.location.href, 'defaultRender');
    if (defRen == 'richList') { defRen = 'fatrow'; }
    if (!$.isBlank(blist.initialRowId)) { defRen = 'page'; }

    var openSidebar = false;
    if (blist.dataset.displayFormat.viewDefinitions)
    {
        if (!blist.dataset.childViews)
        { blist.dataset.childViews = _.pluck(blist.dataset.displayFormat.viewDefinitions, 'uid'); }

        var viewId = blist.dataset.displayFormat.viewDefinitions[0].uid;
        if (viewId != 'self')
        {
            _.each(blist.dataset.metadata.renderTypeConfig.visible || [], function(v, type)
            {
                if (v && _.include(['table', 'page', 'fatrow'], type)
                && !$.subKeyDefined(blist.dataset.metadata, 'renderTypeConfig.active.' + type + '.id'))
                { $.deepSet(blist.dataset.metadata, viewId, 'renderTypeConfig', 'active', type, 'id'); }
            });

            if ($.subKeyDefined(blist.dataset, 'metadata.query.' + viewId + '.filterCondition')
                && (blist.dataset.metadata.query[viewId].filterCondition.children || []).length > 0)
            { openSidebar = true; }
        }
    }
    datasetPageNS.rtManager = blist.$container.renderTypeManager({
        view: blist.dataset,
        defaultTypes: defRen,
        editEnabled: !blist.dataset.isImmutable() &&
            (blist.dataset.isUnpublished() || blist.dataset.viewType != 'tabular' || blist.dataset.newBackend),
        columnEditEnabled: !blist.dataset.isImmutable(),
        common: {
            editColumnCallback: function(col)
            {
                datasetPageNS.sidebar.hide();
                datasetPageNS.sidebar.show('columnProperties', col);
            },
            showRowHandle: true,
            manualResize: true
        },
        table: {
            addColumnCallback: function(parId)
            {
                datasetPageNS.sidebar.show('edit.addColumn', {parentId: parId});
            },
            cellCommentsCallback: blist.sidebarHidden.feed.cellFeed ? null : function(rowId, tcId)
            {
                datasetPageNS.sidebar.show('cellFeed', {rowId: rowId, tableColumnId: tcId}, true);
            }
        },
        page: { defaultRowId: blist.initialRowId }
    });

    var $dataGrid = datasetPageNS.rtManager.$domForType('table')

    $(document).bind(blist.events.DISPLAY_ROW, function(e, rowId, updateOnly)
    {
        var uid;
        if (typeof rowId == 'string' && rowId.indexOf('/') > -1)
        { var splitRowId = rowId.split('/'); uid = splitRowId[0]; rowId = splitRowId[1]; }

        var curId = $.deepGet(blist.dataset.metadata.renderTypeConfig, 'active', 'page', 'id');
        var sameDS = curId == uid || $.isBlank(curId) && uid == blist.dataset.id;
        if (!updateOnly || (blist.dataset.metadata.renderTypeConfig.visible.page && !sameDS))
        {
            datasetPageNS.rtManager.setTypeConfig('page', {defaultRowId: rowId});
            blist.dataset.showRenderType('page', uid, !sameDS);
        }
    });

    // sidebar and sidebar tabs
    datasetPageNS.sidebar = $('#gridSidebar').gridSidebar({
        position: blist.sidebarPosition || 'right',
        waitOnDataset: blist.dataset.type != 'form' && blist.dataset.valid,
        onSidebarShown: function(primaryPane)
        {
            var $opts = $('#sidebarOptions');
            $opts.find('li').removeClass('active');

            var $activeLink = $('#sidebarOptions').find('a[data-paneName=' + primaryPane + ']');
            if ($activeLink.length > 0)
            {
                $opts.css('background-color', $activeLink.css('background-color'))
                $activeLink.closest('li').addClass('active');
            }
            else
            {
                $opts.css('background-color', 'transparent').find('li').removeClass('active');
            }
        },
        onSidebarClosed: function()
        {
            $('#sidebarOptions').css('background-color', 'transparent')
                .find('li').removeClass('active');
        },
        columnChoosers: blist.$container.renderTypeManager().$domForType('table'),
        renderTypeManager: blist.$container.renderTypeManager(),
        resizeNeighbor: blist.$container,
        setSidebarTop: false,
        view: blist.dataset
    });

    // Conditionally hide sidebar option links based on whether a sidebar pane is present.
    // Note: This logic fails for the embed pane. The reason why is left as an exercise for the developer.
    $('#sidebarOptions').find('a[data-paneName]').each(function() {
        var $anchor = $(this);
        var dataPaneName = $anchor.attr('data-paneName');

        if (datasetPageNS.sidebar.hasPane(dataPaneName)) {
            $anchor.click(function(e) {
                e.preventDefault();
                datasetPageNS.sidebar.show(dataPaneName);
                $.analytics.trackEvent(
                    'dataset page (v4-chrome)',
                    dataPaneName + ' pane opened',
                    blist.dataset.id
                );
            });
        } else {
            $anchor.closest('li').hide();
        }
    });

    datasetPageNS.$feedTab = $('#sidebarOptions').find('a.feed');
    if (datasetPageNS.$feedTab.is(':visible'))
    {
        datasetPageNS.$feedTab
            .contentIndicator().setText(blist.dataset.numberOfComments || '');
    }

    // Show guided filter by default if there is a default filter
    var hasConditions = function(filterCondition)
    {
        return (filterCondition.children || []).length > 0;
    };
    if (openSidebar ||
        ($.subKeyDefined(blist.dataset, 'query.filterCondition') &&
             hasConditions(blist.dataset.query.filterCondition)) ||
        ($.subKeyDefined(blist.dataset, 'metadata.filterCondition') &&
             hasConditions(blist.dataset.metadata.filterCondition)))
    {
        datasetPageNS.sidebar.setDefault('filter.unifiedFilter');
    }
    // Also, text search for viewDefinitions for the other case.

    // Pop a sidebar right away if they ask for it
    var paneName = $.urlParam(window.location.href, 'pane') || blist.defaultPane;
    if (_.isString(paneName) && !$.isBlank(paneName))
    { datasetPageNS.sidebar.show(paneName); }
    else if (blist.dataset.visibleColumns &&
             blist.dataset.visibleColumns.length == 0 &&
             !blist.sidebarHidden.edit.addColumn)
    { datasetPageNS.sidebar.show('edit.addColumn'); }

    var sidebarUpdate = function()
        { datasetPageNS.sidebar.updateEnabledSubPanes(); };
    blist.dataset
        .bind('columns_changed', sidebarUpdate)
        .bind('displaytype_change', sidebarUpdate);

    // Hook up search form
    var $clearSearch = $('#searchForm .clearSearch');
    var $searchForm = $('#searchForm');

    $searchForm.submit(function (e)
    {
        e.preventDefault();
        var searchText = $(e.currentTarget).find(':input').val();
        var md = $.extend(true, {}, blist.dataset.metadata);
        md.jsonQuery.search = searchText;
        blist.dataset.update({ metadata: md });
        if (!searchText || searchText === '')
        { $clearSearch.hide(); }
        else
        { $clearSearch.show(); }
    });

    var resetSearchForm = function()
    {
        $searchForm.find(':input').focus().val(blist.dataset.metadata.jsonQuery.search).blur();
        $clearSearch.toggle(!$.isBlank(blist.dataset.metadata.jsonQuery.search));
    };

    $clearSearch.click(function (e)
    {
        e.preventDefault();
        var md = $.extend(true, {}, blist.dataset.metadata);
        delete md.jsonQuery.search;
        blist.dataset.update({ metadata: md });
        resetSearchForm();
    }).hide();
    blist.dataset.bind('clear_temporary', function() { resetSearchForm(); });

    if (!$.isBlank(blist.dataset.metadata.jsonQuery.search))
    {
        $searchForm.find(':input').focus().val(blist.dataset.metadata.jsonQuery.search).blur();
        $clearSearch.show();
    }

    // toolbar area
    $('#description').expander({
        contentSelector: 'p',
        expanderCollapsedClass: 'rightArrow',
        expandSelector: '.descriptionExpander',
        moveExpandTrigger: true,
        resizeFinishCallback: datasetPageNS.adjustSize
    });

    var $dsIcon = $('#datasetIcon');
    $dsIcon.socrataTip($dsIcon.text());

    $('.fullscreenButton').click(function(event)
    {
        event.preventDefault();

        $('#siteHeader, #siteFooter').animate(
            { opacity: 'toggle' },
            datasetPageNS.adjustSize);
        datasetPageNS.adjustSize(); // So that when animating in footer is visible.
        $(this)
            .toggleClass('maximize')
            .toggleClass('minimize');
    });

    $('#shareOptions .email').click(function(event)
    {
        event.preventDefault();
        if(_.isFunction(blist.dialog.sharing))
        { blist.dialog.sharing(event); }
    });

    $('#shareOptions .subscribe').click(function(event)
    {
        event.preventDefault();
        if(_.isFunction(blist.dialog.subscribe))
        { blist.dialog.subscribe(); }
    });

    // Edit toolbar
    $('#editOptions .undo').click(function (event)
    {
        event.preventDefault();
        if (!$(event.target).is('.disabled'))
        { $dataGrid.blistModel().undo(); }
    });
    $('#editOptions .redo').click(function (event)
    {
        event.preventDefault();
        if (!$(event.target).is('.disabled'))
        { $dataGrid.blistModel().redo(); }
    });
    $dataGrid.bind('undo_redo_change', function(e)
    {
        var model = $dataGrid.blistModel();
        $('#editOptions .undo').toggleClass('disabled', !model.canUndo());
        $('#editOptions .redo').toggleClass('disabled', !model.canRedo());
    });
    if (!$.isBlank($dataGrid.blistModel))
    {
        var model = $dataGrid.blistModel();
        $('#editOptions .undo').toggleClass('disabled', !model.canUndo());
        $('#editOptions .redo').toggleClass('disabled', !model.canRedo());
    }


    // Format toolbar
    $('#formatOptions select').uniform();

    $('#formatOptions').formatOptions({gridSelector: $dataGrid});


    // Unsaved view stuff
    blist.dataset.bind('set_temporary', datasetPageNS.setTempView);
    blist.dataset.bind('clear_temporary', datasetPageNS.clearTempView);

    blist.datasetControls.unsavedViewPrompt();

    $('.unsavedLine a.save').click(function(e)
    {
        e.preventDefault();
        var $a = $(this);
        if ($a.is('.disabled')) { return; }

        $a.data('saveText', $a.text());
        $a.text($a.attr('data-savingText'));
        $a.addClass('disabled');

        blist.dataset.save(function()
        {
            $a.text($a.data('saveText'));
            $a.removeClass('disabled');
        });
    });

    $('.unsavedLine a.saveAs').click(function(e)
    {
        e.preventDefault();
        blist.datasetControls.showSaveViewDialog();
    });

    $('.unsavedLine a.revert, .basedOnTemp .revertLink').click(function(e)
    {
        e.preventDefault();
        blist.dataset.reload();
    });

    // Publishing
    blist.datasetControls.hookUpPublishing($('#infoBox'));

    blist.$container.bind('attempted_edit', function(e)
    {
        if (!blist.dataset.isPublished() || !blist.dataset.canEdit() ||
            $.isBlank(blist.currentUserId))
        { return; }

        var showTip = function()
        {
            $(e.target).socrataTip({content: blist.datasetControls.editPublishedMessage(),
                showSpike: false, trigger: 'now'});
        };
        if (!blist.dataset.isDefault())
        {
            blist.dataset.getParentDataset(function(parDS)
            { if (!$.isBlank(parDS) && parDS.canEdit()) { showTip(); } });
        }
        else { showTip(); }
    });

    $.live('.button.editPublished', 'click', function(e)
    {
        e.preventDefault();
        var $t = $(this);
        if ($t.hasClass('disabled')) { return; }

        if ($t.closest('.bt-wrapper').length > 0)
        { $t.closest('.bt-wrapper').data('socrataTip-$element').socrataTip().hide(); }

        blist.dataset.getUnpublishedDataset(function(unpub)
        {
            if (!$.isBlank(unpub)) { unpub.redirectTo(); }
            else
            {
                var wasPending = false;
                blist.dataset.makeUnpublishedCopy(function(copyView)
                {
                    if (wasPending)
                    {
                        datasetPageNS.sidebar.show('edit');
                        $('.editAlert').find('.editPublished, .doneCopyingMessage').removeClass('hide');
                        $('.editAlert').find('.copyingMessage').addClass('hide');
                    }
                    else
                    { copyView.redirectTo(); }
                },
                function()
                {
                    $('.editAlert').find('.editPublished, .editMessage').addClass('hide');
                    $('.editAlert').find('.copyingMessage').removeClass('hide');
                    wasPending = true;
                },
                function()
                {
                    if (wasPending)
                    {
                        datasetPageNS.sidebar.show('edit');
                    }
                    $('.editAlert').find('.errorMessage').removeClass('hide');
                    $('.editAlert').find('.copyingMessage, .editPublished, .editMessage').addClass('hide');
                });
            }
        });
    });

    // If this is a newly unpublished dataset on the first run, show a warning
    if (blist.dataset.isUnpublished() && $.urlParam(window.location.href, 'firstRun') == 'true')
    {
        $('#infoBox #datasetName').socrataTip({trigger: 'now', showSpike: false, closeOnClick: false,
            content: $.tag({tagName: 'div', 'class': 'unpublishedAlert', contents: [
                {tagName: 'p', contents: $.t('screens.ds.show.unpublished_alert')},
                {tagName: 'a', 'class': ['button', 'close'], contents: 'OK'}
            ]})
        });
        $.live('.unpublishedAlert .close', 'click', function(e)
        {
            e.preventDefault();
            $('#infoBox #datasetName').socrataTip().destroy();
        });
    }

    // Invalid views
    blist.dataset.bind('valid', function() { datasetPageNS.updateValidView(); });

    $('.viewError').text(blist.dataset.invalidMessage());

    var viewEditPane = $.gridSidebar
        .paneForDisplayType[blist.dataset.metadata.availableDisplayTypes[0]] ||
        $.gridSidebar.paneForDisplayType[blist.dataset.type];
    if ($.isBlank(viewEditPane) || !datasetPageNS.sidebar.isPaneEnabled(viewEditPane))
    { $('.invalidActions .editView').hide(); }
    else
    {
        $('.invalidActions .editView').click(function(e)
        {
            e.preventDefault();
            datasetPageNS.sidebar.show(viewEditPane);
        });
    }

    // Massage search params
    $('#searchForm').submit(function() { if ($(this).find(
        '.searchField').val() == 'snuffleupadata') {
        _.times(20, function() {
            setTimeout(function() {
                $('<img src="/images/snuffleupadata.gif"/>')
                    .appendTo($('body'))
                    .css('position', 'absolute')
                    .css('zindex', '9999')
                    .css('left', '-48px')
                    .css('top', Math.random() * $(window).height())
                    .animate({left: $(window).width() + 48}, 'slow',
                        function() { $(this).remove(); }
        )}, Math.random() * 4000)})}});

    $('.invalidActions .removeView').click(function(e)
    {
        e.preventDefault();
        if (!confirm($.t('screens.ds.show.remove_confirm')))
        { return; }

        blist.dataset.remove(function()
        {
            blist.dataset.getParentView(function(parDS)
            {
                if (!$.isBlank(parDS)) { parDS.redirectTo(); }
                else { window.location = '/datasets'; }
            });
        });
    });

    $.fn.shortenActionBar = function(options)
    {
        var $this = $(this);
        var tooLong = function() { return _.uniq($this.find('#sidebarOptions li:visible').map(
            function() { return $(this).position().top; })).length > 1; };

        var $moreButton = $this.find('a.other').parent(),
            $dropdown = $('#moreActionBarButtons');

        if (!$dropdown.exists())
        {
            $dropdown = $('<ul class="hide" id="moreActionBarButtons">');
            $this.append($dropdown);
            $moreButton.click(function(e) { e.preventDefault(); $dropdown.toggleClass('hide'); });
        }

        var priorityButtons = options.priorityForTruncate.slice(),
            movedButtons = [];

        var truncateButton = function()
        {
            $moreButton.addClass('hide');

            var $target;
            if (priorityButtons.length > 0)
            { $target = $this.find('a.' + priorityButtons.shift()).parent(); }
            else
            { $target = $this.find('a:visible:last').parent(); }

            movedButtons.push($target.index());
            $dropdown.append($target);
            $moreButton.removeClass('hide');
        };

        var restoreButton = function()
        {
            var index = movedButtons.pop(),
                $target = $dropdown.children(':last'),
                clsName = $target.find('a').attr('class');

            if (_.include(options.priorityForTruncate, clsName))
            { priorityButtons.unshift(clsName); }
            $target.insertBefore($('#sidebarOptions li:eq(' + index + ')'));

            if (!$dropdown.children().exists())
            { $moreButton.addClass('hide'); $dropdown.addClass('hide'); }
        };

        var windowWidth = Infinity,
            resizing = false,
            offset = $('#description').position().left - $("#sidebarOptions").padding().left;
        $(window).resize(_.debounce(function()
        {
            if (resizing) { return; }
            resizing = true;
            var width = $(window).width();

            // Not worth it to run calcs at this point.
            if (width < $(".siteOuterWrapper").width() - 70)
            { windowWidth = width; resizing = false; return; }

            var optionsWidth = function()
            {
                if (blist.sidebarPosition == 'left') { return width * 0.9; }
                var overlapWidth = $('#description, #description .collapsed').width();
                if (overlapWidth) { return width - (overlapWidth + offset); }
                else { return width * 0.85; }
            }
            $(".sidebarOptionsContainer").width(optionsWidth());

            if (windowWidth < width) // Bigger!
            {
                while (!tooLong() && $dropdown.children().exists())
                { restoreButton(); }
                if (tooLong())
                { truncateButton(); }
            }
            else if (windowWidth > width)
            {
                while (tooLong())
                { truncateButton(); }
            }

            windowWidth = width;
            resizing = false;
        }, 500));
    };
    $('#actionBar').shortenActionBar({ priorityForTruncate: ['feed', 'embed', 'export'] });

    // iPad special casing
    if ($.device.ipad)
    {
        // essentially, disable scrolling of the main container
        $(document).bind('touchmove', function(event)
        {
            event.originalEvent.preventDefault();
        });
    }

    var forceOldVisualize = $.urlParam(window.location.href, 'visualize') == 'old' || blist.configuration.oldChartConfigForced;
    var isNewVisualize = $.urlParam(window.location.href, 'visualize') == 'nextgen' || (blist.configuration.newChartConfig && !forceOldVisualize);
    if(isNewVisualize){
       $('a.new_visualize').closest('li').show();
    }

    // Data calls
    _.defer(function()
    {
        // register opening
        blist.dataset.registerOpening(document.referrer);

        // set up the main menu
        if (!_.include(['blist', 'blob', 'href'], blist.dataset.type) &&
            !blist.dataset.isGeoDataset())
        {
            blist.dataset.getParentView(function(parDS)
            {
                if (!$.isBlank(parDS))
                {
                    $('.basedOnParent')
                        .addClass('hasParent')
                        .find('.parentName')
                            .attr('href', parDS.url)
                            .text(parDS.name);
                }
                else
                {
                    $('.basedOnParent')
                        .addClass('hasParent')
                        .find('.parentName')
                            .attr('href', null)
                            .text($.t('screens.ds.bar.based_on_private_view'))
                }
            });
        }

        _.defer(function() {
            // Update datasetName to reflect out-of-date status
            if (blist.dataset._dataOutOfDate
                && blist.dataset._truthLastModified
                && blist.dataset._lastModified) {
                $('#datasetName').after(
                    '<span class="outOfDate">' +
                        $.t('screens.ds.bar.out_of_date', {
                            seconds: blist.dataset._truthLastModified - blist.dataset._lastModified
                        }) +
                    '.</span>'
                );
            }
        });

        // report to events analytics for easier aggregation
        $.analytics.trackEvent('dataset page (v4-chrome)',
            'page loaded', blist.dataset.id);
    });
});
