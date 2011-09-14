;(function($) {
     $.Control.extend('pane_propertiesEditor', {
        isAvailable: function()
        { return !$.isBlank(this.component); },

        getSections: function()
        {
            return [
                { title: 'Edit ' + (this._component || {}).catalogName, fields: [
                ] }
            ];
        },

        setComponent: function(newComp)
        {
            this.component = newComp;
            this.reset();
            this.render();
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
            if (!$.isBlank(this.component))
            { this.component.properties(this._getInputValue($field)); }
        }
     }, {name: 'propertiesEditor'}, 'controlPane');
})(jQuery);
