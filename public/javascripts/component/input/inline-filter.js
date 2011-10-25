$.component.Component.extend('Inline filter', 'input', {
    _init: function()
    {
        this._needsOwnContext = true;
        this._super.apply(this, arguments);
    },

    _getAssets: function()
    {
        return {
            javascripts: [{assets: 'base-control'}, {assets: 'shared-editors'}, {assets: 'unified-filter'}],
            stylesheets: [{assets: 'base-control'}],
            templates: ['grid_sidebar', 'unified_filter']};
    },

    configurationSchema: function()
    {
        var retVal = {schema: [{ fields: [$.cf.contextPicker()] }], view: (this._dataContext || {}).view};
        return retVal;
    },

    _render: function()
    {
        this._super.apply(this, arguments);

        this._updateDataSource(this._properties, renderUpdate);
    },

    _propWrite: function(properties)
    {
        this._super.apply(this, arguments);

        this._updateDataSource(properties, renderUpdate);
    }
});

var renderUpdate = function()
{
    if (!$.isBlank(this._uf))
    { this._uf.setView(this._dataContext.view); }
    else
    {
        this._uf = this.$contents.pane_unifiedFilter({ view: this._dataContext.view }).render();
        this._updateValidity();
    }
};
