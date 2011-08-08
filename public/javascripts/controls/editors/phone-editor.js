(function($)
{
    $.blistEditor.phone = function(options, dom)
    {
        this.settings = $.extend({}, $.blistEditor.phone.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    var numberValue = function(editObj)
    {
        var v = editObj.originalValue;
        var ret = v || '';
        if (v instanceof Object) { ret = v[editObj.column.subColumnTypes[0]]; }
        return ret || '';
    };

    var typeValue = function(editObj)
    {
        var v = editObj.originalValue;
        var ret = '';
        if (v instanceof Object) { ret = v[editObj.column.subColumnTypes[1]]; }
        return ret || '';
    };

    var typeValues = [
        { id: 'null', label: '(Blank)'},
        { id: 'Home', label: 'Home'},
        { id: 'Cell', label: 'Cell'},
        { id: 'Work', label: 'Work'},
        { id: 'Fax', label: 'Fax'},
        { id: 'Other', label: 'Other'}
    ];

    var renderTypeValue = function(value)
    {
        var $row = $(this);
        var $span_icon = $('<span class="icon"></span>');
        var $span_label = $('<span class="label"></span>').html(value.label);
        $row.addClass(value.id).empty().append($span_icon).append($span_label);
    };

    $.extend($.blistEditor.phone, $.blistEditor.extend(
    {
        prototype:
        {
            $editor: function()
            {
                if (!this._$editor)
                {
                    var value = $.htmlEscape(this.newValue || numberValue(this));
                    this._$editor = $('<div class="blist-table-editor' +
                        ' type-' + this.column.renderTypeName +
                        '">' +
                        '<input type="text" class="phoneNumber" value="' +
                        value + '" />' +
                        '<div class="blist-combo-wrapper">' +
                        '<div class="type-combo"></div></div></div>');
                }
                return this._$editor;
            },

            editorInserted: function()
            {
                var editObj = this;
                editObj.setFullSize();
                editObj.$dom().addClass('combo-container');
                editObj.$editor().find('.type-combo').combo({
                    ddClass: 'table-editor-combo',
                    name: 'type-combo',
                    values: typeValues,
                    value: typeValue(editObj) || 'null',
                    renderFn: renderTypeValue,
                    adjustDropdownLayout: this.inContainer() ? function(layout) {
                        // Move dropdown
                        layout.top += 4;
                        layout.left -= 2;
                        layout.width += 4;
                    } : null
                });
                editObj.$dom().find(':text.phoneNumber').keydown(function(e)
                    { if (e.keyCode == 9 && !e.shiftKey)
                        { e.stopPropagation(); } });
                editObj.$dom().find('.type-combo').keydown(function(e)
                    { if (e.keyCode == 9 && e.shiftKey)
                        { e.stopPropagation(); } });
            },

            currentNumberValue: function()
            {
                var newNum = this.$editor().find(':text.phoneNumber').val();
                return newNum === '' || newNum === undefined ? null : newNum;
            },

            currentValue: function()
            {
                var newNum = this.currentNumberValue();

                var newType = this.$editor()
                    .find('.type-combo').value();
                newType = newType == 'null' || newType === undefined ?
                    null : newType;
                if (newNum === null && newType === null) { return null; }

                var ret = {};
                ret[this.column.subColumnTypes[0]] = newNum;
                ret[this.column.subColumnTypes[1]] = newType;
                return ret;
            },

            setSize: function(width, height)
            {
                var $outer = this.$dom();
                var $sz = $(this.getSizeElement());
                var outerWidth = width + ($outer.width() - $sz.width());
                var outerHeight = height + ($outer.height() - $sz.height());

                $sz.css({ width: width + 'px', height: height + 'px' });
                $outer.width(outerWidth).height(outerHeight);

                var $input = this.$dom().find(':text.phoneNumber');
                var padding = $input.innerHeight() - $input.height();
                $input.height(height - padding);
            },

            querySize: function() {
                return { width: 240 };
            }
        }
    }));

    $.blistEditor.addEditor($.blistEditor.phone, 'phone');

})(jQuery);
