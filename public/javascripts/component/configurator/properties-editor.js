;(function($) {
    $.Control.extend('pane_propertiesEditor', {
        getTitle: function()
        { return 'Edit Component'; },

        getSubtitle: function()
        { return 'Configure this component'; },

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
                { peObj.component.properties(peObj._getFormValues(true)); }
            });
        },

        _getCurrentData: function()
        {
            return $.isBlank(this.component) ? null : this.component.properties();
        },

        _getSections: function()
        {
            var config = this.component.configurationSchema();
            if (config === false)
            {
                this._startProcessing();
                return;
            }
            this._finishProcessing();
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
            if (!this._isDirty && !$.isBlank(this.component) && this._isValid($field))
            {
                var props = this._getInputValue($field);
                if (!_.isEmpty(props))
                {
                    $.cf.edit.execute('properties',
                            {component: this.component, properties: props});
                }
            }
        }
     }, {name: 'propertiesEditor'}, 'controlPane');

    $.gridSidebar.registerConfig('configuration.propertiesEditor', 'pane_propertiesEditor', 2);
})(jQuery);
