const utils = require('common/js_utils');
const $ = require('jquery');
const _ = require('lodash');
const SvgVisualization = require('./SvgVisualization.js');
const DataTypeFormatter = require('./DataTypeFormatter.js');
const I18n = require('../I18n');

const MINIMUM_COLUMN_WIDTH = 64;

// Passing in locale is a temporary workaround to localize the Table
module.exports = function Table(element, originalVif, locale) {

  _.extend(this, new SvgVisualization(element, originalVif));

  const self = this;
  // Because we need to hook into the renderError function call but want to be
  // able to call the 'super' once we do so, we cache the original version of
  // this.renderError for use in our overridden version later.
  //
  // Note that we lose the 'this' context when we do this so we need to re-bind
  // it.
  const superRenderError = this.renderError.bind(this);

  let vifToRender = originalVif;
  let dataToRender;
  let scrollbarHeightPx;
  let columnWidths = {};
  // Handle column width resizing
  let activeResizeColumnName = null;
  let activeResizeXStart = 0;
  let activeResizeXEnd = 0;

  attachEvents();

  /**
   * Public Methods
   */

  this.render = function(newVif, newData) {

    if (_.isEqual(vifToRender, newVif) && _.isEqual(dataToRender, newData)) {
      return;
    }

    // Note that we check if vifToRender and newVif are actually different
    // instead of just overwriting vifToRender so that we don't lose the
    // previously-calculated column widths.
    if (!_.isEqual(vifToRender, newVif)) {

      vifToRender = newVif;
      columnWidths = {};
    }

    if (newData) {
      dataToRender = newData;
    }

    render(vifToRender, dataToRender);
  };

  this.renderError = function() {

    self.$element.
      find('.socrata-visualization-container').
      removeClass('loaded');

    superRenderError(
      I18n.translate('visualizations.table.error_unable_to_render', locale)
    );
  };

  /**
   * Compute how many rows can fit into the given pixel height (taking into
   * account header size).
   *
   * NOTE: This assumes each row is the same vertical height, no matter the
   * content.
   *
   * Currently this is true due to how the table is styled. Caveat emptor.
   */
  this.howManyRowsCanFitInHeight = function(overallHeightPx) {
    const alreadyHasData = dataToRender && dataToRender.rows.length > 0;

    if (!_.isFinite(overallHeightPx)) {
      return 0;
    }

    // We need some data in the table to do the measurements.
    // If there is none there, render a placeholder.
    if (!alreadyHasData) {
      // Render sample data into the table. Used for UI element measurement.
      //
      // We assign the values below in the same way that they are assigned in
      // the public this.render() function, but we add the 'placeholder'
      // property so that we know to not actually display the placholder data.
      dataToRender = {
        columns: [ { fieldName: 'placeholder', renderTypeName: 'text' } ],
        rows: [ [ 'placeholder' ] ],
        placeholder: true
      };

      render(vifToRender, dataToRender);
    }

    utils.assertInstanceOf(element.find('thead')[0], HTMLElement);
    utils.assertInstanceOf(element.find('tbody tr')[0], HTMLElement);

    // Measure.
    let headerHeightPx = element.find('thead').outerHeight();
    let rowHeightPx = element.find('tbody tr').outerHeight();

    // Compute
    let heightLeftAfterHeaderPx = (
      overallHeightPx -
      headerHeightPx -
      scrollbarHeightPx
    );
    let numberOfRows = heightLeftAfterHeaderPx / rowHeightPx;
    let maxRowCount = 0;

    if (_.isFinite(numberOfRows)) {
      maxRowCount = Math.max(0, Math.floor(numberOfRows));
    }

    return maxRowCount;
  };

  this.destroy = function() {

    detachEvents();
    self.$element.find('.socrata-table').remove();
  };

  /**
   * Private Methods
   */

  function templateTableCell(column, cell) {
    const cellData = DataTypeFormatter.renderCell(
      cell,
      column,
      _.get(vifToRender, 'series[0].dataSource.domain'),
      _.get(vifToRender, 'series[0].dataSource.datasetUid')
    );

    const cellAlignment = DataTypeFormatter.getCellAlignment(column);

    return `
      <td data-cell-render-type="${column.renderTypeName}" data-cell-alignment="${cellAlignment}">
        <div>
          ${cellData}
        </div>
      </td>
    `;
  }

  function templateTableSortedHeader(options) {
    let resizeTarget;

    if (options.isLastColumn) {

      resizeTarget = `
        <div
          class="
            column-resize-target
            column-resize-target-last${options.resizingClassIfIsResizing}
          "
          data-column-name="${options.columnName}">
        </div>
      `;
    } else {

      resizeTarget = `
        <div
          class="column-resize-target${options.resizingClassIfIsResizing}"
          data-column-name="${options.columnName}">
        </div>
      `;
    }

    return `
      <th scope="col">
        <div
          class="column-header-content"
          data-column-name="${options.columnName}"
          data-column-description="${options.columnDescription}"
          data-column-render-type="${options.renderTypeName}" data-sort>

          <span class="column-header-content-column-name">
            ${options.columnTitle}
          </span>
          <span class="icon-${options.sortDirection}"></span>
        </div>
        ${resizeTarget}
      </th>
    `;
  }

  function templateTableUnsortableHeader(options) {
    let resizeTarget;

    if (options.isLastColumn) {

      resizeTarget = `
        <div
          class="
            column-resize-target
            column-resize-target-last${options.resizingClassIfIsResizing}
          "
          data-column-name="${options.columnName}">
        </div>
      `;
    } else {

      resizeTarget = `
        <div
          class="column-resize-target${options.resizingClassIfIsResizing}"
          data-column-name="${options.columnName}">
        </div>
      `;
    }

    return `
      <th scope="col">
        <div
          class="column-header-content"
          data-column-name="${options.columnName}"
          data-column-description="${options.columnDescription}"
          data-column-render-type="${options.renderTypeName}">

          <span class="column-header-content-column-name">
            ${options.columnTitle}
          </span>
        </div>
        ${resizeTarget}
      </th>
    `;
  }

  function templateTableHeader(options) {
    let resizeTarget;

    if (options.isLastColumn) {

      resizeTarget = `
        <div
          class="
            column-resize-target
            column-resize-target-last${options.resizingClassIfIsResizing}
          "
          data-column-name="${options.columnName}">
        </div>
      `;
    } else {

      resizeTarget = `
        <div
          class="column-resize-target${options.resizingClassIfIsResizing}"
          data-column-name="${options.columnName}">
        </div>
      `;
    }

    return `
      <th scope="col">
        <div
          class="column-header-content"
          data-column-name="${options.columnName}"
          data-column-description="${options.columnDescription}"
          data-column-render-type="${options.renderTypeName}">

          <span class="column-header-content-column-name">
            ${options.columnTitle}
          </span>
          <span class="icon-arrow-down"></span>
        </div>
        ${resizeTarget}
      </th>
    `;
  }

  function templateTable(vif, data) {
    const activeSort = _.get(vif, 'configuration.order[0]', {});

    if (data === null) {
      return '';
    }

    const filteredColumns = data.columns.filter(function(column) {
      const flags = column.flags;
      const hidden = flags && flags.indexOf('hidden') >= 0;

      return !hidden;
    });

    let head = filteredColumns.
      map(function(column, i) {
        const resizingClassIfIsResizing = (
          column.fieldName === activeResizeColumnName
        ) ?
          ' resizing' :
          '';
        const templateOptions = {
          columnName: column.fieldName,
          columnTitle: _.escape(_.get(column, 'name', column.fieldName)),
          columnDescription: _.escape(_.get(column, 'description', '')),
          renderTypeName: _.get(column, 'renderTypeName', ''),
          sortDirection: activeSort.ascending ?
            'arrow-down' :
            'arrow-up',
          isLastColumn: (i === (filteredColumns.length - 1)),
          resizingClassIfIsResizing: resizingClassIfIsResizing
        };

        let template;

        if (isGeometryType(column)) {
          template = templateTableUnsortableHeader(templateOptions);
        } else if (activeSort.columnName === column.fieldName) {
          template = templateTableSortedHeader(templateOptions);
        } else {
          template = templateTableHeader(templateOptions);
        }

        return template;
      }).
      join('');

    let body = data.
      rows.
      map(function(row) {

        if (!row) {
          return '<tr class="null-row"><td></td></tr>';
        }

        let rowData = filteredColumns.
          map(function(column, columnIndex) {
            return templateTableCell(column, row[columnIndex]);
          }).join('');

        return `<tr>${rowData}</tr>`;
      }).
      join('');

    return `
      <div class="socrata-table">
        <table>
          <thead>
            ${head}
          </thead>
          <tbody>
            ${body}
          </tbody>
        </table>
      </div>
    `;
  }

  function render(vif, data) {
    const $existingTable = self.$element.find('.socrata-table');

    let scrollLeft = 0;

    if (!data) {
      return;
    }

    const $template = $(templateTable(vif, data));

    // Note that we need to append the table headers and rows to the DOM before
    // the native table column sizing behavior will take place. We rely on this
    // behavior to 'right-size' the columns based on the content of the rows
    // on the first page of results, which widths will be persisted across
    // result page changes.
    if ($existingTable.length) {

      scrollLeft = _.get($existingTable, '[0].scrollLeft', 0);
      $existingTable.replaceWith($template);
    } else {

      self.
        $element.
        find('.socrata-visualization-container').
        append($template);
    }

    const $newTable = self.$element.find('.socrata-table');
    const newTableScrollbarHeightPx = $newTable[0].offsetHeight -
      $newTable[0].clientHeight;

    // Cache the scrollbar height for later use.
    scrollbarHeightPx = scrollbarHeightPx || newTableScrollbarHeightPx;

    // If we are just rendering placeholder data we do not want to record or
    // update the column widths. We only use placeholder data to determine how
    // many rows can fit in the vertical space allotted to the table.
    if (data.placeholder === true) {
      return;
    }

    // Read the column widths out of the vif if they exist.
    _.each(
      _.get(vif, 'configuration.tableColumnWidths', {}),
      function(columnWidth, columnName) {

        if (!columnWidths.hasOwnProperty(columnName)) {
          columnWidths[columnName] = columnWidth;
        }
      }
    );

    // Backfill missing column widths based on the browser layout
    // and update widths.
    $template.
      find('thead th').
      each(function() {
        const $th = $(this);
        const columnName = $th.
          find('.column-header-content').
          attr('data-column-name');

        if (!columnWidths.hasOwnProperty(columnName)) {
          columnWidths[columnName] = this.getBoundingClientRect().width;
        }

        $th.width(
          Math.max(
            columnWidths[columnName],
            MINIMUM_COLUMN_WIDTH
          )
        );
      });

    // Update the current vif with the new column widths.
    _.set(
      vifToRender,
      'configuration.tableColumnWidths',
      columnWidths
    );

    $template.addClass('frozen-columns');

    if (activeResizeColumnName !== null) {

      $(`.column-resize-target[data-column-name="${activeResizeColumnName}"]`).
        addClass('resizing');
    }

    $newTable[0].scrollLeft = scrollLeft;

    self.
      $element.
      find('.socrata-visualization-container').
      addClass('loaded');
  }

  function attachEvents() {

    $(window).on('mousemove', handleMousemove);
    $(window).on('mouseup', handleMouseup);

    self.$element.on(
      'mousedown',
      '.socrata-table thead th .column-resize-target',
      handleResizeTargetMousedown
    );
    self.$element.on(
      'click',
      '.socrata-table thead th .column-header-content',
      handleColumnHeaderClick
    );

    self.$element.on(
      'mouseenter mousemove',
      '.socrata-table thead th',
      showDescriptionFlyout
    );
    self.$element.on(
      'mouseleave',
      '.socrata-table thead th',
      hideDescriptionFlyout
    );

    self.$element.on(
      'mouseenter mousemove',
      '.socrata-table tbody td',
      showCellFlyout
    );
    self.$element.on(
      'mouseleave',
      '.socrata-table tbody td',
      hideCellFlyout
    );
  }

  function detachEvents() {

    $(window).off('mousemove', handleMousemove);
    $(window).off('mouseup', handleMouseup);

    self.$element.off(
      'mousedown',
      '.socrata-table thead th .column-resize-target',
      handleResizeTargetMousedown
    );
    self.$element.off(
      'click',
      '.socrata-table thead th .column-header-content',
      handleColumnHeaderClick
    );

    self.$element.off(
      'mouseenter mousemove',
      '.socrata-table thead th',
      showDescriptionFlyout
    );
    self.$element.off(
      'mouseleave',
      '.socrata-table thead th',
      hideDescriptionFlyout
    );

    self.$element.off(
      'mouseenter mousemove',
      '.socrata-table tbody td',
      showCellFlyout
    );
    self.$element.off(
      'mouseleave',
      '.socrata-table tbody td',
      hideCellFlyout
    );
  }

  function showDescriptionFlyout(event) {
    const $target = $(event.currentTarget).find('.column-header-content');
    const title = _.escape($target.find('.column-header-content-column-name').text());
    const description =
      _.escape($target.attr('data-column-description')) ||
      `<em>${I18n.translate('visualizations.table.no_column_description', locale)}</em>`;
    const content = `
      <span>${title}</span><br>
      <span>${description}</span>
    `;

    // Don't distract the user if they are resizing a column
    // (activeResizeColumnName is set to the name of the column being resized
    // at the start of the resize action, and reset to null when the resize
    // action is complete).
    if (activeResizeColumnName === null) {

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
    const $target = $(event.currentTarget).find('div');
    // Sometimes $target doesn't seem to have any elements associated with it.
    const isOverflowing = (!_.isUndefined($target[0])) ?
      $target[0].clientWidth < $target[0].scrollWidth :
      false;
    const data = _.escape($target.text());

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

    return _.includes(
      [
        'point',
        'multipoint',
        'line',
        'multiline',
        'polygon',
        'multipolygon',
        'location'
      ],
      column.renderTypeName
    );
  }

  function handleResizeTargetMousedown(event) {
    const columnName = this.getAttribute('data-column-name');

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
      columnWidths[activeResizeColumnName] += (
        activeResizeXEnd -
        activeResizeXStart
      );
      activeResizeXStart = activeResizeXEnd;

      render(vifToRender, dataToRender);
    }
  }

  function handleMouseup() {
    const newColumnWidths = {};

    // If we are currently resizing a column activeResizeColumnName will be
    // non-null; it is reset to null once the resize operation is complete.
    if (!_.isNull(activeResizeColumnName)) {

      activeResizeColumnName = null;
      // Just do a blanket removeClass instead of trying to remove it only from
      // the one that was active (there will probably be less than 100 of these
      // elements in most meaningful situations).
      $('.column-resize-target').removeClass('resizing');

      self.
        $element.
        find('thead th').
        each(function() {
          const $th = $(this);
          const columnName = $th.
            find('.column-header-content').
            attr('data-column-name');
          const columnWidth = parseInt($th.width(), 10);

          newColumnWidths[columnName] = columnWidth;
        });

      self.emitEvent(
        'SOCRATA_VISUALIZATION_TABLE_COLUMNS_RESIZED',
        newColumnWidths
      );
    }
  }

  function handleColumnHeaderClick() {
    const columnName = this.getAttribute('data-column-name');
    const columnRenderType = this.getAttribute('data-column-render-type');

    if (columnName && !isGeometryType({renderTypeName: columnRenderType})) {
      self.emitEvent('SOCRATA_VISUALIZATION_COLUMN_CLICKED', columnName);
    }
  }
};
