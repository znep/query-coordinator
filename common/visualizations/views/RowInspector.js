const utils = require('common/js_utils');
const _ = require('lodash');
const $ = require('jquery');
const I18n = require('common/i18n').default;

const ROW_INSPECTOR_WIDTH = 350;
const ROW_INSPECTOR_MAX_CONTENT_HEIGHT = 250;
const ROW_INSPECTOR_WINDOW_PADDING = 22;
const ROW_INSPECTOR_PADDING_COMPENSATION = 3;
const ROW_INSPECTOR_HINT_WIDTH = 10;

var _$rowInspectorContainer;
var _$rowInspectorToolPanel;
var _$rowInspectorContent;
var _$rowInspectorToolPanelHint;
var _$paginationButtonPrevious;
var _$paginationButtonNext;
var _$pagingPanel;
var _$paginationMessage;
var _$paginationPosition;
var _$pendingContent;
var _$errorContent;
var _$stickyBorderBottom;

var _config;
var _state;

var _$target;

/**
 * @function setup
 * @description
 *
 * Adds JavaScript functionality to a row inspector template.
 *
 * In this particular case, the row inspector is a flyout panel
 * that visualizes tabular data. It includes paging between
 * rows of the data, and showing per-column visualizations of
 * the row data.
 *
 * Events and Interaction:
 *
 *   - Example with Successful Payload:
 *
 *     { error: false,
 *       message: null,
 *       position: {pageX: 0, pageY: 0}, // Must be numbers
 *       labelUnit: null, // or a string literal
 *       data: [ // This attribute is optional, a spinner will be shown if missing/null.
 *         [ // Represents a row
 *           {column: 'columnName', value: 'columnValue' }, // Represents a column.
 *           ...
 *         ],
 *         ...
 *       ]
 *     }
 *
 *   - Example with Error Payload:
 *
 *     { error: true,
 *       message: 'There was an error',
 *       position: {pageX: 0, pageY: 0} // Must be numbers
 *     }
 *
 *   Event Names:
 *
 *   SOCRATA_VISUALIZATION_ROW_INSPECTOR_SHOW:
 *   - Places the row inspector where the mouse was clicked.
 *   - Optionally, Accepts a payload (See example payload)
 *   SOCRATA_VISUALIZATION_ROW_INSPECTOR_UPDATE:
 *   - Accepts a payload and loads the first row into the view.
 *   SOCRATA_VISUALIZATION_ROW_INSPECTOR_HIDE:
 *   - Hides the row inspector.
 *   SOCRATA_VISUALIZATION_ROW_INSPECTOR_HIDDEN:
 *   - Triggered after "HIDE" completes. Mainly for adjusting card properties after row inspector disappears.
 *
 * @param {Object} config - An object containing translations in a localization-keyed subobject.
 *
 * Example Configuration:
 *   config = {
 *     localization: {
 *       previous: 'PREVIOUS'
 *     }
 *   }
 *
 * @param {Object} $target - Target container. Falls back to body
 *
 * These translations will be merged into the default translations.
 * For other available keys, see ROW_INSPECTOR_DEFAULT_TRANSLATIONS in this file.
 */
