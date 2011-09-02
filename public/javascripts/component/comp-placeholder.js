$.component.Component.extend('Placeholder', {
    render: function() {
        this._super();
        var $dom = $(this.dom);
        $dom.addClass('socrata-placeholder');
        if (this.height)
            $dom.css('height', this.height);
    }
});
