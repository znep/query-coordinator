(function(){

Dataset.modules['form'] =
{
    supportsSnapshotting: function()
    {
        return true;
    },

    _setupSnapshotting: function()
    {
        // The form is rendered by rails, we're ready already
        var that = this;
        _.defer(function()
        { that.takeSnapshot(); });
    },

    _checkValidity: function()
    {
        // summary view gives us no columns; validity is irrelevant in that case anyway.
        this.visibleColumns = this.visibleColumns || [];

        return _.any(this.visibleColumns, function(c) { return 'nested_table' != c.dataTypeName; });
    }
};

})();
