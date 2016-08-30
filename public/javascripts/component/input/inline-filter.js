(function($) {
$.component.Component.extend('Inline filter', 'input', {
    _needsOwnContext: true,

    _getAssets: function()
    {
        return {
            javascripts: [{assets: 'awesomecomplete'}, {assets: 'columnizer'}, {assets: 'base-control'},
                {assets: 'shared-editors'}, {assets: 'unified-filter'}],
            stylesheets: [{assets: 'base-control'}, {sheet: '/webfonts/ss-standard.css', hasFonts: true}],
            templates: ['grid_sidebar', 'unified_filter'],
            translations: ['controls.filter'] };
    },

    configurationSchema: function()
    {
        var dsList = this._getDatasetListFromContext(this._dataContext);
        var retVal = {schema: [{ fields: [$.cf.contextPicker()] }], view: _.first(dsList)};
        return retVal;
    },

    _initDom: function()
    {
        this._super.apply(this, arguments);
        this.$dom.attr('aria-live', 'polite');
    },

    _render: function()
    {
        if (!this._super.apply(this, arguments)) { return false; }

        if (!this._updateDataSource(this._properties, renderUpdate))
        { renderUpdate(); }
        return true;
    },

    _propWrite: function(properties)
    {
        this._super.apply(this, arguments);

        this._updateDataSource(properties, renderUpdate);
    },

    _hidden: function()
    {
        this._super.apply(this, arguments);
        renderUpdate.apply(this);
    },

    _shown: function()
    {
        this._super.apply(this, arguments);
        renderUpdate.apply(this);
    }
});

var renderUpdate = function()
{
    if (this._isHidden)
    {
        if (!$.isBlank(this._uf))
        { this._uf.setView(null); }
        return;
    }

    // We don't support mixed data context types, so check the first one to decide what to do
    var dcList = $.makeArray(this._dataContext);
    if (dcList.length < 1) { return; }

    var opts = {};
    var cf = this._stringSubstitute(this._properties.columnFilter);
    var hideBase = _.isUndefined(this._properties.hideBase) ? true : this._properties.hideBase;
    var addCondition = function(tcIds)
    {
        if ($.isBlank(opts.rootCondition))
        {
            opts.rootCondition = {
                type: 'operator',
                value: 'AND',
                children: [],
                metadata: {
                    advanced: false,
                    hideBase: hideBase,
                    unifiedVersion: 2
                }
            };
        }
        opts.rootCondition.children.push({
            type: 'operator',
            value: 'OR',
            metadata: $.extend({operator: 'EQUALS'}, cf, { tableColumnId: tcIds })
        });
        opts.minimalDisplay = true;
    };

    var firstDC = _.first(dcList);
    if (firstDC.type == 'column')
    {
        opts.datasets = [];
        _.each(dcList, function(dc)
        {
            if (dc.type != 'column') { return; }
            opts.datasets.push(dc.column.view);
            var tcIds = {};
            tcIds[dc.column.view.publicationGroup] = dc.column.tableColumnId;
            addCondition(tcIds);
        });
    }

    else if (firstDC.type == 'dataset' || firstDC.type == 'datasetList')
    {
        opts.datasets = this._getDatasetListFromContext(dcList);

        if (!$.isBlank(cf))
        {
            var tcIds = {};
            opts.datasets = _.select(opts.datasets, function(ds)
            {
                var c = ds.columnForIdentifier(cf.column);
                if (!$.isBlank(c))
                { tcIds[ds.publicationGroup] = c.tableColumnId; }
                return !$.isBlank(c);
            });

            addCondition(tcIds);
        }
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
        this._uf = this.$contents.pane_unifiedFilter(opts);
        this._uf.render();
    }
    this._updateValidity();
};
})(jQuery);
