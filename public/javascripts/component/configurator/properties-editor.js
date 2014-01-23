;(function($) {

    /* STAT-555: When selecting a dataset, we receive two properties actions.
       In order to make undoing and redoing this action singular, we use a transaction.
       #_changeHandler triggers first, sets { contextId: 4x4 }, and begins the transactions.
       #render triggers second, sets defaults, and ends the transaction.

       If _getFormValues returns with an empty object, it's a no-op.
       If the properties action changes nothing, it's a no-op.
       Start a transaction whenever you add a component.
         This makes it possible to roll-up any further actions into a single undo.
       If the properties are set, end the transaction.
         (This is the case when components set initial values.)
       If there is no configuration, end the transaction.
         (Print and Share components are like this.)
       If _noTransactionForUndo is set, end the transaction.
         (This is the case where there is only a context picker.)
    */

    $.Control.extend('pane_propertiesEditor', {
        getTitle: function()
        { return $.t('dataslate.edit_component.title'); },

        getSubtitle: function()
        { return $.t('dataslate.edit_component.subtitle'); },

        isAvailable: function()
        { return !$.isBlank(this.component); },

        setComponent: function(newComp)
        {
            this.component = newComp;
            this.reset();
        },

        render: function()
        {
            this._super.apply(this, arguments);

            var peObj = this;
            _.defer(function()
            {
                var properties = peObj._getFormValues(true);
                if (!$.isBlank(peObj.component))
                {
                    if (!_.isEmpty(properties))
                    {
                        $.cf.edit.execute('properties',
                            { component: peObj.component, properties: properties });
                        // We commit everything in order to sweep up the transaction from edit-add.
                        $.cf.edit.commit();
                    }

                    // properties will be empty if there's nothing to configure
                    if (peObj.component.configurationSchema() === null)
                    { $.cf.edit.commit(); }

                    if (peObj.component._noTransactionForUndo)
                    { $.cf.edit.commit(); }
                }
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
                        value: $.t('dataslate.edit_component.no_config', { component: this.component.catalogName }) } ] }
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
                    if (_.isEqual(_.keys(props), ['contextId']))
                    { $.cf.edit.beginTransaction(); }

                    $.cf.edit.execute('properties',
                            {component: this.component, properties: props});
                }
            }
        }
     }, {name: 'propertiesEditor'}, 'controlPane');

    $.gridSidebar.registerConfig('configuration.propertiesEditor', 'pane_propertiesEditor', 2);
})(jQuery);
