(function(){

Dataset.modules['calendar'] =
{
    _checkValidity: function()
    {
        var startCol = this.columnForTCID(this.displayFormat.startDateTableId);
        var titleCol = this.columnForTCID(this.displayFormat.titleTableId);

        return !$.isBlank(startCol) && !$.isBlank(titleCol);
    },

    _convertLegacy: function()
    {
        var view = this;
        _.each(['startDate', 'endDate', 'title', 'description'], function(n)
        {
            if ($.isBlank(view.displayFormat[n + 'TableId']) &&
                !$.isBlank(view.displayFormat[n + 'Id']))
            {
                var c = view.columnForID(view.displayFormat[n + 'Id']);
                if (!$.isBlank(c))
                { view.displayFormat[n + 'TableId'] = c.tableColumnId; }
            }
        });
    }
};

})();
