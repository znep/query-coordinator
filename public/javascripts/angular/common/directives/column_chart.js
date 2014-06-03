angular.module('socrataCommon.directives').directive('columnChart', function() {
  return {
    restrict: 'A',

    template: '<svg></svg>',

    link: function(scope, element, attrs) {
      var data = scope.data[scope.fieldName];
      var filteredData = scope.filteredData[scope.fieldName];
      var filterApplied = function() { return true; };

      if (attrs.mode == 508) {

        var table = $('<table border="1" cellpadding="2">');
        var head = $('<thead>');
        var tr = $('<tr>');
        var th = $('<th>').text(scope.fieldName);

        tr.append(th);
        if (filterApplied()) {
          th = $('<th class="filtered">').text(scope.fieldName + ' (filtered)');
          tr.append(th);
        }
        head.append(tr);
        table.append(head);
        _.each(data, function(row, index) {
          tr = $('<tr>');
          var td = $('<td>').text(row);
          tr.append(td);
          if (filterApplied()) {
            td = $('<td class="filtered">').text(filteredData[index]);
            tr.append(td);
          }
          table.append(tr);
        });
        element.append('<h1>').text('508 View');
        element.append(table);

      } else {

        var svg = d3.select(element.find('svg')[0]);
        var unfilteredBars = svg.selectAll('.bar unfiltered');
        var unfilteredBar = unfilteredBars.data(data);
        var filteredBars = svg.selectAll('.bar filtered');
        var filteredBar = filteredBars.data(filteredData);
        var top = element.height();
        var barSpacing = 2;
        var vScale = (filterApplied() ? filteredData[0] : data[0]) / top;
        var scaleHeight = function(v) { return v / vScale; };

        var wScale = Math.floor(element.width() / (data.length + 1 + barSpacing));
        var minWidth = 5;
        var maxWidth = 50;

        wScale = wScale < minWidth ? minWidth : wScale > maxWidth ? maxWidth : wScale;
        svg.attr('width', element.width());

        // Secondary bar is /unfiltered/ data (if a filter has been applied)
        if (filterApplied()) {
          unfilteredBar.enter().append('rect').
            attr('width', wScale + 'px').
            attr('height', function(d) {
              return scaleHeight(d);
            }).
            attr('x', function(_, i) {
              return i * (wScale + barSpacing);
            }).
            attr('y', function(d) {
              return top - scaleHeight(d);
            }).
            attr('class', 'bar unfiltered');
        }

        // Primary bar is /filtered/ data (if a filter has been applied)
        filteredBar.enter().append('rect').
          attr('width', wScale + 'px').
          attr('height', function(d) {
            return scaleHeight(d);
          }).
          attr('x', function(_, i) {
            return i * (wScale + barSpacing);
          }).
          attr('y', function(d) {
            return top - scaleHeight(d);
          }).
          attr('class', 'bar filtered');

        // Tertiary bar is solely for capturing the :hover pseudo class for CSS styling
        unfilteredBar.enter().append('rect').
          attr('width', wScale + 'px').
          attr('height', function(d) {
            return top;
          }).
          attr('x', function(_, i) {
            return i * (wScale + barSpacing);
          }).
          attr('y', function(d) {
            return 0;
          }).
          attr('class', 'bar tertiary');
      }
    }
  }
});
