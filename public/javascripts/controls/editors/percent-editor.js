(function($)
{
    $.blistEditor.percent = $.blistEditor.extend({
        currentValue: function()
        {
            var newVal = this.textValue();
            var adjVal = newVal && newVal.charAt(newVal.length - 1) == '%' ?
                newVal.slice(0, newVal.length - 1) : newVal;
            return adjVal == parseFloat(adjVal) ? parseFloat(adjVal) : newVal;
        }
    }, $.blistEditor.number);

    $.blistEditor.addEditor($.blistEditor.percent, 'percent');

})(jQuery);
