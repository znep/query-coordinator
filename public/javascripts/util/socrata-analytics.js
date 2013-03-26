jQuery.metrics = {
    queue: [],
    increment: function(entity, metric, increment)
    {
        // validate params
        if ((entity === undefined) || (metric === undefined))
            return false;

        // bail if we did not load socrata server
        if ($.socrataServer === undefined)
            return false;
        $.metrics.queue.push({entity: entity, metric: metric, increment: increment});
        if ($.metrics.queue.length >= 10)
        {
            $.metrics.flush_metrics();
        }
    },

    mark: function(entity, metric)
    {
        $.metrics.increment(entity, metric, 1);
    },

    flush_metrics: function()
    {
        var metrics_bag = $.metrics.queue;
        $.metrics.queue = [];
        $.socrataServer.makeRequest({
        url: "/analytics/add",
        type: "POST",
        data: JSON.stringify({'metrics': metrics_bag}),
        anonymous: true,
        isSODA: true,
        headers: {'Content-Type': 'application/text'},
        success: function (data) {
            // noop
        },
        error: function (request) {
            //noop
        }
    });

    }
};

$(function() {
    $.metrics.mark("domain", "js-page-view");

    // NavigationTiming not supported by safari
    // https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/NavigationTiming
    if (window.performance !== undefined)
    {
        var now = new Date().getTime();
        var page_load_time = now - performance.timing.navigationStart;
        $.metrics.mark("domain-intern", "js-page-load-samples");
        $.metrics.increment("domain-intern", "js-page-load-time", page_load_time);
    }
    $.metrics.flush_metrics();
});
