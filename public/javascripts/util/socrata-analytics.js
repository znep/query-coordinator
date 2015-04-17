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
        $.metrics.mark("domain", "browser-" + $.metrics.browser_name());
        $.metrics.mark("domain-intern", "browser-" + $.metrics.browser_name());
        $.metrics.mark("domain", "browser-" + $.metrics.browser_name() + "-" + $.browser.majorVersion);
        $.metrics.mark("domain-intern", "browser-" + $.metrics.browser_name() +
                "-" + $.browser.majorVersion);

        var page_type = $.metrics.determine_page_type();
        if ($.metrics.in_iframe()) {
            $.metrics.mark("domain", 'js-page-view-embed-{0}'.format(page_type));
        } else {
            $.metrics.mark("domain", 'js-page-view-{0}'.format(page_type));
        }

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

                // TODO: Start sending "js-pageview-{page_type}"

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
    in_iframe: function() {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    },
    determine_page_type: function() {
        var page_type = 'other';

        //debugger;
        var path = window.location.pathname;

        // Currently abiding by ISO 639-1 localisation standard
        var localization_regex = "[a-z]{2}";
        // Front load the dataslate check because it is the only check not dependent on the URL Path
        if ($.subKeyDefined(blist, 'configuration.page')) {
            page_type = 'dataslate';
        }

        // TODO Client end page type classification.  This should instead be replaced with a more robust classify on consume model.

        if (!path || path.match("^/({0})?/?$".format(localization_regex))) {
            page_type = 'homepage';
        }

        if (blist.dataset) {
            var extra = _.compact(_.map({
                'order': 'sort',
                'group': 'grouped',
                'where': 'filter',
                'having': 'filter' }, function(name, qPart)
                { return !_.isEmpty($.deepGet(blist.dataset, 'metadata', 'jsonQuery', qPart)) ? name : null; }));

            if (extra.length > 1)
            { page_type = 'dataset-complex'; }
            else if (extra.length == 1)
            { page_type = "dataset-{0}".format(extra[0]); }
            else
            { page_type = 'dataset'; }

        } else if (path.match("^/({0}/)?admin".format(localization_regex))) {
            page_type = 'admin';
        } else if (path.match("^/({0}/)?profile".format(localization_regex))) {
            page_type = 'profile';
        } else if (path.match("^/({0}/)?browse".format(localization_regex))) {
            page_type = 'browse' + (window.location.href.indexOf('q=') > -1 ? '-search' : '');
        } else if ($.subKeyDefined(blist, 'govstat')) {
            page_type = 'govstat'
        }

        return page_type;
    },
    browser_name: function() {
        return $.browser.msie ? 'ie' : $.browser.mozilla ? 'firefox' : $.browser.chrome ? 'chrome' :
            $.browser.safari ? 'safari' : 'other';
    }
};

$(window).load(function() { _.defer($.metrics.collect_page_timings); });
$(window).unload(function() { $.metrics.flush_metrics(); });
