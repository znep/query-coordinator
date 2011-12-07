(function($)
{
    // This is a virtual class, so there is no way provided to instantiate it
    $.Control.extend('socrataVisualization', {
        _init: function()
        {
            var currentObj = this;
            currentObj._super.apply(currentObj, arguments);
            var $mainDom = $(currentObj.currentDom);
            $mainDom.addClass('visualization');

            currentObj._primaryView = currentObj.settings.view;
            currentObj._displayFormat = currentObj.settings.displayFormat ||
                currentObj._primaryView.displayFormat;
            $mainDom.resize(function(e, source, forceUpdate) { doResize(currentObj, e, forceUpdate); })
                .bind('hide', function() { currentObj._hidden = true; })
                .bind('show', function()
                {
                    if (currentObj._obsolete) { return; }
                    delete currentObj._hidden;
                    if (currentObj._needsReload)
                    { currentObj.reload(); }
                });

            var $domObj = currentObj.$dom();
            if ($domObj.siblings('#vizError').length < 1)
            { $domObj.before('<div id="vizError" class="mainError"></div>'); }
            $domObj.siblings('#vizError').hide();

            currentObj._maxRows = 500;
            currentObj._renderedRows = 0;

            currentObj._byView = {};
            if (!$.isBlank(currentObj._primaryView))
            {
                currentObj._byView[currentObj._primaryView.id] = { view: currentObj._primaryView };
                currentObj._dataViews = [currentObj._primaryView];
            }

            var viewsFetched = 0;
            var viewsToLoad = (currentObj._displayFormat.compositeMembers || []).length + 1;

            var datasetReady = function()
            {
                viewsFetched++;
                if (viewsFetched >= viewsToLoad)
                { currentObj.loadLibraries(); }
            };

            _.each(currentObj._displayFormat.compositeMembers || [],
            function(member_id, index)
            {
                Dataset.createFromViewId(member_id, function(dataset)
                {
                    currentObj._dataViews[index + 1] = dataset;
                    currentObj._byView[dataset.id] = { view: dataset };
                    datasetReady();
                }, function(request)
                {
                    datasetReady();
                });
            });
            // No composite member views
            _.defer(datasetReady);
        },

        $dom: function()
        {
            if (!this._$dom)
            {
                var $d = $(this.currentDom);
                this._$dom = $d.find('.visualizationArea');
                if (this._$dom.length == 0)
                { this._$dom = $.tag({tagName: 'div', style: {height: '100%'},
                    'class': 'visualizationArea',
                    id: $d.closest('[id]').attr('id') + '_visualizationArea'}); }
                var existingVizAreas = $(".visualizationArea").length;
                if (existingVizAreas > 0)
                { this._$dom.attr('id', this._$dom.attr('id')+existingVizAreas); }
                $d.append(this._$dom);
            }
            return this._$dom;
        },

        $flyoutTemplate: function()
        {
            if (!this._$flyoutTemplate)
            {
                this._$flyoutTemplate = this.$dom()
                    .siblings('.flyoutRenderer.template');
                if (this._$flyoutTemplate.length < 1)
                {
                    this.$dom().after($.tag({tagName: 'div',
                        'class': ['template', 'row',
                            'richRendererContainer', 'flyoutRenderer']}));
                    this._$flyoutTemplate = this.$dom()
                        .siblings('.flyoutRenderer.template');
                }
                this.richRenderer = this._$flyoutTemplate.richRenderer({
                    columnCount: 1, view: this._primaryView});
            }
            return this._$flyoutTemplate;
        },

        $noDataMessage: function()
        {
            if ($.isBlank(this._$noData))
            {
                this._$noData = $.tag({tagName: 'div', 'class': ['noDataMessage', 'hide'],
                    contents: 'No data available'});
                $(this.currentDom).append(this._$noData);
            }
            return this._$noData;
        },

        isValid: function()
        { return true; },

        initializeFlyouts: function(columns)
        {
            var vizObj = this;
            vizObj._flyoutLayout = vizObj.generateFlyoutLayout(columns);
            // Getting the template initializes RR
            if ($.isBlank(vizObj.richRenderer)) { vizObj.$flyoutTemplate(); }
            vizObj.richRenderer.setConfig(vizObj._flyoutLayout);
            if (vizObj.hasFlyout())
            { vizObj.richRenderer.renderLayout(); }
            else
            { var $item = vizObj.$flyoutTemplate().empty(); }

            if (!vizObj._eventsHooked)
            {
                // Tooltips are wonky, so we just live this for all of them,
                // and use stored data to figure out how to close the tip
                // on click
                $.live('.flyoutRenderer .viewRow', 'click', function(e)
                {
                    var $a = $(this);
                    // Open a new page if it's not the same view.
                    if ($a.attr('target') == '_blank') { return; }
                    e.preventDefault();
                    vizObj.closeFlyout($a);
                    var href = $a.attr('href');
                    $(document).trigger(blist.events.DISPLAY_ROW,
                        [href.slice(href.lastIndexOf('/') + 1)]);
                });
                vizObj._eventsHooked = true;
            }
        },

        hasFlyout: function()
        {
            return !$.isBlank(this._flyoutLayout);
        },

        generateFlyoutLayout: function(columns)
        {
            var vizObj = this;
            // Override if you want a different layout
            if (_.isEmpty(columns)) { return null; }

            var col = {rows: []};
            _.each(columns, function(dc)
            {
                var row = {fields: [
                    {type: 'columnLabel', tableColumnId: dc.tableColumnId, fieldName: dc.fieldName},
                    {type: 'columnData', tableColumnId: dc.tableColumnId, fieldName: dc.fieldName}
                ]};
                if ((vizObj._displayFormat || {}).flyoutsNoLabel)
                { row.fields.shift(); }
                col.rows.push(row);
            });
            return {columns: [col]};
        },

        renderFlyout: function(row, view)
        {
            var vizObj = this;

            var isPrimaryView = vizObj._primaryView == view;
            var $item = vizObj.$flyoutTemplate().clone()
                    .removeClass('template');

            // In composite views, we don't have a displayFormat, so there are no
            // bits to show. Just point them at the row data in full.
            if (!isPrimaryView)
            { $item.empty(); }
            if (vizObj.hasFlyout())
            { vizObj.richRenderer.renderRow($item, row, true); }

            if (vizObj.settings.showRowLink)
            {
                $item.append($.tag({tagName: 'a',
                    href: view.url + '/' + row.id,
                    target: isPrimaryView ? null : '_blank',
                    'class': ['viewRow', 'noInterstitial', 'noRedirPrompt'],
                    contents: 'View details for this row'}));
            }
            return $item;
        },

        closeFlyout: function($link)
        {
            // Implement me to close the flyout, because a view row link has
            // been clicked
        },

        showError: function(errorMessage)
        {
            this.$dom().siblings('#vizError').show().text(errorMessage);
        },

        // Used in a few places for non-dataset status
        startLoading: function()
        {
            this._primaryView.trigger('request_start');
        },

        finishLoading: function()
        {
            this._primaryView.trigger('request_finish');
        },

        initializeVisualization: function()
        {
            // Implement me
        },

        columnsLoaded: function()
        {
            // Called once the columns are loaded
        },

        ready: function()
        {
            var vizObj = this;
            var handleChange = function(forceRowReload)
            {
                if (vizObj._obsolete) { return; }
                if (forceRowReload === true)
                { vizObj._requireRowReload = true; }
                if (!vizObj._initialLoad)
                { _.defer(function() { vizObj.reload(); }); }
            };
            var handleRowChange = function(rows, fullReset)
            {
                if (vizObj._obsolete) { return; }
                if (fullReset) { handleChange(true); }
                else if (!vizObj._hidden) { vizObj.handleRowsLoaded(rows, vizObj._primaryView); }
            };
            var handleQueryChange = function() { handleChange(true); };

            if (!vizObj._boundViewEvents)
            {
                vizObj._primaryView
                    .bind('query_change', handleQueryChange, vizObj)
                    .bind('row_change', handleRowChange, vizObj)
                    .bind('displayformat_change', handleChange, vizObj);

                vizObj._boundViewEvents = true;
            }
        },

        setView: function(newView)
        {
            var vizObj = this;
            if (!$.isBlank(vizObj._primaryView))
            {
                vizObj._primaryView.unbind(null, null, vizObj);
                vizObj._dataViews = _.without(vizObj._dataViews, vizObj._primaryView);
                delete vizObj._byView[vizObj._primaryView.id];
            }

            vizObj._primaryView = newView;
            vizObj._dataViews.unshift(vizObj._primaryView);
            vizObj._byView[vizObj._primaryView.id] = vizObj._primaryView;
            vizObj._boundViewEvents = false;

            vizObj._requireRowReload = true;
            vizObj.reload({});
        },

        reload: function(newDF)
        {
            var vizObj = this;
            vizObj._savedDF = newDF;

            if (vizObj._hidden)
            {
                vizObj._needsReload = true;
                return;
            }
            delete vizObj._needsReload;

            vizObj._displayFormat = vizObj._savedDF ||
                vizObj.settings.displayFormat || vizObj._primaryView.displayFormat;

            // If still loading libraries, don't try to reload
            if (!vizObj._dynamicLibrariesLoaded) { return; }

            if (vizObj.needsFullReset())
            {
                vizObj.reset();
                return;
            }

            vizObj.$dom().siblings('#vizError').hide().text('');

            if (!vizObj._requireRowReload && vizObj.noReload())
            {
                vizObj.reloadSpecialCases();
                return;
            }

            vizObj.cleanVisualization();
            vizObj.reloadVisualization();
        },

        cleanVisualization: function()
        {
            var vizObj = this;
            delete vizObj._requireRowReload;
            delete vizObj._flyoutLayout;
            vizObj._renderedRows = 0;
        },

        reloadVisualization: function()
        {
            var vizObj = this;
            if (!vizObj.isValid()) { return; }

            vizObj.getDataForAllViews();

            if (vizObj.getColumns())
            {
                vizObj.columnsLoaded();
                vizObj.ready();
            }
        },

        reset: function()
        {
            // Implement how to do a full reset
        },

        noReload: function()
        {
            // Override if you need to whitelist against reloading
            return false;
        },

        reloadSpecialCases: function()
        {
            // Implement if noReload will be true, but things still need to happen
        },

        needsFullReset: function()
        {
            // Override if you need to do a bigger reset
            return false;
        },

        handleRowsLoaded: function(rows, view)
        {
            // Override if you need extra handling before rendering
            this.renderData(rows, view);
        },

        handleClustersLoaded: function(clusters, view)
        {
            // Intended for maps only
        },

        renderData: function(rows, view)
        {
            var vizObj = this;

            if (this._delayRenderData)
            {
                if (!this._delayedRenderData) { this._delayedRenderData = []; }
                var _this = this;
                this._delayedRenderData.push(function()
                    { _this.renderData(rows); });
                return;
            }

            var addedRows = false;
            var badPoints = false;
            _.each(rows, function(r)
            {
                var result = vizObj.renderRow(r, view);
                if (result) { vizObj._renderedRows++; }
                addedRows = addedRows || result;
                badPoints = badPoints || !result;
            });

            if (badPoints)
            {
                vizObj.showError('Some points were invalid. ' +
                    vizObj.errorMessage);
            }


            if (addedRows || rows.length == 0)
            { vizObj.rowsRendered(); }
        },

        renderRow: function(row)
        {
            // Implement me
            this.errorMessage = 'No render function';
            return false;
        },

        rowsRendered: function()
        {
            this.$noDataMessage().toggleClass('hide', this._renderedRows > 0);

            // Implement me if you want to do something after all the rows
            // are rendered
        },

        resizeHandle: function(event)
        {
            // Implement if you need to do anything on resize
        },

        getColumns: function()
        {
            // Implement me to get the specific columns you need for
            // this view
        },

        javascriptBase: "/javascripts/",

        getRequiredJavascripts: function()
        {
            // Implement me if you need libraries to function
        },

        loadLibraries: function()
        {
            var vizObj = this;

            // Set up the final callback, which is called once ALL
            // required javascript model/plugin code is loaded and evaluated.
            // Only here do we initializeVisualization(), which almost certainly
            // needs some of the code we just loaded
            vizObj._librariesLoaded = function()
            {
                if (!vizObj.isValid()) { return; }

                vizObj.initializeVisualization();

                vizObj._initialLoad = true;

                vizObj.getDataForAllViews();

                if (vizObj.getColumns())
                { vizObj.columnsLoaded(); }

                $(vizObj.currentDom).resize();
            };

            var scripts = vizObj.getRequiredJavascripts();

            // If _setupLibraries is defined, we're assuming that the
            // function will be called by an external source.
            // This is used, for example, in google maps, where the
            // google loader itself async loads other files, and only *it*
            // knows when it's ready, not LABjs
            var callback = _.isFunction(vizObj._setupLibraries) &&
                !$.isBlank(scripts) ? function() {} : vizObj._librariesLoaded;

            if (vizObj._dynamicLibrariesLoaded)
            {
                callback();
                return;
            }

            if (!$.isBlank(scripts))
            {
                blist.util.assetLoading.loadLibraries(scripts, function() {
                    vizObj._dynamicLibrariesLoaded = true;
                    callback();
                });
            }
            else
            {
                vizObj._dynamicLibrariesLoaded = true;
                callback();
            }
        },

        getDataForAllViews: function()
        {
            var vizObj = this;

            var nonStandardRender = function(view)
                { return view.renderWithArcGISServer() };

            var viewsToRender = _.reject(vizObj._dataViews, function(view)
                { return nonStandardRender(view); });

            vizObj._rowsLoaded = 0;
            _.each(viewsToRender, function(view) { vizObj.getDataForView(view); });
        },

        getDataForView: function(view)
        {
            var vizObj = this;
            var viewConfig = vizObj._byView[view.id];
            var rowsToFetch = vizObj._maxRows - vizObj._rowsLoaded;
            if (rowsToFetch <= 0) { return; }

            view.getRows(0, rowsToFetch, function(data)
            {
                _.defer(function()
                    { vizObj.handleRowsLoaded(data, view); });
                vizObj._rowsLoaded += view.totalRows ? view.totalRows
                                                     : data.length;
                vizObj.totalRowsForAllViews();
                delete vizObj._initialLoad;
            },
            function(errObj)
            {
                // If we were cancelled, and didn't respond to the event that caused a cancel,
                // then re-try this request. Otherwise just clear initialLoad, and it will
                // respond normally.
                if ($.subKeyDefined(errObj, 'cancelled') && errObj.cancelled &&
                    (vizObj._initialLoad || !vizObj._boundViewEvents))
                { vizObj.getDataForView(view); }
                else if (vizObj._boundViewEvents) { delete vizObj._initialLoad; }
            });
        },

        // This function is not meant as an accessor.
        totalRowsForAllViews: function()
        {
            var vizObj = this;
            vizObj._totalRows = _.reduce(vizObj._dataViews,
                function(total, view)
                { return view.totalRows ? total + view.totalRows : total; }, 0);
            return vizObj._totalRows;
        }
    }, {view: null, showRowLink: true}, null, true);

    var doResize = function(vizObj, e, forceUpdate)
    {
        if (!forceUpdate &&
                vizObj._prevHeight == vizObj.$dom().height() && vizObj._prevWidth == vizObj.$dom().width())
        { return; }

        vizObj._prevHeight = vizObj.$dom().height();
        vizObj._prevWidth = vizObj.$dom().width();
        vizObj.resizeHandle(e);
    };

})(jQuery);
