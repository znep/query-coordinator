(function($)
{

    $.blistEditor.number = $.blistEditor.extend({
        _init: function()
        {
            // attach maskedinput plugin if relevant
            if (this._$editor && _.isString(this.format.mask))
            {
                this._$editor.find('input').mask(this.format.mask);
            }

            this._super.apply(this, arguments);
        },

        numberTextValue: function()
        {
            // get our value from the mask plugin if necessary
            // (need to demask it)
            if (this._$editor && _.isString(this.format.mask))
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
        }
    }, $.blistEditor.text);

    $.blistEditor.addEditor($.blistEditor.number, 'number');

})(jQuery);
