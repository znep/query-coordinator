const utils = require('common/js_utils');
const $ = require('jquery');
const _ = require('lodash');
const classNames = require('classnames');
const SvgVisualization = require('./SvgVisualization.js');
const DataTypeFormatter = require('./DataTypeFormatter.js');
const I18n = require('common/i18n').default;
const { ENTER, SPACE, TAB } = require('common/dom_helpers/keycodes_deprecated');

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
      I18n.t('shared.visualizations.charts.table.error_unable_to_render', locale)
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
        columns: [{ fieldName: 'placeholder', renderTypeName: 'text' }],
        rows: [['placeholder']],
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
    const cellData = DataTypeFormatter.renderCellHTML(
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

  function renderResizeTarget(options) {
    const {
      isLastColumn,
      resizingClassIfIsResizing,
      columnName
    } = options;

    const className = classNames(
      'column-resize-target', {
        [`column-resize-target-last${resizingClassIfIsResizing}`]: isLastColumn
      });

    return `
      <div
        class="${className}"
        data-column-name="${columnName}">
      </div>
    `;
  }

  function templateTableSortedHeader(options) {
    const {
      columnName,
      columnDescription,
      renderTypeName,
      columnTitle,
      sortDirection
    } = options;

    const resizeTarget = renderResizeTarget(options);

    return `
      <th scope="col">
        <div
          class="column-header-content"
          data-column-name="${columnName}"
          data-column-description="${columnDescription}"
          data-column-render-type="${renderTypeName}"
          data-sort>

          <span class="column-header-content-column-name">
            ${columnTitle}
          </span>
          <span class="sort-controls-container">
            <span class="${sortDirection} sort-indicator"></span>
            <button class="sort-menu-button"><span class="socrata-icon-kebab"></span></button>
          </div>
        </span>
        ${resizeTarget}
      </th>
    `;
  }

  function templateTableUnsortableHeader(options) {
    const {
      columnName,
      columnDescription,
      renderTypeName,
      columnTitle
    } = options;

    const resizeTarget = renderResizeTarget(options);

    return `
      <th scope="col">
        <div
          class="column-header-content"
          data-column-name="${columnName}"
          data-column-description="${columnDescription}"
          data-column-render-type="${renderTypeName}">

          <span class="column-header-content-column-name">
            ${columnTitle}
          </span>
        </div>
        ${resizeTarget}
      </th>
    `;
  }

  function templateTableHeader(options) {
    const {
      columnName,
      columnDescription,
      renderTypeName,
      columnTitle
    } = options;

    const resizeTarget = renderResizeTarget(options);

    return `
      <th scope="col">
        <div
          class="column-header-content"
          data-column-name="${columnName}"
          data-column-description="${columnDescription}"
          data-column-render-type="${renderTypeName}">

          <span class="column-header-content-column-name">
            ${columnTitle}
          </span>
          <span class="sort-controls-container">
            <span class="socrata-icon-arrow-up2 sort-indicator"></span>
            <button class="sort-menu-button"><span class="socrata-icon-kebab"></span></button>
          </span>
        </div>
        ${resizeTarget}
      </th>
    `;
  }

  function templateSortMenu() {

    const description = I18n.t('shared.visualizations.charts.table.description', locale);
    const more = I18n.t('shared.visualizations.charts.table.more', locale);
    const sortAscending = I18n.t('shared.visualizations.charts.table.sort_ascending', locale);
    const sortDescending = I18n.t('shared.visualizations.charts.table.sort_descending', locale);

    return `
      <div id="sort-menu">
        <ul>
          <li>
            <button id="sort-menu-sort-asc-button"><span class="socrata-icon-arrow-up2"></span>${sortAscending}</button>
          </li>
          <li>
            <button id="sort-menu-sort-desc-button"><span class="socrata-icon-arrow-down2"></span>${sortDescending}</button>
          </li>
        </ul>
        <div id="sort-menu-description-container">
          <div><span class="socrata-icon-info-inverse"></span>${description}</div>
          <p></p>
          <a id="sort-menu-more-link" tabindex="0">${more}</a>
        </div>
      </div>
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
            'socrata-icon-arrow-up2' :
            'socrata-icon-arrow-down2',
          isLastColumn: (i === (filteredColumns.length - 1)),
          resizingClassIfIsResizing: resizingClassIfIsResizing
        };

        let template;

        if (isUnsortableColumnType(column)) {
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
      map(function(row, i) {

        if (!row) {
          return '<tr class="null-row"><td></td></tr>';
        }

        const rowId = _.get(data, ['rowIds', i], null);
        const rowData = filteredColumns.
          map(function(column, columnIndex) {
            return templateTableCell(column, row[columnIndex]);
          }).join('');
        const conditionalFormattingRules = _.get(
          vif,
          'series[0].dataSource.view.metadata.conditionalFormatting',
          []
        );
        const conditionalFormattingStyles = (row || []).
          map((columnValue, columnIndex) => {

            return DataTypeFormatter.getCellConditionalFormattingStyles(
              columnValue,
              filteredColumns[columnIndex],
              conditionalFormattingRules
            );
          }).
          filter((conditionalFormattingStylesForColumnValue) => {
            return !_.isEmpty(conditionalFormattingStylesForColumnValue);
          });

        const styleAttribute = _.escape(_.first(conditionalFormattingStyles));
        return `<tr data-row-id="${rowId}" style="${styleAttribute}">${rowData}</tr>`;
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

  /**
   * EN-17640 - Make URL columns great again
   *
   * Attempts to identify NBE columns that were converted from OBE URL columns to regular
   * text columns. This is not foolproof as we can only guess by looking for related columns
   * based on 'name' and 'fieldName', which a user can control
   *
   * @param {Array} columnData - the unaltered column data
   * @returns {Array} - a list of columns that we think came from an OBE URL column.
   *                    This list only returns the 'url' half of the url + description pair
   */
  function findNbeUrlCols(columnData) {
    utils.assertIsArray(columnData);

    return _.filter(columnData, ({ name, fieldName }) => {
      return _.find(columnData, _.matches({
        name: `${name} (description)`,
        fieldName: `${fieldName}_description`
      }));
    });
  }

  /**
   * EN-17640 - Make URL columns great again (for NBE datasets)
   *
   * Looks for columns that resemble exploded URL columns like 'link' & 'link_description'
   * and combines them into an OBE-like URL column
   *
   * @param {Array} columnData - the unaltered column data
   * @param {Array} urlCols - list of columns that _probably_ came from OBE URL columns
   * @returns {Array} a list of columns where exploded NBE URL columns are molded back into OBE URL columns
   */
  function reconstructColumnsWithObeUrls(columnData, urlCols) {
    utils.assertIsArray(columnData);
    utils.assertIsArray(urlCols);

    return _.chain(columnData).
      map((col) => {
        const colCopy = _.clone(col, true);
        _.forEach(urlCols, (urlCol) => {
          if (colCopy.fieldName === urlCol.fieldName) {
            colCopy.renderTypeName = 'url';
          }
        });
        return colCopy;
      }).
      // remove _description sub-column since all URL data will be combined into a single column
      reject((col) => {
        return _.some(urlCols, (urlCol) => {
          return col.fieldName === `${urlCol.fieldName}_description`;
        });
      }).
      value();
  }

  /**
   * EN-17640 - Make URL columns great again (for NBE datasets)
   *
   * Combines row data for likely URL columns (e.g. 'link', 'link_description') into a single
   * row item that looks like { description: 'Google', url: 'www.google.com' }
   *
   * @param {Array} rowData - the unaltered row data
   * @param {Array} columnData - the unaltered column data
   * @param {Array} urlCols - list of columns that _probably_ came from OBE URL columns
   * @returns {Array} row data where individual urls and url descriptions are combined
   */
  function reconstructRowsWithObeUrls(rowData, columnData, urlCols) {
    utils.assertIsArray(rowData);
    utils.assertIsArray(columnData);
    utils.assertIsArray(urlCols);

    return _.map(rowData, (row) => {
      const rowCopy = _.clone(row, true);
      // Row can be null here since we intentionally pad rowData with nulls in
      // Table.js #setInlineDataQuery if there aren't enough rows
      if (rowCopy === null) {
        return null;
      }

      _.forEach(urlCols, (urlCol) => {
        const urlColIndex = _.findIndex(columnData, (col) => _.isEqual(urlCol, col));
        const urlColDescriptionIndex = _.findIndex(columnData, (col) => {
          return col.fieldName === `${urlCol.fieldName}_description`;
        });

        const description = row[urlColDescriptionIndex];
        const url = row[urlColIndex];

        // is it possible to have just a description w/o a url?
        if (url || description) {
          rowCopy[urlColIndex] = { description, url };
        }

        // Remove the _description data from the row since it is part of the new fake OBE url col
        _.pullAt(rowCopy, urlColDescriptionIndex);
      });

      return rowCopy;
    });
  }

  function render(vif, data) {
    const $existingTable = self.$element.find('.socrata-table');

    let scrollLeft = 0;

    if (!data) {
      return;
    }

    // EN-17640 Make URL columns great again (for NBE datasets)
    // We manually edit the column and row data to spoof 'url' type columns
    // just like we had in the good 'ol days (OBE). I promise these columns are
    // real, and not fake like the NYTimes.
    const urlCols = findNbeUrlCols(data.columns);

    if (!_.isEmpty(urlCols)) {
      const nbeColumnsWithObeUrls = reconstructColumnsWithObeUrls(data.columns, urlCols);
      const nbeRowsWithObeUrls = reconstructRowsWithObeUrls(data.rows, data.columns, urlCols);

      data.columns = nbeColumnsWithObeUrls;
      data.rows = nbeRowsWithObeUrls;
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

  function closeIfBlurred() {
    setTimeout(() => {
      const sortMenu = document.getElementById('sort-menu');
      const focused = document.activeElement;

      if (!$.contains(sortMenu, focused)) {
        hideSortMenu();
      }
    }, 1);
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
      'click touchstart',
      '.socrata-table thead th .column-header-content',
      handleColumnHeaderClick
    );

    self.$element.on(
      'click touchstart',
      '.sort-menu-button',
      handleSortMenuButtonClick
    );

    self.$element.on('blur', '.sort-menu-button', closeIfBlurred);

    if (!self.isMobile()) {

      self.$element.on(
        'mouseenter mousemove',
        '.socrata-table thead .sort-menu-button',
        showSortMenuButtonFlyout
      );

      self.$element.on(
        'mouseleave',
        '.socrata-table thead .sort-menu-button',
        hideSortMenuButtonFlyout
      );
    }

    self.$element.on(
      'dblclick',
      '.socrata-table tbody tr',
      handleRowDoubleClick
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
      'click touchstart',
      '.socrata-table thead th .column-header-content',
      handleColumnHeaderClick
    );

    self.$element.off(
      'click touchstart',
      '.sort-menu-button',
      handleSortMenuButtonClick
    );

    self.$element.off('blur', '.sort-menu-button', closeIfBlurred);

    if (!self.isMobile()) {

      self.$element.off(
        'mouseenter mousemove',
        '.socrata-table thead .sort-menu-button',
        showSortMenuButtonFlyout
      );

      self.$element.off(
        'mouseleave',
        '.socrata-table thead .sort-menu-button',
        hideSortMenuButtonFlyout
      );
    }

    self.$element.off(
      'dblclick',
      '.socrata-table tbody tr',
      handleRowDoubleClick
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

  function showSortMenuButtonFlyout() {

     // Don't distract the user if they are resizing a column
     // (activeResizeColumnName is set to the name of the column being resized
     // at the start of the resize action, and reset to null when the resize
     // action is complete).
    if (activeResizeColumnName === null) {

      self.emitEvent(
         'SOCRATA_VISUALIZATION_COLUMN_FLYOUT',
        {
          element: $(this)[0],
          content: I18n.t('shared.visualizations.charts.table.column_options', locale),
          belowTarget: false,
          rightSideHint: false,
          dark: true
        }
       );
    }
  }

  function hideSortMenuButtonFlyout() {

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
    if (isOverflowing && !_.isEmpty(String(data).replace(/\s/g, ''))) {

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

  function handleRowDoubleClick(event) {
    const $row = $(event.target).closest('tr');
    const rowIds = _.get(dataToRender, 'rowIds', []);

    if ($row.length <= 0) {
      return;
    }

    if (!_.isArray(rowIds)) {
      return;
    }

    const rowId = $row.attr('data-row-id');
    const rowIndex = rowIds.indexOf(rowId);

    if (rowIndex >= 0) {
      const payload = {
        columns: dataToRender.columns,
        row: {
          id: rowId,
          data: dataToRender.rows[rowIndex]
        }
      };

      self.emitEvent(
        'SOCRATA_VISUALIZATION_ROW_DOUBLE_CLICKED',
        payload
      );
    }
  }

  function hideCellFlyout() {

    self.emitEvent(
      'SOCRATA_VISUALIZATION_CELL_FLYOUT',
      null
    );
  }

  // EN-17490 - Socrata Viz Table incorrectly allows sorting by blob type
  //
  // This function was previously called `isGeometryType()`, but it was being
  // used to determine whether or not to allow sorting by a column. This was
  // problematic because document and blob columns are also not sortable, but we
  // were allowing the user to attempt to sort by them, which made the resulting
  // query fail in such a way as to put the table into an unrecoverable broken
  // state.
  function isUnsortableColumnType(column) {

    return _.includes(
      [
        'point',
        'multipoint',
        'line',
        'multiline',
        'polygon',
        'multipolygon',
        'location',
        'phone',
        'document',
        'blob',
        'photo'
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

  function handleColumnHeaderClick(event) {

    event.stopPropagation();
    event.preventDefault();

    if (self.isMobile()) {
      handleColumnHeaderClickForMobile($(this));
    } else {
      handleColumnHeaderClickForDesktop($(this));
    }
  }

  function handleColumnHeaderClickForDesktop($contentDiv) {

    const columnName = $contentDiv.attr('data-column-name');
    const columnRenderType = $contentDiv.attr('data-column-render-type');

    if (columnName && !isUnsortableColumnType({ renderTypeName: columnRenderType })) {
      self.emitEvent('SOCRATA_VISUALIZATION_COLUMN_CLICKED', columnName);
    }
  }

  function handleColumnHeaderClickForMobile($contentDiv) {

    handleSortMenuToggle($contentDiv);
  }

  function handleSortMenuButtonClick(event) {
    event.stopPropagation();
    event.preventDefault();

    const $contentDiv = $(this).closest('.column-header-content');
    handleSortMenuToggle($contentDiv);
  }

  function handleSortMenuToggle($contentDiv) {

    const columnName = $contentDiv.attr('data-column-name');
    const columnRenderType = $contentDiv.attr('data-column-render-type');
    const columnDescription = _.escape($contentDiv.attr('data-column-description')) ||
      I18n.t('shared.visualizations.charts.table.no_column_description', locale);

    toggleSortMenu($contentDiv.closest('th'), columnName, columnRenderType, columnDescription);
  }

  function toggleSortMenu($container, columnName, columnRenderType, columnDescription) {

    let $sortMenu = $('#sort-menu');

    if ($sortMenu.length > 0) {

      // Menu exists.  If the menu is displayed on this column already, remove it
      //
      if ($sortMenu.attr('sort-menu-column-name') == columnName) {
        hideSortMenu();
        return;
      }

    } else {
      $sortMenu = $(templateSortMenu());
    }

    attachSortMenuEventHandlers($sortMenu, columnName, columnRenderType);
    populateSortMenu($sortMenu, columnName, columnDescription);
    positionSortMenu($sortMenu, $container);
  }

  function hideSortMenu() {

    $('#sort-menu').remove();
    $(document).off('click touchstart', hideSortMenu);
  }

  function attachSortMenuEventHandlers($sortMenu, columnName, columnRenderType) {

    if (columnName && !isUnsortableColumnType({ renderTypeName: columnRenderType })) {

      $(document).on('click touchstart', hideSortMenu);

      $sortMenu.find('#sort-menu-sort-asc-button').off().on('click touchstart', (event) => {

        event.stopPropagation();
        event.preventDefault();

        self.emitEvent('SOCRATA_VISUALIZATION_COLUMN_SORT_APPLIED', { columnName, ascending: true });
        $sortMenu.remove();
      });

      $sortMenu.find('#sort-menu-sort-desc-button').off().on('click touchstart', (event) => {

        event.stopPropagation();
        event.preventDefault();

        self.emitEvent('SOCRATA_VISUALIZATION_COLUMN_SORT_APPLIED', { columnName, ascending: false });
        $sortMenu.remove();
      });

      const $moreLink = $sortMenu.find('#sort-menu-more-link');

      const openDescription = (event) => {
        event.stopPropagation();
        event.preventDefault();

        // Open the full description
        const columnDescription = $sortMenu.attr('sort-menu-column-description');
        $sortMenu.find('#sort-menu-description-container p').text(columnDescription);
        const $dummy = $('<span tabindex="0"></span>');
        $sortMenu.append($dummy);
        $dummy.focus();
        $dummy.on('blur', () => {
          closeIfBlurred();
          $dummy.remove(); // We only need the dummy element once.
        });
        $moreLink.hide();
      };

      $moreLink.on('click touchstart', openDescription);

      $moreLink.on('keydown', (event) => {
        if (event.keyCode === ENTER || event.keyCode === SPACE) {
          openDescription(event);
        } else if (event.keyCode === TAB) {
          // We can't use on(blur) because clicking the "more" button triggers a blur.
          closeIfBlurred();
        }
      });

      $sortMenu.find('button').on('blur', closeIfBlurred);
    }
  }

  function populateSortMenu($sortMenu, columnName, columnDescription) {

    $sortMenu.attr('sort-menu-column-name', columnName);
    $sortMenu.attr('sort-menu-column-description', columnDescription);

    const maxCharacters = 150;

    if (columnDescription.length > maxCharacters) {

      const truncatedDescription = _.truncate(
        columnDescription,
        {
          length: maxCharacters,
          separator: /,?\.* +/ // separate by spaces, including preceding commas and periods
        });

      $sortMenu.find('#sort-menu-description-container p').text(truncatedDescription);
      $sortMenu.find('#sort-menu-more-link').show();

    } else {

      $sortMenu.find('#sort-menu-description-container p').text(columnDescription);
      $sortMenu.find('#sort-menu-more-link').hide();
    }
  }

  function positionSortMenu($sortMenu, $container) {

    const $sortMenuButton = $container.find('.sort-menu-button');
    const buttonBottom = $sortMenuButton.position().top + $sortMenuButton.outerHeight(true);

    $sortMenu.appendTo($container);
    $sortMenu.css('right', 0); // must be positioned first for offset calculations to work
    $sortMenu.css('top', buttonBottom);

    // Move menu to the right if the left edge extends past the left table edge
    //
    const socrataTableScrollLeft = $container.closest('.socrata-table').scrollLeft();
    const tableOffsetLeft = $container.closest('table').offset().left;
    const menuOffsetLeft = $sortMenu.offset().left;

    const menuOffsetRight = Math.min(menuOffsetLeft - tableOffsetLeft - socrataTableScrollLeft, 5);
    $sortMenu.css('right', menuOffsetRight);
  }
};
