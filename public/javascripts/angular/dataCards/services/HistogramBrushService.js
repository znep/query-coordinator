(function() {
  'use strict';

  var FILTER_ICON_SVG_PATH = 'M617.661 322.068l-25.462-309.228h-164.531l-25.467 309.228-317.215 518.712h849.894l-317.22-518.712z';

  function HistogramVisualizationService(Constants, FlyoutService, I18n) {

    function setupBrushHandles(selection, height, leftOffset) {

      var handleHeight = 8;

      function brushLine(gBrush) {
        gBrush.append('line').
          classed('histogram-brush-line', true).
          attr('transform', 'translate({0}, 0)'.format(leftOffset)).
          attr('y1', 0);
      }

      function brushHandle(path, gBrush) {
        gBrush.append('path').
          attr('class', 'histogram-brush-handle').
          attr('transform', 'translate({0}, 0)'.format(leftOffset)).
          attr('d', path);
      }

      function brushHoverTarget(xTranslation, gBrush) {
        gBrush.append('rect').
          attr('class', 'histogram-brush-handle-target').
          style('fill', 'transparent').
          attr('height', '100%').
          attr('width', function() {
            return gBrush.node().getBoundingClientRect().width;
          }).
          attr('transform', function() {
            return 'translate({0}, 0)'.format(xTranslation + leftOffset);
          });
      }

      function buildBrushHandle(side, path) {
        var direction = side === 'right' ? 'e' : 'w';
        if (selection.select('.histogram-brush-{0}'.format(side)).empty()) {
          selection.select('.resize.{0}'.format(direction)).
            attr('transform', 'translate({0}, 0)'.format(11)).
            append('g').attr('class', 'histogram-brush-{0}'.format(side)).
            call(brushLine).
            call(_.partial(brushHandle, path, _)).
            call(_.partial(brushHoverTarget, side === 'right' ? 0 : -10, _));
        }
        selection.selectAll('.histogram-brush-line').
          attr('y2', height + handleHeight);
      }

      buildBrushHandle('right', 'M0,0L10,0L10,8L0,16Z');
      buildBrushHandle('left', 'M0,0L-10,0L-10,8L0,16Z');
    }

    function HistogramBrush(id) {
      this.id = id;
      this.brushDispatcher = d3.dispatch('clear');

      FlyoutService.register({
        selector: '.brush-clear-x',
        render: _.constant(I18n.distributionChart.dragClearHelp)
      });

      FlyoutService.register({
        selector: '.histogram-brush-handle-target',
        render: _.constant(I18n.distributionChart.dragHelp),
        positionOn: function(element) {
          return $(element).closest('.resize').get(0);
        }
      });

      FlyoutService.register({
        selector: '.histogram-brush-line',
        render: _.constant(I18n.distributionChart.dragHelp),
        positionOn: function(element) {
          return $(element).closest('.resize').get(0);
        }
      });
    }

    HistogramBrush.prototype.setupDOM = function(dom) {
      dom.area.selectedUnfiltered = dom.chart.
        selectAll('.histogram-area.histogram-area-selected-unfiltered').data([0]);
      dom.line.selectedUnfiltered = dom.chart.
        selectAll('.histogram-area.histogram-trace-selected-unfiltered').data([0]);

      dom.area.selectedUnfiltered.enter().
        insert('path', '.histogram-axis').
        attr('clip-path', 'url(#clip-{0})'.format(this.id)).
        classed('histogram-area histogram-area-selected-unfiltered', true);

      dom.line.selectedUnfiltered.enter().
        insert('path', '.histogram-axis').
        attr('clip-path', 'url(#clip-{0})'.format(this.id)).
        classed('histogram-trace histogram-trace-selected-unfiltered', true);

      dom.area.selected = dom.chart.
        selectAll('.histogram-area.histogram-area-selected').data([0]);
      dom.line.selected = dom.chart.
        selectAll('.histogram-area.histogram-trace-selected').data([0]);

      dom.area.selected.enter().
        insert('path', '.histogram-axis').
        attr('clip-path', 'url(#clip-{0})'.format(this.id)).
        classed('histogram-area histogram-area-selected', true);

      dom.line.selected.enter().
        insert('path', '.histogram-axis').
        attr('clip-path', 'url(#clip-{0})'.format(this.id)).
        classed('histogram-trace histogram-trace-selected', true);

      this.brushDOM = dom.brush = dom.svg.selectAll('.brush').data([0]);

      dom.brush.enter().
        append('g').classed('brush', true).
        attr('transform', 'translate(0, 0)').
        append('clipPath').
        attr('id', 'clip-{0}'.format(this.id)).
        append('rect').
        classed('extent', true);

      return dom;
    };

    HistogramBrush.prototype.setupBrush = function(scale) {
      var brush = d3.svg.brush();

      brush.
        x(scale.x).
        clamp(true);

      return brush;
    };

    HistogramBrush.prototype.updateBrush = function(dom, brush, height, valueExtent) {
      var self = this;

      this.brushDOM.
        call(function(selection) {
          brush.apply(this, [selection]);
        }).
        select('.extent').
        attr('height', height);

      var brushClearData = [{
        brushLeft: brush.extent()[0],
        brushRight: brush.extent()[1],
        brushHasExtent: !brush.empty(),
        valueExtent: valueExtent,
        offset: 5,
        leftOffset: dom.margin.left,
        backgroundHeight: '3em',
        top: height
      }];

      var brushClear = this.brushDOM.selectAll('.brush-clear').
        data(brushClearData);

      brushClear.enter().
        append('g').classed('brush-clear', true).
        on('mouseover.brush-clear', function(d) {
          FlyoutService.refreshFlyout();
          dom.hoverDispatcher.hover(d.brushLeft, d.brushRight);
        }).
        on('mouseout.brush-clear', function() {
          FlyoutService.refreshFlyout();
          dom.hoverDispatcher.hover();
        }).
        on('mousedown.brush-clear-text', function() {
          d3.event.stopPropagation();
          self.brushDispatcher.clear();
        });

      var brushClearBackground = brushClear.selectAll('.brush-clear-background').
        data(brushClearData);

      brushClearBackground.enter().
        insert('rect').
        classed('brush-clear-background', true);

      brushClearBackground.
        attr('height', _.property('backgroundHeight')).
        attr('width', function(d) {
          return Math.max(0, d.brushRight - d.brushLeft);
        });

      var brushClearText = brushClear.selectAll('.brush-clear-text').
        data(brushClearData);

      brushClearText.enter().
        insert('text').
        classed('brush-clear-text', true);

      brushClearText.
        text(function(d) {
          if (_.isArray(d.valueExtent)) {
            return '{0} to {1}'.format($.toHumaneNumber(d.valueExtent[0]), $.toHumaneNumber(d.valueExtent[1]));
          }
        }).
        attr('transform', function(d) {
          var halfTextWidth = this.getBoundingClientRect().width / 2;
          var halfSelectionWidth = (d.brushRight - d.brushLeft) / 2;
          var offset = halfSelectionWidth - halfTextWidth;
          return 'translate({0}, {1})'.format(offset, this.getBoundingClientRect().height);
        });

      var brushClearX = brushClear.selectAll('.brush-clear-x').
        data(brushClearData);

      brushClearX.enter().
        append('text').
        classed('brush-clear-x', true);

      brushClearX.
        text('×').
        attr('transform', function(d) {
          var brushTextBBox = brushClearText.node().getBoundingClientRect();
          var halfTextWidth = brushTextBBox.width / 2;
          var halfSelectionWidth = (d.brushRight - d.brushLeft) / 2;
          var offset = halfSelectionWidth + halfTextWidth + Constants.HISTOGRAM_CLEAR_X_OFFSET;
          return 'translate({0}, {1})'.format(offset, brushTextBBox.height);
        });

      var filterIcon = brushClear.selectAll('.filter-icon').
        data(brushClearData);

      filterIcon.enter().
        insert('path').
        classed('filter-icon', true).
        attr('d', FILTER_ICON_SVG_PATH);

      filterIcon.
        attr('transform', function(d) {
          var brushTextBBox = brushClearText.node().getBoundingClientRect();
          var halfTextWidth = brushTextBBox.width / 2;
          var halfSelectionWidth = (d.brushRight - d.brushLeft) / 2;
          var offset = halfSelectionWidth - halfTextWidth;
          return 'translate({0}, {1}) translate(0, 1) rotate(180) scale(0.015)'.format(offset, brushTextBBox.height);
        });

      brushClear.
        style('display', function(d) { return d.brushHasExtent ? null : 'none'; }).
        attr('transform', function(d) {
          return 'translate({0}, {1})'.format(d.brushLeft + d.leftOffset, d.top + d.offset);
        }).
        attr('height', function(d) {
          return '2em';
        }).
        attr('width', function(d) {
          return d.brushRight - d.brushLeft;
        });

      brushClear.exit().remove();

      this.brushDOM.select('.background').
        attr('style', 'fill: transparent; cursor: pointer; pointer-events: all;');

      dom.svg.call(setupBrushHandles, height, dom.margin.left);
    };

    return {
      create: function(id, dom) {
        return new HistogramBrush(id, dom);
      }
    }

  }

  angular.
    module('dataCards.services').
    factory('HistogramBrushService', HistogramVisualizationService);

})();
