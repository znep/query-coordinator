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
                    var align = this.column.alignment ?
                        ' align-' + this.column.alignment : '';
                    this._$editor = $('<div class="blist-table-editor blist-td' +
                        ' type-' + this.column.type +
                        '"><input type="text" class="' + align +  '" value="' +
                        this.originalTextValue() + '" /></div>');
                }
                return this._$editor;
            },

            originalTextValue: function()
            {
                return this.originalValue || '';
            },

            editorInserted: function()
            {
                this.textValidationHookup();
            },

            textValidationHookup: function()
            {
                var editObj = this;
                editObj.$dom().find(':input').keypress(function(e)
                    { setTimeout(function() { editObj.textModified(); }, 0); });
            },

            adjustSize: function()
            {
                if (typeof this.originalValue == 'string')
                {
                    this.$editor().css('min-width', this.originalValue
                        .visualLength(this.$editor().css('font-size')) + 1);
                }
            },

            textValue: function()
            {
                var newVal = this.$editor().find(':text').val();
                return newVal === '' ? null : newVal;
            },

            currentValue: function()
            { return this.textValue(); },

            focus: function()
            {
                this.$editor().find(':text').focus().select();
            },

            textModified: function()
            {
                if (this.isValid()) { this.$dom().removeClass('invalid'); }
                else { this.$dom().addClass('invalid'); }
            }
        }
    }));

})(jQuery);
