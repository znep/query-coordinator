var filterNS = blist.namespace.fetch('blist.filter');

filterNS.uid = 0;

filterNS.conditions = {
  text: ["equals", "not equals", "starts with", "contains"],
  checkbox: ["equals"],
  photo: ["blank", "not blank"],
  number: ["equals", "not equals", "less than", "less than or equals", "greater than", "greater than or equals"]
};

filterNS.filterableClass = function(type) {
  if ($.inArray(type, ["text", "richtext", "flag", "url", "email", "phone", "tag"]) > -1)
  {
    return "text";
  }
  else if ($.inArray(type, ["number", "money", "percent", "stars"]) > -1)
  {
    return "number";
  }
  else if ($.inArray(type, ["photo", "document"]) > -1)
  {
    return "photo";
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
    //TODO: bnb
    var col = columns[i];
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

filterNS.filterColumnChanged = function() {
  column = filterNS.columns[$(this).val()];
  $(this).closest("tr").find(".renderer").remove();
  $(this).closest("tr").find(".rendererCell").append('<div class="renderer"></div>');
  $(this).closest("tr").find(".renderer").blistEditor({row: null, column: column});
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
  $table.find("#" + id + " .renderer").blistEditor({row: null, column: columns[0]});
  $table.find("#" + id + " .columnSelect").change(filterNS.filterColumnChanged);
  $table.find("#" + id + " .remove").click(filterNS.filterRemove);
  $table.find("#" + id + " .add").click(filterNS.filterAdd);

  return $table.find("#" + id);
};

filterNS.row = function($row) {
  var row = {type: "operator"};

  row.value = $row.find(".condition").val().toUpperCase();

  var children = [
    {
      columnId: filterNS.columns[$row.find(".columnSelect").val()].id,
      type: "column"
    },
    {type: "literal", value: $row.find(".renderer").blistEditor().currentValue()}
  ];

  row.children = children;

  return row;
};

filterNS.json = function($table, operator) {
  var j = {type: "operator", value: operator.toUpperCase(), children: []};
  var children = j.children;

  $table.find("tr").each(function(i, $row) {
    children.push(filterNS.row($row));
  });

  return $.json.serialize(j);
};

filterNS.populate = function($table, filters, columns) {
  for (var i=0; i < filters.children.length; i++)
  {
    filterRow = filters.children[i];

    var $row = filterNS.addFilterRow($table, columns);

    for (var j=0; j < filterRow.children.length; j++)
    {
      var sub = filterRow.children[j];
      var col;
      if (sub.type == "column")
      {
        for (var k=0; k < columns.length; k++)
        {
          if (sub.columnId == columns[k].id)
          {
            col = columns[k];
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
        $row.find(".renderer").blistEditor({row: null, column: col, value: sub.value});
      }
    }
  }
};

