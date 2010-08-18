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
            maxRows: 500,
            view: null
        },

        prototype:
        {
            init: function ()
            {
                var currentObj = this;
                var $domObj = currentObj.$dom();
                $domObj.data("socrataVisualization", currentObj);

                currentObj.settings.view
                    .bind('start_request',
                        function() { currentObj.startLoading(); })
                    .bind('finish_request', function()
                        { currentObj.finishLoading(); });

                if ($domObj.parent().find('.loadingSpinnerContainer').length < 1)
                {
                    $domObj.parent().append(
                        '<div class="loadingSpinnerContainer hidden">' +
                        '<div class="loadingSpinner"></div></div>');
                }

                if ($domObj.siblings('#vizError').length < 1)
                { $domObj.before('<div id="vizError" class="mainError"></div>'); }
                $domObj.siblings('#vizError').hide();

                currentObj.initializeVisualization();

                $domObj.resize(function(e) { doResize(currentObj, e); });


                if (!currentObj.settings.view.valid)
                {
                    currentObj.ready();
                    return;
                }

                currentObj._initialLoad = true;

                currentObj.settings.view.getRows(0, currentObj.settings.maxRows,
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

            startLoading: function()
            {
                this.$dom().parent().find('.loadingSpinnerContainer')
                    .removeClass('hidden');
            },

            finishLoading: function()
            {
                this.$dom().parent().find('.loadingSpinnerContainer')
                    .addClass('hidden');
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
                var handleChange = function()
                {
                    if (!vizObj._pendingReload && !vizObj._initialLoad)
                    {
                        vizObj._pendingReload = true;
                        _.defer(function() { vizObj.reload(); });
                    }
                };

                vizObj.settings.view
                    .bind('query_change', handleChange)
                    .bind('displayformat_change', handleChange);
            },

            reload: function()
            {
                var vizObj = this;
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

                vizObj.reloadVisualization();

                vizObj.settings.view.getRows(0, vizObj.settings.maxRows,
                    function()
                    {
                        // Use a defer so that if the rows are already loaded,
                        // getColumns has a chance to run first
                        var args = arguments;
                        _.defer(function()
                        { vizObj.handleRowsLoaded.apply(vizObj, args); });
                    });

                if (vizObj.getColumns())
                { vizObj.columnsLoaded(); }

                delete vizObj._pendingReload;
            },

            reset: function()
            {
                // Implement how to do a full reset
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
