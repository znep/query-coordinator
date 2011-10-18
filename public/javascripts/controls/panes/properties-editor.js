;(function($) {
    $.Control.extend('pane_propertiesEditor', {
        getTitle: function()
        { return 'Edit Component'; },

        isAvailable: function()
        { return !$.isBlank(this.component); },

        setComponent: function(newComp)
        {
            this.component = newComp;
            this.reset();
            this.render();
        },

        render: function()
        {
            this._super.apply(this, arguments);

            var peObj = this;
            _.defer(function()
            {
                if (!$.isBlank(peObj.component))
                { peObj.component.properties(peObj._getFormValues()); }
            });
        },

        _getCurrentData: function()
        {
            return $.isBlank(this.component) ? null : this.component.properties();
        },

        _getSections: function()
        {
            var config = this.component.configurationSchema();
            if (_.isArray(config)) { config.schema = config; }
            if (!$.subKeyDefined(config, 'schema'))
            {
                return [
                    { fields: [ {type: 'note',
                        value: 'No configuration available for ' + this.component.catalogName} ] }
                ];
            }

            this.setView(config.view);
            return config.schema;
        },

        _changeHandler: function($field, event)
        {
            if (!$.isBlank(this.component) && this._isValid($field))
            {
                $.cf.edit.execute('properties',
                        {componentID: this.component.properties().id,
                            properties: this._getInputValue($field)});
            }
        }
     }, {name: 'propertiesEditor'}, 'controlPane');
})(jQuery);
