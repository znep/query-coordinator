;(function() {

$.component.Component.extend('Table', 'data', {
    _init: function()
    {
        this._needsOwnContext = true;
        this._super.apply(this, arguments);
    },

    isValid: function()
    {
        return $.isBlank(this._table) ? false : this._table.isValid();
    },

    configurationSchema: function()
    {
        // TODO: more config
        return {schema: [{ fields: [$.cf.contextPicker()] }], view: (this._dataContext || {}).view};
    },

    _getAssets: function()
    {
        return {
            javascripts: [{ assets: 'shared-table-render' }],
            stylesheets: [{assets: 'grid'}]
        };
    },

    _render: function()
    {
        var lcObj = this;
        if (!_.isNumber(lcObj._properties.height))
        { lcObj._properties.height = 300; }
        lcObj._super.apply(lcObj, arguments);

        updateProperties(lcObj, lcObj._properties);
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
            if (!$.isBlank(this._table))
            { this._table.setView(this._dataContext.view); }
            else
            {
                this._table = this.$contents.datasetGrid({view: this._dataContext.view,
                    columnHideEnabled: false,
                    columnPropertiesEnabled: false,
                    editEnabled: false
                });
                this._updateValidity();
            }
        });
};

})(jQuery);
