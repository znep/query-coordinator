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
                    this.flattenValue();
                    var align = (this.column.format || {}).align ?
                        ' align-' + this.column.format.align : '';
                    this._$editor = $('<div class="blist-table-editor ' +
                        'type-' + this.column.renderTypeName + align + '">' +
                        '<input type="checkbox"' +
                        (this.originalValue && this.originalValue != '0' ?
                            ' checked="checked"' : '') +
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
                        { if (e.keyCode == 32) { e.stopPropagation(); } })
                    .click(function() { editObj.changed(); });
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

    $.blistEditor.addEditor($.blistEditor.checkbox, 'checkbox');

})(jQuery);
