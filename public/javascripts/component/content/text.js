$.component.Component.extend('Text', 'content', {
    _render: function() {
        this._super();
        if (this.html)
            $(this.dom).append(this._template(this.html));
    },

    _propRead: function() {
        var result = this._super();
        result.html = this.html;
        return result;
    }
});
