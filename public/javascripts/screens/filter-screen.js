var filterNS = blist.namespace.fetch('blist.filter');

filterNS.conditions = {
    text:     [ { operator: "EQUALS", label: "equals" },
                { operator: "NOT_EQUALS", label: "does not equal" },
                { operator: "STARTS_WITH", label: "starts with" },
                { operator: "CONTAINS", label: "contains" } ],
    date:     [ { operator: "EQUALS", label: "on" },
                { operator: "NOT_EQUALS", label: "not on" },
                { operator: "LESS_THAN", label: "before" },
                { operator: "GREATER_THAN", label: "after" },
                { operator: "BETWEEN", label: "between" } ],
    checkbox: [ { operator: "EQUALS", label: "equals" } ],
    photo:    [ { operator: "IS_BLANK", label: "is empty" },
                { operator: "IS_NOT_BLANK", label: "exists" } ],
    number:   [ { operator: "EQUALS", label: "equals" },
                { operator: "NOT_EQUALS", label: "not equals" },
                { operator: "LESS_THAN", label: "less than" },
                { operator: "LESS_THAN_OR_EQUALS", label: "less than or equal to" },
                { operator: "GREATER_THAN", label: "greater than" },
                { operator: "GREATER_THAN_OR_EQUALS", label: "greater than or equal to" },
                { operator: "BETWEEN", label: "between" } ]
};

filterNS.filterableClass = function(type) {
    if ($.inArray(type, ["text", "richtext", "url", "email", "phone", "tag"]) > -1)
    {
        return "text";
    }
    else if ($.inArray(type, ["number", "money", "percent", "stars", "picklist", "drop_down_list"]) > -1)
    {
        return "number";
    }
    else if ($.inArray(type, ["photo", "document"]) > -1)
    {
        return "photo";
    }
    else if ($.inArray(type, ["checkbox", "flag"]) > -1)
    {
        return "checkbox";
    }
    else
    {
        return type;
    }
};

filterNS.filterAdd = function(event) {
    event.preventDefault();
    filterNS.addFilterRow($(this).closest("#filterTable"), filterNS.columns);
};

filterNS.filterRemove = function(event) {
    event.preventDefault();
    var $this = $(this);
    if ($this.closest('.filterTableBody').find('.filterTableRow').length == 10)
    {
        filterNS.cloneTemplateRow($this.closest('#filterTable'), filterNS.columns).insertBefore(
            $this.closest('#filterTable').find('.filterTableRowTemplate'));
    }

    $this.closest(".filterTableRow").remove();
};

filterNS.createEditor = function($renderer, column, value) {
    var tempCol = $.extend({}, column);
    if ((tempCol.type == "tag") || (tempCol.type == "email") || (tempCol.type == 'richtext'))
    {
        tempCol.type = "text";
    }
    else if (tempCol.type == "date")
    {
        tempCol.format = "date";
    }
    else if ((tempCol.type == "document") || (tempCol.type == "photo"))
    {
        return;
    }

    $renderer.blistEditor({row: null, column: tempCol, value: value})
};

filterNS.filterEditor = function($row, column) {
    var condition = $row.find(".filterTable-conditionDropDown").value();

    var $editorContainer = $row.find(".filterTable-editor");
    $editorContainer.empty();
    if (condition.operator == "BETWEEN")
    {
        $editorContainer.append('<div class="renderer renderer1 between"></div>' +
            '<div class="ampersand">&amp;</div><div class="renderer renderer2 between"></div>');

        var renderer1 = $editorContainer.find(".renderer1");
        var renderer2 = $editorContainer.find(".renderer2");
        filterNS.createEditor(renderer1, column);
        filterNS.createEditor(renderer2, column);
    }
    else
    {
        $editorContainer.append('<div class="renderer"></div>');
        filterNS.createEditor($editorContainer.find(".renderer"), column);
    }
};

filterNS.setColumns = function(columns)
{
    filterNS.columns = columns;
    filterNS.columnsValues = $.map(columns, function(col, i) {
        return { index: i, label: col.name, type: col.type };
    })
};

