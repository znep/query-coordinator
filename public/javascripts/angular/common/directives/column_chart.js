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
    var $chart = element.find('.column-chart-wrapper');
    var d3Selection = d3.select($chart.get(0));
    var unfilteredSelection = d3Selection.selectAll('.bar.unfiltered').data(unFilteredData);
    var filteredSelection = d3Selection.selectAll('.bar.filtered').data(filteredData);
    var hoverTriggerSelection = d3Selection.selectAll('.bar.hover-trigger').data(unFilteredData);
    var chartHeight = 150;//$chart.height();
    var chartWidth = $chart.width();
    var barSpacing = 8;
    var verticalScaleFactor = (filtered ? filteredData[0].value : unFilteredData[0].value) / chartHeight;
    var barWidth = Math.floor(chartWidth / (unFilteredData.length + 1 + barSpacing));
    var minBarWidth = 8;
    var maxBarWidth = 50;
    var topMargin = 30; // Defined also in the CSS for div.labels
    var numberOfTicks = 3;

    // TODO D3-ify the ticks to scale along with the data
    var ticks = function() {
      var domain;
      var element;
      if (filtered) {
        domain = [filteredData[0].value, _.last(filteredData).value]
      } else {
        domain = [unFilteredData[0].value, _.last(unFilteredData).value]
      }

      element = $('<div>').addClass('ticks');
      _.each(d3.scale.linear().domain(domain).ticks(numberOfTicks), function(tick) {
        element.append($('<div>').css('bottom', topMargin + 'px').
          css('top', chartHeight - calculateHeight({value: tick}) - topMargin + 10 + 'px').
          text(tick));
      });
      return element;
    };

    if (barWidth < minBarWidth) {
      barWidth = minBarWidth;
    }
    if (barWidth > maxBarWidth) {
      barWidth = maxBarWidth;
    }

    var calculateHeight = function(value) {
      var height = value.value / verticalScaleFactor;
      return height > chartHeight ? chartHeight : height
    };
    var calculateXOffset = function(i) {
      return Number(i * (barWidth + barSpacing));
    };

    var flyout = function(_, i) {
      var unFilteredDatum = unFilteredData[i];
      var filteredDatum = filteredData[i];
      var $chart = $('<div class="flyout">');
      var value = $('<div class="data_value">').
        text(unFilteredDatum.name + ': ' + unFilteredDatum.value);

      if (filtered) {
        value.text(value.text() + ' (unfiltered)');
        $chart.append(value);
        value.after($('<div class="data_value">').
          text(filteredDatum.name + ': ' + filteredDatum.value + ' (filtered)'));
      } else {
        $chart.append(value);
      }

      var width = 130; // This is the result of $chart.get(0).getBoundingClientRect().width (CSS width of 110 plus 10 padding on each size)
      var maxOffset = chartWidth - width;
      var centering = barWidth / 2 - 1;
      var tipWidth = 10;
      var tipOffset = centering - tipWidth / 2 - tipWidth;

      // TODO Fix this horrible tip centering silliness. Also make the flyout's overflow hidden
      if (calculateXOffset(i) > maxOffset) {
        var adjustment = maxOffset - calculateXOffset(i);
        $chart.css('left', adjustment + 'px');
        tipOffset = calculateXOffset(i) - maxOffset - tipWidth / 2 - 1;
      } else {
        $chart.css('left', 0);
      }
      tipOffset = tipOffset < -10 ? -10 : tipOffset;
      if (filtered) {
        $chart.css('bottom', calculateHeight(filteredDatum) + 10 + 'px');
      } else {
        $chart.css('bottom', calculateHeight(unFilteredDatum) + 10 + 'px');
      }
      $chart.append($('<span>').addClass('tip').css('left', tipOffset + 'px').
        css('top', filtered ? '10px' : '20px'));
      return $chart.get(0);
    };

    // TODO D3-ify the labels
    var labels = function() {
      var labels = $('<div>').addClass('labels');
      var centering = barWidth / 2 - 1;
      var numberOfLabels = 3;
      for (var i = 0; i < numberOfLabels; i++) {
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

    var enterBars = function(barSelection, cssClass) {
      barSelection.enter().append('div').classed('bar ' + cssClass, true);
    };

    var updateBars = function() {
      this.
        style('width', barWidth + 'px').
        style('left', function(_, i) {
          return calculateXOffset(i) + 'px';
        }).
        style('bottom', function() {
          return topMargin + 'px';
        }).
        style('height', function(d) {
          return (calculateHeight(d)) + 'px';
        });
    };

    var updateHoverTriggerBars = function() {
      this.
        style('width', barWidth + 'px').
        style('height', function() {
          return chartHeight + 'px';
        }).
        style('left', function(_, i) {
          return calculateXOffset(i) + 'px';
        }).
        style('bottom', function() {
          return topMargin + 'px';
        })
    };

    element.children('.ticks').remove();
    element.prepend(ticks);

    unfilteredSelection.exit().remove();
    filteredSelection.exit().remove();
    hoverTriggerSelection.exit().remove();

    if (filtered) {
      unfilteredSelection.call(enterBars, 'unfiltered');
      filteredSelection.call(enterBars, 'filtered');
      filteredSelection.call(updateBars);
      unfilteredSelection.call(updateBars);
    } else {
      unfilteredSelection.call(enterBars, 'filtered');
      unfilteredSelection.call(updateBars);
    }

    hoverTriggerSelection.enter().append('div').classed('bar hover-trigger', true).append(flyout);
    hoverTriggerSelection.call(updateHoverTriggerBars);

    element.children('.labels').remove();
    element.append(labels);
  };

  return {
    template: '<div class="column-chart-wrapper"></div>',
    restrict: 'A',
    scope: { unfilteredData: '=', filteredData: '=', fieldName: '=' },
    link: function(scope, element, attrs) {
      var unfilteredData = scope.unfilteredData[scope.fieldName];
      var filterApplied = function() { return true; };

      scope.$watch('unfilteredData', function(value) {
        renderColumnChart(element, value[scope.fieldName], scope.filteredData[scope.fieldName], filterApplied());
      });
//      This WIP temporarily disabled for demo
//      render508Table(element, data, filteredData, filterApplied(), scope.fieldName);
    }
  }
});
