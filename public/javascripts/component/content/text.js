$.component.Component.extend('Text', 'content', {
    _render: function() {
        this._super();
        if (this.html)
            $(this.dom).append(this.html);
    }
});