filterNS.addFilterRow = function($table, columns) {
    filterNS.setColumns(columns);

    var $template = $table.find('.filterTableRowTemplate');
    $template.siblings('.filterTableRow').appendTo($table.find('.filterTableBody'));

    if ($table.find('.filterTableBody .filterTableRow').length < 10)
    {
        var $newRow = filterNS.cloneTemplateRow($table, columns);
        $newRow.insertBefore($template);
        return $newRow;
    }
    return null;
};

filterNS.cloneTemplateRow = function($table, columns)
{
    var $template = $table.find('.filterTableRowTemplate');
    var $newRow = $('<div class="filterTableRow">' + $template.html() + '</div>');

    textPromptEntry = { index: -1, label: 'Pick a Column', type: 'none' };
    $newRow.find('.filterTable-nameDropDown')
        .combo({
            name: 'columnName',
            values: [textPromptEntry].concat(filterNS.columnsValues),
            value: textPromptEntry,
            renderFn: function(value)
                {
                    $(this).empty().append('<span class="typeSelect datatype-' +
                        value.type + '">' + value.label + '</span>');
                }
        })
        .bind('change', function(event) {
            var $this = $(this);
            var selectedValue = $this.value();
            if (selectedValue.index >= 0)
            {
                var $conditionDropDown = $('<div class="blist-combo-wrapper">' +
                    '<div class="filterTable-conditionDropDown"></div></div>');
                $this.closest('.filterTableRow')
                    .find('.filterTable-condition')
                    .empty()
                    .append($conditionDropDown);

                var column = filterNS.columns[selectedValue.index];
                var conditions = filterNS.conditions[filterNS.filterableClass(column.type)];
                $conditionDropDown.find('.filterTable-conditionDropDown')
                    .combo({
                        name: 'condition',
                        values: conditions,
                        value: conditions[0]
                    }).bind('change', function(event) {
                        filterNS.filterEditor($newRow, column);
                    });

                filterNS.filterEditor($newRow, column);
            }
            else
            {
                filterNS.cloneTemplateRow($table, columns).insertBefore($newRow);
                $newRow.remove();
            }
        });

    return $newRow;
};

filterNS.row = function($row) {
    var selectedColumn = $row.find(".filterTable-nameDropDown").value();
    if ((selectedColumn === undefined) || (selectedColumn.index < 0))
    {
        return false;
    }

    var column = filterNS.columns[selectedColumn.index];
    var operator = $row.find(".filterTable-conditionDropDown").value().operator;

    if ((column.type == "document") || (column.type == "photo"))
    {
        return [
            {
                type: 'operator',
                value: operator,
                children: [
                    {
                        columnId: column.id,
                        type: "column"
                    }
                ]
            }
        ];
    }

    var value = [];
    $.each($row.find(".renderer"), function(i, r) {
        value.push($(r).blistEditor().currentValue());
    });

    // Translate values. Filters have a different format which is awesome.
    if (column.type == "phone")
    {
        var filter = []
        var children = [];
        var phoneNumber = {type: "operator"};
        var phoneType = {type: "operator"};

        // Number
        if (value[0] !== null && value[0].phone_number !== null)
        {
            children = [{columnId: column.id, type: "column",
                    value: "phone_number"},
                {type: "literal", value: value[0].phone_number}];
            phoneNumber.value = operator; 
            phoneNumber.children = children;
            filter.push(phoneNumber);
        }

        // Type
        if (value[0] !== null && value[0].phone_type !== null)
        {
            children = [{columnId: column.id, type: "column", value: "phone_type"},
                {type: "literal", value: value[0].phone_type}];
            phoneType.value = operator;
            phoneType.children = children;
            filter.push(phoneType);
        }

        return filter;
    }
    else if (column.type == "url")
    {
        var filter = [];

        if (value[0] !== null && value[0].url !== null)
        {
            filter.push({
                type: "operator",
                value: operator,
                children: [
                    {   columnId: column.id,
                        type: "column",
                        value: "url" },
                    {   type: "literal",
                        value: value[0].url }
                ]
            });
        }

        if (value[0] !== null && value[0].description !== null)
        {
            filter.push({
                type: "operator",
                value: operator,
                children: [
                    {   columnId: column.id,
                        type: "column",
                        value: "description" },
                    {   type: "literal",
                        value: value[0].description }
                ]
            });
        }

        return filter;
    }
    else
    {
        var row = {type: "operator"};
        row.value = operator;

        var hasValue = false;
        $.each(value, function(i, v) {
            if ((v !== null) || (column.type == 'checkbox'))
            {
                hasValue = true;
            }
        });
        if (!hasValue)
        {
            return false;
        }

        if (column.type == "checkbox")
        {
            if (value[0] == true)
            {
                value = "1";
            }
            else
            {
                value = "0";
            }
        }
        else if (column.type == "date")
        {
            $.each(value, function(i, v) {
                var dateObj = new Date();
                dateObj.setTime(v * 1000);
                var mm = dateObj.getMonth() + 1;
                if (mm < 10)
                {
                    mm = '0' + mm;
                }
                var dd = dateObj.getDate();
                if (dd < 10)
                {
                    dd = '0' + dd;
                }
                value[i] = mm + '/' + dd + '/' + dateObj.getFullYear();
            });
        }

        var children = [
            {
                columnId: column.id,
                type: "column"
            }
        ];

        $.each(value, function(i, v) {
            children.push({type: "literal", value: v});
        });

        row.children = children;

        return row;
    }
};

