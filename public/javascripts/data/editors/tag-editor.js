(function($)
{
    $.blistEditor.tag = function(options, dom)
    {
        this.settings = $.extend({}, $.blistEditor.tag.defaults, options);
        this.currentDom = dom;
        this.init();
    };


    $.extend($.blistEditor.tag, $.blistEditor.extend(
    {
        prototype:
        {
            originalTextValue: function()
            {
                return this.originalValue ? this.originalValue.join(', ') : '';
            },

            currentValue: function()
            {
                var textVal = this.textValue();
                if (!textVal) { return []; }

                return $.map(textVal.split(','),
                    function(t, i) { return $.trim(t); });
            }
        }
    }, $.blistEditor.text));

    $.blistEditor.addEditor($.blistEditor.tag, 'tag');

})(jQuery);
