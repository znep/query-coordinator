;(function($) {

$.component.FunctionalComponent.extend('EventConnector', 'functional', {
    _propWrite: function(properties)
    {
        var cObj = this;
        var oldEvent = cObj._properties.sourceEvent;
        var parSuper = cObj._super;

        var doUpdate = function()
        {
            var origTransforms = $.extend(true, [], properties.transformations);
            parSuper.call(cObj, cObj._stringSubstitute(properties));

            var srcCompId = (cObj._properties.parentPrefix || '') +
                cObj._properties.sourceComponentId;
            if (srcCompId != (cObj._sourceComponent || {}).id)
            {
                if (!$.isBlank(cObj._sourceComponent))
                { cObj._sourceComponent.unbind(null, null, cObj); }
                if (!$.isBlank(srcCompId))
                { cObj._sourceComponent = $.component(srcCompId, cObj._componentSet); }
                oldEvent = null;
            }

            var srcContextId = cObj._properties.sourceContextId;
            if (srcContextId != (cObj._sourceContext || {}).id)
            {
                if (!$.isBlank(cObj._sourceContext))
                { cObj._sourceContext.unbind(null, null, cObj); }
                delete cObj._sourceContext;
                if (!$.isBlank(srcContextId))
                {
                    $.dataContext.getContext(cObj._properties.sourceContextId, function(sc)
                        {
                            cObj._sourceContext = sc;
                            if (sc.type == 'dataset')
                            { eventChanged(cObj, cObj._sourceContext.dataset, oldEvent, origTransforms); }
                            else
                            { eventChanged(cObj, cObj._sourceContext, oldEvent, origTransforms); }
                        });
                }
                oldEvent = null;
            }
            else if (!$.isBlank(cObj._sourceContext) && oldEvent != cObj._properties.sourceEvent)
            { eventChanged(cObj, (cObj._sourceContext.type == 'dataset' ?
                        cObj._sourceContext.dataset : cObj._sourceContext), oldEvent, origTransforms); }

            if (oldEvent != cObj._properties.sourceEvent && !$.isBlank(cObj._sourceComponent))
            { eventChanged(cObj, cObj._sourceComponent, oldEvent, origTransforms); }

            var destCompId = (cObj._properties.parentPrefix || '') + cObj._properties.destComponentId;
            if (destCompId != (cObj._destComponent || {}).id)
            {
                cObj._destComponent = $.component(destCompId, cObj._componentSet);
                if (!$.isBlank(cObj._destComponent))
                { cObj._destComponent.$dom.attr('aria-live', 'polite'); }
            }

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

var eventChanged = function(cObj, sourceItem, oldEvent, origTransforms)
{
    sourceItem.unbind(oldEvent, null, cObj);
    sourceItem.bind(cObj._properties.sourceEvent,
        function(args)
        {
            args = args || sourceItem;
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
                _.each(origTransforms, function(origT)
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
};

var getValue = function(trans, args)
{
    var v;
    var row;
    var col;
    if (!$.isBlank(trans.sourceColumn) && !$.isBlank(args.row) &&
        $.subKeyDefined(args, 'dataContext.dataset'))
    {
        col = args.dataContext.dataset.columnForIdentifier(trans.sourceColumn);
        if (!$.isBlank(col))
        {
            v = args.row.data[col.lookup];
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
        }
        else { row = args.row; }
    }

    else if (!$.isBlank(trans.sourceKey))
    { v = $.deepGet.apply($, [args].concat(trans.sourceKey.split('.'))); }

    _.detect(trans.rules, function(r)
    {
        var expr = { operator: r.operator, value: r.value };
        if (!$.isBlank(col))
        { expr.columnFieldName = col.columnFieldName; }
        var matches = blist.filter.matchesExpression(expr, (args.dataContext || {}).dataset)(row || v);

        if (matches) { v = r.result; }
        return matches;
    });

    return _.isUndefined(v) ? null : v;
};

})(jQuery);
