// extend jQuery with Firebug console logging: http://muzso.hu/2008/03/07/logging-to-the-firebug-console-in-jquery
$.fn.log = function (msg, obj)
{
    $.debug(msg, this, obj);
    return this;
};

var debugNS = blist.namespace.fetch('blist.debug');
blist.debug.uid = 0;

// extend jQuery with generic console logging.
$.debug = function(msg, obj, obj2)
{
    msg = '[' + debugNS.uid++ + '] (' + new Date().getTime() + ') ' + msg;
    if (window.console && window.console.log)
    {
        if (obj || obj2)
        {
            if (obj2)
            { window.console.log("%s: %o; %o", msg, obj, obj2); }
            else
            { window.console.log("%s: %o", msg, obj); }
        }
        else
        { window.console.log(msg); }
    }
    else
    {
        var $console = $('#debug-console');
        if ($console.length < 1)
        {
            $('body').append('<div id="debug-console" style="position:fixed;' +
                'bottom:0;left:0;background-color:white;width:30em;' +
                'height:10em;overflow:auto;"></div>');
            $console = $('#debug-console');
        }
        if ((obj || obj2) && JSON)
        {
            if (obj2)
            { $console.append("<p>" + msg + ": " + JSON.stringify(obj) + "; " +
                JSON.stringify(obj2) + "</p>"); }
            else
            { $console.append("<p>" + msg + ": " + JSON.stringify(obj) + "</p>"); }
        }
        else
        { $console.append("<p>" + msg + "</p>"); }
        $console[0].scrollTop = $console[0].scrollHeight;
    }
};

$.objDiff = function(o1, o2)
{
    if (_.isEqual(o1, o2))
    {
        $.debug('Objects are equal');
        return;
    }
    if (!$.isPlainObject(o1) || !$.isPlainObject(o2))
    {
        $.debug('Objects are different and not both objects');
        return;
    }
    _.each(_.uniq(_.keys(o1).concat(_.keys(o2))), function(k)
    {
        if (!_.isEqual(o1[k], o2[k]))
        { $.debug(k + ' is different', o1[k], o2[k]); }
    });
};

blist.debug.clearCache = function ()
{
    blist.debug.cache.length = 0;
};

$(function ()
{
    // Alias for inspecting the request cache
    if ($.Tache)
    {
      blist.debug.cache = $.Tache.Data;
    }
});

(function()
{
    var debug = $.urlParam(window.location.href, 'debug');
    if (debug)
    { _.each(debug.split(','), function(key) { blist.debug[key] = true; }); }
})();

window.mapDebugger = function()
{
    window.mapObj = blist.datasetPage.rtManager.$domForType('map').socrataMap();
    window.viewConfig = mapObj._byView[mapObj._primaryView.id];

    window.zoomLevel = function() { console.log(window.mapObj.currentZoom()); };
    window.zoomIn = function() { window.mapObj.map.zoomIn(); };
    window.zoomOut = function() { window.mapObj.map.zoomOut(); };
    window.hideFeature = function(feature) { feature.style.display = 'none'; feature.layer.drawFeature(feature); };

    window.timestamp = function() { return new Date().getTime(); };
    window.animations = [];
    window.animationDebugger = function() { return {
        log: [],
        timestamps: function() { return _.pluck(this.log, 'timestamp'); },
        get: function(index) { return this.log[index].timestamp; },
        totalMS: function() {
            var times = this.timestamps();
            return _.last(times) - _.first(times);
        },
        transitions: function() {
            var _this = this;
            return _.map(this.log, function(item, index)
            {
                if (index == 0) { return 0; }
                return _this.get(index) - _this.get(index - 1);
            });
        }
    }; };
    window.newAnimationSet = function(animationConfig, num)
    { window.animations.push( $.extend(animationDebugger(),
        { config: animationConfig, toAnimate: num, startAt: timestamp() } )); };
    window.rememberAnimation = function(stuff)
    { _.last(window.animations).log.push($.extend({ timestamp: timestamp() }, stuff)); };
    window.killingAnimations = function() { _.last(window.animations).killedAt = timestamp(); };

    delete window.mapDebugger;
};

window.chartDebugger = function()
{
    window.chartObj = blist.datasetPage.rtManager.$domForType('chart').socrataChart();
    window.cc = chartObj._chartConfig || chartObj._columnChart;
    window.sg = chartObj._seriesGrouping;
    window.drawLine = function(num, color)
    {
        var $foo = $("<div />").css({ position: 'absolute', top: 0, left: 0,
                                      borderRight: 'solid 1px ' + (color || 'black'),
                                      width: num + 'px',
                                      height: '100%' });
        $('body').append($foo);
    }

    delete window.chartDebugger;
};

window.fetchOrigDF = function(uid)
{
    $.getJSON('/views/' + (uid || blist.dataset.id) + '.json',
        function(ds) { console.dir(ds.displayFormat); });
};

window.addDataset = function(uid)
{
    $(".repeater .addValue:eq(1)").click();
    $("input[name=dataset_name]").val(uid).blur();
};

window.logDebug = function() {
    if (!(console && console.log)) {
        return;
    }
    if (window.blistEnv === 'development' && $.deepGetStringField(window.blist, 'configuration.logging')) {
        var n = Date.now();
        var now = Date.strftime('%m-%d-%y %T', n / 1000.0) + (n % 1000.0 / 1000.0).toFixed(3) + ':';
        [].unshift.call(arguments, now);
        console.log.apply(console, arguments);
    }
};
