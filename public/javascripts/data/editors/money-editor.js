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
                return adjVal == parseFloat(adjVal) ? adjVal : newVal;
            }
        }
    }, $.blistEditor.number));

})(jQuery);
