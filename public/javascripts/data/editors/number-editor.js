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
                var curVal = this.textValue();
                return curVal === null || curVal == parseFloat(curVal);
            },

            currentValue: function()
            { return this.isValid() ? parseFloat(this.textValue()) : null; }
        }
    }, $.blistEditor.text));

    $.blistEditor.addEditor($.blistEditor.number, 'number');

})(jQuery);
