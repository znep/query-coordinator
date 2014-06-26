angular.module('socrataCommon.directives').directive('columnChart', function($parse, AngularRxExtensions) {

  var renderColumnChart = function(element, chartData, showFiltered, dimensions, expanded, datumClicked) {
    var barPadding = 0.25;
    var topMargin = 20; // TODO calculate this dynamically
    var bottomMargin = 132;
    var tipHeight = 10;
    var tipWidth = 10;

    var $chart = element.find('.column-chart-wrapper');
    var $chartScroll = element.find('.chart-scroll');
    var d3Selection = d3.select($chart.get(0));
    var barGroupSelection = d3Selection.selectAll('.bar-group').data(chartData);
    var hoverTriggerSelection = d3Selection.selectAll('.bar.hover-trigger').data(chartData);
    var chartWidth = dimensions.width;
    var chartTruncated = false;
    var tooltipWidth = 123;
    var numberOfBars = chartData.length;
    var truncationMarker = element.find('.truncation-marker');
    var truncationMarkerWidth = truncationMarker.width();

    if (chartWidth <= 0) {
      return;
    }

    // Compute chart margins
    if (expanded) {
      var maxLength = _.max(chartData.map(function(item) {
        return item.name.capitaliseEachWord().visualLength('0.75rem');
      }));
      bottomMargin = (maxLength + $.relativeToPx('1.0rem')) / Math.sqrt(2);
    } else {
      var numberOfLabels = Math.min(chartData.length, 3);
      bottomMargin = $.relativeToPx(numberOfLabels + 1 + 'rem');
    }

    var chartTop = element.position().top;
    var chartHeight = dimensions.height - topMargin - bottomMargin - chartTop;
    var verticalScale = d3.scale.linear().range([chartHeight, 0]);
    var verticalOffset = topMargin + chartHeight;
    var horizontalScale = null;
    var rightOffset = 0;
    var rangeBand = 0;
    var leftOffset = null;

    var computeChartDimensions = function() {
      horizontalScale = d3.scale.ordinal().rangeRoundBands(
        [0, chartWidth], barPadding).domain(_.pluck(chartData, 'name')
      );
      rightOffset = horizontalScale.range()[numberOfBars - 1];
      rangeBand = horizontalScale.rangeBand();
    };

    computeChartDimensions();

    // If the bar width is too narrow, compute the acceptable minimum width and rescale the chart
    if (rangeBand < 8) {
      chartWidth = Math.floor(8 * numberOfBars * 1.5);
      computeChartDimensions();
      chartTruncated = true;
      chartWidth = Math.floor(dimensions.width);
    }


    leftOffset = horizontalScale.range()[0];

    $chart.css('height', chartHeight + topMargin + 1).
      css('width', chartWidth);
    $chartScroll.css('padding-bottom', bottomMargin).
      css('padding-top', chartTop);

    var maxValue = _.isEmpty(chartData) ? 0 : chartData[0].total;
    verticalScale.domain([maxValue, 0]);

    var ticks = function() {
      var numberOfTicks = 3;
      var element;

      element = $('<div>').addClass('ticks').css('top', $chartScroll.position().top + topMargin + chartTop).css('width', chartWidth);
      _.each(_.uniq([0].concat(verticalScale.ticks(numberOfTicks))), function(tick) {
        element.append($('<div>').css('top', chartHeight - verticalScale(tick)).text($.toHumaneNumber(tick, 1)));
      });
      element.css('height', chartHeight + topMargin);
      return element;
    };

    var enterTooltip = function(datum, i) {
      var content = $('<div class="datum">');

      content.append($('<div class="name">'));
      content.append($('<div class="value-unfiltered">').
        append($('<div class="value">')).
        append($('<div class="label">Total</div>'))
      );
      content.append($('<div class="value-filtered">').
        append($('<div class="value">')).
        append($('<div class="label">Current filter</div>'))
      );
      var $tooltip = $('<div class="tooltip">');
      var $tip = $('<span>');

      $tooltip.append(content);

      $tip.addClass('tip');
      $tooltip.append($tip);

      return $tooltip.get(0);
    };

    var updateTooltip = function(selection) {
      var tipOffset = rangeBand / 2 - tipWidth / 2;

      selection.
        classed('filtered', showFiltered).
        each(function(d) {
          var $tooltip = $(this);
          var $tip = $tooltip.find('.tip');
          var rightEdge = 0;
          if (showFiltered) {
            $tooltip.css('bottom', verticalScale(d.filtered) + tipHeight);
            rightEdge = horizontalScale(d.name) + tooltipWidth - chartWidth;
          } else {
            $tooltip.css('bottom', verticalScale(d.total) + tipHeight);
            rightEdge = horizontalScale(d.name) + tooltipWidth - chartWidth;
          }

          if (rightEdge > 0) {
            $tooltip.css('left', -1 * rightEdge);
            $tip.css('left', tipOffset + rightEdge);
          }
          else {
            $tip.css('left', Math.max(0, tipOffset));
          }

          $tooltip.find('.name').text(d.name.capitaliseEachWord());
          $tooltip.find('.value-unfiltered .value').text($.commaify(d.total));
          $tooltip.find('.value-filtered .value').text($.commaify(d.filtered));
        });
    };

    var labels = function() {
      var labelContent = $('<div>').addClass('labels').
        css('top', chartHeight + chartTop + topMargin);
      var numberOfLabels = expanded ? chartData.length : Math.min(chartData.length, 3);
      var centering = leftOffset - rangeBand / 2;

      for (var i = 0; i < numberOfLabels; i++) {
        var label = $('<span>').
          css('top', numberOfLabels - 0.5 - i + 'rem').
          text(chartData[i].name.capitaliseEachWord());
        var labelContainer = $('<div>').
            css('left', horizontalScale(chartData[i].name) - centering - 1).
          append(label);
        if (!expanded) {
          labelContainer.css('height', (numberOfLabels - i) + 'rem');
      }
        labelContent.prepend(labelContainer);
      }
      return labelContent;
    };

    var clampHeight = function(height) {
      return height > chartHeight ? chartHeight : height;
    };

    var horizontalBarPosition = function(d) {
      return horizontalScale(d.name) - leftOffset;
    };

    var updateBars = function(selection) {
      // Bars are composed of a bar group and two bars (total and filtered).

      // ENTER PROCESSING
      
      // Create bar groups.
      selection.enter().
        append('div').
          classed('bar-group', true);

      // Create 2 bars, total and filtered. Filtered bars default to 0 height if there is no data for them.
      var bars = selection.selectAll('.bar').data(function(d) {
        return [d.total, d.filtered || 0];
      });

      // Bars are just a div.
      bars.enter().
        append('div');

      // UPDATE PROCESSING
      // Update the position of the groups.
      selection.
        style('left', function(d) { return horizontalBarPosition(d) + 'px'; }).
        classed('special', function(d) { return d.special; }).
        classed('active', function(d) { return horizontalBarPosition(d) < chartWidth - truncationMarkerWidth; });

      // Update the position of the individual bars.
      bars.
        style('width', rangeBand + 'px').
        style('height', function(d) { return clampHeight(verticalScale(d)) + 'px'; }).
        style('top', function(d) { return verticalOffset - clampHeight(verticalScale(d)) + 1 + 'px'; }).
        attr('class', function(d, i) {
          return 'bar ' + (i==0 ? 'unfiltered' : 'filtered');
        });

      // EXIT PROCESSING
      bars.exit().remove();
      selection.exit().remove();
    };

    var updateHoverTriggerBars = function(selection) {
      // Hover trigger bars overlay the entire vertical space of the chart, and contain a tooltip.

      // ENTER PROCESSING
      // Hover trigger bars are just a div.
      selection.enter().
        append('div').
          attr('class', 'bar hover-trigger').
          on('click', datumClicked);

      // Create the tooltips.
      var tooltips = selection.selectAll('.tooltip').data(function(d) { return [d]; });
      tooltips.
        enter().
          append(enterTooltip);

      // UPDATE PROCESSING
      selection.
        style('width', rangeBand + 'px').
        style('left', function(d) { return horizontalScale(d.name) - leftOffset + 'px'; }).
        style('top', function() { return topMargin + 'px'; }).
        style('height', function() { return chartHeight + 'px'; }).
        classed('active', function(d) { return horizontalBarPosition(d) < chartWidth - truncationMarkerWidth; });

      tooltips.call(updateTooltip);
  
      // EXIT PROCESSING
      selection.exit().remove();
    };

    element.children('.ticks').remove();
    element.prepend(ticks);

    barGroupSelection.call(updateBars);
    hoverTriggerSelection.call(updateHoverTriggerBars);

    $chartScroll.children('.labels').remove();
    $chartScroll.append(labels);

    if (chartTruncated) {
      truncationMarker.css('display', 'block');
    } else {
      truncationMarker.css('display', 'none');
    }
  };

  return {
    template:
      '<div class="chart-scroll">' +
        '<div class="column-chart-wrapper" ng-class="{filtered: showFiltered}">' +
          '<div class="truncation-marker">&raquo;</div>' +
          '<div class="tooltip"><div>Click to expand</div><span class="tip"></span></div>' +
        '</div>' +
      '</div>',
    restrict: 'A',
    scope: {
      chartData: '=',
      showFiltered: '=',
      expanded: '=',
      click: '='
    },
    link: function(scope, element, attrs) {
      AngularRxExtensions.install(scope);

      Rx.Observable.subscribeLatest(
        element.closest('.card').observeDimensions(),
        scope.observe('chartData'),
        scope.observe('showFiltered'),
        scope.observe('expanded'),
        function(cardDimensions, chartData, showFiltered, expanded) {
          if (!chartData) return;
          renderColumnChart(
            element,
            chartData,
            showFiltered,
            cardDimensions,
            expanded,
            scope.click
          );
        }
      )
    }
  }

});
