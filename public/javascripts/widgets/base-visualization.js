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
            pageSize: 100
        },

        prototype:
        {
            init: function ()
            {
                var currentObj = this;
                var $domObj = currentObj.$dom();
                $domObj.data("socrataVisualization", currentObj);

                currentObj._displayConfig = currentObj.settings.displayFormat || {};

                currentObj._rowsLeft = 0;
                currentObj._rowsLoaded = 0;

                if ($domObj.parent().find('.loadingSpinnerContainer').length < 1)
                {
                    $domObj.parent().append(
                        '<div class="loadingSpinnerContainer">' +
                        '<div class="loadingSpinner"></div></div>');
                }

                if ($domObj.siblings('#vizError').length < 1)
                { $domObj.before('<div id="vizError" class="mainError"></div>'); }
                $domObj.siblings('#vizError').hide();

                currentObj.initializeVisualization();

                $domObj.resize(function(e) { currentObj.resizeHandle(e); });

                loadRows(currentObj,
                    {method: 'getByIds', meta: true, start: 0,
                        length: currentObj.settings.pageSize});
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

            reload: function(newOptions)
            {
                var vizObj = this;
                vizObj.$dom().siblings('#vizError').hide().text('');

                if (newOptions !== undefined)
                { vizObj._displayConfig = newOptions; }

                vizObj.reloadVisualization();

                vizObj._rowsLeft = 0;
                vizObj._rowsLoaded = 0;

                loadRows(vizObj,
                    {method: 'getByIds', meta: true, start: 0,
                        length: vizObj.settings.pageSize});
            },

            handleRowsLoaded: function(rows)
            {
                // Override if you need extra handling before rendering
                this.renderData(rows);
            },

            renderData: function(rows)
            {
                var vizObj = this;

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

            getColumns: function(view)
            {
                // Implement me to get the specific columns you need for
                // this view
            }
        }
    });

    var loadRows = function(vizObj, args)
    {
        vizObj.startLoading();
        $.ajax({url: '/views/' + blist.display.viewId + '/rows.json',
                cache: false, data: args, type: 'GET', dataType: 'json',
                error: function() { vizObj.finishLoading(); },
                success: function(data)
                {
                    vizObj.finishLoading();
                    rowsLoaded(vizObj, data);
                }});
    };

    var rowsLoaded = function(vizObj, data)
    {
        if (data.meta !== undefined)
        {
            vizObj._displayConfig = data.meta.view.displayFormat;
            vizObj.getColumns(data.meta.view);
            vizObj._rowsLeft = data.meta.totalRows - vizObj._rowsLoaded;
        }

        var rows = data.data.data || data.data;
        vizObj._rowsLoaded += rows.length;
        vizObj._rowsLeft -= rows.length;
        loadMoreRows(vizObj);

        vizObj.handleRowsLoaded(rows);
    };

    var loadMoreRows = function(vizObj)
    {
        if (vizObj._rowsLeft < 1) { return; }

        var toLoad = Math.min(vizObj._rowsLeft, vizObj.settings.pageSize);

        loadRows(vizObj, { method: 'getByIds', start: vizObj._rowsLoaded,
            length: toLoad });
    };

})(jQuery);
