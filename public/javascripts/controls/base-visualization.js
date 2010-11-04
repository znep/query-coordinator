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
                var $domObj = currentObj.$dom();
                $domObj.data("socrataVisualization", currentObj);

                if ($domObj.siblings('#vizError').length < 1)
                { $domObj.before('<div id="vizError" class="mainError"></div>'); }
                $domObj.siblings('#vizError').hide();

                currentObj._maxRows = 500;

                $domObj.resize(function(e) { doResize(currentObj, e); });

                if (!currentObj.settings.view.valid)
                {
                    currentObj._invalid = true;
                    currentObj.ready();
                    return;
                }

                currentObj.initializeVisualization();

                currentObj._initialLoad = true;

                currentObj.settings.view.getRows(0, currentObj._maxRows,
                    function()
                    {
                        // Use a defer so that if the rows are already loaded,
                        // getColumns has a chance to run first
                        var args = arguments;
                        _.defer(function()
                        {
                            currentObj.handleRowsLoaded.apply(currentObj, args);
                            delete currentObj._initialLoad;
                        });
                    });

                if (currentObj.getColumns())
                { currentObj.columnsLoaded(); }
            },

            $dom: function()
            {
                if (!this._$dom)
                { this._$dom = $(this.currentDom); }
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
                        .bind('displayformat_change', handleChange)
                        .bind('valid', handleChange);
                    vizObj._boundViewEvents = true;
                }

                delete vizObj._pendingReload;
            },

            reload: function()
            {
                var vizObj = this;
                if (vizObj.needsPageRefresh())
                {
                    window.location.reload();
                    return;
                }

                if (vizObj.needsFullReset())
                {
                    delete vizObj._pendingReload;
                    vizObj.reset();
                    return;
                }

                vizObj.$dom().siblings('#vizError').hide().text('');

                if (!vizObj.settings.view.valid)
                {
                    delete vizObj._pendingReload;
                    return;
                }

                if (!vizObj._requireRowReload && vizObj.noReload())
                {
                    vizObj.reloadSpecialCases();
                    delete vizObj._pendingReload;
                    return;
                }
                if (vizObj._requireRowReload)
                { delete vizObj._requireRowReload; }

                if (vizObj._invalid)
                {
                    delete vizObj._invalid;
                    vizObj.initializeVisualization();
                }
                else
                { vizObj.reloadVisualization(); }

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
