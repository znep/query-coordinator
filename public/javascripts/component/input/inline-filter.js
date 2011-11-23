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
        var retVal = {schema: [{ fields: [$.cf.contextPicker()] }], view: (this._dataContext || {}).dataset};
        return retVal;
    },

    _render: function()
    {
        if (!this._super.apply(this, arguments)) { return false; }

        this._updateDataSource(this._properties, renderUpdate);
        return true;
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
    { this._uf.setView(this._dataContext.dataset); }
    else
    {
        var rc;
        var minimal = false;
        if (!$.isBlank(this._properties.columnFilter))
        {
            var cf = this._template(this._properties.columnFilter);
            var tcIds = {};
            var c = this._dataContext.dataset.columnForIdentifier(cf.column);
            if (!$.isBlank(c))
            { tcIds[this._dataContext.dataset.publicationGroup] = c.tableColumnId; }
            rc = {
                type: 'operator',
                value: 'AND',
                children: [{
                    type: 'operator',
                    value: 'OR',
                    metadata: $.extend({operator: 'EQUALS'}, cf, { tableColumnId: tcIds })
                }],
                metadata: {
                    advanced: false,
                    unifiedVersion: 2
                }
            };
            minimal = true;
        }

        this._uf = this.$contents.pane_unifiedFilter({ view: this._dataContext.dataset,
            rootCondition: rc, minimalDisplay: minimal }).render();
        this._updateValidity();
    }
};
