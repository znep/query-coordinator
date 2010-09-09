(function(){

Dataset.modules['form'] =
{
    _checkValidity: function()
    {
        // summary view gives us no columns; validity is irrelevant in that case anyway.
        this.visibleColumns = this.visibleColumns || [];

        return _.any(this.visibleColumns, function(c)
            { return !_.include(['tag', 'nested_table'], c.dataTypeName); });
    }
};

})();
