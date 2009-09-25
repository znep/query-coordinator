var filterNS = blist.namespace.fetch('blist.filter');

filterNS.uid = 0;

filterNS.conditions = {
    text: ["equals", "not equals", "starts with", "contains"],
    date: ["on", "not on", "before", "after", "between"],
    checkbox: ["equals"],
    photo: ["blank", "not blank"],
    number: ["equals", "not equals", "less than", "less than or equals", "greater than", "greater than or equals", "between"]
};

filterNS.filterableClass = function(type) {
    if ($.inArray(type, ["text", "richtext", "url", "email", "phone", "tag"]) > -1)
    {
        return "text";
    }
    else if ($.inArray(type, ["number", "money", "percent", "stars", "picklist"]) > -1)
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

filterNS.renderColumnSelect = function(columns) {
    var ret = '<select class="columnSelect">';

    for (var i=0; i < columns.length; i++)
    {
        var col = columns[i];
        if (col.type == "nested_table") continue;
        ret += '<option value="' + i + '">' + col.name + '</option>';
    }

    return ret + "</select>";
};

filterNS.renderConditionSelect = function(column) {
    var ret = '<select class="conditionSelect">';
    var conditionType = filterNS.filterableClass(column.type);
    var conditions = filterNS.conditions[conditionType];

    for (var i=0; i < conditions.length; i++)
    {
        ret += '<option value="' + conditions[i].replace(/ /g, "_") + '">' + conditions[i] + '</option>';
    }

    return ret + "</select>";
};

filterNS.filterAdd = function(event) {
    event.preventDefault();
    var $table = $(this).closest("tbody");
    filterNS.addFilterRow($table, filterNS.columns);
    //filterNS.setTableScroll($table);
};

filterNS.filterRemove = function(event) {
    event.preventDefault();
    var $this = $(this);
    var $row = $this.closest("tr");
    var $table = $this.closest("tbody");
    if ($this.closest("table").find("tbody tr").length > 1)
    {
        if ($row.siblings('tr').length === 0)
        {
            // TODO: clear contents of the row
        }
        else
        {
            $row.remove();
        }
    }
    //filterNS.setTableScroll($table);
    $table.find("tr:last").addClass("last");
};

filterNS.setTableScroll = function($table)
{
        // tbody max-height doesn't work on a lot of browsers
        totalHeight = 0;
        $table.children('tr').each(function()
        {
            totalHeight += $(this).outerHeight(true);
        });

        if (totalHeight > 300)
        {
            $table.height(300);
        }
        else
        {
            $table.height(null);
        }
};

filterNS.createEditor = function($renderer, column, value) {
    var tempCol = $.extend({}, column); 
    if (tempCol.type == "tag")
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
    var operator = $row.closest("tr").find(".conditionSelect").val();

    $row.closest("tr").find(".rendererCell").html("");
    if (operator == "between")
    {
        $row.closest("tr").find(".rendererCell").append('<div class="renderer renderer1 between"></div><div class="ampersand">&amp;</div><div class="renderer renderer2 between"></div>');

        var renderer1 = $row.closest("tr").find(".renderer1");
        var renderer2 = $row.closest("tr").find(".renderer2");
        filterNS.createEditor(renderer1, column);
        filterNS.createEditor(renderer2, column);
    }
    else
    {
        $row.closest("tr").find(".rendererCell").append('<div class="renderer"></div>');
        filterNS.createEditor($row.closest("tr").find(".renderer"), column);
    }
};

filterNS.filterColumnChanged = function() {
    column = filterNS.columns[$(this).val()];
    $(this).closest("tr").find(".condition").html(filterNS.renderConditionSelect(column));

    $(this).closest("tr").find(".conditionSelect").change(function() {
        filterNS.filterEditor($(this), column);
    });

    filterNS.filterEditor($(this), column);
};

filterNS.addFilterRow = function($table, columns) {
    filterNS.columns = columns;

    var id = "filter-row-" + filterNS.uid;
    filterNS.uid += 1;

    //TODO: what if there's no columns
    $table.append('<tr id="' + id + '"><td class="delete"><a href="#delete">delete</a></td><td>' +
            filterNS.renderColumnSelect(columns) +
            '</td><td class="condition">' + filterNS.renderConditionSelect(columns[0]) + 
            '</td><td class="rendererCell"><div class="renderer"></div></td>' +
            '<td class="addRemove"><ul class="actionButtons"><li>' +
            '<a href="#addCondition">Add Condition</a></li></ul></td></tr>');

    filterNS.createEditor($table.find("#" + id + " .renderer"), columns[0]);

    $table.find("#" + id + " .columnSelect").change(filterNS.filterColumnChanged);
    $table.find("#" + id + " .conditionSelect").change(function() {
        var $row = $table.find('#' + id + '.columnSelect');
        filterNS.filterEditor($row, columns[0]);
    });
    $table.find("#" + id + " .remove").click(filterNS.filterRemove);
    $table.find("#" + id + " .add").click(filterNS.filterAdd);

    $table.find("tr").
        removeClass("last").
        removeClass("only");

    if ($table.find("tr").length == 1)
    {
        $table.find("tr").addClass("only");
    }

    $table.find("tr:last").addClass("last");

    return $table.find("#" + id);
};

filterNS.realToDisplayCondition = function(condition, type) {
    condition = condition.toLowerCase();
    if (type == "date")
    {
        var map = {
            "equals": "on",
            "not_equals": "not on",
            "less_than": "before",
            "greater_than": "after"
        };

        return map[condition].toLowerCase();
    }
    else if ((type == "document") || (type == "photo"))
    {
        var map = {
            "is_blank": "blank",
            "is_not_blank": "not_blank"
        };
        
        return map[condition].toLowerCase();
    }

    return condition.toLowerCase();
}

filterNS.displayToRealCondition = function(condition) {
    condition = condition.toLowerCase();
    var map = {
        "on": "equals",
        "not on": "not_equals",
        "before": "less_than",
        "after": "greater_than",
        "blank": "is_blank",
        "not_blank": "is_not_blank"
    };

    if (map[condition] == undefined)
    {
        return condition.toUpperCase();
    }
    else
    {
        return map[condition].toUpperCase();
    }
}

filterNS.row = function($row) {
    var column = filterNS.columns[$row.find('.columnSelect').val()];
    var operator = $row.find(".conditionSelect").val().toUpperCase();

    if ((column.type == "document") || (column.type == "photo"))
    {
        return [
            {
                type: 'operator',
                value: filterNS.displayToRealCondition($row.find(".conditionSelect").val().toUpperCase()),
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
        if (value[0].phone_number != null)
        {
            children = [{columnId: column.id, type: "column", value: "phone_number"}, {type: "literal", value: value[0].phone_number}];
            phoneNumber.value = operator; 
            phoneNumber.children = children;
            filter.push(phoneNumber);
        }

        // Type
        if (value[0].phone_type != null)
        {
            children = [{columnId: column.id, type: "column", value: "phone_type"}, {type: "literal", value: value[0].phone_type}];
            phoneType.value = operator;
            phoneType.children = children;
            filter.push(phoneType);
        }

        return filter; 
    }
    else if (column.type == "url")
    {
        var filter = [];

        if (value[0].url !== null)
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
        
        if (value[0].description !== null)
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
        row.value = filterNS.displayToRealCondition($row.find(".conditionSelect").val().toUpperCase());

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

filterNS.getFilter = function($table, operator) {
    var j = {type: "operator", value: operator.toUpperCase()};
    var children = [];

    $table.find("tr").each(function(i, row) {
        var $row = $(row);
        var rowResult = filterNS.row($row);
        if (rowResult !== false)
        {
            children = children.concat(rowResult);
        }
    });
    j.children = children;

    return j;
};

filterNS.populate = function($table, filters, columns) {
    for (var i=0; i < filters.children.length; i++)
    {
        filterRow = filters.children[i];

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

                        $row.find(".columnSelect").val(k);
                        $row.find(".columnSelect").change();
                        $row.find(".renderer").remove();
                        $row.find(".conditionSelect").val(filterNS.realToDisplayCondition(filterRow.value.toLowerCase(), columns[k].type));
                        break;
                    }
                }
            }
            else if (sub.type == "literal")
            {
                if (j > 1)
                {
                    $row.find(".rendererCell").append('<div class="ampersand">&amp;</div>');
                }
                
                if (filterRow.value.toLowerCase() == "between")
                {
                    $row.find(".rendererCell").append('<div class="renderer renderer' + j + ' between"></div>');
                }
                else
                {
                    $row.find(".rendererCell").append('<div class="renderer renderer' + j + '"></div>');
                }

                var value;
                if (subcolumn != null)
                {
                    value = {};
                    value[subcolumn] = sub.value;
                    subcolumn = null;
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
};
