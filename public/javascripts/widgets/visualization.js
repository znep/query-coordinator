(function($)
{
    $.fn.visualization = function(options)
    {
        // build main options before element iteration
        var opts = $.extend({}, $.fn.visualization.defaults, options);

        // iterate and do stuff to each matched element
        return this.each(function()
        {
            var $visualization = $(this);
            // build element specific options
            var config = $.meta ? $.extend({}, opts, $visualization.data()) : opts;
            $visualization.data("config-visualization", config);

            $visualization.addClass('chartContainer');
            $visualization.bind('resize',
                function(e) { handleResize($visualization, e); });

            if (blist.widgets.visualization.invalid)
            {
                $visualization.html("<div class='error'>There are not enough " +
                    "columns to display this visualization.  " +
                    "If you are the owner, please choose new columns.</div>");
                return;
            }

            if (!blist.widgets.visualization.isFusionMap)
            {
                var query = new google.visualization.Query('/views/' +
                  blist.widgets.visualization.viewId + '/rows.gvds?accessType=WEBSITE&_=' +
                    new Date().valueOf());
                // Send the query with a callback function.
                query.send(function(r) { handleQueryResponse($visualization, r); });
            }
            else
            {
                var map = new FusionMaps("/fusionMaps/" +
                    blist.widgets.visualization.fusionMapSwf,
                    "Map1Id", "100%" , "100%", "0", "0");
                map.setDataURL("/views/" + blist.widgets.visualization.viewId +
                    "/rows.fmap");
                map.addParam("wmode", "opaque");
                map.render($visualization[0]);
            }
        });
    };

    //
    // private functions
    //
    function handleResize($viz, event)
    {
        // Some viz require height & width explicitly set on the container
        $viz.width('100%');
        $viz.width($viz.width());

        var config = $viz.data("config-visualization");
        if (!config._resizeTimer && (config._prevWidth !== $viz.width() ||
            config._prevHeight !== $viz.height()))
        {
            config._prevWidth = $viz.width();
            config._prevHeight = $viz.height();
            config._resizeTimer = true;
            setTimeout(function() { renderViz($viz); }, 300);
        }
    };

    function handleQueryResponse($viz, response)
    {
        // Called when the query response is returned.
        if (response.isError())
        {
            alert('Error in query: ' + response.getMessage() + ' ' +
                response.getDetailedMessage());
            return;
        }

        var config = $viz.data("config-visualization");
        config._data = response.getDataTable();
        renderViz($viz);
    };

    function renderViz($viz)
    {
        var config = $viz.data("config-visualization");
        delete config._resizeTimer;
        if (config._data === undefined) { return; }

        $viz.empty();
        $viz.css('overflow', 'hidden');
        var chart = new blist.widgets.visualization.chartClass($viz[0]);
        chart.draw(config._data, $.extend({legendFontSize: 12},
            blist.widgets.visualization.displayFormat,
            {height: $viz.height(), width: $viz.width()}) );
    };

})(jQuery);
