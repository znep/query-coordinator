(function($)
{
    $.blistEditor.addEditor('number', {
        editorAdded: function()
        {
            // attach maskedinput plugin if relevant
            if (this._$editor && _.isString(this.format.mask))
            {
                this._$editor.find('input').mask(this.format.mask);
            }

            this._super.apply(this, arguments);
        },

        originalTextValue: function()
        {
            var v = this._super.apply(this, arguments).toString();
            if (!$.isBlank(this.format.decimalSeparator) && this.format.decimalSeparator != '.')
            { v = v.replace('.', this.format.decimalSeparator); }
            return v;
        },

        textValue: function()
        {
            var v = this._super.apply(this, arguments);
            if (!$.isBlank(v) && !$.isBlank(this.format.decimalSeparator) &&
                    this.format.decimalSeparator != '.')
            {
                v = v.replace(/\./g, '');
                v = v.replace(this.format.decimalSeparator, '.');
            }
            return v;
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
    }, 'text');

})(jQuery);
