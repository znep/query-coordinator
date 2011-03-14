(function($)
{
    $.blistEditor.money = function(options, dom)
    {
        this.settings = $.extend({}, $.blistEditor.money.defaults, options);
        this.currentDom = dom;
        this.init();
    };


    $.extend($.blistEditor.money, $.blistEditor.extend(
    {
        prototype:
        {
            currentValue: function()
            {
                var newVal = this.textValue();
                var adjVal = newVal && newVal.charAt(0) == '$' ?
                    newVal.slice(1) : newVal;
                adjVal = blist.util.parseHumaneNumber(adjVal);
                return adjVal == parseFloat(adjVal) ? parseFloat(adjVal) : newVal;
            }
        }
    }, $.blistEditor.number));

    $.blistEditor.addEditor($.blistEditor.money, 'money');

})(jQuery);
