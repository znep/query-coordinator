(function($)
{
    $.blistEditor.addEditor('percent', {
        currentValue: function()
        {
            var newVal = this.textValue();
            var adjVal = newVal && newVal.charAt(newVal.length - 1) == '%' ?
                newVal.slice(0, newVal.length - 1) : newVal;
            return adjVal == parseFloat(adjVal) ? parseFloat(adjVal) : newVal;
        }
    }, 'number');

})(jQuery);
