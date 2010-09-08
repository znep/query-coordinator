(function(){

Dataset.modules['form'] =
{
    _checkValidity: function()
    {
        return _.any(this.visibleColumns, function(c)
            { return !_.include(['tag', 'nested_table'], c.dataTypeName); });
    }
};

})();
