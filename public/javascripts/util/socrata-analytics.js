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
    },
    collect_page_timings: function() {
        $.metrics.mark("domain", "js-page-view");

        // NavigationTiming not supported by safari
        // https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/NavigationTiming
        if (window.performance !== undefined)
        {
            var nav_start = performance.timing.navigationStart;
            var dom_complete = performance.timing.domComplete;
            // Some browsers appear to return zero for navigationStart
            if (nav_start > 0 && dom_complete > 0) {
                $.metrics.mark("domain-intern", "js-page-load-samples");
                $.metrics.increment("domain-intern", "js-page-load-time", dom_complete - nav_start);
                // domComplete is always the value of the *first* state change to complete
                // subsequent interactive states will not be captured here
                $.metrics.increment("domain-intern", "js-dom-load-time", dom_complete - performance.timing.domLoading);
            }
        }
        $.metrics.flush_metrics();
    }
};

$(window).load($.metrics.collect_page_timings);

