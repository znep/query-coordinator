;(function() {

$.component.Component.extend('Visualization', 'data', {
    _init: function()
    {
        this._needsOwnContext = true;
        this._delayUntilVisible = true;
        this._noTransactionForUndo = true;
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
    },

    design: function()
    {
        this._super.apply(this, arguments);
        if ($.isBlank(this.$editOverlay))
        {
            this.$editOverlay = $.tag2({ _: 'div', className: 'editOverlay' });
            this.$dom.append(this.$editOverlay);
        }
        this.$editOverlay.toggleClass('hide', !this._designing);
    }
});

var updateProperties = function(lcObj)
{
    var renderViz = function()
    {
        if (lcObj.$contents.data('renderTypeManager'))
        {
            var rtm = lcObj.$contents.data('renderTypeManager');
            rtm.hide(_.keys(rtm.settings.defaultTypes)[0]);
            lcObj.$contents.removeData('renderTypeManager');
        }

        var ds = (lcObj._dataContext || {}).dataset;

        if ($.isBlank(ds)) { return; }
        var visibleTypes = _.keys(ds.metadata.renderTypeConfig.visible),
            defaultTypes = {};

        // Attempt to reduce it down to a primary view.
        var type = _.detect(visibleTypes, function(vt) { return vt != 'table'; });
        type = type || 'table'; // Last ditch, even though 'table' doesn't work anyways.
        defaultTypes[type] = true;

        lcObj._rtm = lcObj.$contents.renderTypeManager({
            defaultTypes: defaultTypes,
            view: ds,
            width: lcObj._properties.width,
            height: lcObj._properties.height,
            map: { interactToScroll: true }
        });
    };

    if (!lcObj._updateDataSource(null, renderViz)) { renderViz(); };
};

})(jQuery);
