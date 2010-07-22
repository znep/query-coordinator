(function($)
{
    $.blistEditor.flag = function(options, dom)
    {
        this.settings = $.extend({}, $.blistEditor.flag.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    var flagValues = [
        { id: 'null', label: '(Blank)'},
        { id: 'red', label: 'Red'},
        { id: 'blue', label: 'Blue'},
        { id: 'green', label: 'Green'},
        { id: 'yellow', label: 'Yellow'},
        { id: 'orange', label: 'Orange'},
        { id: 'purple', label: 'Purple'}
    ];

    var renderFlagValue = function(value)
    {
        var $row = $(this);
        var $span_icon = $('<span class="icon"></span>');
        var $span_label = $('<span class="label"></span>').html(value.label);
        $row.addClass(value.id).empty().append($span_icon).append($span_label);
    };

    $.extend($.blistEditor.flag, $.blistEditor.extend(
    {
        prototype:
        {
            $editor: function()
            {
                if (!this._$editor)
                {
                    this._$editor = $('<div class="blist-table-editor">' +
                        '<div class="flag-combo"></div></div>');
                }
                return this._$editor;
            },

            editorInserted: function()
            {
                this.flattenValue();
                this.setFullSize();
                this.$dom().addClass('blist-combo-wrapper')
                    .addClass('combo-container');
                this.$editor().find('.flag-combo').combo({
                    ddClass: 'table-editor-combo',
                    name: 'flag-combo',
                    values: flagValues,
                    value: this.originalValue || 'null',
                    renderFn: renderFlagValue,
                    adjustDropdownLayout: this.inContainer() ? function(layout) {
                        // Move dropdown
                        layout.top += 5;

                        // Compensate for cell borders
                        layout.left -= 2;
                        layout.width += 4;
                    } : null
                });
            },

            currentValue: function()
            {
                var val = this.$editor().find('.flag-combo').value();
                return val === 'null' ? null : val;
            },

            focus: function()
            {
                this.$dom().find('.flag-combo').focus();
            },

            isValid: function()
            {
                var curVal = this.currentValue();
                if (curVal === null) { return true; }

                var found = false;
                $.each(flagValues, function(i, v)
                        { if (v.id == curVal) { found = true; return false; } });
                return found;
            }
        }
    }));

    $.blistEditor.addEditor($.blistEditor.flag, 'flag');

})(jQuery);
