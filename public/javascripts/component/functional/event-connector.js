;(function($) {

$.component.FunctionalComponent.extend('EventConnector', 'functional', {
    _propWrite: function(properties)
    {
        var cObj = this;
        var oldEvent = cObj._properties.sourceEvent;
        var parSuper = cObj._super;

        var doUpdate = function()
        {
            var transformations = $.extend(true, [], properties.transformations);
            parSuper.call(cObj, cObj._stringSubstitute(properties));

            var srcCompId = (cObj._properties.parentPrefix || '') +
                cObj._properties.sourceComponentId;
            if (srcCompId != (cObj._sourceComponent || {}).id)
            {
                if (!$.isBlank(cObj._sourceComponent))
                { cObj._sourceComponent.unbind(null, null, this); }
                cObj._sourceComponent = $.component(srcCompId);
                oldEvent = null;
            }

            if (oldEvent != cObj._properties.sourceEvent && !$.isBlank(cObj._sourceComponent))
            {
                cObj._sourceComponent.unbind(oldEvent, null, cObj);
                cObj._sourceComponent.bind(cObj._properties.sourceEvent,
                    function(args)
                    {
                        if (!$.isBlank(cObj._destComponent))
                        {
                            var p = {};
                            _.each(cObj._properties.transformations, function(t)
                            {
                                $.deepSet.apply($, [p, getValue(t, args)].concat(t.destProperty.split('.')));
                            });
                            cObj._destComponent.properties(p);
                        }

                        if ($.subKeyDefined(cObj, '_destContext.dataset'))
                        {
                            _.each(transformations, function(origT)
                            {
                                var t = {};
                                _.each(origT, function(v, k)
                                {
                                    // String subst. items to match their data context
                                    if (k.startsWith('dest'))
                                    { t[k] = cObj._stringSubstitute(v, cObj._destContext); }
                                    else
                                    { t[k] = cObj._stringSubstitute(v); }
                                });
                                var colParts = t.destColFilter.split(':');
                                var dc = cObj._destContext.dataset.columnForIdentifier(colParts[0]);
                                if ($.isBlank(dc)) { return; }
                                var v = getValue(t, args);
                                if (colParts.length > 2)
                                {
                                    var o = {};
                                    var orig = o;
                                    for (var i = 2; i < colParts.length - 1; i++)
                                    {
                                        o[colParts[i]] = {};
                                        o = o[colParts[i]];
                                    }
                                    o[colParts[i]] = v;
                                    v = orig;
                                }
                                dc.filter(v, colParts[1], t.destOperator);
                            });
                        }
                    }, cObj);
            }

            var destCompId = (cObj._properties.parentPrefix || '') + cObj._properties.destComponentId;
            if (destCompId != (cObj._destComponent || {}).id)
            { cObj._destComponent = $.component(destCompId); }

            if (cObj._properties.destContextId != (cObj._destContext || {}).id)
            {
                delete cObj._destContext;
                $.dataContext.getContext(cObj._properties.destContextId, function(dc)
                { cObj._destContext = dc; });
            }
        };

        if (!cObj._updateDataSource(properties, doUpdate))
        { doUpdate(); }
    }
});

var getValue = function(trans, args)
{
    var v;
    if (!$.isBlank(trans.sourceColumn) && !$.isBlank(args.row) &&
        $.subKeyDefined(args, 'dataContext.dataset'))
    {
        var c = args.dataContext.dataset.columnForIdentifier(trans.sourceColumn);
        if (!$.isBlank(c))
        {
            v = args.row[c.lookup];
            if (!$.isBlank(trans.sourceValue))
            {
                var keys = trans.sourceValue.split('.');
                for (var i = 0; i < keys.length; i++)
                {
                    if (_.isString(v))
                    { v = JSON.parse(v); }
                    if ($.isBlank(v))
                    { break; }
                    v = v[keys[i]];
                }
            }
            else
            { v = c.renderType.renderer(args.row[c.lookup], c, true); }
        }
    }

    else if (!$.isBlank(trans.sourceKey))
    { v = $.deepGet.apply($, [args].concat(trans.sourceKey.split('.'))); }

    _.detect(trans.rules, function(r)
    {
        var matches = false;
        switch (r.operator)
        {
            case 'is_not_blank':
                matches = !$.isBlank(v);
                break;
            case 'is_blank':
                matches = $.isBlank(v);
                break;
        }
        if (matches) { v = r.result; }
        return matches;
    });

    return _.isUndefined(v) ? null : v;
};

})(jQuery);
