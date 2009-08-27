(function($)
{
    $.blistEditor.picklist = function(options, dom)
    {
        this.settings = $.extend({}, $.blistEditor.picklist.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    var valuesList = [ { id: 'null', label: '(Blank)'} ];

    var renderValue = function(value)
    {
        var $row = $(this);
        var $icon = $('<span class="icon-filler"></span>');
        if (value.icon)
        { $icon = $('<img class="icon-img" src="' + value.icon + '" />'); }
        var $span_label = $('<span class="label"></span>').html(value.label);
        $row.empty().append($icon).append($span_label);
    };

    $.extend($.blistEditor.picklist, $.blistEditor.extend(
    {
        prototype:
        {
            $editor: function()
            {
                if (!this._$editor)
                {
                    this._$editor = $('<div class="blist-table-editor blist-td">' +
                        '<div class="picklist-combo"></div></div>');
                }
                return this._$editor;
            },

            editorInserted: function()
            {
                $.each(this.column.options, function(id, v)
                    { valuesList.push({id: id, label: v.text, icon: v.icon}); });
                this.$dom().addClass('blist-combo-wrapper');
                this.$editor().find('.picklist-combo').combo({
                    name: 'picklist-combo',
                    values: valuesList,
                    value: this.originalValue ?
                        this.originalValue.toLowerCase() : 'null',
                    renderFn: renderValue
                });
            },

            currentValue: function()
            {
                var val = this.$editor().find('.picklist-combo').value();
                return val === 'null' ? null : val.toUpperCase();
            },

            focus: function()
            {
                this.$dom().find('.picklist-combo').focus();
            },

            isValid: function()
            {
                var curVal = this.currentValue();
                if (curVal === null) { return true; }

                var found = false;
                $.each(valuesList, function(i, v)
                        { if (v.id.toUpperCase() == curVal)
                            { found = true; return false; } });
                return found;
            }
        }
    }));

})(jQuery);
