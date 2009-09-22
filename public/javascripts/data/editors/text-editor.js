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
                    this._$editor = $('<div class="blist-table-editor' +
                        ' type-' + this.column.type +
                        '"><input type="text" class="' + align +  '" value="' +
                        this.originalTextValue() + '" /></div>');
                }
                return this._$editor;
            },

            getSizeElement: function()
            {
                return this.$editor()[0].childNodes[0];
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

            querySize: function()
            {
                // Compute visual width of text
                var width = ((this.originalValue || '') + '').visualLength(this.$editor().css('font-size'));

                // Adjust width for cursor slop
                // XXX - I don't know why this is nessary.  On FF w/out this the cursor disappears at the end of the
                // line.  Maybe only necessary on FF?
                width += 2;

                return { width: width };
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
