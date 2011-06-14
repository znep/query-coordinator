(function($)
{
    // Set up namespace for editors to class themselves under
    $.socrataVisualization =
    {
        extend: function(extHash, extObj)
        {
            if (!extObj) { extObj = socrataVisualizationObj; }
            return $.extend({}, extObj, extHash,
            {
                defaults: $.extend({}, extObj.defaults, extHash.defaults || {}),
                prototype: $.extend({}, extObj.prototype, extHash.prototype || {})
            });
        }
    };

    // This is a virtual class, so there is no way provided to instantiate it

    var socrataVisualizationObj = {};

    $.extend(socrataVisualizationObj,
    {
        defaults:
        {
            view: null
        },

        prototype:
        {
            init: function ()
            {
                var currentObj = this;
                var $mainDom = $(currentObj.currentDom);
                $mainDom.data("socrataVisualization", currentObj);

                $mainDom.resize(function(e) { doResize(currentObj, e); })
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

                currentObj._byView = {};
                currentObj._byView[currentObj.settings.view.id]
                    = { view: currentObj.settings.view };
                currentObj._dataViews = [currentObj.settings.view];

                var viewsFetched = 0;
                var viewsToLoad = (currentObj.settings.view
                                   .displayFormat.compositeMembers || []).length + 1;

                var datasetReady = function()
                {
                    viewsFetched++;
                    if (viewsFetched >= viewsToLoad)
                    { currentObj.loadLibraries(); }
                };

                _.each(currentObj.settings.view.displayFormat.compositeMembers || [],
                function(member_id, index)
                {
                    Dataset.createFromViewId(member_id, function(dataset)
                    {
                        currentObj._dataViews[index + 1] = dataset;
                        currentObj._byView[dataset.id] = { view: dataset };
                        datasetReady();
                    });
                });
                // No composite member views
                datasetReady();
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
                        columnCount: 1, view: this.settings.view});
                }
                return this._$flyoutTemplate;
            },

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
                // Override if you want a different layout
                if (_.isEmpty(columns)) { return null; }

                var col = {rows: []};
                _.each(columns, function(dc)
                {
                    var row = {fields: [
                        {type: 'columnLabel', tableColumnId: dc.tableColumnId},
                        {type: 'columnData', tableColumnId: dc.tableColumnId}
                    ]};
                    col.rows.push(row);
                });
                return {columns: [col]};
            },

            renderFlyout: function(row, view)
            {
                var vizObj = this;

                var isPrimaryView = vizObj.settings.view == view;
                var $item = vizObj.$flyoutTemplate().clone()
                        .removeClass('template');

                // In composite views, we don't have a displayFormat, so there are no
                // bits to show. Just point them at the row data in full.
                if (!isPrimaryView)
                { $item.empty(); }
                if (vizObj.hasFlyout())
                { vizObj.richRenderer.renderRow($item, row); }

                $item.append($.tag({tagName: 'a',
                    href: view.url + '/' + row.id,
                    target: isPrimaryView ? null : '_blank',
                    'class': ['viewRow', 'noInterstitial', 'noRedirPrompt'],
                    contents: 'View details for this row'}));
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
                this.settings.view.trigger('start_request');
            },

            finishLoading: function()
            {
                this.settings.view.trigger('finish_request');
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
                    if (forceRowReload === true)
                    { vizObj._requireRowReload = true; }
                    if (!vizObj._pendingReload && !vizObj._initialLoad)
                    {
                        vizObj._pendingReload = true;
                        _.defer(function() { vizObj.reload(); });
                    }
                };
                var handleQueryChange = function() { handleChange(true); };

                if (!vizObj._boundViewEvents)
                {
                    vizObj.settings.view
                        .bind('query_change', handleQueryChange)
                        .bind('row_change', handleChange)
                        .bind('displayformat_change', handleChange);

                    vizObj._boundViewEvents = true;
                }
            },

            reload: function()
            {
                var vizObj = this;
                if (vizObj._hidden)
                {
                    vizObj._needsReload = true;
                    return;
                }
                delete vizObj._needsReload;

                if (vizObj.needsPageRefresh())
                {
                    // Now that visualizations are being done inline, reloading
                    // the page is not going to work. The sidebar (or similar)
                    // should handle prompting the user and doing a reload if
                    // appropriate. Here, we just bail because there is no point
                    // to refreshing
                    return;
                }

                if (vizObj.needsFullReset())
                {
                    delete vizObj._pendingReload;
                    vizObj.reset();
                    return;
                }

                vizObj.$dom().siblings('#vizError').hide().text('');

                if (!vizObj._requireRowReload && vizObj.noReload())
                {
                    vizObj.reloadSpecialCases();
                    delete vizObj._pendingReload;
                    return;
                }
                if (vizObj._requireRowReload)
                { delete vizObj._requireRowReload; }

                delete vizObj._flyoutLayout;

                vizObj.reloadVisualization();

                getRowsForAllViews(vizObj,
                    function()
                    {
                        // Use a defer so that if the rows are already loaded,
                        // getColumns has a chance to run first
                        var args = arguments;
                        _.defer(function()
                        { vizObj.handleRowsLoaded.apply(vizObj, args); });
                    });

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

            needsPageRefresh: function()
            {
                // Override if you need to whitelist against reloading
                return false;
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

            reloadVisualization: function()
            {
                // Implement me when the view is being reset
            },

            renderRow: function(row)
            {
                // Implement me
                this.errorMessage = 'No render function';
                return false;
            },

            rowsRendered: function()
            {
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
                    vizObj.initializeVisualization();

                    vizObj._initialLoad = true;

                    getRowsForAllViews(vizObj, function()
                    {
                        // Use a defer so that if the rows are already loaded,
                        // getColumns has a chance to run first
                        var args = arguments;
                        _.defer(function()
                        {
                            vizObj.handleRowsLoaded.apply(vizObj, args);
                            delete vizObj._initialLoad;
                        });
                    });

                    if (vizObj.getColumns())
                    { vizObj.columnsLoaded(); }

                    $(window).resize();
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

                // Monkeypatch Javascript, whoooooo.
                // http://code.google.com/p/extsrcjs/source/browse/trunk/extsrc.js
                var document_write = document.write;
                var document_writeln = document.writeln;
                var buffer = '';
                document.write   = function(t) { buffer += t; };
                document.writeln = function(t) { buffer += t; buffer += '\n'; };
                // This style ignores the buffer, which may lead to problems.

                if (!$.isBlank(scripts))
                {
                    $.loadLibraries(scripts, function() {
                        document.write = document_write;
                        document.writeln = document_writeln;
                        vizObj._dynamicLibrariesLoaded = true;
                        callback();
                    });
                }
                else
                {
                    callback();
                }
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
        }
    });

    var doResize = function(vizObj, e)
    {
        if (vizObj._prevHeight == vizObj.$dom().height() &&
                vizObj._prevWidth == vizObj.$dom().width())
        { return; }

        vizObj._prevHeight = vizObj.$dom().height();
        vizObj._prevWidth = vizObj.$dom().width();
        vizObj.resizeHandle(e);
    };

    var getRowsForAllViews = function(vizObj, callback)
    {
        var rowsToFetch = vizObj._maxRows;
        var nonStandardRender = function(view)
            { return view.renderWithArcGISServer() };

        var viewsToRender = _.reject(vizObj._dataViews, function(view)
            { return nonStandardRender(view); });

        var views = [];
        var viewsToCount = viewsToRender.length;
        _.each(viewsToRender, function(view, index)
        {
            view.getTotalRows(function()
            {
                var clusterFunction = function()
                    {
                        if (vizObj.updateRowsByViewport
                            && vizObj.settings.view.displayFormat.viewport)
                        {
                            var isEsri = vizObj.settings.view.displayFormat.type == 'esri';
                            var viewport = vizObj.settings.view.displayFormat.viewport;
                            if (isEsri && viewport.sr == 102100)
                            {
                                viewport =
                                    esri.geometry.webMercatorToGeographic(new esri.geometry.Extent(
                                        viewport.xmin,
                                        viewport.ymin,
                                        viewport.xmax,
                                        viewport.ymax,
                                        new esri.SpatialReference({ wkid: viewport.sr })))
                                viewport = {
                                    xmin: viewport.xmin,
                                    ymin: viewport.ymin,
                                    xmax: viewport.xmax,
                                    ymax: viewport.ymax,
                                    sr: viewport.spatialReference.wkid
                                };
                            }
                            vizObj.updateRowsByViewport(viewport, !isEsri);
                        }
                        view.getClusters(function(data)
                        {
                            _.defer(function()
                                { vizObj.handleClustersLoaded(data, view); });
                            var executable = views.shift();
                            if (executable) { executable(); }
                            vizObj.totalRowsForAllViews();
                            delete vizObj._initialLoad;
                            delete vizObj._pendingReload;
                        },
                        function()
                        {
                            _.defer(function()
                                { vizObj.handleClustersLoaded([], view); });
                            var executable = views.shift();
                            if (executable) { executable(); }
                            // On error clear these variables so more requests will be triggered
                            delete vizObj._initialLoad;
                            delete vizObj._pendingReload;
                        });
                    };
                var rowFunction = function()
                    {
                        view.getRows(0, rowsToFetch, function(data)
                        {
                            rowsToFetch -= view.totalRows ? view.totalRows
                                                          : data.length;
                            var executable = views.shift();
                            if (executable) { executable(); }
                            vizObj.totalRowsForAllViews();
                            if (rowsToFetch <= 0 || !executable)
                            { delete vizObj._pendingReload; }
                            callback.apply(vizObj, [data, view]);
                        });
                    };

                if (vizObj.settings.view.metadata.renderTypeConfig.visible.map
                    && vizObj.settings.view.displayFormat.plotStyle == 'point'
                    && view.totalRows > vizObj._maxRows)
                { views[index] = clusterFunction; }
                else
                { views[index] = rowFunction; }

                viewsToCount--;
                if (viewsToCount == 0)
                {
                    var executable = views.shift();
                    if (executable) { executable(); }
                }
            });
        });
    };

})(jQuery);
