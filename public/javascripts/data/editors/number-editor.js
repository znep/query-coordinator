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
            numberTextValue: function()
            {
                var format = this.column.format || {};

                // get our value from the mask plugin if necessary
                // (need to demask it)
                if (this._$editor && _.isString(format.mask))
                {
                    var $input = this._$editor.find('input');

                    // need to check if we've yet masked; plugin freaks out if not
                    if (_.isUndefined($input.data($.mask.dataName)))
                        return this.textValue();
                    else
                        return $input.mask();
                }
                else
                {
                    return this.textValue();
                }
            },

            isValid: function()
            {
                var curVal = this.numberTextValue();
                return curVal === null || curVal == parseFloat(curVal);
            },

            currentValue: function()
            {
                var curVal = this.numberTextValue();
                return curVal == parseFloat(curVal) ? parseFloat(curVal) : curVal;
            },

            editorInserted: function()
            {
                var format = this.column.format || {};
                // attach maskedinput plugin if relevant
                if (this._$editor && _.isString(format.mask))
                {
                    this._$editor.find('input').mask(format.mask,
                        { placeholder: ' ' });
                }

                // super():
                this.textValidationHookup();
            }
        }
    }, $.blistEditor.text));

    $.blistEditor.addEditor($.blistEditor.number, 'number');

})(jQuery);
