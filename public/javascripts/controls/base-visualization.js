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

                currentObj.loadLibraries();
            },

            $dom: function()
            {
                if (!this._$dom)
                {
                    var $d = $(this.currentDom);
                    this._$dom = $d.find('.fullHeight');
                    if (this._$dom.length == 0)
                    { this._$dom = $.tag({tagName: 'div', 'class': 'fullHeight',
                                        id: $d.attr('id') + '_visualizationArea'}); }
                    $d.append(this._$dom);
                }
                return this._$dom;
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
                    if (forceRowReload) { vizObj._requireRowReload = true; }
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

                delete vizObj._pendingReload;
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

                vizObj.reloadVisualization();

                vizObj.settings.view.getRows(0, vizObj._maxRows,
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

            handleRowsLoaded: function(rows)
            {
                // Override if you need extra handling before rendering
                this.renderData(rows);
            },

            renderData: function(rows)
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
                    var result = vizObj.renderRow(r);
                    addedRows = addedRows || result;
                    badPoints = badPoints || !result;
                });

                if (badPoints)
                {
                    vizObj.showError('Some points were invalid. ' +
                        vizObj.errorMessage);
                }


                if (addedRows)
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

                    vizObj.settings.view.getRows(0, vizObj._maxRows,
                        function()
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

})(jQuery);
