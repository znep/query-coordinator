$.component.Component.extend('Placeholder', {
    _persist: false,

    _render: function() {
        this._super();
        var $insides = $('<div class="insides"></div>');
        this.$contents.append($insides);
    }
});
