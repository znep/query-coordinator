var $ = require('jquery');
var utils = require('socrata-utils');
var Visualization = require('./Visualization.js');
var _ = require('lodash');
var DataTypeFormatter = require('./DataTypeFormatter.js');

module.exports = function Table(element, vif) {
  _.extend(this, new Visualization(element, vif));

  var SORT_ICON_WIDTH = 32;

  var self = this;
  var _lastRenderData;
  var _lastRenderOptions;
  var _scrollbarHeightPx;

  // If defined, this is an object that maps column name to pixel widths.
  // See freezeColumnWidths().
  var _columnWidths;

  utils.assertHasProperties(
    vif,
    'configuration.localization.LATITUDE',
    'configuration.localization.LONGITUDE'
  );

  _attachEvents(this.element);

  /**
   * Public Methods
   */

  this.render = function(data, options) {
    utils.assertHasProperties(data, 'rows', 'columns', 'datasetMetadata');
    if (_.isEqual(_lastRenderData, data) && _.isEqual(_lastRenderOptions, options)) {
      return;
    }

    _lastRenderData = data;
    _lastRenderOptions = options;

    _render(data, options);
  };

  /**
   * Compute how many rows can fit into the given pixel height (taking into account header
   * size).
   * NOTE: This assumes each row is the same vertical height, no matter the content.
   * Currently this is true due to how the table is styled. Caveat emptor.
   */
  this.howManyRowsCanFitInHeight = function(overallHeightPx) {
    if (!_.isFinite(overallHeightPx)) {
      return 0;
    }

    var currentRenderData = _lastRenderData;
    var currentRenderOptions = _lastRenderOptions;
    var headerHeightPx;
    var rowHeightPx;
    var heightLeftAfterHeaderPx;
    var maxRowCount;
    var alreadyHasData = _lastRenderData && _lastRenderOptions && _lastRenderData.rows.length > 0;

    // We need some data in the table to do the measurements.
    // If there is none there, render a placeholder.
    if (!alreadyHasData) {
      // Render sample data into the table. Used for UI element measurement.
      self.render(
        {
          columns: [ 'placeholder' ],
          rows: [ [ 'placeholder' ] ],
          datasetMetadata: { columns: [ { fieldName: 'placeholder', renderTypeName: 'text' } ] }
        },
        [ {} ]
      );
    }

    utils.assertInstanceOf(element.find('thead')[0], HTMLElement);
    utils.assertInstanceOf(element.find('tbody tr')[0], HTMLElement);

    // Measure.
    headerHeightPx = element.find('thead')[0].getBoundingClientRect().height;
    rowHeightPx = element.find('tbody tr')[0].getBoundingClientRect().height;

    // Compute
    heightLeftAfterHeaderPx = overallHeightPx - headerHeightPx - _scrollbarHeightPx;
    numberOfRows = heightLeftAfterHeaderPx / rowHeightPx;

    if (_.isFinite(numberOfRows)) {
      maxRowCount = Math.max(0, Math.floor(numberOfRows));
    } else {
      maxRowCount = 0;
    }

    // If we rendered placeholder data, remove it.
    if (!alreadyHasData) {
      element.find('.table-container').remove();
    }

    return maxRowCount;
  };

  this.destroy = function() {
    _detachEvents(this.element);
    this.element.find('.socrata-table').remove();
  };

  // Causes all columns to maintain their absolute widths, regardless of any new content.
  // If a column is added after this function is called, the new column will get a default
  // width of 150px.
  this.freezeColumnWidthsAndRender = function() {
    // TODO If we implement persistent column resizing, this function
    // should be modified to simply return columnWidths for later use
    // as a render option.
    var headerWidths = element.find('thead th').map(function() {
      return this.getBoundingClientRect().width;
    });

    _columnWidths = _.zipObject(
      _lastRenderData.columns,
      headerWidths
    );

    _render(_lastRenderData, _lastRenderOptions);
  };

  /**
   * Private Methods
   */

  function _templateTableCell(column, cell) {
    return [
      '<td>',
        '<div>',
          DataTypeFormatter.renderCell(cell, column, {
            latitude: vif.configuration.localization.LATITUDE,
            longitude: vif.configuration.localization.LONGITUDE
          }),
        '</div>',
      '</td>'
    ].join('');
  }

  function _templateTableSortedHeader() {
    return [
      '<th data-column-name="{columnName}" data-column-description="{columnDescription}" data-sort>',
        '{columnTitle}<span class="icon-{sortDirection}"></span>',
      '</th>'
    ].join('');
  }

  function _templateTableHeader() {
    return [
      '<th data-column-name="{columnName}" data-column-description="{columnDescription}">',
        '{columnTitle}',
      '</th>'
    ].join('');
  }

  function _templateTable(data, options) {
    var activeSort = options[0];

    return _.flatten([
      '<div class="socrata-table">',
        '<table>',
          '<thead>',
            '<tr>',
              data.columns.map(function(columnName) {
                var template = activeSort.columnName === columnName ?
                  _templateTableSortedHeader() :
                  _templateTableHeader();

                var column = _.find(data.datasetMetadata.columns, function(column) {
                  return column.fieldName === columnName;
                });

                return template.format({
                  columnName: columnName,
                  columnTitle: column && column.name || columnName,
                  columnDescription: column && column.description || '',
                  sortDirection: activeSort.ascending ? 'arrow-down' : 'arrow-up' //TODO
                });
              }),
            '</tr>',
          '</thead>',
          '<tbody>',
            _.map(data.rows, function(row) {
              if (!row) {
                return '<tr class="null-row"></tr>';
              }

              return '<tr>' + data.columns.map(function(columnName, columnIndex) {
                var column = _.find(
                  data.datasetMetadata.columns,
                  {
                    fieldName: columnName
                  }
                );
                return _templateTableCell(column, row[columnIndex])
              }).join('\n') + '</tr>';
            }),
          '</tbody>',
        '</table>',
      '</div>'
    ]).join('\n');
  }

  function _render(data, options) {
    var $existingTable = self.element.find('.socrata-table');
    var $template = $(_templateTable(data, options));
    var scrollLeft = _.get($existingTable, '[0].scrollLeft') || 0;
    var $newTable;

    _applyFrozenColumns($template);
    if ($existingTable.length) {
      $existingTable.replaceWith($template);
    } else {
      self.element.append($template);
    }

    $newTable = self.element.find('.socrata-table');
    $newTable[0].scrollLeft = scrollLeft;

    // Cache the scrollbar height for later use.
    _scrollbarHeightPx = _scrollbarHeightPx || $newTable[0].offsetHeight - $newTable[0].clientHeight;
  }

  function _attachEvents(element) {
    self.element.on('click', '.socrata-table thead th', _handleRowHeaderClick);

    self.element.on('mouseenter mousemove', '.socrata-table thead th', _showDescriptionFlyout);
    self.element.on('mouseleave', '.socrata-table thead th', _hideDescriptionFlyout);

    self.element.on('mouseenter mousemove', '.socrata-table tbody td', _showCellFlyout);
    self.element.on('mouseleave', '.socrata-table tbody td', _hideCellFlyout);
  }

  function _detachEvents(element) {
    self.element.off('click', '.socrata-table thead th', _handleRowHeaderClick);

    self.element.off('mouseenter mousemove', '.socrata-table thead th', _showDescriptionFlyout);
    self.element.off('mouseleave', '.socrata-table thead th', _hideDescriptionFlyout);

    self.element.off('mouseenter mousemove', '.socrata-table tbody td', _showCellFlyout);
    self.element.off('mouseleave', '.socrata-table tbody td', _hideCellFlyout);
  }

  function _showDescriptionFlyout(event) {
    var $target = $(event.currentTarget);
    var description = $target.data('column-description');

    if (description && description.length > 0) {
      self.emitEvent(
        'SOCRATA_VISUALIZATION_COLUMN_FLYOUT',
        {
          element: $target[0],
          content: description,
          belowTarget: true,
          rightSideHint: false
        }
      );
    }
  }

  function _hideDescriptionFlyout(event) {
    var $target = $(event.currentTarget);

    self.emitEvent(
      'SOCRATA_VISUALIZATION_COLUMN_FLYOUT',
      null
    );
  }

  function _showCellFlyout(event) {
    var $target = $(event.currentTarget).find('div');
    var data = $target.text();
    var overflowing = $target[0].clientWidth < $target[0].scrollWidth;

    if (overflowing) {
      self.emitEvent(
        'SOCRATA_VISUALIZATION_CELL_FLYOUT',
        {
          element: $target[0],
          content: data,
          belowTarget: true,
          rightSideHint: false
        }
      );
    }
  }

  function _hideCellFlyout() {
    self.emitEvent(
      'SOCRATA_VISUALIZATION_CELL_FLYOUT',
      null
    );
  }

  function _handleRowHeaderClick() {
    var columnName = this.getAttribute('data-column-name');
    if (columnName) {
      self.emitEvent('SOCRATA_VISUALIZATION_COLUMN_CLICKED', columnName);
    }
  }

  function _applyFrozenColumns($template) {
    $template.toggleClass('frozen-columns', !!_columnWidths);
    $template.find('thead th').each(function() {
      var $th = $(this);
      var columnName = $th.attr('data-column-name');
      var frozenWidth = _.get(_columnWidths, columnName, 150);
      $th.width(frozenWidth + SORT_ICON_WIDTH);
    });
  }
};