function setup(config, $target) {
  _config = _.cloneDeep(config || {});
  _$target = $target || $('body');

  if (_$target.find('#socrata-row-inspector').length === 0) {

    if (_config.isMobile) {

      _$rowInspectorContainer = $(
        [
          '<div id="socrata-row-inspector">',
            '<div class="tool-panel">',
              '<div class="tool-panel-arrow"></div>',
              '<div class="tool-panel-main">',
                '<div class="icon-close"></div>',
                '<div class="paging-panel">',
                  '<button type="button" class="l-to-r paging-btn action-btn previous">',
                    '<span class="arrow"></span>',
                  '</button>',
                  '<button type="button" class="r-to-l paging-btn action-btn next">',
                    '<span class="arrow"></span>',
                  '</button>',
                  '<div class="paging-info">',
                    '<div class="message">',
                      '<div></div>',
                      '<div></div>',
                    '</div>',
                  '</div>',
                '</div>',
                '<div class="tool-panel-inner-container">',
                  '<!-- Successful query response -->',
                  '<div class="row-inspector-content">',
                    '<div class="row-data-item">',
                      '<span class="name"></span>',
                      '<span class="value"></span>',
                    '</div>',
                  '</div>',
                  '<!-- Loading spinner while query pending-->',
                  '<div class="pending-content"></div>',
                  '<!-- Error message if row query unsuccessful -->',
                  '<div class="error-content">',
                    '<div class="icon-row-inspector-warning" aria-label="row error warning"></div>',
                    '<div class="error-message"></div>',
                  '</div>',
                '</div>',
                '<div class="sticky-border bottom show-more">',
                  '<a class="show-more-button">',
                  '<span class="show-details">Show More</span>',
                  '<span class="hide-details">Show Less</span>',
                  '</a>',
                '</div>',
              '</div>',
            '</div>',
          '</div>'
        ].join('')
      );

    } else {

      _$rowInspectorContainer = $(
        [
          '<div id="socrata-row-inspector">',
            '<div class="tool-panel">',
              '<div class="tool-panel-main">',
                '<div class="icon-close" aria-label="close"></div>',
                '<div class="sticky-border"></div>',
                '<div class="tool-panel-inner-container">',
                  '<!-- Successful query response -->',
                  '<div class="row-inspector-content">',
                    '<div class="row-data-item">',
                      '<span class="name"></span>',
                      '<span class="value"></span>',
                    '</div>',
                  '</div>',
                  '<!-- Loading spinner while query pending-->',
                  '<div class="pending-content"></div>',
                  '<!-- Error message if row query unsuccessful -->',
                  '<div class="error-content">',
                    '<div class="icon-warning"></div>',
                    '<div class="error-message"></div>',
                  '</div>',
                '</div>',
                '<div class="sticky-border bottom"></div>',
                '<div class="paging-panel">',
                  '<button aria-label="previous" type="button" class="l-to-r paging-btn action-btn previous">',
                    '<span class="caret" aria-hidden="true"></span>',
                  '</button>',
                  '<button aria-label="next" type="button" class="r-to-l paging-btn action-btn next">',
                    '<span class="caret" aria-hidden="true"></span>',
                  '</button>',
                  '<div class="paging-info">',
                    '<div class="message">',
                      '<div></div>',
                      '<div></div>',
                    '</div>',
                  '</div>',
                '</div>',
                '<div class="tool-panel-hint"></div>',
              '</div>',
            '</div>',
          '</div>'
        ].join('')
      );

    }

    _$target.append(_$rowInspectorContainer);

    _assignChildren();

    // rowInspectorSetup can be called multiple times
    // but we only want our bindings set once.
    _attachEventsOnce();

    // Replacing the template means we need to rebind these
    // events.
    _$paginationButtonPrevious.on('click', _decrementPageByOne);
    _$paginationButtonNext.on('click', _incrementPageByOne);

  } else {

    _$rowInspectorContainer = _$target.find('#socrata-row-inspector');
    _assignChildren();
  }

  // Add translations
  if (!_config.isMobile) {
    _$paginationButtonPrevious.find('span').text(
      I18n.t('shared.visualizations.charts.row_inspector.previous')
    );
    _$paginationButtonNext.find('span').text(
      I18n.t('shared.visualizations.charts.row_inspector.next')
    );
  }
}

var _attachEventsOnce = _.once(function() {
  var $document = $(document);
  var $body = $(document.body);

  _$target.on('SOCRATA_VISUALIZATION_ROW_INSPECTOR_SHOW', function(event, jQueryPayload) {
    event.stopPropagation();

    // These events are CustomEvents. jQuery < 3.0 does not understand that
    // event.detail should be passed as an argument to the handler.
    var payload = jQueryPayload || _.get(event, 'originalEvent.detail');

    // Defer, otherwise the click that triggered this event will immediately close the flannel.
    _.defer(_show);
    _setState(payload);
  });

  _$target.on('SOCRATA_VISUALIZATION_ROW_INSPECTOR_UPDATE', function(event, jQueryPayload) {
    event.stopPropagation();

    // These events are CustomEvents. jQuery < 3.0 does not understand that
    // event.detail should be passed as an argument to the handler.
    var payload = jQueryPayload || _.get(event, 'originalEvent.detail');

    if (_.isUndefined(payload.position)) {
      // Reuse position from SOCRATA_VISUALIZATION_ROW_INSPECTOR_SHOW if not specified.
      payload.position = _state.position;
    }

    _setState(payload);
  });

  $body.on('SOCRATA_VISUALIZATION_ROW_INSPECTOR_HIDE', _hide);
  $body.on('SOCRATA_VISUALIZATION_ROW_INSPECTOR_ADJUST_POSITION', _render);

  $document.on('click', _captureLeftClickAndHide);
  $document.on('keydown', _captureEscapeAndHide);
});

