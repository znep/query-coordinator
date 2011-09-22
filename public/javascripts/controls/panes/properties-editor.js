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

            if (!$.isBlank(this.component))
            {
                if (this._validator.form())
                { this.component.properties(this._getFormValues()); }
                else
                { this._validator.resetForm(); }
            }
        },

        _getCurrentData: function()
        {
            return $.isBlank(this.component) ? null : this.component.properties();
        },

        _getSections: function()
        {
            var config = this.component.configurationSchema();
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
            if (!$.isBlank(this.component) && $field.valid())
            {
                $.cf.edit.execute('properties',
                        {componentID: this.component.properties().id,
                            properties: this._getInputValue($field)});
            }
        }
     }, {name: 'propertiesEditor'}, 'controlPane');
})(jQuery);
