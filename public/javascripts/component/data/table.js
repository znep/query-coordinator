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
            stylesheets: [{assets: 'grid'}],
            translations: ['controls.grid']
        };
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

        updateProperties(lcObj, properties);
    }
});

var updateProperties = function(lcObj, properties)
{
    lcObj._updateDataSource(properties, function()
        {
            if ($.isBlank(this.$contents)) { return; }
            if (!$.isBlank(this._table))
            { this._table.setView(this._dataContext.dataset); }
            else
            {
                this._table = this.$contents.datasetGrid({view: this._dataContext.dataset,
                    columnHideEnabled: false,
                    columnPropertiesEnabled: false,
                    editEnabled: false
                });
                this._updateValidity();
            }
        });
};

})(jQuery);
