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
            templates: ['grid_sidebar', 'unified_filter'],
            translations: ['controls.filter'] };
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
        var opts = {};
        switch (this._dataContext.type)
        {
            case 'dataset':
                opts.datasets = [ this._dataContext.dataset ];
                break;
            case 'datasetList':
                opts.datasets = _.pluck(this._dataContext.datasetList, 'dataset');
                break;
        }

        if (!$.isBlank(this._properties.columnFilter))
        {
            var cf = this._stringSubstitute(this._properties.columnFilter);
            var tcIds = {};
            opts.datasets = _.select(opts.datasets, function(ds)
            {
                var c = ds.columnForIdentifier(cf.column);
                if (!$.isBlank(c))
                { tcIds[ds.publicationGroup] = c.tableColumnId; }
                return !$.isBlank(c);
            });

            opts.rootCondition = {
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
            opts.minimalDisplay = true;
        }

        if (opts.datasets.length < 1) { return; }
        opts.view = _.first(opts.datasets);

        this._uf = this.$contents.pane_unifiedFilter(opts).render();
        this._updateValidity();
    }
};