function _assignChildren() {
  // Grab all children that we run operations on.
  _$rowInspectorToolPanel = _$rowInspectorContainer.find('.tool-panel');
  _$rowInspectorContent = _$rowInspectorContainer.find('.row-inspector-content');
  _$pendingContent = _$rowInspectorContainer.find('.pending-content');
  _$errorContent = _$rowInspectorContainer.find('.error-content');
  _$rowInspectorToolPanelHint = _$rowInspectorContainer.find('.tool-panel-hint');
  _$paginationButtonPrevious = _$rowInspectorContainer.find('.paging-btn.previous');
  _$paginationButtonNext = _$rowInspectorContainer.find('.paging-btn.next');
  _$pagingPanel = _$rowInspectorContainer.find('.paging-panel');
  _$paginationMessage = _$rowInspectorContainer.find('.paging-info .message div:first-child');
  _$paginationPosition = _$rowInspectorContainer.find('.paging-info .message div + div');
  _$stickyBorderBottom = _$rowInspectorContainer.find('.sticky-border.bottom');
}

function _captureLeftClickAndHide(event) {
  var $target = $(event.target);
  var isLeftClick = event.which === 1;
  var isOutsideOfRowInspector = $target.closest(_$rowInspectorContainer).length === 0;
  var isIconClose = $target.is('.icon-close');

  if (isLeftClick && (isOutsideOfRowInspector || isIconClose)) {
    _hide();
  }
}

function _captureEscapeAndHide(event) {
  if (event.which === 27) {
    _hide();
  }
}

function _incrementPageByOne() {
  _state.pageIndex = Math.min(_state.pageIndex + 1, _state.rows.length - 1);
  _render();
}

function _decrementPageByOne() {
  _state.pageIndex = Math.max(0, _state.pageIndex - 1);
  _render();
}

function _adjustPosition(position) {
  var hintRightOffset;
  var hintPositionFromRight;
  var distanceOutOfView = $(window).scrollTop();
  var xPosition = position.pageX;
  var yPosition = position.pageY;
  var windowWidth = $(window).width();
  var windowHeight = $(window).innerHeight();
  var positionFlannelEast = false;
  var positionFlannelNorth = false;

  var abutsRightEdge = windowWidth <
    (xPosition + ROW_INSPECTOR_WIDTH + ROW_INSPECTOR_WINDOW_PADDING);

  var panelPositionStyle = {left: '', right: ''};
  var hintPositionStyle = {left: '', right: ''};

  panelPositionStyle.top = '{0}px'.format(yPosition);

  // Display flannel above clicked point if the point is more than halfway
  // down the window viewport. Else display flannel below the point.
  positionFlannelNorth = (yPosition - distanceOutOfView) < (windowHeight / 2);

  if (abutsRightEdge) {
    positionFlannelEast = xPosition + (ROW_INSPECTOR_WIDTH / 2) >
      windowWidth - (ROW_INSPECTOR_WINDOW_PADDING + ROW_INSPECTOR_PADDING_COMPENSATION);

    panelPositionStyle.right = '{0}px'.format(
      ROW_INSPECTOR_WIDTH + ROW_INSPECTOR_PADDING_COMPENSATION + ROW_INSPECTOR_WINDOW_PADDING
    );

    hintRightOffset = xPosition + ROW_INSPECTOR_WINDOW_PADDING +
      (positionFlannelEast ? 0 : ROW_INSPECTOR_HINT_WIDTH);
    hintPositionFromRight = Math.max(0, windowWidth - hintRightOffset);

    hintPositionStyle.right = '{0}px'.format(hintPositionFromRight);
    hintPositionStyle.left = 'auto';
  } else {
    panelPositionStyle.left = '{0}px'.format(xPosition);
    positionFlannelEast = false;
  }

  _$rowInspectorToolPanel.css(panelPositionStyle);
  _$rowInspectorToolPanelHint.css(hintPositionStyle);
  _$rowInspectorToolPanel.toggleClass('west', !positionFlannelEast);
  _$rowInspectorToolPanel.toggleClass('east', positionFlannelEast);
  _$rowInspectorToolPanel.toggleClass('south', !positionFlannelNorth);
  _$rowInspectorToolPanel.toggleClass('north', positionFlannelNorth);
}


