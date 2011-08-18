(function($)
{
    $.blistEditor.tag = $.blistEditor.extend({
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
    }, $.blistEditor.text);

    $.blistEditor.addEditor($.blistEditor.tag, 'tag');

})(jQuery);
