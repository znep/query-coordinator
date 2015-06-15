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
                (currentObj._primaryView || {}).displayFormat;
            $mainDom.resize(function(e, source, forceUpdate) {
                doResize(currentObj, e, forceUpdate);
                e.stopPropagation();
            })
                .bind('hide', function() { currentObj._hidden = true; })
                .bind('show', function()
                {
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

            var compositeMembers = (currentObj._displayFormat || {}).compositeMembers || [];
            var viewsFetched = 0;
            var viewsToLoad = compositeMembers.length;
            if (currentObj._primaryView) { viewsToLoad++; }

            var datasetReady = function()
            {
                viewsFetched++;
                if (viewsFetched >= viewsToLoad)
                { currentObj.loadLibraries(); }
            };

            _.each(compositeMembers, function(member_id, index)
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
                var $noData = $(this.currentDom).find('.noDataMessage');
                if ($noData.length == 0)
                {
                    this._$noData = $.tag({tagName: 'div', 'class': ['noDataMessage', 'hide'],
                        contents: 'No data available'});
                    $(this.currentDom).append(this._$noData);
                }
                else
                { this._$noData = $noData; }
            }
            return this._$noData;
        },

        isValid: function()
        { return true; },

        initializeFlyouts: function(columns)
        {
            var vizObj = this;
            vizObj._flyoutLayout = vizObj.generateFlyoutLayout(columns,
                (vizObj._displayFormat || {}).flyoutsNoLabel, vizObj._primaryView);
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

        generateFlyoutLayout: function(columns, noLabel, view)
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
                if (noLabel)
                { row.fields.shift(); }
                col.rows.push(row);
            });
            return {columns: [col]};
        },

        renderFlyout: function(row, view)
        {
            var vizObj = this;
            var viewConfig = vizObj._byView[view.id];

            var isPrimaryView = vizObj._primaryView == view;
            var $item;
            if (isPrimaryView)
            { $item = vizObj.$flyoutTemplate().clone().removeClass('template'); }
            else
            {
                if (!viewConfig._$flyoutTemplate)
                {
                    viewConfig._$flyoutTemplate = vizObj.$dom()
                        .siblings('.flyoutRenderer.template[data-viewId="' + view.id + '"]');
                    if (viewConfig._$flyoutTemplate.length < 1)
                    {
                        vizObj.$dom().after($.tag({tagName: 'div', 'data-viewId': view.id,
                            'class': ['template', 'row',
                                'richRendererContainer', 'flyoutRenderer'] }));
                        viewConfig._$flyoutTemplate = vizObj.$dom()
                            .siblings('.flyoutRenderer.template[data-viewId="' + view.id + '"]');
                    }
                    viewConfig.richRenderer = viewConfig._$flyoutTemplate.richRenderer({
                        columnCount: 1, view: view });
                    viewConfig.richRenderer.setConfig(vizObj.generateFlyoutLayout(
                        (view.displayFormat.plot || {}).descriptionColumns,
                        view.displayFormat.flyoutsNoLabel, view));
                    viewConfig.richRenderer.renderLayout();
                }
                $item = viewConfig._$flyoutTemplate.clone().removeClass('template');
            }

            if (isPrimaryView && vizObj.hasFlyout())
            { vizObj.richRenderer.renderRow($item, row, true); }
            if (!isPrimaryView && viewConfig.richRenderer)
            { viewConfig.richRenderer.renderRow($item, row, true); }

            if (vizObj.settings.showRowLink && !vizObj._primaryView.displayFormat.hideRowLink)
            {
                $item.append($.tag({tagName: 'a',
                    href: view.url + '/' + row.id,
                    target: isPrimaryView ? null : '_blank',
                    'class': ['viewRow', 'noInterstitial', 'noRedirPrompt'],
                    contents: $.t('controls.common.visualization.row_details')}));
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
            var $error = this.$dom().siblings('#vizError').show().text(errorMessage);
            this.$dom().height(this.$dom().parent().height() - $error.outerHeight());
        },

        // Used in a few places for non-dataset status
        startLoading: function()
        {
            this._primaryView && this._primaryView.trigger('request_start');
        },

        finishLoading: function()
        {
            this._primaryView && this._primaryView.trigger('request_finish');
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
            if (!vizObj._boundViewEvents)
            {
                var handleChange = function(forceRowReload)
                {
                    if (vizObj._doingReload || vizObj._ignoreViewChanges) { return; }
                    if (forceRowReload === true)
                    { vizObj._requireRowReload = true; }
                    vizObj._maybeDoInitialLoad();
                };
                var handleRowChange = function(rows, fullReset)
                {
                    var ds = this;
                    if (fullReset) { handleChange(true); }
                    else if (!vizObj._hidden)
                    {
                        var removedRows = [];
                        rows = _.reject(rows, function(r)
                        {
                            if ($.isBlank(ds.rowForID(r.id)))
                            {
                                removedRows.push(r);
                                return true;
                            }
                            return false;
                        });
                        if (rows.length > 0)
                        { vizObj.handleRowsLoaded(rows, ds); }
                        if (removedRows.length > 0)
                        { vizObj.handleRowsRemoved(removedRows, ds); }
                    }
                };
                var handleQueryChange = function() {
                    if (vizObj._updatingViewport) return;
                    handleChange(true);
                };

                vizObj._boundViewEvents =
                    vizObj._bindEventsToViews(
                    'viewChangedEvents',
                    vizObj._dataViews,
                    {
                        'query_change': handleQueryChange,
                        'row_change': handleRowChange,
                        'displayformat_change': handleChange
                    }, vizObj);
            }

            if (vizObj._validEvent)
            {
                vizObj._validEvent.unbindAll();
            }

            vizObj._validEvent =
                vizObj._bindEventsToViews(
                'viewReadyEvents',
                vizObj._dataViews,
                {
                    'valid': _.bind(vizObj._onMakeValid, vizObj)
                }, vizObj);
        },

        _onMakeValid: function()
        {
            var vizObj = this;
            vizObj.ready();
            vizObj._maybeDoInitialLoad();
        },

        _maybeDoInitialLoad: function()
        {
            var vizObj = this;
            if (!vizObj._initialLoad)
            {
                // Skip another changes this same render cycle
                vizObj._doingReload = true;
                _.defer(function()
                {
                    if (vizObj._doingReload)
                    {
                        delete vizObj._doingReload;
                        vizObj.reload();
                    }
                });
            }
        },

        // Binds all events given in the hash to each view.
        // Given:
        //  nsLeafName: namespace name, will be made unique to base-visualization.
        //  views: Array of views.
        //  events: Hash of event names to handler functions.
        //  model: Model to register under.
        // Returns:
        // An object that has the given api:
        // {
        //   unbindAll(): Unbinds all events bound by this call to _bindEventsToViews()
        // }
        _bindEventsToViews: function(nsLeafName, views, events, model)
        {
            var vizObj = this;
            var baseVizEventNamespace = 'controls.base-visualization.' + nsLeafName;
            var namespaces = [];
            _.each(views, function(view)
            {
                var ns = view.getEventNamespace(baseVizEventNamespace);
                namespaces.push(ns);
                ns.unbindAll();
                _.each(events, function(handler, eventName)
                {
                    ns.bind(eventName, handler, model);
                });
            });

            return {
                unbindAll: function()
                {
                    _.each(namespaces, function(ns)
                    {
                        ns.unbindAll();
                    });
                }
            };
        },

        setView: function(newView)
        {
            var vizObj = this;
            var hadView = !$.isBlank(vizObj._primaryView);
            if (hadView && !$.isBlank(newView) && newView.id == vizObj._primaryView.id ||
                    !hadView && $.isBlank(newView))
            { return; }

            if (hadView)
            {
                vizObj._primaryView.unbind(null, null, vizObj);
                vizObj._dataViews = _.without(vizObj._dataViews, vizObj._primaryView);
                delete vizObj._byView[vizObj._primaryView.id];
            }

            vizObj._primaryView = newView;
            if (vizObj._boundViewEvents)
            {
                vizObj._boundViewEvents.unbindAll();
                delete vizObj._boundViewEvents;
            }
            if (!$.isBlank(vizObj._primaryView))
            {
                vizObj._dataViews.unshift(vizObj._primaryView);
                vizObj._byView[vizObj._primaryView.id] = vizObj._primaryView;
            }

            vizObj._requireRowReload = true;
            vizObj._viewChanged = true;
            if (hadView) { delete vizObj._savedDF; }
            return vizObj.reload(null);
        },

        reload: function(newDF)
        {
            var vizObj = this;
            if (!$.isBlank(newDF)) { vizObj._savedDF = newDF; }

            if (vizObj._hidden)
            {
                vizObj._needsReload = true;
                return;
            }
            delete vizObj._needsReload;

            vizObj._displayFormat = vizObj._savedDF ||
                vizObj.settings.displayFormat || (vizObj._primaryView || {}).displayFormat;

            // If still loading libraries, don't try to reload
            if (!vizObj._dynamicLibrariesLoaded) { return; }

            if (vizObj.needsFullReset())
            {
                delete vizObj._viewChanged;
                return vizObj.reset();
            }

            vizObj.$dom().siblings('#vizError').hide().text('');

            if (_.any([vizObj._updatingViewport, vizObj._willfullyIgnoreReload]))
            {
                if (vizObj._updatingViewport)
                { vizObj.getDataForAllViews(); }
                else if (vizObj._willfullyIgnoreReload)
                {
                    // Hack for now. Purpose is to refresh all the existing rows with DF changes,
                    // without prompting a full reload of the rows.
                    // Will be done at the datalayer level in maps rewrite.
                    _.each(vizObj._dataViews, function(view)
                    { vizObj.renderData(view._activeRowSet._rows, view); });
                }
                delete vizObj._updatingViewport;
                delete vizObj._willfullyIgnoreReload;
            }
            else
            {
                vizObj.cleanVisualization();
                vizObj.reloadVisualization();
            }
        },

        cleanVisualization: function()
        {
            var vizObj = this;
            delete vizObj._requireRowReload;
            delete vizObj._flyoutLayout;
            vizObj._renderedRows = 0;
            if (vizObj._boundViewEvents)
            {
                vizObj._boundViewEvents.unbindAll();
                delete vizObj._boundViewEvents;
            }
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

        needsFullReset: function()
        {
            // Override if you need to do a bigger reset
            return this._viewChanged || false;
        },

        handleRowsLoaded: function(rows, view)
        {
            // Override if you need extra handling before rendering
            // Charts overrides this (and doesn't call super).
            this.renderData.apply(this, arguments);
        },

        handleClustersLoaded: function(clusters, view)
        {
            // Intended for maps only
        },

        handleRowsRemoved: function(rows, view)
        {
            var vizObj = this;
            _.each(rows, function(r) { vizObj.removeRow(r, view); });
        },

        renderData: function(rows, view)
        {
            var vizObj = this;

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

        renderRow: function(row, view)
        {
            // Implement me
            this.errorMessage = 'No render function';
            return false;
        },

        removeRow: function(row, view)
        {
            // Implement me if desired
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

            if (vizObj._dynamicLibrariesLoaded)
            {
                vizObj._librariesLoaded();
                return;
            }

            if (!$.isBlank(scripts))
            {
                blist.util.assetLoading.loadLibraries(scripts, function() {
                    vizObj._dynamicLibrariesLoaded = true;
                    vizObj._librariesLoaded();
                });
            }
            else
            {
                vizObj._dynamicLibrariesLoaded = true;
                vizObj._librariesLoaded();
            }
        },

        getDataForAllViews: function()
        {
            var vizObj = this;

            var nonStandardRender = function(view)
                { return view.renderWithArcGISServer() || view.isGeoDataset() };

            var viewsToRender = _.reject(vizObj._dataViews, function(view)
                { return nonStandardRender(view); });

            vizObj._rowsLoaded = 0;
            var actualFetchRows = function() {
              _.each(viewsToRender, function(view) { vizObj.getDataForView(view); });
            };

            var timesPolled = 0;
            var interval = setInterval(function() {
              timesPolled++;
              // Oh god I hope this is safe. Code audit says it should be okay. =/
              if (vizObj._boundViewEvents || timesPolled > 10) {
                clearInterval(interval);
                actualFetchRows();
              }
            }, 50);
        },

        getDataForView: function(view)
        {
            var vizObj = this;
            var viewConfig = vizObj._byView[view.id];
            var rowsToFetch = vizObj._maxRows - vizObj._rowsLoaded;
            if (rowsToFetch <= 0) { return; }

            viewConfig._requestedRows = rowsToFetch;
            view.getRows(0, rowsToFetch, function(data)
            {
                viewConfig._requestedRows = Math.min(view.totalRows(), viewConfig._requestedRows);
                _.defer(function()
                    { vizObj.handleRowsLoaded(data, view); });
                vizObj._rowsLoaded += view.totalRows() || data.length;
                vizObj.totalRowsForAllViews();
                delete vizObj._initialLoad;
                delete vizObj._loadDelay;
            },
            function(errObj)
            {
                // If we were cancelled, and didn't respond to the event that caused a cancel,
                // then re-try this request. Otherwise just clear initialLoad, and it will
                // respond normally.
                if ($.subKeyDefined(errObj, 'cancelled') && errObj.cancelled)
                {
                    // Exponential back-off in case we're waiting on something that needs to finish
                    if ($.isBlank(vizObj._loadDelay) || vizObj._loadDelay == 0)
                    { vizObj._loadDelay = 500; }
                    setTimeout(function()
                        { vizObj.getDataForView(view); }, vizObj._loadDelay);
                    vizObj._loadDelay *= 2;
                }
                else if (vizObj._boundViewEvents) { delete vizObj._initialLoad; }
            });
        },

        // This function is not meant as an accessor.
        totalRowsForAllViews: function()
        {
            var vizObj = this;
            vizObj._totalRows = _.reduce(vizObj._dataViews,
                function(total, view)
                { return total + (view.totalRows() || 0); }, 0);
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
