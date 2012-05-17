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
        var dsList = getDatasetList(this);
        var retVal = {schema: [{ fields: [$.cf.contextPicker()] }], view: _.first(dsList)};
        return retVal;
    },

    _render: function()
    {
        if (!this._super.apply(this, arguments)) { return false; }

        if (!this._updateDataSource(this._properties, renderUpdate))
        { this.$contents.empty(); }
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
    var opts = {datasets: getDatasetList(this)};

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

    if (!$.isBlank(this._uf))
    {
        this._uf.setView(opts.view);
        // TODO: update other options
    }
    else
    {
        this.$contents.empty();
        this._uf = this.$contents.pane_unifiedFilter(opts).render();
    }
    this._updateValidity();
};

var getDatasetList = function(cObj)
{
    var datasets = [];
    _.each($.makeArray(cObj._dataContext), function(dc)
    {
        switch (dc.type)
        {
            case 'dataset':
                datasets.push(dc.dataset);
                break;
            case 'datasetList':
                datasets = datasets.concat(_.pluck(dc.datasetList, 'dataset'));
                break;
        }
    });
    return datasets;
};