function _render() {
  var rows = _state.rows;
  var position = _state.position;
  var hasRows = Array.isArray(rows) && rows.length;
  var isScrollable;
  var scrollingElement = _$rowInspectorContainer.find('.tool-panel-inner-container');

  // Set position
  if (!_config.isMobile) {
    _adjustPosition(position);
  }

  // Set initial paging button states
  _$paginationButtonPrevious.prop('disabled', true);
  _$paginationButtonNext.prop('disabled', true);

  // Conditionally hide the pending content
  _$pendingContent.toggleClass('visible', !hasRows && !_state.error);

  _renderPage();
  _renderPagination();
  _renderError();

  isScrollable = _$rowInspectorContent.innerHeight() >
    ROW_INSPECTOR_MAX_CONTENT_HEIGHT;

  utils.isolateScrolling(scrollingElement, isScrollable);
  _$rowInspectorToolPanel.toggleClass('scrollable', isScrollable);
}

function _renderError() {
  var message = _state.message;
  var $errorMessage = _$rowInspectorContainer.find('.error-message');

  $errorMessage.text(message);
  _$errorContent.toggleClass('visible', _state.error);
}

function _renderPage() {
  var row = _.get(_state, ['rows', _state.pageIndex]);
  var title = _.get(_state, ['titles', _state.pageIndex]);

  _$rowInspectorContent.empty();

  // We may not have a row to render, but we still want to
  // render pagination and clean out a previously-rendered page.
  if (!row) {
    return;
  }

  utils.assert(Array.isArray(row), 'rowInspector data must be composed of an array of arrays');
  utils.assert(row.length > 0, 'This row is empty.');

  if (title) {
    _$rowInspectorContent.append('<h3 class="row-inspector-title">{0}</h3>'.format(title));
  }

  row.forEach(function(columnValue) {
    var $rowDataItem = $('<div>', {'class': 'row-data-item'});
    var $name = $('<span>', {'class': 'name'});
    var $value = $('<span>', {'class': 'value'});

    utils.assertHasProperties(columnValue, 'column', 'value');

    $name.html(columnValue.column);
    $value.html(columnValue.value);

    $rowDataItem.append($name).append($value);
    _$rowInspectorContent.append($rowDataItem);
  });
}

function _renderPagination() {
  var numRows = _.get(_state, 'rows.length');
  var labelUnit = _state.labelUnit;

  if (numRows > 1) {
    _$paginationMessage.text(
      I18n.t('shared.visualizations.charts.row_inspector.showing').
        format(labelUnit)
    );
    _$paginationPosition.text(
      I18n.t('shared.visualizations.charts.row_inspector.paging').
        format(_state.pageIndex + 1, numRows)
    );
    _$paginationButtonPrevious.prop('disabled', _state.pageIndex === 0);
    _$paginationButtonNext.prop('disabled', _state.pageIndex === numRows - 1);

    _$pagingPanel.addClass('visible');
    _$stickyBorderBottom.css('bottom', _$pagingPanel.outerHeight());
  } else {
    _$pagingPanel.removeClass('visible');
    _$stickyBorderBottom.css('bottom', 0);
  }
}

function _show() {
  _$rowInspectorContainer.addClass('visible');
}

function _hide() {
  _$rowInspectorContainer.removeClass('visible');
  _$target.trigger('SOCRATA_VISUALIZATION_ROW_INSPECTOR_HIDDEN');
}

function _setState(payload) {
  utils.assertIsOneOfTypes(payload, 'object');

  utils.assertHasProperties(payload, 'position', 'error');
  utils.assertHasProperties(payload.position, 'pageX', 'pageY');

  if (payload.data) {
    utils.assert(_.isArray(payload.data), 'rowInspector row data must be an array');
  }

  if (payload.titles) {
    utils.assert(_.isArray(payload.titles), 'rowInspector title data must be an array');
  }

  _state = {
    rows: payload.error ? null : payload.data,
    titles: payload.error ? null : payload.titles,
    labelUnit: payload.labelUnit || I18n.t('shared.visualizations.charts.row_inspector.default_label_unit'),
    error: payload.error,
    message: payload.message,
    position: payload.position,
    pageIndex: 0
  };

  _render();
}

module.exports = {
  setup: setup
};
