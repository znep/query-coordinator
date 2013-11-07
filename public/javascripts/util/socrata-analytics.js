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
        if (!$.metrics.stopwatches[entity + '/' + metric])
        {
            $.metrics.stopwatches[entity + '/' + metric] = {
                entity: entity,
                metric: metric,
                pulses: [],

                start: function()
                {
                    this.pulses.push({ type: 'start', timestamp: $.metrics.stopwatchFunction() });
                    this.flush(); // Reset debounce timer.
                    this.started = true;
                },
                pulse: function()
                {
                    if (!this.started) { return; }
                    this.pulses.push({ type: 'pulse', timestamp: $.metrics.stopwatchFunction() });
                    this.flush(); // Reset debounce timer.
                },
                end: function()
                {
                    this.done = true;
                    this.pulse();
                },
                flush: _.debounce(function()
                {
                    if (!this.done) { return; }

                    var start = _.detect(this.pulses,
                            function(pulse) { return pulse.type == 'start'; }),
                        lastPulse = _.detect(this.pulses.slice().reverse(),
                            function(pulse) { return pulse.type == 'pulse'; });

                    if (start && lastPulse)
                    { $.metrics.increment(entity, metric, lastPulse.timestamp - start.timestamp); }

                    this.pulses = [];
                    this.done = false;
                }, 1000)
            };
        }
        if (action == 'clear')
        { delete $.metrics.stopwatches[entity + '/' + metric]; }
        else
        { $.metrics.stopwatches[entity + '/' + metric][action](); }
    },

    mark: function(entity, metric)
    {
        $.metrics.increment(entity, metric, 1);
    },

    flush_metrics: function()
    {
        if ($.metrics.queue.length === 0) { return; }

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
                var tz = new Date().getTimezoneOffset();
                var js_page_load_time = dom_complete - nav_start;
                var js_dom_load_time = dom_complete - performance.timing.domLoading;

                $.metrics.mark("domain-intern", "js-page-load-samples");
                $.metrics.increment("domain-intern", "js-page-load-time", js_page_load_time);
                $.metrics.increment("domain-intern", "js-page-load-tz-" + tz + "-time", js_page_load_time);
                $.metrics.increment("domain-intern", "js-response-start-time", response_start - nav_start);
                $.metrics.increment("domain-intern", "js-response-read-time", performance.timing.responseEnd - response_start);
                // Socrata->Browser latency ( not including dns )
                $.metrics.increment("domain-intern", "js-connect-time", performance.timing.connectEnd - performance.timing.connectStart);
                $.metrics.increment("domain-intern", "js-connect-tz-" + tz + "-time", performance.timing.connectEnd - performance.timing.connectStart);
                // domComplete is always the value of the *first* state change to complete
                // subsequent interactive states will not be captured here
                $.metrics.increment("domain-intern", "js-dom-load-time", js_dom_load_time);

                var page_type = $.metrics.determine_page_type();

                $.metrics.increment("domain-intern", page_type + "-js-dom-load-time", js_dom_load_time);
                $.metrics.mark("domain-intern", page_type + "-js-dom-load-samples");

                $.metrics.increment("domain-intern", page_type + "-js-page-load-time", js_page_load_time);
                $.metrics.mark("domain-intern", page_type + "-js-page-load-samples");

                if (page_type == 'dataslate')
                {
                    var num_contexts = _.size($.dataContext.availableContexts),
                        bucket = _.detect([1, 2, 4, 8, 16, 32, 64, 128],
                            function(b) { return num_contexts < b; });
                    $.metrics.increment('domain-intern',
                        'js-dataslate-lte-' + bucket + '-contexts-page-load-time', js_page_load_time);
                }
            }
        }
        $.metrics.flush_metrics();
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
            var extra = _.compact(_.map({
                    'sort': 'orderBys',
                    'grouped': 'groupBys',
                    'filter': 'filterCondition' }, function(qPart, name)
                { return !_.isEmpty($.deepGet(blist.dataset, 'query', qPart)) ? name : null; }));

            if (extra.length > 1)
            { return 'dataset-complex'; }
            else if (extra.length == 1)
            { return 'dataset-' + extra[0]; }
            else
            { return 'dataset'; }

        } else if (path.match("^/admin")) {
            return "admin";
        } else if (path.match("^/profile")) {
            return "profile";
        } else if (path.match("^/browse")) {
            return "browse" + (window.location.href.indexOf('q=') > -1 ? '-search' : '');
        } else if ($.subKeyDefined(blist, 'govstat')) {
            return "govstat"
        }

        return "other";
    }
};

$(window).load(function() { _.defer($.metrics.collect_page_timings); });
$(window).unload(function() { $.metrics.flush_metrics(); });
