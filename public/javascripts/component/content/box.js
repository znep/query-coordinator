$.component.Container.extend('Box', 'content', {
    _getContainer: function() {
        var ct = $.tag({tagName: 'div', 'class': 'component-Box-container'});
        this.$contents.append(ct);
        return ct;
    }
});
