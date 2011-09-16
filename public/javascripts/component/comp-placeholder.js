$.component.Component.extend('Placeholder', {
    _render: function() {
        this._super();
        var $dom = $(this.dom);
        var $insides = $('<div class="insides"></div>');
        $dom.append($insides);
        if (this.height)
            $dom.css('height', this.height);
    }
});
