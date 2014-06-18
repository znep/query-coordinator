angular.module('socrataCommon.directives').directive('columnChart', function(AngularRxExtensions) {

  var renderColumnChart = function(element, unFilteredData, filteredData, filtered, dimensions) {
    var barPadding = 0.25;
    var topMargin = 20; // TODO calculate this dynamically
    var bottomMargin = 90;
    var tipHeight = 10;
    var tipWidth = 10;

    var $chart = element.find('.column-chart-wrapper');
    var d3Selection = d3.select($chart.get(0));
    var unFilteredSelection = d3Selection.selectAll('.bar.unfiltered').data(unFilteredData);
    var filteredSelection = d3Selection.selectAll('.bar.filtered').data(filteredData);
    var neutralSelection = d3Selection.selectAll('.bar.neutral').data(filtered ? []: unFilteredData);
    var hoverTriggerSelection = d3Selection.selectAll('.bar.hover-trigger').data(unFilteredData);
    var tooltipSelection = d3Selection.selectAll('.bar.hover-trigger > .tooltip').data(filteredData);
    var chartWidth = dimensions.width;
    var chartTruncated = false;

    if (chartWidth <= 0) {
      return;
    }

    if (chartWidth < 475) {
      chartWidth = 475;
      chartTruncated = true;
    }

    var chartHeight = dimensions.height - topMargin - bottomMargin;
    var unFilteredHorizontalScale = d3.scale.ordinal().rangeRoundBands(
      [0, chartWidth], barPadding).domain(_.pluck(unFilteredData, 'name')
    );
    var filteredHorizontalScale = d3.scale.ordinal().rangeRoundBands(
      [0, chartWidth], barPadding).domain(_.pluck(filteredData, 'name')
    );
    var neutralHorizontalScale = d3.scale.ordinal().rangeRoundBands(
      [0, chartWidth], barPadding).domain(_.pluck(unFilteredData, 'name')
    );
    var verticalScale = d3.scale.linear().range([chartHeight, 0]);
    var leftOffset = neutralHorizontalScale.range()[0];
    var rangeBand = unFilteredHorizontalScale.rangeBand();

    $chart.css('height', chartHeight + topMargin + 'px');

    if (filtered) {
      verticalScale.domain([filteredData[0].value, 0]);
    } else {
      verticalScale.domain([unFilteredData[0].value, 0]);
    }

    var ticks = function() {
      var numberOfTicks = 3;
      var element;

      element = $('<div>').addClass('ticks').css('top', topMargin + 'px');
      _.each(_.uniq([0].concat(verticalScale.ticks(numberOfTicks))), function(tick) {
        element.append($('<div>').css('top', chartHeight - verticalScale(tick) + 'px').text(tick));
      });

      return element;
    };

    // TODO deal with tooltip getting cut off on the top of the chart
    // TODO deal with tooltip not centering over the bar along with the tip
    var enterTooltip = function(d, i) {
      var unFilteredDatum = unFilteredData[i];
      var filteredDatum = filteredData[i];
      var value = $('<div class="data_value">').text(unFilteredDatum.name + ': ' + unFilteredDatum.value);
      var $tooltip = $('<div class="tooltip">');
      var $tip = $('<span>');
      var tipOffset = rangeBand / 2 - tipWidth / 2;

      if (filtered) {
        value.text(value.text() + ' (unfiltered)');
        $tooltip.append(value);
        value.after($('<div class="data_value">').
          text(filteredDatum.name + ': ' + filteredDatum.value + ' (filtered)'));
      } else {
        $tooltip.append(value);
      }

      if (filtered) {
        $tooltip.css('bottom', verticalScale(filteredDatum.value) + tipHeight + 'px');
      } else {
        $tooltip.css('bottom', verticalScale(unFilteredDatum.value) + tipHeight + 'px');
      }

      tipOffset = tipOffset - tipWidth + 1;
      tipOffset = tipOffset < -10 ? -10 : tipOffset;
      $tip.addClass('tip').css('left', tipOffset + 'px');
      // TODO WTF is this required?
      if (!filtered) {
        $tip.css('top', '20px');
      }

      $tooltip.append($tip);

      return $tooltip.get(0);
    };

    var updateTooltip = function() {
      this.style('bottom', function(d, i) {
        var datum;
        if (filtered) {
          datum = filteredData[i];
        } else {
          datum = unFilteredData[i];
        }
        return verticalScale(datum.value) + tipHeight + 'px';
      });
    };

    var labels = function() {
      var labels = $('<div>').addClass('labels');
      var numberOfLabels = Math.min(unFilteredData.length, 3);
      var centering = leftOffset - rangeBand / 2;
      for (var i = 0; i < numberOfLabels; i++) {
        var label = $('<span>').
          css('top', numberOfLabels - 0.5 - i + 'rem').
          text(unFilteredData[i].name);
        labels.prepend(
          $('<div>').
            css('left', unFilteredHorizontalScale(unFilteredData[i].name) - centering + 'px').
            css('height', (numberOfLabels - i) + 'rem').
            append(label)
        );
      }
      return labels;
    };

    var clampHeight = function(height) {
      return height > chartHeight ? chartHeight : height;
    };

    var enterBars = function(selection, cssClass) {
      selection.enter().append('div').classed('bar ' + cssClass, true);
    };

    var updateBars = function(selection, cssClass) {
      var verticalOffset = topMargin + chartHeight;
      this.
        style('width', rangeBand + 'px').
        style('left', function(d) {
          var left;
          if (cssClass === 'unfiltered') {
            left = unFilteredHorizontalScale(d.name);
          } else if (cssClass === 'filtered') {
            left = filteredHorizontalScale(d.name);
          } else if (cssClass === 'neutral') {
            left = neutralHorizontalScale(d.name);
          } else {
            throw new Error('Unknown cssClass: ' + cssClass);
          }
          return left - leftOffset + 'px';
        }).
        style('top', function(d) { return verticalOffset - clampHeight(verticalScale(d.value)) + 'px'; }).
        style('height', function(d) { return clampHeight(verticalScale(d.value)) + 'px'; });
    };

    var enterHoverTriggerBars = function(selection) {
      selection.enter().append('div').classed('bar hover-trigger', true).append(enterTooltip);
    };

    var updateHoverTriggerBars = function() {
      this.
        style('width', rangeBand + 'px').
        style('left', function(d) { return unFilteredHorizontalScale(d.name) - leftOffset + 'px'; }).
        style('top', function() { return topMargin + 'px'; }).
        style('height', function() { return chartHeight + 'px'; });
    };

    element.children('.ticks').remove();
    element.prepend(ticks);

    unFilteredSelection.exit().remove();
    filteredSelection.exit().remove();
    neutralSelection.exit().remove();
    hoverTriggerSelection.exit().remove();

    if (filtered) {
      unFilteredSelection.call(enterBars, 'unfiltered');
      unFilteredSelection.call(updateBars, 'unfiltered');
      filteredSelection.call(enterBars, 'filtered');
      filteredSelection.call(updateBars, 'filtered');
    } else {
      neutralSelection.call(enterBars, 'neutral');
      neutralSelection.call(updateBars, 'neutral');
    }

    hoverTriggerSelection.call(enterHoverTriggerBars);
    hoverTriggerSelection.call(updateHoverTriggerBars);
    tooltipSelection.call(updateTooltip);

    element.children('.labels').remove();
    element.append(labels);

    var marker = element.find('.truncation-marker');
    if (chartTruncated) {
      marker.css('height', chartHeight + 'px').css('top', topMargin + 'px').css('line-height', chartHeight  / 4 + 'px').show();
    } else {
      marker.hide();
    }
  };

  return {
    template:
      '<div class="column-chart-wrapper">' +
        '<div class="truncation-marker">M O A R' +
      '</div>',
    restrict: 'A',
    scope: { unFilteredData: '=', filteredData: '=', fieldName: '=' },
    link: function(scope, element, attrs) {
      AngularRxExtensions.install(scope);

      Rx.Observable.subscribeLatest(
        element.closest('.card').observeDimensions(),
        scope.observe('unFilteredData'),
        scope.observe('filteredData'),
        function(cardDimensions, unFilteredData, filteredData) {
          if (unFilteredData && filteredData) {
            renderColumnChart(
              element,
              unFilteredData,
              filteredData,
              !!filteredData,
              cardDimensions
            );
          }
        }
      );
    }
  }

});
