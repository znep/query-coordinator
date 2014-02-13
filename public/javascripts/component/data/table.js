;(function() {

$.component.Component.extend('Table', 'data', {
    _init: function()
    {
        this._needsOwnContext = true;
        this._delayUntilVisible = true;
        this._super.apply(this, arguments);
        this.registerEvent({display_row: ['dataContext', 'row']});
    },

    isValid: function()
    {
        return $.isBlank(this._table) ? false : this._table.isValid();
    },

    configurationSchema: function()
    {
        // TODO: more config
        return {schema: [{ fields: [$.cf.contextPicker()] }], view: (this._dataContext || {}).dataset};
    },

    _initDom: function()
    {
        var lcObj = this;
        lcObj._super.apply(lcObj, arguments);

        lcObj.$contents.off('.table_' + lcObj.id);
        lcObj.$contents.on('display_row.table_' + lcObj.id, function(e, args)
        {
            lcObj.trigger('display_row',
                [{dataContext: lcObj._dataContext, row: (args || {}).row}]);
        });
    },

    _getAssets: function()
    {
        return {
            javascripts: [{ assets: 'shared-table-render' }],
            stylesheets: [{assets: 'grid'}, { assets: 'render-images-bundle', hasImages: true }],
            translations: ['controls.grid']
        };
    },

    _stylesLoaded: function()
    {
        this._super.apply(this, arguments);
        if (!$.isBlank(this.$contents))
        { this.$contents.trigger('show'); }
    },

    _shown: function()
    {
        this._super();
        if (!$.isBlank(this.$contents))
        { this.$contents.trigger('show'); }
    },

    _hidden: function()
    {
        this._super();
        if (!$.isBlank(this.$contents))
        { this.$contents.trigger('hide'); }
    },

    _arrange: function()
    {
        this._super.apply(this, arguments);
        if (!$.isBlank(this.$contents))
        { this.$contents.trigger('resize'); }
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

var updateProperties = function(lcObj, properties)
{
    var setUpTable = function()
    {
        if ($.isBlank(lcObj.$contents) || $.isBlank(lcObj._dataContext)) { return; }
        if (!$.isBlank(lcObj._table))
        { lcObj._table.setView(lcObj._dataContext.dataset); }
        else
        {
            lcObj._table = lcObj.$contents.datasetGrid({view: lcObj._dataContext.dataset,
                columnHideEnabled: false,
                columnPropertiesEnabled: false,
                editEnabled: false,
                manualResize: true
            });
            lcObj._updateValidity();
        }
    };

    if (!lcObj._updateDataSource(properties, setUpTable))
    { setUpTable(); }
};

})(jQuery);
