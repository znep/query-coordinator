;(function() {

$.component.Component.extend('Visualization', 'data', {
    _init: function()
    {
        this._needsOwnContext = true;
        this._delayUntilVisible = true;
        this._super.apply(this, arguments);
    },

    isValid: function()
    {
        return this._dataContext;
    },

    configurationSchema: function()
    {
        return {schema: [{ fields: [$.cf.contextPicker()] }], view: this._dataset};
    },

    _getAssets: function()
    {
        return { javascripts: [ { assets: 'shared-visualization' } ] };
    },

    _render: function()
    {
        var lcObj = this;
        if (!_.isNumber(lcObj._properties.height))
        { lcObj._properties.height = 300; }
        if (!lcObj._super.apply(lcObj, arguments)) { return false; }

        updateProperties(lcObj, lcObj._properties);
        return true;
    },

    _propWrite: function(properties)
    {
        var lcObj = this;
        lcObj._super.apply(lcObj, arguments);

        if (lcObj._rendered)
        { updateProperties(lcObj, properties); }
    }
});

var updateProperties = function(lcObj)
{
    var renderViz = function() {

        if (lcObj.$contents.data('renderTypeManager'))
        { lcObj.$contents.removeData('renderTypeManager'); }

        lcObj.$contents.renderTypeManager({
            view: (lcObj._dataContext || {}).dataset,
            width: lcObj._properties.width,
            height: lcObj._properties.height
        });
    };

    if (!lcObj._updateDataSource(null, renderViz)) { renderViz(); };
};

})(jQuery);
