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
        if (v instanceof Object) { ret = v[editObj.column.subTypes[0]]; }
        return ret || '';
    };

    var typeValue = function(editObj)
    {
        var v = editObj.originalValue;
        var ret = '';
        if (v instanceof Object) { ret = v[editObj.column.subTypes[1]]; }
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
                    this._$editor = $('<div class="blist-table-editor blist-td' +
                        ' type-' + this.column.type +
                        '">' +
                        '<input type="text" class="number" value="' +
                        numberValue(this) + '" />' +
                        '<div class="blist-combo-wrapper">' +
                        '<div class="type-combo"></div></div></div>');
                }
                return this._$editor;
            },

            editorInserted: function()
            {
                var editObj = this;
                editObj.$dom().addClass('combo-container');
                editObj.$editor().find('.type-combo').combo({
                    name: 'type-combo',
                    values: typeValues,
                    value: typeValue(editObj) || 'null',
                    renderFn: renderTypeValue
                });
                editObj.$dom().find(':text.number').keydown(function(e)
                    { if (e.keyCode == 9 && !e.shiftKey)
                        { e.stopPropagation(); } });
                editObj.$dom().find('.type-combo').keydown(function(e)
                    { if (e.keyCode == 9 && e.shiftKey)
                        { e.stopPropagation(); } });
            },

            currentNumberValue: function()
            {
                var newNum = this.$editor().find(':text.number').val();
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
                ret[this.column.subTypes[0]] = newNum;
                ret[this.column.subTypes[1]] = newType;
                return ret;
            },

            focus: function()
            {
                this.$editor().find(':text:first').focus().select();
            }
        }
    }));

})(jQuery);
