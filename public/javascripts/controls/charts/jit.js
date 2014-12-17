(function($)
{
    var Other = $.t('controls.charts.other_slice_label');

    $.Control.registerMixin('jit', {
        initializeVisualization: function()
        {
            var chartObj = this;
            chartObj._super();

            var limit = Dataset.chart.types[chartObj._chartType].displayLimit;
            if (limit.points)
            { chartObj._maxRows = limit.points; }
        },

        columnsLoaded: function()
        {
            var chartObj = this;
            chartObj._totalSum = chartObj._valueColumns[0].column.aggregates.sum;
            chartObj._remainder = chartObj._valueColumns[0].column.aggregates.sum -
                (chartObj._preRemainder || 0);
            delete chartObj._preRemainder;
        },

        renderData: function(rows)
        {
            var chartObj = this;
            if (!chartObj.isValid()) { return; }

            var valCol = chartObj._valueColumns[0].column;
            var addRows = function(row, index)
                {
                    var exItem = _.detect(chartObj._jitData.children, function(c)
                        { return c.id == row.id; });
                    var exIndex = -1;
                    var exArea = 0;
                    if (!$.isBlank(exItem))
                    {
                        exIndex = _.indexOf(chartObj._jitData.children, exItem);
                        chartObj._jitData.children.splice(exIndex, 1);
                        exArea = exItem.data.$area;
                    }

                    var area = parseFloat(row.data[valCol.lookup]);
                    if (_.isNaN(area)) { return; }

                    if (!$.isBlank(chartObj._remainder))
                    { chartObj._remainder -= area - exArea; }
                    else
                    {
                        chartObj._preRemainder = chartObj._preRemainder || 0;
                        chartObj._preRemainder += area - exArea;
                    }
                    var xCol = chartObj._fixedColumns[0];

                    var colors = chartObj._displayFormat.colors || blist.defaultColors;
                    index = _.isUndefined(row.index) ? index : row.index;
                    var defaultColor = colors[index % Math.min(5, colors.length)];

                    var rowColor = (row.metadata.meta && row.metadata.meta.color) ||
                        row.color || defaultColor;
                    var isHighlight = (row.sessionMeta || {}).highlight;
                    if (isHighlight)
                    { rowColor = getHighlightColor(rowColor); }

                    var item = {
                        id: row.id,
                        name: xCol.renderType.renderer(row.data[xCol.lookup], xCol, true),
                        data: {
                            $area: area,
                            $color: rowColor,
                            row: row,
                            column: valCol,
                            flyoutDetails: chartObj.renderFlyout(row,
                                valCol.tableColumnId, chartObj._primaryView)
                        },
                        children: []
                    };
                    if (isHighlight)
                    { item.data['$canvas-shadowBlur'] = chartObj.settings.highlightBlur; }

                    if (exIndex < 0)
                    { chartObj._jitData.children.push(item); }
                    else
                    { chartObj._jitData.children.splice(exIndex, 0, item); }
                    chartObj._renderedRows++;
                };

            if (!chartObj._jitData)
            { chartObj._jitData = { id: 'jitRoot_' + _.uniqueId(), name: '', data: {}, children: [] }; }
            else
            {
                if (chartObj._otherAdded)
                {
                    chartObj._jitData.children = _.reject(chartObj._jitData.children,
                        function(c) { return c.id < 0; });
                    chartObj._otherAdded = false;
                }
            }
            _.each(rows, addRows);

            if (chartObj._renderedRows < 1)
            {
                chartObj.rowsRendered();
                return;
            }

            if (chartObj._remainder > chartObj._totalSum * 0.005)
            {
                var row = { id: Other, data: {}, changed: {}, error: {}, invalid: {} };
                row.data[chartObj._fixedColumns[0].lookup] = Other;
                row.data[valCol.lookup] = chartObj._remainder;
                var colors = chartObj._displayFormat.colors;
                var color = colors[chartObj._primaryView.totalRows() % 5];
                if ((chartObj._primaryView.highlights || {})[row.id])
                { color = getHighlightColor(color); }
                var item = {
                    id: -1,
                    name: Other,
                    data: {
                        $area: chartObj._remainder,
                        $color: color,
                        row: { id: Other, data: {} },
                        column: valCol,
                        flyoutDetails: chartObj.renderFlyout(row,
                            valCol.tableColumnId, chartObj._primaryView)
                    },
                    children: []
                };
                if ((chartObj._primaryView.highlights || {})[row.id])
                { item.data['$canvas-shadowBlur'] = chartObj.settings.highlightBlur; }
                chartObj._jitData.children.push(item);
                chartObj._otherAdded = true;
            }

            if (!chartObj.chart)
            { initializeJITObject(chartObj); }

            chartObj.chart.loadJSON(chartObj._jitData);
            chartObj.chart.refresh();
            chartObj.rowsRendered();
        },

        cleanVisualization: function()
        {
            var chartObj = this;
            chartObj._super();
            if (!$.isBlank(chartObj.chart))
            { $(chartObj.chart.canvas.getElement()).parent().empty(); }
            delete chartObj.chart;
            delete chartObj._jitData;
            delete chartObj._remainder;
            delete chartObj._preRemainder;
            delete chartObj._totalSum;
        },

        resizeHandle: function()
        {
            var chartObj = this;
            if (!chartObj.chart || !chartObj.chart.canvas) { return; }
            chartObj.chart.canvas.resize(chartObj.$dom().width(),
                                         chartObj.$dom().height());
        },

        getRequiredJavascripts: function()
        {
            var scripts = $.makeArray(blist.assets.libraries.jit);
            if ($.browser.msie)
            {
                scripts.push(this.javascriptBase + 'plugins/excanvas.compiled.js');
            }
            return scripts;
        }
    }, {highlightBlur: 7}, 'socrataChart');

    var getHighlightColor = function(color)
    {
        var hsv = $.rgbToHsv($.hexToRgb(color));
        if (hsv.s > 50) { hsv.s /= 2; }
        else { hsv.s *= 2; }
        if (hsv.v < 51) { hsv.v *= 2; }
        else { hsv.v /= 2; }
        return '#' + $.rgbToHex($.hsvToRgb(hsv));
    };

    var initializeJITObject = function(chartObj)
    {
        chartObj.chart = new $jit.TM.Squarified({
            injectInto: chartObj.$dom().attr('id'),
            levelsToShow: 1,
            titleHeight: 0,
            animate: false,
            duration: 1000,
            offset: 1,
            Label: {
                type: 'HTML',
                size: 12,
                family: 'Tahoma, Verdana, Arial'
            },
            Node: {
                CanvasStyles: {
                    shadowBlur: 0,
                    shadowColor: '#0000ff'
                }
            },
            Events: {
              enable: true,
              onMouseEnter: function(node, eventInfo)
              {
                  if (!$.isBlank(chartObj._rowLeaveTimer))
                  {
                      clearTimeout(chartObj._rowLeaveTimer);
                      delete chartObj._rowLeaveTimer;
                  }
                  if (node)
                  {
                      if (!$.isBlank(chartObj._curHighlight) &&
                          chartObj._curHighlight.id != node.data.row.id)
                      { chartObj._primaryView.unhighlightRows(chartObj._curHighlight); }

                      chartObj._curHighlight = node.data.row;
                      chartObj._primaryView.highlightRows(node.data.row, null, node.data.column);
                  }
              },
              onMouseLeave: function(node)
              {
                  if (node)
                  {
                      // Delay in case they moused over the tooltip before it adjusted
                      chartObj._rowLeaveTimer =
                          setTimeout(function()
                          {
                              delete chartObj._rowLeaveTimer;
                              chartObj._primaryView.unhighlightRows(node.data.row);
                          }, 100);
                  }
              },
              onClick: function(node)
              {
                  if ($.subKeyDefined(chartObj._primaryView, 'highlightTypes.select.' + node.data.row.id))
                  {
                      chartObj._primaryView.unhighlightRows(node.data.row, 'select');
                      chartObj.$dom().trigger('display_row', [{row: null}]);
                  }
                  else
                  {
                      chartObj._primaryView.highlightRows(node.data.row, 'select',  node.data.column);
                      chartObj.$dom().trigger('display_row', [{row: node.data.row}]);
                  }
              }
            },
            Tips: {
              enable: true,
              type: 'Native',
              offsetX: -10,
              offsetY: 10,
              onShow: function(tip, node, isLeaf, domElement)
              {
                  $(tip)
                    .addClass('jitTip')
                    .empty().append(node.data.flyoutDetails);
              }
            },
            onCreateLabel: function(domElement, node){
                domElement.innerHTML = node.name;
            }
        });
    };

})(jQuery);
