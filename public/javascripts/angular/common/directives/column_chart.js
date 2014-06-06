angular.module('socrataCommon.directives').directive('columnChart', function() {

  var render508Table = function(element, unFilteredData, filteredData, filtered, fieldName) {
    var table = $('<table border="1" cellspacing="0" cellpadding="3">');
    var head = $('<thead>');
    var tr = $('<tr>');
    var th = $('<th>').text(fieldName);

    tr.append(th);
    if (filtered) {
      th.text(th.text() + ' (unfiltered)');
      th = $('<th class="filtered">').text(fieldName + ' (filtered)');
      tr.append(th);
    }
    head.append(tr);
    table.append(head);
    _.each(unFilteredData, function(datum, index) {
      tr = $('<tr>');
      var td = $('<td>').text(datum.name + ': ' + datum.value);
      tr.append(td);
      if (filtered) {
        td = $('<td class="filtered">').text(filteredData[index].name + ': ' + filteredData[index].value);
        tr.append(td);
      }
      table.append(tr);
    });
    element.append('<h3>Section 508 Representation</h3>');
    element.append(table);
  };

  var renderColumnChart = function(element, unFilteredData, filteredData, filtered) {
    var chart = d3.select(element.get(0));
    var unfilteredBars = chart.selectAll('.bar unfiltered').data(unFilteredData);
    var filteredBars = chart.selectAll('.bar filtered').data(filteredData);
    var chartHeight = 150;//element.height();
    var chartWidth = element.width();
    var barSpacing = 2;
    var vScale = (filtered ? filteredData[0].value : unFilteredData[0].value) / chartHeight;
    var scaleHeight = function(v) { return v.value / vScale; };
    var wScale = Math.floor(chartWidth / (unFilteredData.length + 1 + barSpacing));
    var minWidth = 5;
    var maxWidth = 50;
    var topMargin = 30; // Defined also in the CSS

    wScale = wScale < minWidth ? minWidth : wScale > maxWidth ? maxWidth : wScale;

    var calculateXOffset = function(i) { return Number(i * (wScale + barSpacing)); };

    var flyout = function(_, i) {
      var unfilteredDatum = unFilteredData[i];
      var filteredDatum = filteredData[i];
      var element = $('<div class="flyout">');
      var tipOffset = 0;
      var value = $('<div class="data_value">').
        text(unfilteredDatum.name + ': ' + unfilteredDatum.value);

      if (filtered) {
        value.text(value.text() + ' (unfiltered)');
        element.append(value);
        value.after($('<div class="data_value">').
          text(filteredDatum.name + ': ' + filteredDatum.value + ' (filtered)'));
      } else {
        element.append(value);
      }

      var width = 130; // This is the result of element.get(0).getBoundingClientRect().width
      var maxOffset = chartWidth - width;

      if (calculateXOffset(i) > maxOffset) {
        var adjustment = maxOffset - (calculateXOffset(i));
        element.css('left', adjustment + 'px');
        tipOffset = adjustment;
      }
      element.css('bottom', scaleHeight(filteredDatum) + 10 + 'px');
      element.append($('<span>').addClass('tip').css('left', (-10) - tipOffset + 'px'));

      return element.get(0);
    };

    var labels = function() {
      var labels = $('<div>').addClass('labels');
      var centering = wScale / 2 - 1;
      var numberOfLabels = 3;
      for (var i = 0; i < 3; i++) {
        var label = $('<span>').
          css('top', numberOfLabels - 0.5 - i + 'rem').
          text(unFilteredData[i].name);
        labels.prepend(
          $('<div>').
            css('left', calculateXOffset(i) + centering + 'px').
            css('height', (numberOfLabels - i) + 'rem').
            append(label)
        );
      }
      return labels;
    };

    var enterBars = function(bars, cssClass) {
      bars.enter().append('div').
        style('width', wScale + 'px').
        style('height', function(d) {
          return (scaleHeight(d) > chartHeight ? chartHeight : scaleHeight(d)) + 'px';
        }).
        style('left', function(_, i) {
          return calculateXOffset(i) + 'px';
        }).
        style('bottom', function(d) {
          return topMargin + 'px';
        }).
        classed('bar ' + cssClass, true);
    };

    if (filtered) {
      enterBars(unfilteredBars, 'unfiltered');
    }
    enterBars(filteredBars, 'filtered');

    unfilteredBars.enter().append('div').
      style('width', wScale + 'px').
      style('height', function() {
        return chartHeight + 'px';
      }).
      style('left', function(_, i) {
        return calculateXOffset(i) + 'px';
      }).
      style('bottom', function() {
        return topMargin + 'px';
      }).
      classed('bar tertiary', true).
      append(flyout);

    element.parent().append(labels);
  };

  return {
    restrict: 'A',

    link: function(scope, element, attrs) {
      var data = scope.data[scope.fieldName];
      var filteredData = scope.filteredData[scope.fieldName];
      var filterApplied = function() { return true; };

      if (attrs.mode == 508) {
        render508Table(element, data, filteredData, filterApplied(), scope.fieldName);
      } else {
        renderColumnChart(element, data, filteredData, filterApplied());
      }
    }
  }
});
