const utils = require('socrata-utils');
const $ = require('jquery');
const _ = require('lodash');
const SvgVisualization = require('./SvgVisualization.js');
const DataTypeFormatter = require('./DataTypeFormatter.js');
const I18n = require('../I18n');

module.exports = function Table(element, originalVif) {
  _.extend(this, new SvgVisualization(element, originalVif));

  var SORT_ICON_WIDTH = 32;
  var MINIMUM_COLUMN_WIDTH = 48;

  var self = this;
  var vifToRender = originalVif;
  var dataToRender;
  // Because we need to hook into the renderError function call but want to be
  // able to call the 'super' once we do so, we cache the original version of
  // this.renderError for use in our overridden version later.
  //
  // Note that we lose the 'this' context when we do this so we need to re-bind
  // it.
  var superRenderError = this.renderError.bind(this);
  var scrollbarHeightPx;

  // If defined, this is an object that maps column name to pixel widths.
  // See freezeColumnWidthsAndRender().
  var columnWidths;
  var columnWidthsFromVif = {};

  // Handle column width resizing
  var activeResizeColumnName = null;
  var activeResizeXStart = 0;
  var activeResizeXEnd = 0;

  attachEvents();

  /**
   * Public Methods
   */

  this.render = function(newVif, newData) {

    if (_.isEqual(vifToRender, newVif) && _.isEqual(dataToRender, newData)) {
      return;
    }

    if (newVif) {
      vifToRender = newVif;
    }

    if (newData) {
      dataToRender = newData;
    }

    columnWidthsFromVif = {};
    _.get(vifToRender, 'configuration.tableColumnWidths', []).
      forEach(
        function(columnWidthFromVif) {

          if (
            columnWidthFromVif.hasOwnProperty('columnName') &&
            columnWidthFromVif.hasOwnProperty('width')
          ) {
            columnWidthsFromVif[columnWidthFromVif.columnName] = columnWidthFromVif.width;
          }
        }
      );

    render(newVif, newData);
  };

  this.renderError = function() {

    self.
      $element.
        find('.visualization-container').
          removeClass('loaded');

    superRenderError(
      I18n.translate('visualizations.table.error_unable_to_render')
    );
  };

  /**
   * Compute how many rows can fit into the given pixel height (taking into account header
   * size).
   * NOTE: This assumes each row is the same vertical height, no matter the content.
   * Currently this is true due to how the table is styled. Caveat emptor.
   */
  this.howManyRowsCanFitInHeight = function(overallHeightPx) {
    var headerHeightPx;
    var rowHeightPx;
    var heightLeftAfterHeaderPx;
    var maxRowCount;
    var numberOfRows;
    var alreadyHasData = dataToRender && dataToRender.rows.length > 0;

    if (!_.isFinite(overallHeightPx)) {
      return 0;
    }

    // We need some data in the table to do the measurements.
    // If there is none there, render a placeholder.
    if (!alreadyHasData) {
      // Render sample data into the table. Used for UI element measurement.
      //
      // We assign the values below in the same way that they are assigned in
      // the public this.render() function, but we call the private render()
      // function directly so that we can pass extra arguments to it without
      // having to make the public interface understand these extra arguments.
      dataToRender = {
        columns: [ { fieldName: 'placeholder', renderTypeName: 'text' } ],
        rows: [ [ 'placeholder' ] ]
      };

      render(vifToRender, dataToRender, true);
    }

    utils.assertInstanceOf(element.find('thead')[0], HTMLElement);
    utils.assertInstanceOf(element.find('tbody tr')[0], HTMLElement);

    // Measure.
    headerHeightPx = element.find('thead').outerHeight();
    rowHeightPx = element.find('tbody tr').outerHeight();

    // Compute
    heightLeftAfterHeaderPx = overallHeightPx - headerHeightPx - scrollbarHeightPx;
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
    detachEvents();
    this.$element.find('.socrata-table').remove();
  };

  // Causes all columns to maintain their absolute widths, regardless of any new content.
  // If a column is added after this function is called, the new column will get a default
  // width of 150px.
  this.freezeColumnWidthsAndRender = function() {
    // TODO If we implement persistent column resizing, this function
    // should be modified to simply return columnWidths for later use
    // as a render option.
    var headerWidths = self.
      $element.
        find('thead th').
          map(
            function() {
              var columnName = $(this).find('.column-header-content').attr('data-column-name');

              return (columnWidthsFromVif.hasOwnProperty(columnName)) ?
                columnWidthsFromVif[columnName] :
                this.getBoundingClientRect().width;
            }
          );
    var columns = _.map(dataToRender.columns, 'fieldName');

    columnWidths = _.zipObject(
      columns,
      headerWidths
    );

    render(vifToRender, dataToRender);
  };

  /**
   * Private Methods
   */

  function templateTableCell(column, cell) {
    return [
      '<td data-cell-render-type="{renderTypeName}">',
        '<div>',
          DataTypeFormatter.renderCell(
            cell,
            column,
            _.get(vifToRender, 'series[0].dataSource.domain'),
            _.get(vifToRender, 'series[0].dataSource.datasetUid')
          ),
        '</div>',
      '</td>'
    ].join('').format(column);
  }

  function templateTableSortedHeader(options) {
    var resizeTarget = (options.isLastColumn) ?
      '<div class="column-resize-target column-resize-target-last{isResizingThisColumn}" data-column-name="{columnName}"></div>' :
      '<div class="column-resize-target{isResizingThisColumn}" data-column-name="{columnName}"></div>';

    return [
      '<th scope="col">',
        '<div class="column-header-content" data-column-name="{columnName}" data-column-description="{columnDescription}" data-column-render-type="{renderTypeName}" data-sort>',
          '<span class="column-header-content-column-name">{columnTitle}</span>',
          '<span class="icon-{sortDirection}"></span></div>',
        resizeTarget,
      '</th>'
    ].
      join('').
      format(options);
  }

  function templateTableUnsortableHeader(options) {
    var resizeTarget = (options.isLastColumn) ?
      '<div class="column-resize-target column-resize-target-last{isResizingThisColumn}" data-column-name="{columnName}"></div>' :
      '<div class="column-resize-target{isResizingThisColumn}" data-column-name="{columnName}"></div>';

    return [
      '<th scope="col">',
        '<div class="column-header-content" data-column-name="{columnName}" data-column-description="{columnDescription}" data-column-render-type="{renderTypeName}">',
          '<span class="column-header-content-column-name">{columnTitle}</span>',
        '</div>',
        resizeTarget,
      '</th>'
    ].
      join('').
      format(options);
  }

  function templateTableHeader(options) {
    var resizeTarget = (options.isLastColumn) ?
      '<div class="column-resize-target column-resize-target-last{isResizingThisColumn}" data-column-name="{columnName}"></div>' :
      '<div class="column-resize-target{isResizingThisColumn}" data-column-name="{columnName}"></div>';

    return [
      '<th scope="col">',
        '<div class="column-header-content" data-column-name="{columnName}" data-column-description="{columnDescription}" data-column-render-type="{renderTypeName}">',
          '<span class="column-header-content-column-name">{columnTitle}</span>',
          '<span class="icon-arrow-down"></span></div>',
        resizeTarget,
      '</th>'
    ].
      join('').
      format(options);
  }

  function templateTable(vif, data) {
    var activeSort = _.get(vif, 'configuration.order[0]');

    return _.flatten([
      '<div class="socrata-table">',
        '<table>',
          '<thead>',
            '<tr>',
              data.columns.map(function(column, i) {
                var template;
                var templateOptions = {
                  columnName: column.fieldName,
                  columnTitle: (column && column.name) || column.fieldName,
                  columnDescription: (column && column.description) || '',
                  renderTypeName: (column && column.renderTypeName) || '',
                  sortDirection: activeSort.ascending ? 'arrow-down' : 'arrow-up',
                  isLastColumn: (i === (data.columns.length - 1)),
                  isResizingThisColumn: (column.fieldName === activeResizeColumnName) ? ' resizing' : ''
                };

                if (isGeometryType(column)) {
                  template = templateTableUnsortableHeader(templateOptions);
                } else if (activeSort.columnName === column.fieldName) {
                  template = templateTableSortedHeader(templateOptions);
                } else {
                  template = templateTableHeader(templateOptions);
                }

                return template;
              }),
            '</tr>',
          '</thead>',
          '<tbody>',
            _.map(data.rows, function(row) {
              if (!row) {
                return '<tr class="null-row"><td></td></tr>';
              }

              return '<tr>' + data.columns.map(function(column, columnIndex) {
                return templateTableCell(column, row[columnIndex]);
              }).join('\n') + '</tr>';
            }),
          '</tbody>',
        '</table>',
      '</div>'
    ]).join('\n');
  }

  function render(vif, data, skipLoadedEvent) {
    var $existingTable = self.$element.find('.socrata-table');
    var $template = $(templateTable(vif, data));
    var scrollLeft = _.get($existingTable, '[0].scrollLeft') || 0;
    var $newTable;

    applyFrozenColumns($template);

    if ($existingTable.length) {

      $existingTable.replaceWith($template);

    } else {

      self.
        $element.
          find('.visualization-container').
            append($template);
    }

    $newTable = self.$element.find('.socrata-table');
    $newTable[0].scrollLeft = scrollLeft;

    if (activeResizeColumnName !== null) {
      $('.column-resize-target[data-column-name="{0}"]'.format(activeResizeColumnName)).addClass('resizing');
    }

    // Cache the scrollbar height for later use.
    scrollbarHeightPx = scrollbarHeightPx || $newTable[0].offsetHeight - $newTable[0].clientHeight;

    // Because we render placeholder data for measurement
    if (!skipLoadedEvent) {

      self.
        $element.
          find('.visualization-container').
            addClass('loaded');
    }
  }

  function attachEvents() {
    $(window).on('mousemove', handleMousemove);
    $(window).on('mouseup', handleMouseup);

    self.$element.on('mousedown', '.socrata-table thead th .column-resize-target', handleResizeTargetMousedown);
    self.$element.on('click', '.socrata-table thead th .column-header-content', handleColumnHeaderClick);

    self.$element.on('mouseenter mousemove', '.socrata-table thead th', showDescriptionFlyout);
    self.$element.on('mouseleave', '.socrata-table thead th', hideDescriptionFlyout);

    self.$element.on('mouseenter mousemove', '.socrata-table tbody td', showCellFlyout);
    self.$element.on('mouseleave', '.socrata-table tbody td', hideCellFlyout);
  }

  function detachEvents() {
    $(window).off('mousemove', handleMousemove);
    $(window).off('mouseup', handleMouseup);

    self.$element.off('mousedown', '.socrata-table thead th .column-resize-target', handleResizeTargetMousedown);
    self.$element.off('click', '.socrata-table thead th .column-header-content', handleColumnHeaderClick);

    self.$element.off('mouseenter mousemove', '.socrata-table thead th', showDescriptionFlyout);
    self.$element.off('mouseleave', '.socrata-table thead th', hideDescriptionFlyout);

    self.$element.off('mouseenter mousemove', '.socrata-table tbody td', showCellFlyout);
    self.$element.off('mouseleave', '.socrata-table tbody td', hideCellFlyout);
  }

  function showDescriptionFlyout(event) {
    var $target = $(event.currentTarget).find('.column-header-content');
    var title = $target.find('.column-header-content-column-name').text();
    var noColumnDescription = '<em>{noColumnDescription}</em>';
    var description = $target.attr('data-column-description') || noColumnDescription;
    var content = [
      '<span>{title}</span><br>',
      '<span>{description}</span>'
    ].join('\n');

    // Don't distract the user if they are resizing a column
    // (activeResizeColumnName is set to the name of the column being resized
    // at the start of the resize action, and reset to null when the resize
    // action is complete).
    if (activeResizeColumnName === null) {

      content = content.format({
        title: title,
        description: description,
        noColumnDescription: I18n.translate('visualizations.table.no_column_description')
      });

      self.emitEvent(
        'SOCRATA_VISUALIZATION_COLUMN_FLYOUT',
        {
          element: $target[0],
          content: content,
          belowTarget: true,
          rightSideHint: false,
          dark: true
        }
      );
    }
  }

  function hideDescriptionFlyout() {
    self.emitEvent(
      'SOCRATA_VISUALIZATION_COLUMN_FLYOUT',
      null
    );
  }

  function showCellFlyout(event) {
    var $target = $(event.currentTarget).find('div');
    var data = $target.text();
    // Sometimes $target doesn't seem to have any elements associated with it.
    var isOverflowing = (!_.isUndefined($target[0])) ?
      $target[0].clientWidth < $target[0].scrollWidth :
      false;

    // IE will incorrectly set isOverflowing to true for empty cells.
    if (isOverflowing && String(data).length > 0) {
      self.emitEvent(
        'SOCRATA_VISUALIZATION_CELL_FLYOUT',
        {
          element: $target[0],
          content: data,
          belowTarget: true,
          rightSideHint: false,
          dark: true
        }
      );
    }
  }

  function hideCellFlyout() {
    self.emitEvent(
      'SOCRATA_VISUALIZATION_CELL_FLYOUT',
      null
    );
  }

  function isGeometryType(column) {
    return _.includes([
      'point',
      'multipoint',
      'line',
      'multiline',
      'polygon',
      'multipolygon',
      'location'
    ], column.renderTypeName);
  }

  function handleResizeTargetMousedown(event) {
    var columnName = this.getAttribute('data-column-name');

    event.originalEvent.stopPropagation();
    event.originalEvent.preventDefault();

    $(this).addClass('resizing');

    // We need to set this for when the table gets re-rendered.
    activeResizeColumnName = columnName;
    activeResizeXStart = event.originalEvent.clientX;
  }

  function handleMousemove(event) {

    // If we are currently resizing a column activeResizeColumnName will be
    // non-null; it is reset to null once the resize operation is complete.
    if (activeResizeColumnName !== null) {

      activeResizeXEnd = event.originalEvent.clientX;
      columnWidths[activeResizeColumnName] += (activeResizeXEnd - activeResizeXStart);
      activeResizeXStart = activeResizeXEnd;

      delete columnWidthsFromVif[activeResizeColumnName];

      render(vifToRender, dataToRender);
    }
  }

  function handleMouseup() {
    var newColumnWidths = [];

    // If we are currently resizing a column activeResizeColumnName will be
    // non-null; it is reset to null once the resize operation is complete.
    if (activeResizeColumnName !== null) {

      activeResizeColumnName = null;
      // Just do a blanket removeClass instead of trying to remove it only from
      // the one that was active (there will probably be less than 100 of these
      // elements in most meaningful situations).
      $('.column-resize-target').removeClass('resizing');

      self.
        $element.
          find('thead th').
            each(
              function() {
                var $th = $(this);
                var columnName = $th.find('.column-header-content').attr('data-column-name');
                var columnWidth = parseInt($th.width(), 10);

                newColumnWidths.push({
                  columnName: columnName,
                  width: columnWidth
                });
              }
            );

      self.emitEvent('SOCRATA_VISUALIZATION_TABLE_COLUMNS_RESIZED', newColumnWidths);
    }
  }

  function handleColumnHeaderClick() {
    var columnName = this.getAttribute('data-column-name');
    var columnRenderType = this.getAttribute('data-column-render-type');

    if (columnName && !isGeometryType({renderTypeName: columnRenderType})) {
      self.emitEvent('SOCRATA_VISUALIZATION_COLUMN_CLICKED', columnName);
    }
  }

  // What does it mean to "apply frozen columns"?
  //
  // Because we need to render multiple pages of results in the table, we need
  // to choose column widths that persist across pages. If we were to let the
  // table auto-size its widths each time it was rendered, the specific values
  // in the rows of each page might cause the column widths to vary across
  // pages. This would be jarring and appear broken. Instead, when we first
  // render values we choose 'default' widths for each column that will be used
  // across all pages.
  //
  // This function is called each time we render a page of results and
  // reapplies these widths so that regardless of the content of any individual
  // set of rows that appear on a page the column widths remain consistent.
  //
  // Since we cache any overridden column widths that exist in the vif being
  // rendered, this function will prefer those over the calculated widths;
  // resizing the column will invalidate the cached width for that column that
  // may have been read out of the vif and instead uses the new value (which
  // is tracked internally to the instance in columnWidths).
  function applyFrozenColumns($template) {
    $template.toggleClass('frozen-columns', !!columnWidths);

    $template.find('thead th').each(
      function() {
        var $th = $(this);
        var columnName = $th.find('.column-header-content').attr('data-column-name');
        var width = Math.max(
          _.get(columnWidths, columnName, 150) + SORT_ICON_WIDTH,
          MINIMUM_COLUMN_WIDTH
        );

        $th.width(width);
      }
    );
  }
};
