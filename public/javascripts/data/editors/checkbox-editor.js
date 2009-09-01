(function($)
{
    $.blistEditor.checkbox = function(options, dom)
    {
        this.settings = $.extend({}, $.blistEditor.checkbox.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    $.extend($.blistEditor.checkbox, $.blistEditor.extend(
    {
        prototype:
        {
            $editor: function()
            {
                if (!this._$editor)
                {
                    var align = this.column.alignment ?
                        ' align-' + this.column.alignment : '';
                    this._$editor = $('<div class="blist-table-editor blist-td ' +
                        'type-' + this.column.type + align + '">' +
                        '<input type="checkbox"' +
                        (this.originalValue ? ' checked="checked"' : '') +
                        ' /></div>');
                }
                return this._$editor;
            },

            editorInserted: function()
            {
                var editObj = this;
                editObj.$dom().click(function() { editObj.focus(); })
                    .find(':input')
                    .mousedown(function(e) { e.stopPropagation(); })
                    .mouseup(function(e) { e.stopPropagation(); })
                    .keydown(function(e)
                        { if (e.keyCode == 32) { e.stopPropagation(); } })
                    .keypress(function(e)
                        { if (e.keyCode == 32) { e.stopPropagation(); } });
            },

            currentValue: function()
            {
                var val = this.$editor().find(':checkbox').value();
                return val === false ? null : val;
            },

            focus: function()
            {
                this.$dom().find(':checkbox').focus();
            }
        }
    }));

})(jQuery);
