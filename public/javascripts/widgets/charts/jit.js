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
            },

            renderData: function(rows)
            {
                var chartObj = this;

                chartObj._jitData = { id: 'root', name: '', data: {},
                    children: _.map(rows, function(row)
                    {
                        return {
                            id: _.uniqueId(), // TODO: will be able to use row.id later which is better
                            name: row[chartObj._fixedColumns[0].dataIndex],
                            data: {
                                $area:  parseFloat(row[chartObj._valueColumns[0].column.dataIndex]),
                                amount: row[chartObj._valueColumns[0].column.dataIndex]
                            },
                            children: []
                        };
                    }) };

                if (!chartObj._jit)
                { initializeJITObject(chartObj); }

                chartObj._jit.loadJSON(chartObj._jitData);
                chartObj._jit.refresh();
            }
        }
    }));

    var initializeJITObject = function(chartObj)
    {
        chartObj._jit = new $jit.TM.Squarified({
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
                  node.setCanvasStyle('shadowBlur', 7);
                  node.setData('color', '#888');
                  chartObj._jit.fx.plotNode(node, chartObj._jit.canvas);
                  //chartObj._jit.labels.plotLabel(chartObj._jit.canvas, node);
                    // No controller is being passed and this seems to cause JS errors.
                }
              },
              onMouseLeave: function(node) {
                if(node) {
                  node.removeData('color');
                  node.removeCanvasStyle('shadowBlur');
                  chartObj._jit.plot();
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
