;(function($) {

$.component.FunctionalComponent.extend('EventConnector', 'functional', {
    _propWrite: function(properties)
    {
        var cObj = this;
        var oldEvent = cObj._properties.sourceEvent;
        cObj._super.apply(cObj, arguments);

        if (properties.sourceComponentId != (cObj._sourceComponent || {}).id)
        {
            if (!$.isBlank(cObj._sourceComponent))
            { cObj._sourceComponent.unbind(null, null, this); }
            cObj._sourceComponent = $.component(properties.sourceComponentId);
            oldEvent = null;
        }

        if (oldEvent != properties.sourceEvent && !$.isBlank(cObj._sourceComponent))
        {
            cObj._sourceComponent.unbind(oldEvent, null, cObj);
            cObj._sourceComponent.bind(properties.sourceEvent, function(args)
                {
                    if (!$.isBlank(cObj._destComponent))
                    {
                        var p = {};
                        _.each(cObj._properties.transformations, function(t)
                        { $.deepSet.apply($, [p, getValue(t, args)].concat(t.destProperty.split('.'))); });
                        cObj._destComponent.properties(p);
                    }

                    if ($.subKeyDefined(cObj, '_destContext.view'))
                    {
                        _.each(cObj._properties.transformations, function(t)
                        {
                            var dc = cObj._destContext.view.columnForID(t.destColFilter);
                            if ($.isBlank(dc)) { return; }
                            dc.filter(getValue(t, args));
                        });
                    }
                }, cObj);
        }

        if (properties.destComponentId != (cObj._destComponent || {}).id)
        { cObj._destComponent = $.component(properties.destComponentId); }

        if (properties.destContextId != (cObj._destContext || {}).id)
        {
            delete cObj._destContext;
            $.dataContext.getContext(properties.destContextId, function(dc)
            { cObj._destContext = dc; });
        }
    }
});

var getValue = function(trans, args)
{
    var v;
    if (!$.isBlank(trans.sourceColumn) && !$.isBlank(args.row) &&
        $.subKeyDefined(args, 'dataContext.view'))
    {
        var c = args.dataContext.view.columnForID(trans.sourceColumn);
        if (!$.isBlank(c))
        { v = c.renderType.renderer(args.row[c.lookup], c, true); }
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
