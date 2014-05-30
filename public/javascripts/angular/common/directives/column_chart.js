angular.module('socrataCommon.directives').directive('columnChart', function() {
  return {
    restrict: 'A',

    template: '<svg></svg>',

    link: function(scope, element, attrs) {
      var data = scope.data[scope.fieldName];
      if (attrs.mode == 508) {
        var table = $('<table border="1" cellpadding="2">')
        var head = $('<thead>');
        var tr = $('<tr>');
        var th = $('<th>').text(scope.fieldName);
        tr.append(th);
        head.append(tr);
        table.append(head);
        _.each(data, function(row) {
          tr = $('<tr>');
          var td = $('<td>').text(row);
          tr.append(td);
          table.append(tr);
        });
        element.append('<h1>').text('508 View');
        element.append(table);
      } else {
        var svg = d3.select(element.find('svg')[0]);
        var bars = svg.selectAll('.bar');
        var bar = bars.data(data);
        var top = element.height();
        bar.enter().append('rect').
          attr('fill', 'blue').
          attr('width', '10px').
          attr('height', function(d) {
            return d * 10;
          }).
          attr('x', function(_, i) {
            return i * 12;
          }).
          attr('y', function(d) {
            return top - d * 10;
          })
      }
    }
  }
});
