(function($)
{
    $.blistEditor.picklist = function(options, dom)
    {
        this.settings = $.extend({}, $.blistEditor.picklist.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    var renderValue = function(value)
    {
        var $row = $(this);
        var $icon = $('<span class="icon-filler"></span>');
        if (value.icon)
        { $icon = $('<img class="icon-img" src="' + value.icon + '" />'); }
        var $span_label = $('<span class="label"></span>').html($.htmlEscape(value.label));
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
                    this._$editor = $('<div class="blist-table-editor">' +
                        '<div class="picklist-combo"></div></div>');
                }
                return this._$editor;
            },

            editorInserted: function()
            {
                var editObj = this;
                editObj._valuesList = [ { id: 'null', label: '(Blank)'} ];

                _.each((editObj.column.dropDown || {}).values || [],
                    function(v)
                    {
                        if (!v.deleted)
                        {
                            editObj._valuesList.push({id: v.id,
                                label: v.description || '', icon: v.icon});
                        }
                    });

                editObj.flattenValue();
                editObj.setFullSize();
                editObj.$dom().addClass('blist-combo-wrapper')
                    .addClass('combo-container');
                editObj.$editor().find('.picklist-combo').combo({
                    ddClass: 'table-editor-combo',
                    name: 'picklist-combo',
                    values: editObj._valuesList,
                    value: editObj.originalValue ?
                        editObj.originalValue : 'null',
                    // drop down must use existing values
                    // rdf link can use non-existing values
                    allowFreeEdit: this.allowFreeEdit(),
                    renderFn: renderValue
                });
            },

            getSizeElement: function()
            {
                return this.$editor().children(':first');
            },

            currentValue: function()
            {
                var val = this.$editor().find('.picklist-combo').value();
                return val === undefined || val === null || val === 'null' ?
                    null : val;
            },

            focus: function()
            {
                this.$dom().find('.picklist-combo').focus();
            },

            isValid: function()
            {
                if (this.allowFreeEdit())
                {
                    return true;
                }

                var curVal = this.currentValue();
                if (curVal === null) { return true; }

                var found = false;
                if (this._valuesList)
                {
                    $.each(this._valuesList, function(i, v)
                            { if (v.id == curVal)
                                { found = true; return false; } });
                }
                return found;
            },

            dataType: function()
            {
                return this.column.dataTypeName;
            },

            allowFreeEdit: function()
            {
                switch (this.dataType())
                {
                    case 'dataset_link': return true;
                    default: return false;
                }
            }
        }
    }));

    $.blistEditor.addEditor($.blistEditor.picklist, ['drop_down_list', 'picklist', 'dataset_link']);

})(jQuery);
