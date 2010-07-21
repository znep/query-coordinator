(function($)
{
    $.blistEditor.number = function(options, dom)
    {
        this.settings = $.extend({}, $.blistEditor.number.defaults, options);
        this.currentDom = dom;
        this.init();
    };


    $.extend($.blistEditor.number, $.blistEditor.extend(
    {
        prototype:
        {
            isValid: function()
            {
                var curVal = this.currentValue();
                return curVal === null || curVal == parseFloat(curVal);
            }
        }
    }, $.blistEditor.text));

    $.blistEditor.addEditor($.blistEditor.number, 'number');

})(jQuery);
