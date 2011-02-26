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
            nodeColor: '#042656'
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
                chartObj._remainder = chartObj._valueColumns[0].column.aggregates.sum;
            },

            renderData: function(rows)
            {
                var chartObj = this;

                var processRows = function(row)
                    {
                        var area = parseFloat(row[chartObj.
                            _valueColumns[0].column.id]);
                        if (_.isNaN(area)) { return null; }
                        chartObj._remainder -= area;
                        var xCol = chartObj._fixedColumns[0];
                        return {
                            id: row.id,
                            name: xCol.renderType.renderer(row[xCol.id], xCol, true),
                            data: {
                                $area: area,
                                $color: (row.meta && row.meta.color) ||
                                    chartObj.settings.view.displayFormat.baseColor ||
                                    chartObj.settings.nodeColor,
                                amount:
                                    row[chartObj._valueColumns[0].column.id] || 0
                            },
                            children: []
                        };
                    }

                if (!chartObj._jitData)
                { chartObj._jitData = { id: 'root', name: '', data: {},
                        children: _.compact(_.map(rows, processRows)) }; }
                else
                {
                    if (chartObj._otherAdded)
                    {
                        chartObj._jitData.children.pop();
                        chartObj._otherAdded = false;
                    }
                    chartObj._jitData.children = chartObj._jitData.children.concat(
                        _.compact(_.map(rows, processRows)));
                }

                if (chartObj._remainder > 0)
                {
                    chartObj._jitData.children.push( {
                        id: -1,
                        name: 'Other',
                        data: {
                            amount: chartObj._remainder,
                            $area: chartObj._remainder,
                            $color: chartObj.settings.view.displayFormat.baseColor ||
                                chartObj.settings.nodeColor
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
              onMouseEnter: function(node, eventInfo) {
                if(node) {
                  node.setData('mouseoutColor', node.getData('color'));
                  var hsv = $.rgbToHsv($.hexToRgb(node.getData('color')));
                  if (hsv.s > 50) { hsv.s /= 2; }
                  if (hsv.v < 51) { hsv.v *= 2; }
                  node.setData('color', '#' + $.rgbToHex($.hsvToRgb(hsv)));
                  node.setCanvasStyle('shadowBlur', 7);
                  chartObj.chart.fx.plotNode(node, chartObj.chart.canvas);
                  //chartObj.chart.labels.plotLabel(chartObj.chart.canvas, node);
                    // No controller is being passed and this seems to cause JS errors.
                }
              },
              onMouseLeave: function(node) {
                if(node) {
                  node.setData('color', node.getData('mouseoutColor'));
                  node.removeCanvasStyle('shadowBlur');
                  chartObj.chart.plot();
                }
              }
            },
            Tips: {
              enable: true,
              type: 'Native',
              offsetX: -10,
              offsetY: 10,
              onShow: function(tip, node, isLeaf, domElement) {
                var html = "<div class=\"tip-title\">" + node.name
                  + "</div><div class=\"tip-text\">";
                var data = node.data;
                if(data.amount) {
                  html += chartObj._valueColumns[0].column.name + ": " + data.amount;
                }
                tip.innerHTML =  html;
              }
            },
            onCreateLabel: function(domElement, node){
                domElement.innerHTML = node.name;
            }
        });
    };

})(jQuery);