filterNS.getFilter = function($table, operator)
{
    var hasConditions = false;
    var j = {type: "operator", value: operator.toUpperCase()};
    var children = [];

    $table.find(".filterTableRow").each(function(i, row) {
        var rowResult = filterNS.row($(row));
        if (rowResult !== false)
        {
            children = children.concat(rowResult);
            hasConditions = true;
        }
    });
    j.children = children;

    return hasConditions ? j : null;
};

filterNS.populate = function($table, filters, columns)
{
    for (var i=0; i < filters.children.length; i++)
    {
        var filterRow = filters.children[i];

        var $row = filterNS.addFilterRow($table, columns);

        for (var j=0; j < filterRow.children.length; j++)
        {
            var sub = filterRow.children[j];
            var subcolumn;
            var col;
            if (sub.type == "column")
            {
                for (var k=0; k < columns.length; k++)
                {
                    if (sub.columnId == columns[k].id)
                    {
                        col = columns[k];
                        if (sub.value != undefined)
                        {
                            subcolumn = sub.value;
                        }

                        $row.find(".filterTable-nameDropDown").value($.grep(filterNS.columnsValues,
                            function(columnValue) {
                                return columnValue.index === k;
                            })[0]);
                        $row.find(".filterTable-conditionDropDown")
                            .value($.grep(filterNS.conditions[filterNS.filterableClass(col.type)],
                            function(condition) {
                                return condition.operator == filterRow.value.toUpperCase();
                            })[0]);
                        $row.find(".filterTable-editor").empty();
                        break;
                    }
                }
            }
            else if (sub.type == "literal")
            {
                if (j > 1)
                {
                    $row.find(".filterTable-editor").append('<div class="ampersand">&amp;</div>');
                }

                if (filterRow.value.toLowerCase() == "between")
                {
                    $row.find(".filterTable-editor").append('<div class="renderer renderer' + j + ' between"></div>');
                }
                else
                {
                    $row.find(".filterTable-editor").append('<div class="renderer renderer' + j + '"></div>');
                }

                var value;
                if (subcolumn !== undefined)
                {
                    value = {};
                    value[subcolumn] = sub.value;
                    subcolumn = undefined;
                }
                else
                {
                    value = sub.value;
                }

                if (col.type == "date")
                {
                    value = new Date(value).getTime() / 1000;
                }

                filterNS.createEditor($row.find(".renderer" + j), col, value);
            }
        }
    }

    // add empty row
    filterNS.addFilterRow($table, columns);
};
