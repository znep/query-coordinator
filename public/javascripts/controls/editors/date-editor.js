(function($)
{
    $.blistEditor.addEditor('date', {
        editorAdded: function()
        {
            this._super.apply(this, arguments);

            var editObj = this;
            editObj.textValidationHookup();
            var curDate = editObj._origDate || new Date();
            editObj.$dom().find(':input').DatePicker(
                {current: curDate, date: curDate.format('y-m-d'),
                    locale: $.DatePickerLocaleOptions,
                    onShow: function(calDom)
                    {
                        $(calDom).mousedown(function(e)
                            { e.stopPropagation(); });
                    },
                    onChange: function(f, newD)
                    {
                        editObj.$dom().find(':input')
                            .val(newD.format(editObj._format));
                        editObj.textModified();
                        editObj.focus();
                    },
                    starts: 0, eventName: 'focus'});
        },

        originalTextValue: function()
        {
            this.flattenValue();
            var formatName = this.format.view || 'date_time';
            this._format = this.type.formats[formatName] ||
                this.type.formats['date_time'];
            if (typeof this.originalValue == 'number')
            {
                this._origDate = new Date(this.originalValue * 1000);
            }
            else if (!$.isBlank(this.originalValue))
            {
                if (!$.isBlank(this.type.stringParse))
                { this._origDate = Date.parseExact(this.originalValue,
                    this.type.stringParse); }
                else { this._origDate = Date.parse(this.originalValue); }
            }

            if (_.isDate(this._origDate))
            { return this._origDate.format(this._format); }
            return this.originalValue || '';
        },

        finishEdit: function()
        {
            this._super();
            this.$dom().find(':input').DatePickerRemove();
        },

        currentValue: function()
        {
            var t = this.textValue();
            if (t === null) { return null; }

            var d = Date.parse(t);
            if (!$.isBlank(d))
            {
                // HACK: We can't parse this directly very easily; so if we
                // have a day-month swapped format, manually flip them
                try
                {
                    if ((this.format.view || '').startsWith('date_dmy') &&
                        !$.isBlank(t.match(/\d{1,2}\/\d{1,2}\//)))
                    { d.set({day: d.getMonth() + 1, month: d.getDate() - 1}); }
                }
                catch (e)
                {}

                if (!$.isBlank(this.type.stringFormat))
                { d = d.toString(this.type.stringFormat); }
                else
                { d = Math.floor(d.valueOf() / 1000); }
            }
            return d || t;
        },

        isValid: function()
        {
            var t = this.textValue();
            return t === null || Date.parse(t) !== null;
        }
    }, 'text');

})(jQuery);
