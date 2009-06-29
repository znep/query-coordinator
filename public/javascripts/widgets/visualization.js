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

            var query = new google.visualization.Query('/views/' +
                blist.widgets.visualization.viewId + '/rows.gvds');
            // Send the query with a callback function.
            query.send(function(r) { handleQueryResponse($visualization, r); });
        });
    };

    //
    // private functions
    //
    function handleQueryResponse($vis, response)
    {
        // Called when the query response is returned.
        if (response.isError())
        {
            alert('Error in query: ' + response.getMessage() + ' ' +
                response.getDetailedMessage());
            return;
        }

        var data = response.getDataTable();
        var chart = new blist.widgets.visualization.chartClass($vis[0]);
        chart.draw(data, blist.widgets.visualization.displayFormat );
    };

})(jQuery);
