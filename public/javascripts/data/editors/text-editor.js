(function($)
{
    $.blistEditor.text = function(options, dom)
    {
        this.settings = $.extend({}, $.blistEditor.text.defaults, options);
        this.currentDom = dom;
        this.init();
    };


    $.extend($.blistEditor.text, $.blistEditor.extend(
    {
        prototype:
        {
            $editor: function()
            {
                if (!this._$editor)
                {
                    this._$editor = $('<div class="blist-table-editor blist-td">' +
                        '<input type="text" value="' +
                        (this.originalValue ? this.originalValue : '') +
                        '" /></div>');
                }
                return this._$editor;
            },

            adjustSize: function()
            {
                if (this.originalValue)
                {
                    this.$editor().css('min-width', this.originalValue
                        .visualLength(this.$editor().css('font-size')) + 1);
                }
            },

            currentValue: function()
            {
                var newVal = this.$editor().find(':text').val();
                return newVal === '' ? null : newVal;
            },

            focus: function()
            {
                this.$editor().find(':text').focus();
            }
        }
    }));

})(jQuery);
