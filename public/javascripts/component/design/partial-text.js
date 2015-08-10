/**
 * This is a visual representation of the StringResolver functional
 * component. The logic is separated so that one can resolve strings
 * without any DOM interaction.
 */
$.component.Component.extend('PartialText', 'design', {
    _init: function(properties)
    {
        var cObj = this;
        cObj._super.apply(this, arguments);

        if (!this._properties.template)
            throw new Error('Partial text needs a template to be used');

        cObj._resolver = new $.component.StringResolver($.extend({},
            cObj._properties, {id: '__' + cObj.id}), cObj._componentSet);

        cObj._resolver.bind('child_updated', function(args) {
            cObj._render();
        });
    },

    _initDom: function()
    {
        this._super.apply(this, arguments);
        if (!this.$p)
        {
            this.$contents.empty().append($.tag({tagName: 'p'}));
            this.$p = this.$contents.find('p');
        }
    },

    _render: function() {
        var cObj = this;
        if (!cObj._super.apply(cObj, arguments)) { return false; }

        cObj.$p.text(cObj._resolver.asString());
    },

    _propWrite: function(properties)
    {
        this._super(properties);
        if (!_.isEmpty(properties))
        {
            this._render();
        }
    },

    asString: function() {
        return this._resolver.asString();
    },

    edit: function(editable) {
        var cObj = this;
        if (!cObj._super.apply(cObj, arguments) ||
             cObj._properties.editable === false)
        { return false; }

        // TODO: Switch back and forth for edit mode

        var editableSections = _.filter(cObj._properties.template, function(s) {
            return s.editable;
        });

        if (_.isEmpty(editableSections)) { return false; }
    }
});
