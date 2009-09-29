(function($)
{
    $.blistEditor.date = function(options, dom)
    {
        this.settings = $.extend({}, $.blistEditor.date.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    $.extend($.blistEditor.date, $.blistEditor.extend(
    {
        prototype:
        {
            originalTextValue: function()
            {
                var formatName = this.column.format || 'date_time';
                this._format = blist.data.types.date.formats[this.column.format] ||
                    blist.data.types.date.formats['date_time'];
                if (typeof this.originalValue == 'number')
                {
                    this._origDate = new Date(this.originalValue * 1000);
                    return this._origDate.format(this._format);
                }
                else
                {
                    return this.originalValue || '';
                }
            },

            editorInserted: function()
            {
                var editObj = this;
                editObj.textValidationHookup();
                var curDate = editObj._origDate || new Date();
                editObj.$dom().find(':input').DatePicker(
                    {current: curDate, date: curDate.format('y-m-d'),
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
                        start: 0, eventName: 'focus'});
            },

            finishEditExtra: function()
            {
                this.$dom().find(':input').DatePickerRemove();
            },

            currentValue: function()
            {
                var t = this.textValue();
                if (t === null) { return null; }

                var d = Date.parse(t);
                return d ? d.valueOf() / 1000 : t;
            },

            isValid: function()
            {
                var t = this.textValue();
                return t === null || Date.parse(t) !== null;
            }
        }
    }, $.blistEditor.text));

})(jQuery);
