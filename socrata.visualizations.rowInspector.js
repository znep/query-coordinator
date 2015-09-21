(function(root) {
  'use strict';

  if (!_.has(root, 'socrata.visualizations.Visualization')) {
    throw new Error(
      '`{0}` must be loaded before `{1}`'.
        format(
          'socrata.visualizations.Visualization.js',
          'socrata.visualizations.rowInspector.js'
        )
    );
  }

  var ROW_INSPECTOR_WIDTH = 350;
  var ROW_INSPECTOR_MAX_CONTENT_HEIGHT = 250;
  var ROW_INSPECTOR_WINDOW_PADDING = 22;
  var ROW_INSPECTOR_PADDING_COMPENSATION = 3;
  var ROW_INSPECTOR_HINT_WIDTH = 10;

  var ROW_INSPECTOR_DEFAULT_TRANSLATIONS = {
    previous: 'Previous',
    next: 'Next',
    defaultLabelUnit: 'Row',
    showing: 'Showing {0}',
    paging: '{0} of {1}'
  };

  var socrata = root.socrata;
  var utils = socrata.utils;

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

  function rowInspectorSetup(config) {
    _config = _.cloneDeep(config || {});

    _config.localization = _config.localization || {};
    _config.localization = _.merge({}, ROW_INSPECTOR_DEFAULT_TRANSLATIONS, _config.localization);

    _$rowInspectorContainer = $('#socrata-row-inspector');

    utils.assert(
      _$rowInspectorContainer.length === 1,
      'Could not find #socrata-row-inspector element, ' +
        'please ensure socrata.visualizations.rowInspector.html is included into the page.'
    );

    // Grab all children that we run operations on.
    _$rowInspectorToolPanel= _$rowInspectorContainer.find('.tool-panel');
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

    // Add translations
    _$paginationButtonPrevious.find('span').text(_config.localization.previous);
    _$paginationButtonNext.find('span').text(_config.localization.next);

    // rowInspectorSetup can be called multiple times
    // but we only want our bindings set once.
    _attachEventsOnce();
  }

  var _attachEventsOnce = _.once(function() {
    var $document = $(root.document);
    var $body = $(root.document.body);

    $body.on('SOCRATA_VISUALIZATION_ROW_INSPECTOR_SHOW', function(event, jQueryPayload) {
      // These events are CustomEvents. jQuery < 3.0 does not understand that
      // event.detail should be passed as an argument to the handler.
      var payload = jQueryPayload || _.get(event, 'originalEvent.detail');

      // Defer, otherwise the click that triggered this event will immediately close the flannel.
      _.defer(_show);
      _setState(payload);
    });

    $body.on('SOCRATA_VISUALIZATION_ROW_INSPECTOR_UPDATE', function(event, jQueryPayload) {
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

    $document.on('click', _captureLeftClickAndHide);
    $document.on('keydown', _captureEscapeAndHide);

    _$paginationButtonPrevious.on('click', _decrementPageByOne);
    _$paginationButtonNext.on('click', _incrementPageByOne);
  });

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
    _state.pageIndex = Math.max(0,  _state.pageIndex - 1);
    _render();
  }

  function _adjustPosition(position) {
    var hintRightOffset;
    var hintPositionFromRight;
    var xPosition = position.pageX;
    var yPosition = position.pageY;
    var windowWidth = $(window).width();
    var useSoutheastHint = false;

    var abutsRightEdge = windowWidth <
      (xPosition + ROW_INSPECTOR_WIDTH + ROW_INSPECTOR_WINDOW_PADDING);

    var panelPositionStyle = {'left': '', 'right': ''};
    var hintPositionStyle = {'left': '', 'right': ''};

    panelPositionStyle.top = '{0}px'.format(yPosition);

    if (abutsRightEdge) {
      useSoutheastHint = xPosition + (ROW_INSPECTOR_WIDTH / 2) >
        windowWidth - (ROW_INSPECTOR_WINDOW_PADDING + ROW_INSPECTOR_PADDING_COMPENSATION);

      panelPositionStyle.right = '{0}px'.format(
        ROW_INSPECTOR_WIDTH + ROW_INSPECTOR_PADDING_COMPENSATION + ROW_INSPECTOR_WINDOW_PADDING
      );

      hintRightOffset = xPosition + ROW_INSPECTOR_WINDOW_PADDING +
        (useSoutheastHint ? 0 : ROW_INSPECTOR_HINT_WIDTH);
      hintPositionFromRight = Math.max(0, windowWidth - hintRightOffset);

      hintPositionStyle.right = '{0}px'.format(hintPositionFromRight);
      hintPositionStyle.left = 'auto';
    } else {
      panelPositionStyle.left = '{0}px'.format(xPosition);
      useSoutheastHint = false;
    }

    _$rowInspectorToolPanel.css(panelPositionStyle);
    _$rowInspectorToolPanelHint.css(hintPositionStyle);
    _$rowInspectorToolPanel.toggleClass('southwest', !useSoutheastHint);
    _$rowInspectorToolPanel.toggleClass('southeast', useSoutheastHint);
  }


  function _render() {
    var rows = _state.rows;
    var position = _state.position;
    var hasRows = Array.isArray(rows) && rows.length;
    var isScrollable;
    var scrollingElement = _$rowInspectorContainer.find('.tool-panel-inner-container');

    // Set position
    _adjustPosition(position);

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

    root.socrata.utils.isolateScrolling(scrollingElement, isScrollable);
  }

  function _renderError() {
    var message = _state.message;
    var $errorMessage = _$rowInspectorContainer.find('.error-message');

    $errorMessage.text(message);
    _$errorContent.toggleClass('visible', _state.error);
  }

  function _renderPage() {
    var row = _.get(_state, 'rows[{0}]'.format(_state.pageIndex));

    _$rowInspectorContent.empty();

    // We may not have a row to render, but we still want to
    // render pagination and clean out a previously-rendered page.
    if (!row) {
      return;
    }

    utils.assert(Array.isArray(row), 'rowInspector data must be composed of an array of arrays');
    utils.assert(row.length > 0, 'This row is empty.');

    row.forEach(function(columnValue) {
      var $rowDataItem = $('<div>', {'class': 'row-data-item'});
      var $name = $('<span>', {'class': 'name'});
      var $value = $('<span>', {'class': 'value'});

      utils.assertHasProperties(columnValue, 'column', 'value');

      $name.text(columnValue.column);
      $value.text(columnValue.value);

      $rowDataItem.append($name).append($value);
      _$rowInspectorContent.append($rowDataItem);
    });
  }

  function _renderPagination() {
    var numRows = _.get(_state, 'rows.length');
    var labelUnit = _state.labelUnit;

    if (numRows > 1) {
      _$paginationMessage.text(_config.localization.showing.format(labelUnit));
      _$paginationPosition.text(_config.localization.paging.format(_state.pageIndex + 1, numRows));
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
  }

  function _setState(payload) {
    utils.assertIsOneOfTypes(payload, 'object');

    utils.assertHasProperties(payload, 'position', 'error');
    utils.assertHasProperties(payload.position, 'pageX', 'pageY');

    if (payload.data) {
      utils.assert(_.isArray(payload.data), 'rowInspector data must be an array');
    }

    _state = {
      rows: payload.error ? null : payload.data,
      labelUnit: payload.labelUnit || _config.localization.defaultLabelUnit,
      error: payload.error,
      message: payload.message,
      position: payload.position,
      pageIndex: 0
    };

    _render();
  }

  root.socrata.visualizations.rowInspector = {
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
     *       position: {clientX: 0, clientY: 0}, // Must be numbers
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
     *       position: {clientX: 0, clientY: 0} // Must be numbers
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
     * These translations will be merged into the default translations.
     * For other available keys, see ROW_INSPECTOR_DEFAULT_TRANSLATIONS in this file.
     */
    setup: rowInspectorSetup
  };
})(window);
