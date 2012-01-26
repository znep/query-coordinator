$.component.Component.extend('Placeholder', {
    _persist: false,

    _render: function() {
        this._super();
        this.$contents.append(this.$insides);
    },

    become: function(component) {
        this._initInsides();
        this.$insides.html(
            component.$dom
                .clone()
                .find('*')
                .removeAttr('id')
                .end()
        );
    },

    _initInsides: function() {
        if (!this.$insides)
            this.$insides = $('<div class="insides"></div>');
    }
});
