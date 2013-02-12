jQuery.metrics = {
    increment: function(entity, metric, increment)
    {
        // validate params
        if ((entity === undefined) || (metric === undefined))
            return false;

        // bail if we did not load socrata server
        if ($.socrataServer === undefined)
            return false;
        var csrfToken = $('meta[name="csrf-token"]').attr('content');
        if (csrfToken === undefined)
            return false;
        $.socrataServer.makeRequest({
            url: "/analytics/add/" + entity + "/" + metric,
            params: {'increment': 1},
            type: "POST",
            anonymous: true,
            isSODA: true,
            headers: {'X-CSRF-Token': csrfToken},
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