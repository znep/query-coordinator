jQuery.metrics = {
    increment: function(entity, metric, increment)
    {
        // validate params
        if ((entity === undefined) || (metric === undefined))
            return false;

        // bail if we did not load socrata server
        if ($.socrataServer === undefined)
            return false;

        $.socrataServer.makeRequest({
            url: "/analytics/add/" + entity + "/" + metric + "/" + increment,
            type: "GET",
            success: function (data) {
                // noop
            },
            error: function (request) {
                //noop
            }
        });
    },
    mark: function(entity, metric)
    {
        $.metrics.increment(entity, metric, 1)
    }
};
$.metrics.mark("domain", "js-page-view");