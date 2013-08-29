jQuery.metrics = {
    queue: [],
    pageLoadBucketNames: ["awesome", "good", "ok", "poor", "terrible"],
    pageLoadBuckets: [500, 1000, 2000, 4000],
    domLoadBuckets:  [500, 1000, 2000, 4000],
    stopwatches: {},
    stopwatchFunction: (window.performance !== undefined && _.isFunction(performance.now))
        ? function() { return performance.now(); }
        : function() { return new Date().getTime(); },

    increment: function(entity, metric, increment)
    {
        // validate params
        if ((entity === undefined) || (metric === undefined))
        { return false; }

        // bail if we did not load socrata server
        if ($.socrataServer === undefined)
        { return false; }

        $.metrics.queue.push({entity: entity, metric: metric, increment: increment});
        if ($.metrics.queue.length >= 10)
        {
            $.metrics.flush_metrics();
        }
    },
    measure: (window.performance !== undefined && _.isFunction(performance.now))
        ? function(entity, metric) { $.metrics.increment(entity, metric, performance.now()); }
        : function() {},

    stopwatch: function(entity, metric, action)
    {
        if (_.isFunction($.metrics['stopwatch' + $.capitalize(action)]))
        { $.metrics['stopwatch' + $.capitalize(action)](entity, metric); }
    },
    stopwatchStart: function(entity, metric)
    {
        delete $.metrics.stopwatches[entity + '/' + metric];
        $.metrics.stopwatches[entity + '/' + metric] = $.metrics.stopwatchFunction();
    },
    stopwatchPulse: function(entity, metric)
    {
        var key = entity + '/' + metric;
        if ($.metrics.stopwatches[key])
        {
            $.metrics.increment(entity, metric,
                $.metrics.stopwatchFunction() - $.metrics.stopwatches[key]);
        }
    },
    stopwatchEnd: function(entity, metric)
    {
        $.metrics.stopwatchPulse(entity, metric);
        delete $.metrics.stopwatches[entity + '/' + metric];
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
        success: function (/* data */) {
            // noop
        },
        error: function (/* request */) {
            // noop
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
            var response_start = performance.timing.responseStart;
            // Some browsers appear to return zero for navigationStart
            if (nav_start > 0 && dom_complete > 0 && response_start > 0) {

                var js_page_load_time = dom_complete - nav_start;
                var js_dom_load_time = dom_complete - performance.timing.domLoading;

                $.metrics.mark("domain-intern", "js-page-load-samples");
                $.metrics.increment("domain-intern", "js-page-load-time", js_page_load_time);
                $.metrics.increment("domain-intern", "js-response-start-time", response_start - nav_start);
                $.metrics.increment("domain-intern", "js-response-read-time", performance.timing.responseEnd - response_start);
                // domComplete is always the value of the *first* state change to complete
                // subsequent interactive states will not be captured here
                $.metrics.increment("domain-intern", "js-dom-load-time", js_dom_load_time);

                var page_load_bucket = $.metrics.bucket_timing(js_page_load_time, $.metrics.pageLoadBucketNames, $.metrics.pageLoadBuckets);
                var dom_load_bucket = $.metrics.bucket_timing(js_dom_load_time, $.metrics.pageLoadBucketNames, $.metrics.domLoadBuckets);
                var page_type = $.metrics.determine_page_type();

                $.metrics.increment("domain-intern", page_type + "-" + page_load_bucket + "-js-page-load-time", js_page_load_time);
                $.metrics.mark("domain-intern", page_type + "-" + page_load_bucket + "-js-page-load-samples");

                $.metrics.increment("domain-intern", page_type + "-" + dom_load_bucket + "-js-dom-load-time", js_dom_load_time);
                $.metrics.mark("domain-intern", page_type + "-" + dom_load_bucket + "-js-dom-load-samples");
            }
        }
        $.metrics.flush_metrics();
    },
    bucket_timing: function(timing, names, time_buckets) {
        var i=0;
        while (i<time_buckets.length) {
            if (timing < time_buckets[i]) {
                break;
            }
            i++;
        }
        return names[i];
    },
    determine_page_type: function() {

        //debugger;
        var path = window.location.pathname;

        //First, see if this is a homepage.  Treat this a little special.
        if (!path || path=="/") {
            return "homepage";
        }

        //Next see if it is a dataslate page of any kind
        if ($.subKeyDefined(blist, 'configuration.page')) {
            return "dataslate";
        }

        if (blist.dataset) {
            return "dataset";
        } else if (path.match("^/admin")) {
            return "admin";
        } else if (path.match("^/profile")) {
            return "profile";
        }

        return "other";
    }
};

$(window).load(function() { _.defer($.metrics.collect_page_timings); });
$(window).unload(function() { $.metrics.flush_metrics(); });
