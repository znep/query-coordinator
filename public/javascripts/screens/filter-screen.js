var filterNS = blist.namespace.fetch('blist.filter');

filterNS.uid = 0;

filterNS.conditions = {
  text: ["equals", "not equals", "starts with", "contains"],
  checkbox: ["equals"],
  photo: ["blank", "not blank"],
  number: ["equals", "not equals", "less than", "less than or equals", "greater than", "greater than or equals"]
};

filterNS.filterableClass = function(type) {
  if ($.inArray(type, ["text", "richtext", "url", "email", "phone", "tag"]) > -1)
  {
    return "text";
  }
  else if ($.inArray(type, ["number", "money", "percent", "stars", "date", "picklist"]) > -1)
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
};

filterNS.filterRemove = function(event) {
  event.preventDefault();
  if ($(this).closest("table").find("tbody tr").length > 1)
  {
    $(this).closest("tr").remove();
  }
};

filterNS.createEditor = function($renderer, column, value) {
  var tempCol = $.extend({}, column); 
  if (tempCol.type == "tag")
  {
    tempCol.type = "text";
  }

  $renderer.blistEditor({row: null, column: tempCol, value: value})
};

filterNS.filterColumnChanged = function() {
  column = filterNS.columns[$(this).val()];
  $(this).closest("tr").find(".renderer").remove();
  $(this).closest("tr").find(".rendererCell").append('<div class="renderer"></div>');

  filterNS.createEditor($(this).closest("tr").find(".renderer"), column);

  $(this).closest("tr").find(".condition").html(filterNS.renderConditionSelect(column));
};

filterNS.addFilterRow = function($table, columns) {
  filterNS.columns = columns;
  var id = "filter-row-" + filterNS.uid;
  filterNS.uid += 1;

  //TODO: what if there's no columns
  $table.append('<tr id="' + id + '"><td>' + 
      filterNS.renderColumnSelect(columns) +
      '</td><td class="condition">' + filterNS.renderConditionSelect(columns[0]) + 
      '</td><td class="rendererCell"><div class="renderer"></div></td>' + 
      '<td><a href="#" class="add">+</a> / <a href="#" class="remove">-</a></td></tr>');

  filterNS.createEditor($table.find("#" + id + " .renderer"), columns[0]);

  $table.find("#" + id + " .columnSelect").change(filterNS.filterColumnChanged);
  $table.find("#" + id + " .remove").click(filterNS.filterRemove);
  $table.find("#" + id + " .add").click(filterNS.filterAdd);

  return $table.find("#" + id);
};

filterNS.row = function($row) {
  var column = filterNS.columns[$row.find('.columnSelect').val()];
  var value = $row.find(".renderer").blistEditor().currentValue();
  var operator = $row.find(".conditionSelect").val().toUpperCase();

  // Translate values. Fuck you filters for not accepting the same format as
  // rows.
  if (column.type == "phone")
  {
    var filter = []
    var children = [];
    var phoneNumber = {type: "operator"};
    var phoneType = {type: "operator"};

    // Number
    if (value.phone_number != null)
    {
      children = [{columnId: column.id, type: "column", value: "phone_number"}, {type: "literal", value: value.phone_number}];
      phoneNumber.value = operator; 
      phoneNumber.children = children;
      filter.push(phoneNumber);
    }

    // Type
    if (value.phone_type != null)
    {
      children = [{columnId: column.id, type: "column", value: "phone_type"}, {type: "literal", value: value.phone_type}];
      phoneType.value = operator;
      phoneType.children = children;
      filter.push(phoneType);
    }

    return filter; 
  }
  else
  {
    var row = {type: "operator"};

    if (column.type == "checkbox")
    {
      if (value == true)
      {
        value = "1";
      }
      else
      {
        value = "0";
      }
    }
    else if (column.type == "url")
    {
      // TODO: Yeah, this doesn't work. But at least it doesn't crash.
      var url = value.url == null ? "" : value.url;
      var desc = value.description == null ? "" : value.description;
      value = url + desc;
    }

    row.value = $row.find(".conditionSelect").val().toUpperCase();

    var children = [
      {
        columnId: column.id,
        type: "column"
      },
      {type: "literal", value: value} 
    ];

    row.children = children;

    return row;
  }
};

filterNS.getFilter = function($table, operator) {
  var j = {type: "operator", value: operator.toUpperCase()};
  var children = [];

  $table.find("tr").each(function(i, row) {
    var $row = $(row);
    children = children.concat(filterNS.row($row));
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
            $row.find(".conditionSelect").val(filterRow.value.toLowerCase());
            break;
          }
        }
      }
      else if (sub.type == "literal")
      {
        $row.find(".renderer").remove();
        $row.find(".rendererCell").append('<div class="renderer"></div>');

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

        filterNS.createEditor($row.find(".renderer"), col, value);
      }
    }
  }
};

