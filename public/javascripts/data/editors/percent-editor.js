(function($)
{
    $.blistEditor.percent = function(options, dom)
    {
        this.settings = $.extend({}, $.blistEditor.percent.defaults, options);
        this.currentDom = dom;
        this.init();
    };


    $.extend($.blistEditor.percent, $.blistEditor.extend(
    {
        prototype:
        {
            currentValue: function()
            {
                var newVal = this.textValue();
                var adjVal = newVal && newVal.charAt(newVal.length - 1) == '%' ?
                    newVal.slice(0, newVal.length - 1) : newVal;
                return adjVal == parseFloat(adjVal) ? parseFloat(adjVal) : newVal;
            }
        }
    }, $.blistEditor.number));

    $.blistEditor.addEditor($.blistEditor.percent, 'percent');

})(jQuery);
