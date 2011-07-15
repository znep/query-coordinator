(function($)
{
    $.socrataChart.jit = function(options, dom)
    {
        this.settings = $.extend({}, $.socrataChart.jit.defaults, options);
        this.currentDom = dom;
        this.init();
    };


    $.extend($.socrataChart.jit, $.socrataChart.extend(
    {
        defaults:
        {
        },

        prototype:
        {
            initializeChart: function()
            {
                var chartObj = this;
                chartObj._chartType = chartObj.settings
                    .view.displayFormat.chartType;

                var limit = Dataset.chart.types[chartObj._chartType].displayLimit;
                if (limit.points)
                { chartObj._maxRows = limit.points; }
            },

            columnsLoaded: function()
            {
                var chartObj = this;
                chartObj._remainder = chartObj._valueColumns[0].column.aggregates.sum -
                    (chartObj._preRemainder || 0);
                delete chartObj._preRemainder;
            },

            renderData: function(rows)
            {
                var chartObj = this;

                var addRows = function(row)
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

                        var area = parseFloat(row[chartObj.
                            _valueColumns[0].column.id]);
                        if (_.isNaN(area)) { return; }

                        if (!$.isBlank(chartObj._remainder))
                        { chartObj._remainder -= area - exArea; }
                        else
                        {
                            chartObj._preRemainder = chartObj._preRemainder || 0;
                            chartObj._preRemainder += area - exArea;
                        }
                        var xCol = chartObj._fixedColumns[0];

                        var colors = chartObj.settings.view.displayFormat.colors;
                        var defaultColor = colors[row.id % 5];

                        var item = {
                            id: row.id,
                            name: xCol.renderType.renderer(row[xCol.id], xCol, true),
                            data: {
                                $area: area,
                                $color: (row.meta && row.meta.color) ||
                                    row.color ||
                                    defaultColor,
                                row: row,
                                flyoutDetails: chartObj.renderFlyout(row,
                                    chartObj._valueColumns[0].column.tableColumnId,
                                    chartObj.settings.view)
                            },
                            children: []
                        };
                        if (exIndex < 0)
                        { chartObj._jitData.children.push(item); }
                        else
                        { chartObj._jitData.children.splice(exIndex, 0, item); }
                    };

                if (!chartObj._jitData)
                { chartObj._jitData = { id: 'root', name: '', data: {}, children: [] }; }
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

                if (chartObj._remainder > 0)
                {
                    var row = { id: 'Other', changed: {}, error: {}, invalid: {} };
                    row[chartObj._fixedColumns[0].id] = 'Other';
                    row[chartObj._valueColumns[0].column.id] = chartObj._remainder;
                    var colors = chartObj.settings.view.displayFormat.colors;
                    chartObj._jitData.children.push( {
                        id: -1,
                        name: 'Other',
                        data: {
                            $area: chartObj._remainder,
                            $color: colors[chartObj.settings.view.totalRows % 5],
                            flyoutDetails: chartObj.renderFlyout(row,
                                chartObj._valueColumns[0].column.tableColumnId,
                                chartObj.settings.view)
                        },
                        children: []
                    });
                    chartObj._otherAdded = true;
                }

                if (!chartObj.chart)
                { initializeJITObject(chartObj); }

                chartObj.chart.loadJSON(chartObj._jitData);
                chartObj.chart.refresh();
            },

            resetData: function()
            {
                var chartObj = this;
                $(chartObj.chart.canvas.getElement()).parent().empty();
                delete chartObj.chart;
                delete chartObj._jitData;
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
                var scripts = $.makeArray(blist.assets.jit);
                if ($.browser.msie)
                {
                    scripts.push(this.javascriptBase + 'plugins/excanvas.compiled.js');
                }
                return scripts;
            }
        }
    }));

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
                  if (node)
                  {
                      node.setData('mouseoutColor', node.getData('color'));
                      var hsv = $.rgbToHsv($.hexToRgb(node.getData('color')));
                      if (hsv.s > 50) { hsv.s /= 2; }
                      if (hsv.v < 51) { hsv.v *= 2; }
                      node.setData('color', '#' + $.rgbToHex($.hsvToRgb(hsv)));
                      node.setCanvasStyle('shadowBlur', 7);
                      chartObj.chart.fx.plotNode(node, chartObj.chart.canvas);
                      chartObj.highlightRows(node.data.row);
                      //chartObj.chart.labels.plotLabel(chartObj.chart.canvas, node);
                        // No controller is being passed and this seems to cause JS errors.
                  }
              },
              onMouseLeave: function(node)
              {
                  if (node)
                  {
                      node.setData('color', node.getData('mouseoutColor'));
                      node.removeCanvasStyle('shadowBlur');
                      chartObj.chart.plot();
                      chartObj.unhighlightRows(node.data.row);
                  }
              }
            },
            Tips: {
              enable: true,
              type: 'Native',
              offsetX: -10,
              offsetY: 10,
              onShow: function(tip, node, isLeaf, domElement) {
                $(tip).empty().append(node.data.flyoutDetails);
              }
            },
            onCreateLabel: function(domElement, node){
                domElement.innerHTML = node.name;
            }
        });
    };

})(jQuery);
