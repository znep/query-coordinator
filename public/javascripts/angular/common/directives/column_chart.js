angular.module('socrataCommon.directives').directive('columnChart', function(AngularRxExtensions) {

  var renderColumnChart = function(element, unFilteredData, filteredData, filtered, dimensions, expanded) {
    var barPadding = 0.25;
    var topMargin = 20; // TODO calculate this dynamically
    var bottomMargin = 120;
    var tipHeight = 10;
    var tipWidth = 10;

    var $chart = element.find('.column-chart-wrapper');
    var $chartScroll = element.find('.chart-scroll');
    var d3Selection = d3.select($chart.get(0));
    var unFilteredSelection = d3Selection.selectAll('.bar.unfiltered').data(unFilteredData);
    var filteredSelection = d3Selection.selectAll('.bar.filtered').data(filteredData);
    var neutralSelection = d3Selection.selectAll('.bar.neutral').data(filtered ? []: unFilteredData);
    var hoverTriggerSelection = d3Selection.selectAll('.bar.hover-trigger').data(unFilteredData);
    var tooltipSelection = d3Selection.selectAll('.bar.hover-trigger > .tooltip').data(filteredData);
    var chartWidth = dimensions.width;
    var chartTruncated = false;
    var tooltipWidth = 132;
    var numberOfBars = unFilteredData.length;
    var truncationMarker = element.find('.truncation-marker');
    var truncationMarkerWidth = truncationMarker.width();

    if (chartWidth <= 0 || unFilteredData.length != filteredData.length ||
      unFilteredData.length <= 0 || filteredData.length <= 0) {
      return;
    }
    var computeChartMargins = function() {
      if (expanded) {
        var maxLength = _.max(unFilteredData.map(function(item) {
          return item.name.capitaliseEachWord().visualLength("0.75rem");
        }));
        bottomMargin = (maxLength + $.relativeToPx("1.0rem"))/Math.sqrt(2);
      } else {
        var numberOfLabels = Math.min(unFilteredData.length, 3);
        bottomMargin = $.relativeToPx(numberOfLabels+1+"rem");
      }
    }
    computeChartMargins();

    var chartTop = element.position().top;
    var chartHeight = dimensions.height - topMargin - bottomMargin - chartTop;
    var verticalScale = d3.scale.linear().range([chartHeight, 0]);
    var verticalOffset = topMargin + chartHeight;
    var unFilteredHorizontalScale;
    var filteredHorizontalScale;
    var neutralHorizontalScale;
    var leftOffset;
    var rightOffset = 0;
    var rangeBand = 0;
    var computeChartDimensions = function() {
      unFilteredHorizontalScale = d3.scale.ordinal().rangeRoundBands(
        [0, chartWidth], barPadding).domain(_.pluck(unFilteredData, 'name')
      );
      filteredHorizontalScale = d3.scale.ordinal().rangeRoundBands(
        [0, chartWidth], barPadding).domain(_.pluck(filteredData, 'name')
      );
      neutralHorizontalScale = d3.scale.ordinal().rangeRoundBands(
        [0, chartWidth], barPadding).domain(_.pluck(unFilteredData, 'name')
      );
      leftOffset = neutralHorizontalScale.range()[0];
      rightOffset = neutralHorizontalScale.range()[numberOfBars - 1];
      rangeBand = unFilteredHorizontalScale.rangeBand();
    };

    computeChartDimensions();

    if (rangeBand < 8) {
      chartWidth = Math.floor(8 * numberOfBars * 1.5);
      computeChartDimensions();
      chartTruncated = true;
      chartWidth = Math.floor(dimensions.width);
    }
    $chart.css('height', chartHeight + topMargin + 1).
      css('width', chartWidth);
    $chartScroll.css('padding-bottom', bottomMargin).
      css('padding-top', chartTop);

    if (filtered) {
      verticalScale.domain([filteredData[0].value, 0]);
    } else {
      verticalScale.domain([unFilteredData[0].value, 0]);
    }

    var ticks = function() {
      var numberOfTicks = 3;
      var element;

      element = $('<div>').addClass('ticks').css('top', $chartScroll.position().top + topMargin + chartTop).css('width', chartWidth);
      _.each(_.uniq([0].concat(verticalScale.ticks(numberOfTicks))), function(tick) {
        element.append($('<div>').css('top', chartHeight - verticalScale(tick)).text($.toHumaneNumber(tick, 0)));
      });
      element.css('height', chartHeight + topMargin);
      return element;
    };

    var enterTooltip = function(d, i) {
      var unFilteredDatum = unFilteredData[i];
      var filteredDatum = filteredData[i];
      var content = $('<div class="datum">');
      content.append($('<div class="name">').text(unFilteredDatum.name.capitaliseEachWord()));
      content.append($('<div class="value">').text($.commaify(unFilteredDatum.value)));
      var $tooltip = $('<div class="tooltip">');
      var $tip = $('<span>');
      var tipOffset = rangeBand / 2 - tipWidth / 2;
      var rightEdge = 0;

      $tooltip.append(content);

      if (filtered) {
        $tooltip.css('bottom', verticalScale(filteredDatum.value) + tipHeight);
        rightEdge = filteredHorizontalScale(filteredDatum.name) + tooltipWidth - chartWidth;
      } else {
        $tooltip.css('bottom', verticalScale(unFilteredDatum.value) + tipHeight);
        rightEdge = unFilteredHorizontalScale(unFilteredDatum.name) + tooltipWidth - chartWidth;
      }

      $tip.addClass('tip').css('left', Math.max(0, tipOffset));
      $tooltip.append($tip);

      if (rightEdge > 0) {
        $tooltip.css('left', -1 * rightEdge);
        $tip.css('left', tipOffset + rightEdge);
      }

      return $tooltip.get(0);
    };

    var updateTooltip = function() {
      var tipOffset = rangeBand / 2 - tipWidth / 2;
      var datum = function(i) {
        if (filtered) {
          return filteredData[i];
        } else {
          return unFilteredData[i];
        }
      };

      var rightEdge = function(i) {
        if (filtered) {
          return filteredHorizontalScale(datum(i).name) + tooltipWidth - chartWidth;
        } else {
          return unFilteredHorizontalScale(datum(i).name) + tooltipWidth - chartWidth;
        }
      };

      var left = function(i) {
        if (filtered) {
          return filteredHorizontalScale(datum(i).name);
        } else {
          return unFilteredHorizontalScale(datum(i).name);
        }
      };

      this.
        style('bottom', function(d, i) {
          return verticalScale(datum(i).value) + tipHeight + 'px';
        }).
        style('left', function(d, i) {
          var $tip = $(this).find('.tip');
          if (rightEdge(i) > 0) {
            $tip.css('left', tipOffset + rightEdge(i));
            return -1 * rightEdge(i) + 'px';
          } else {
            $tip.css('left', Math.max(0, tipOffset));
          }
        });
    };
    var labels = function() {
      var labels = $('<div>').addClass('labels').
        css('top', chartHeight + chartTop + topMargin);
      var numberOfLabels = expanded ? unFilteredData.length : Math.min(unFilteredData.length, 3);
      var centering = leftOffset - rangeBand / 2;
      for (var i = 0; i < numberOfLabels; i++) {
        var label = $('<span>').
          css('top', numberOfLabels - 0.5 - i + 'rem').
          text(unFilteredData[i].name.capitaliseEachWord());
        var labelContainer = $('<div>').
          css('left', unFilteredHorizontalScale(unFilteredData[i].name) - centering - 1).
          append(label);
        if (!expanded) {
          labelContainer.css('height', (numberOfLabels - i) + 'rem');
        }
        labels.prepend(labelContainer);
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
      var left = function(d) {
        if (cssClass === 'unfiltered') {
          return unFilteredHorizontalScale(d.name) - leftOffset;
        } else if (cssClass === 'filtered') {
          return filteredHorizontalScale(d.name) - leftOffset;
        } else if (cssClass === 'neutral') {
          return neutralHorizontalScale(d.name) - leftOffset;
        } else {
          throw new Error('Unknown cssClass: ' + cssClass);
        }
      };

      this.
        style('width', rangeBand + 'px').
        style('left', function(d) {
          return left(d) + 'px';
        }).
        style('top', function(d) { return verticalOffset - clampHeight(verticalScale(d.value)) + 1 + 'px'; }).
        style('height', function(d) { return clampHeight(verticalScale(d.value)) + 'px'; }).
        classed('active', function(d) { return left(d) < chartWidth - truncationMarkerWidth; });
    };

    var enterHoverTriggerBars = function(selection) {
      selection.enter().append('div').classed('bar hover-trigger', true).append(enterTooltip);
    };

    var updateHoverTriggerBars = function(selection, cssClass) {
      var left = function(d) {
        if (cssClass === 'unfiltered') {
          return unFilteredHorizontalScale(d.name) - leftOffset;
        } else if (cssClass === 'filtered') {
          return filteredHorizontalScale(d.name) - leftOffset;
        } else if (cssClass === 'neutral') {
          return neutralHorizontalScale(d.name) - leftOffset;
        } else {
          throw new Error('Unknown cssClass: ' + cssClass);
        }
      };
      this.
        style('width', rangeBand + 'px').
        style('left', function(d) { return unFilteredHorizontalScale(d.name) - leftOffset + 'px'; }).
        style('top', function() { return topMargin + 'px'; }).
        style('height', function() { return chartHeight + 'px'; }).
        classed('active', function(d) { return left(d) < chartWidth - truncationMarkerWidth; });
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
      hoverTriggerSelection.call(enterHoverTriggerBars, 'unfiltered');
      hoverTriggerSelection.call(updateHoverTriggerBars, 'unfiltered');
    } else {
      neutralSelection.call(enterBars, 'neutral');
      neutralSelection.call(updateBars, 'neutral');
      hoverTriggerSelection.call(enterHoverTriggerBars, 'neutral');
      hoverTriggerSelection.call(updateHoverTriggerBars, 'neutral');
    }

    tooltipSelection.call(updateTooltip);
    $chartScroll.children('.labels').remove();
    $chartScroll.append(labels);

    if (chartTruncated) {
      truncationMarker.css('height', chartHeight).css('top', topMargin - 1).css('line-height', chartHeight  / 4 + 'px').show();
    } else {
      truncationMarker.hide();
    }
  };

  return {
    template:
      '<div class="chart-scroll">' +
        '<div class="column-chart-wrapper">' +
          '<div class="truncation-marker">M O A R</div>' +
        '</div>' +
      '</div>',
    restrict: 'A',
    scope: { unFilteredData: '=', filteredData: '=', fieldName: '=', expanded: '=' },
    link: function(scope, element, attrs) {
      AngularRxExtensions.install(scope);

      Rx.Observable.subscribeLatest(
        element.closest('.card').observeDimensions(),
        scope.observe('unFilteredData'),
        scope.observe('filteredData'),
        scope.observe('expanded'),
        function(cardDimensions, unFilteredData, filteredData, expanded) {
          if (unFilteredData && filteredData) {
            renderColumnChart(
              element,
              unFilteredData,
              filteredData,
              false,
              cardDimensions,
              expanded
            );
          }
        }
      )
    }
  }

});
