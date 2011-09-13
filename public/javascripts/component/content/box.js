$.component.Container.extend('Box', 'content', {
    _getContainer: function() {
        var ct = document.createElement('div');
        ct.className = 'component-Box-container';
        this.dom.appendChild(ct);
        return ct;
    }
});
