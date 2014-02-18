/**
 * History of table:
 * | This was originally written by Greg, so it did not conform to our normal coding standards.
 * | It was meant primarily for Socrata datasets, but in theory would be usable for other
 * | displays of tabular data. It was written to be generic for this reason; which was part
 * | of the reason for the model-table split. However, it was never used for anything else
 * | in practice.
 * | The actual rendering code was written via code generation originally. This became harder
 * | and harder to support, and (surprise) provided no performance benefits over standard
 * | procedural code. So the code generation was later ripped out.
 * | Enhancements were added over time to support the full features we needed.
 * | One of the big ones was sub-rows: specifically for nested table data types,
 * | which is essentially a mini-table inside a column, with multiple sub-rows per row.
 * | This is surprisingly difficult to deal with properly.
 * | There is also a lot of logic around how to render the visible rows; we only want
 * | to render around the visible window to handle really large datasets (multi-million rows).
 * | But to optimize rendering, rows are re-used as much as possible when the scroll change
 * | is small. Combined with the fact that some browsers have a limit on how tall a div
 * | can be, this led us to a solution with a div for a rendering window, which is what
 * | the rows actually go into; inside a div that creates the scrollbar, scaled to be less
 * | than the maximum height the browser allows.
 * | As much as possible was put into the datasetGrid class, which conformed to our
 * | normal coding standards and was much cleaner. However, most of the direct rendering had to
 * | happen here. As the file grew, we split out the navigation into a separate module,
 * | mainly because it was the easiest/most obvious. The remaining code is still too big.
 * | It also has some really nasty dynamic CSS-styling, which is probably necessary
 * | for the proper sizing of columns; but we have had significant problems (including
 * | performance) in the past.
 * Notable changes/enhancements (in no particular order):
 * | * Attempted copy/paste support. This worked at one point, but has long since decayed
 * | * Supported rendering more rows by switching to a rendering div inside a larger scrolling
 * |   div that may be scaled to fit the browser maximums.
 * | * Ripped out code generation
 * | * Split select mode out from edit mode
 * | * Created datasetGrid to wrap this and provide extra support for menus and headers
 * | * Added ghost column to pad out the lines/selection to the edge of the grid
 * | * Added left-hand locked column for row numbers and menu
 * | * Added row & column select (mostly un-used now)
 * | * Added Column resizing & drag
 * | * Added cell hover expansion
 * | * Added totals footer
 * | * Added 'No Results' message (this was missing for a surprisingly long time)
 * | * Added/improved child-row rendering/handling
 *
 * Original comments:
 * | This file implements the Blist table control.  This control offers an
 * | interactive presentation of tabular data to the user.
 * |
 * | The table renders data contained within a Blist "model" class.  The table
 * | uses the model associated with its root DOM node.
 * |
 * | Most events triggered by the table are managed by the model class.  Events
 * | supported directly by the table are:
 * |
 * | * cellclick - fired whenever the user clicks a cell and the table does not
 * |   perform a default action
 * | * table_click - fired when the mouse is clicked within the table and the
 * |   table does not fire a default action
 * |
 * | Implementation note: We process mouse up and mouse down events manually.  We
 * | treat some mouse events differently regardless of the element on which they
 * | occur.  For example, a mouse down within a few pixels of a column heading
 * | border is a resize, but the mouse may in fact be over a control.  Because of
 * | this and the fact that you can't cancel click events in mouseup handlers we
 * | generally can't use the browser's built in "click" event.  Instead the table
 * | fires a "table_click"ke event.  You should be able to use this anywhere you
 * | would instead handle "click".
 */

(function($)
{
    // Milliseconds to delay before expanding a cell's content
    var EXPAND_DELAY = 100;

    // Milliseconds in which expansion should occur
    var EXPAND_DURATION = 100;

    // Millisecond delay before loading missing rows
    var MISSING_ROW_LOAD_DELAY = 100;

    // Minimum size for a column (pixels)
    var MINIMUM_HEADER_SIZE = 10;

    var nextTableID = 1;

    // HTML escaping utility
    var htmlEscape = function(text)
    {
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    };

    // Determine whether we should be in tracing mode
    var trace = false; // Set this to enable/disable
    trace = trace && window.console;

    if (window.console && !window.console.time)
    {
        var traceTimes = {};
        window.console.time = function(what)
        { traceTimes[what] = new Date().getTime(); };
        window.console.timeEnd = function(what)
        {
            var diff = new Date().getTime() - traceTimes[what];
            //if (diff > 500)
            { $.debug('[Time] ' + what + ': ' + diff); }
            delete traceTimes[what];
        };
    }

    // Note entry into a block
    var begin = trace ? function(what) { console.time(what); } : function() {};

    // Note exit from a block
    var end = trace ? function(what) { console.timeEnd(what); } : function() {};

    // Make a DOM element into a table
    var makeTable = function(options)
    {
        var model;
        var dsReady = false;

        /*** MISC. VARIABLES AND INITIALIZATION ***/

        var id = this.id;
        if (!id)
        {
            id = nextTableID++;
            id = "blist-t" + id;
            this.id = id;
        }

        var $this = $(this);


        /*** CLOSURE UTILITY FUNCTIONS ***/

        // Calculate the number of digits in the handle.  This is important
        // because we need to recreate our layout if the width of the column
        // changes.
        var calculateHandleDigits = function()
        {
            return Math.ceil(Math.log(model.length() || 1) * Math.LOG10E);
        };

        // Sort data
        var sort = function(col)
        {
            begin("sort.configure");

            var sortAscending = true;
            if (!$.isBlank(col.sortAscending))
            { sortAscending = !col.sortAscending; }
            end("sort.configure");

            begin("sort.sort");
            $this.trigger('column_sort', [col, sortAscending]);
            end("sort.sort");
        };

        var configureSortHeader = function()
        {
            $('.sort.active', $header)
                .removeClass('sort-asc').addClass('sort-desc')
                .attr('title', $.t('controls.grid.sort_ascending'))
                .removeClass('active')
                .closest('.blist-th').removeClass('sorted');

            for (var i=0; i < columns.length; i++)
            {
                var col = columns[i];
                if (col.dom && !$.isBlank(col.sortAscending))
                {
                    var sortDescending = !col.sortAscending;
                    var oldClass = 'sort-' + (sortDescending ? 'asc' : 'desc');
                    var newClass = 'sort-' + (sortDescending ? 'desc' : 'asc');
                    var newTitle = $.t('controls.grid.sort_' + (sortDescending ? 'ascending' : 'descending'));
                    $('.sort', col.dom)
                        .removeClass(oldClass).addClass(newClass)
                        .attr('title', newTitle)
                        .addClass('active')
                        .closest('.blist-th').addClass('sorted');
                }
            }
        };

        var configureFilterHeaders = function()
        {
            $('.filter.active', $header).removeClass('active')
                .closest('.blist-th').removeClass('filtered');
            _.each(columns, function (c)
            {
                if (!$.isBlank(c.currentFilter))
                {
                    $('.filter', c.dom).addClass('active')
                        .closest('.blist-th').addClass('filtered');
                }
            });
        };

        // Obtain a model column associated with a column header DOM node
        var getColumnForHeader = function(e) {
            return model.columnForID(e.getAttribute('colId'));
        };

        // Given a DOM node, retrieve the logical row in which the cell resides
        var getRow = function(cell) {
            var rowDOM = cell.parentNode;
            if (!rowDOM) { return null; }

            // + 2 for "-r" suffix prior to row ID
            var rowID = rowDOM.id.substring(id.length + 2);
            return model.getByID(rowID);
        };

        // Given a DOM node, retrieve the logical column in which the cell resides
        var getColumn = function(cell) {
            // The cell will have a class like 'tableId-c4'; we need to
            //  extra the part after the tableId-c, which is the id of
            //  the column that can be looked up
            var classIndex = cell.className.indexOf(id + '-c');
            if (classIndex == -1) {
                return null;
            }
            var endOfID = cell.className.indexOf(' ', classIndex);
            if (endOfID == -1) {
                endOfID = cell.className.length;
            }
            var colID = cell.className.slice(classIndex + id.length + 2, endOfID);
            if (colID == 'rowHandleCol')
            {
                return rowHandleColumn;
            }
            else if (colID == 'rowNumberCol')
            {
                return rowNumberColumn;
            }
            return model.columnForID(colID);
        };

        // Takes a column, and gets the real px width for it
        var getColumnWidthPx = function(col)
        {
            if (col.renderTypeName == 'opener')
            {
                return openerWidth + paddingX;
            }
            else if (col.mcol)
            {
                col = col.mcol;
            }
            return (col.width ||
                parseFloat(getColumnStyle(col).width)) + paddingX;
        };


        /*** COLUMN SELECTION ***/

        var selectColumn = function(column, state)
        {
            if (!cellNav) { return; }

            cellNav.setColumnSelection(column, state);

            if (state)
            { model.unselectAllRows(); }

            // TODO -- support column selection on nested tables?

            updateColumnSelection();
            updateCellNavCues();
        };

        var selectColumnTo = function(column)
        {
            if (!cellNav) { return; }

            if (cellNav.lastSelectedColumn === null)
            {
                selectColumn(column, true);
                return;
            }

            var inSelect = false;
            var lastCol = cellNav.lastSelectedColumn.id;
            _.each(columns, function(c)
            {
                if (c.id == column.id || c.id == lastCol)
                {
                    inSelect = !inSelect;
                    if (!inSelect) { return false; }
                }
                if (inSelect) { cellNav.setColumnSelection(c, true); }
            });
            selectColumn(column, true);
        };

        var selectOnlyColumn = function(column)
        {
            if (!cellNav) { return; }

            cellNav.clearColumnSelection();
            selectColumn(column, true);
        };

        var updateColumnSelection = function()
        {
            if (!cellNav) { return; }
            for (var i = 0; i < columns.length; i++)
            {
                var mcol = columns[i];
                var col = $header.find('.' + id + '-c' + mcol.id);
                var colClass = getColumnClass(mcol);
                if (cellNav.isColumnSelected(mcol))
                {
                    if (!col.is('.blist-select-col'))
                    {
                        var colLeft = col.addClass('blist-select-col')
                            .offset().left;
                        inside.append('<div class="col-select-holder ' +
                            'blist-table-util ' +
                            colClass + '"/>')
                            .find('.col-select-holder.' + colClass)
                            .css('left', colLeft - $header.offset().left +
                                lockedWidth).removeClass('blist-table-util');
                    }
                }
                else
                {
                    if (col.is('.blist-select-col'))
                    {
                        col.removeClass('blist-select-col');
                        inside.find('.col-select-holder.' + colClass).remove();
                    }
                }
            }
        };


        /*** CELL SELECTION AND NAVIGATION ***/

        // Cell navigation model and logic
        var cellNav;

        // DOM nodes for active cells
        var $activeCells;

        var getRenderedRowsWithPosition = function() {
            var rows = [];
            for (var id in renderedRows) {
                var row = renderedRows[id];
                rows.push(row);
            }
            return rows = _.sortBy(rows, function(r) { return model.index(r); });
        };

        var clearRowSelection = function(row)
        {
            if (row.row !== undefined)
            {
                for (var cell = row.row.firstChild; cell; cell = cell.nextSibling)
                {
                    if (cell._sel)
                    {
                        $(cell).removeClass('blist-cell-selected');
                        cell._sel = false;
                    }
                }
            }
            delete row.selected;
        };

        var setRowSelection = function(row, selmap)
        {
            row.selected = true;
            for (var pos = 0, node = row.row.firstChild; node;
                node = node.nextSibling, pos++)
            {
                if (selmap[pos])
                {
                    if (!node.selected)
                    {
                        $(node).addClass('blist-cell-selected');
                        node._sel = true;
                    }
                }
                else if (node._sel)
                {
                    $(node).removeClass('blist-cell-selected');
                    node._sel = false;
                }
            }
        };

        var focus = function(obtain)
        {
            $navigator[0].focus();
        }

        var updateCellNavCues = function()
        {
            if (!cellNav) { return; }

            // Update the active cell
            if (cellNav.isActive())
            {
                var row = model.get(cellNav.getActiveY());
                if (row !== undefined)
                {
                    var physActive = renderedRows[row.id];
                    if (physActive)
                    {
                        var $newActive = $(physActive.row).children()
                            .slice(cellNav.getActiveX(),
                                    cellNav.getActiveXEnd());
                    }
                }
                if ($newActive)
                {
                    // Mark the new cells as active
                    $activeCells = $newActive;
                }
                else
                {
                    $activeCells = null;
                }
            }

            // Obtain a list of rendered rows in natural order
            var rows = getRenderedRowsWithPosition();

            // Update selection information
            cellNav.processSelection(rows, setRowSelection, clearRowSelection);

            // These calls are not strictly related to cell navigation cues.
            // However, this code path is common to all of the places where the
            // selection may change.  So reset these now.
            cellNav.initCopy();
        };

        var $activeContainer;
        var $commentLink;

        var hideActiveCell = function(activeOnly)
        {
            if ($activeContainer)
            {
                $activeContainer.css('top', -10000);
                $activeContainer.css('left', -10000);
            }
            if (!activeOnly)
                endEdit(true, SELECT_EDIT_MODE);
        };

        var $curRenderActiveCells;
        var expandActiveCell = function()
        {
            if (isEdit[DEFAULT_EDIT_MODE] || !cellNav.isActive())
            {
                // In these modes there should be no visible navigation cues
                hideActiveCell();
                return;
            }

            if (isEdit[SELECT_EDIT_MODE])
            {
                // Hide the active cell but do not mess with the select mode editor
                hideActiveCell(true);
                return;
            }

            var column;
            if ($activeCells && $activeCells.length > 0)
            {
                column = getColumn($activeCells[0]);
                var type = column ? column.renderType : null;
                // If this is an inline edit type in edit mode, then just
                // launch the editor instead of select
                if (type && type.isInlineEdit)
                {
                    if (editCell($activeCells[0], SELECT_EDIT_MODE)) { return; }
                }
            }

            // Obtain an expanding node in utility (off-screen) mode
            if (!$activeContainer)
            {
                // Create the expanding element
                $activeContainer = $('<div class="blist-table-active-container ' +
                    'blist-table-util"></div>');
                $render.append($activeContainer);
            }
            // If activeContainer is not in the tree anywhere, stick it inside
            else if ($activeContainer[0].parentNode == null ||
                $activeContainer[0].parentNode.nodeType == 11) // doc fragment
            {
                $render.append($activeContainer);
            }

            var row = model.get(cellNav.getActiveY());
            if (row !== undefined && row.expanded)
            { $activeContainer.addClass('blist-tr-open'); }
            else { $activeContainer.removeClass('blist-tr-open'); }
            if (!$activeCells)
            {
                // Display a placeholder at the appropriate location
                $activeContainer.empty();

                $activeContainer.height(rowOffset -
                    ($activeContainer.outerHeight() - $activeContainer.height()));
                var width = 0;
                for (var j = cellNav.getActiveX(),
                    stop = cellNav.getActiveXEnd(); j < stop; j++)
                {
                    width += getColumnWidthPx(layout[0][j]);
                }
                $activeContainer.width(width -
                    ($activeContainer.outerWidth() - $activeContainer.width()));

                var rowIndex = cellNav.getActiveY();
                $activeContainer.css('top', rowIndex * renderScaling -
                    $render.position().top);
                var left = lockedWidth;
                for (var i = 0; i < cellNav.getActiveX(); i++)
                {
                    left += getColumnWidthPx(layout[0][i]);
                }
                $activeContainer.css('left', left);
                return;
            }

            if (!column) { column = getColumn($activeCells[0]); }

            // Clone the cell
            var $activeExpand = $activeCells.clone();
            $activeExpand.width('auto').height('auto');
            $activeContainer.width('auto').height('auto');
            if ($activeCells != $curRenderActiveCells &&
                ($.isBlank($curRenderActiveCells) || $activeCells.index($curRenderActiveCells) < 0))
            {
                $activeContainer.empty();
                $activeContainer.append($activeExpand);
                $curRenderActiveCells = $activeCells;
            }

            // Don't show comment link for bnb cols
            if (options.cellComments && !!column && !!row && $.isBlank(column.parentColumn) &&
                !model.view.isGrouped())
            {
                if (!$commentLink)
                {
                    $commentLink = $('<a href="#Comments" class="commentLink feed" ' +
                        'title="' + $.t('controls.grid.view_cell_comments') + '"><span class="icon"></span></a>');
                }
                $commentLink.data('rowId', row.id);
                $commentLink.data('tableColumnId', column.tableColumnId);
                $activeContainer.append($commentLink);
            }
            else { $commentLink = null; }
            $activeContainer.toggleClass('comments-active', $activeCells.hasClass('comments-active'));

            // Size the expander
            sizeCellOverlay($activeContainer, $activeExpand, $activeCells, $commentLink);
            // Position the expander
            positionCellOverlay($activeContainer, $activeCells);

            $activeContainer.removeClass('blist-table-util');
        };

        /**
         * Remove all navigation cues, both logically and physically.
         */
        var clearCellNav = function()
        {
            if (cellNav && cellNav.clearAll()) {
                $activeCells = null;
                updateColumnSelection();
                updateCellNavCues();
                expandActiveCell();
                inside.find('.col-select-holder').remove();
            }
        };

        var cellXY = function(cell)
        {
            var row = getRow(cell);
            if (!row) { return null; }

            var levelID = row.level || 0;
            var rowLayout = layout[levelID];
            var x;
            var node;
            var lcol;
            for (x = 0, node = cell.parentNode.firstChild; node;
                node = node.nextSibling)
            {
                lcol = rowLayout[x];
                if (!lcol) { break; }
                if (node == cell) { break; }
                if (lcol.skippable && $(node).hasClass('blist-skip'))
                {
                    // Children aren't rendered, so skip them
                    x += lcol.skipCount;
                }
                x++;
            }
            if (lcol === undefined) { return null; }

            return { x: x, y: model.index(row) };
        };

        var cellFromXY = function(x, y)
        {
            var row = model.get(y);
            if (row !== undefined)
            {
                var physActive = renderedRows[row.id];
                if (physActive)
                {
                    return $(physActive.row).children().eq(x);
                }
            }
            return null;
        };

        /**
         * Navigate to a particular cell (a DOM element).  Returns true iff the
         * cell is a focusable table cell.  This is used for mouse handling.
         */
        var cellNavTo = function(cell, event, selecting)
        {
            var cellLoc = cellXY(cell);
            if (!cellLoc)
            {
                clearCellNav();
                return false;
            }

            // Check if we clicked in a locked section or on a nested table
            // header; ignore those for now
            // Also ignore clicking in the expander -- that means they clicked
            // on the scrollbar
            if (event)
            {
                var $target = $(event.target);
                if ($target.closest('.blist-table-locked').length > 0 ||
                    (!selecting && $target.closest('.blist-tdh') > 0) ||
                    $target.is('.blist-table-expander'))
                {
                    return false;
                }
            }

            model.unselectAllRows();
            if ($target && $target.is('a') && !selecting)
            {
                // Special case for anchor clicks -- do not select the cell
                // immediately but do enter "possible drag" mode
                clearCellNav();
                return true;
            }

            // Standard cell -- activate the cell
            return cellNavToXY(cellLoc, event, selecting);
        };

        /**
         * Navigate to a particular location (column ID, row ID pair).
         * Returns true iff the location contains a focusable table cell.
         */
        var cellNavToXY = function(xy, event, selecting, wrap)
        {
            // Navigate logically
            if (!cellNav.goTo(xy.x, xy.y, event, selecting, wrap)) {
                return false;
            }
            xy.x = cellNav.getActiveX();
            xy.y = cellNav.getActiveY();

            // If we have an event this call was triggered by explicit user
            // navigation.  In this case we scroll the window as necessary
            if (event)
            {
                // Scroll the active cell into view if it isn't visible vertically
                // Calculate the actual rows visible, with conservative boundaries
                // to make sure the row is visible
                var scrollTop = $scrolls[0].scrollTop;
                var firstRow = scrollTop / renderScaling;
                // Subtract one because we are dealing with row indexes;
                // subtract another to make sure the whole row is visible
                var lastRow = firstRow + pageSize - 2;
                var origScrollTop = scrollTop;

                if (xy.y > lastRow)
                { scrollTop = Math.ceil((xy.y - (pageSize - 2)) * renderScaling); }
                if (xy.y < firstRow)
                { scrollTop = Math.floor(xy.y * renderScaling); }
                if (scrollTop != origScrollTop)
                { $scrolls.scrollTop(scrollTop); }

                // Scroll the active cell into view if it isn't visible
                // horizontally
                // Set up scroll variables to use
                var scrollLeft = $scrolls.scrollLeft();
                var scrollWidth = $scrolls.width();
                if ($scrolls[0].scrollHeight > $scrolls[0].clientHeight) {
                    scrollWidth -= scrollbarWidth;
                }
                var scrollRight = scrollLeft + scrollWidth;

                var row = model.get(xy.y);
                var layoutLevel = layout[row !== undefined ? (row.level || 0) : 0];
                // Calculate left & right positions
                var cellLeft = lockedWidth;
                for (var i = 0; i < xy.x; i++)
                {
                    cellLeft += getColumnWidthPx(layoutLevel[i]);
                }
                var cellRight = cellLeft;
                for (var j = 0; j < cellNav.getActiveWidth(); j++)
                {
                    cellRight += getColumnWidthPx(layoutLevel[xy.x + j]);
                }

                if (cellRight > scrollRight)
                {
                    $scrolls.scrollLeft(cellRight - scrollWidth);
                }
                // Check the left, to make sure it is in view
                if (cellLeft - lockedWidth < scrollLeft)
                {
                    $scrolls.scrollLeft(cellLeft - lockedWidth);
                }
            }

            // Reset standard grid state
            killHotExpander();
            updateCellNavCues();

            return true;
        };


        /*** CELL EDITING ***/

        var $editContainers = {};
        var isEdit = {};
        var DEFAULT_EDIT_MODE = 'edit';
        var EXPAND_EDIT_MODE = 'expand';
        var SELECT_EDIT_MODE = 'select';

        var canEdit = function()
        { return options.editEnabled && model.canWrite(); };

        var editCell = function(cell, mode, newValue)
        {
            if (!mode) { mode = DEFAULT_EDIT_MODE; }
            // Don't start another edit yet
            if (isEdit[mode]) { return false; }
            // Make sure they can edit -- if not, trigger an event
            if (!canEdit())
            {
                if (mode == DEFAULT_EDIT_MODE)
                { $(cell).trigger('attempted_edit'); }
                return false;
            }

            var row = getRow(cell);
            var col = getColumn(cell);
            if (!col || col.id == 'rowHandleCol' ||
                col.id == 'rowNumberCol' ||
                col.isLinked() ||
                !row) { return false; }
            var value = model.getRowValue(row, col);
            if (!value) { value = model.getInvalidValue(row, col); }

            // Obtain an expanding node in utility (off-screen) mode
            var $curEditContainer = $('<div class="blist-table-edit-container ' +
                    'mode-' + mode + ' blist-table-util"></div>');
            $scrolls.append($curEditContainer);
            var realCol = model.columnForID(col.id);
            if ($.isBlank(realCol.renderType.interfaceType)) { return; }
            var blistEditor = $curEditContainer.blistEditor(
                {type: realCol.renderType, row: row, value: value, newValue: newValue,
                    format: realCol.format, customProperties: {dropDownList: realCol.dropDownList,
                        baseUrl: realCol.baseUrl()}});

            $curEditContainer.data('realColumn', realCol);
            configureEditor(cell, $curEditContainer, mode);

            // We upgrade expand mode editors when the user interacts with them
            if (mode == EXPAND_EDIT_MODE)
            {
                $curEditContainer.bind('editor-change', function() {
                    reconfigureEditor(cell, $curEditContainer, mode, SELECT_EDIT_MODE);
                });
            }

            return true;
        }

        var reconfigureEditor = function(cell, $curEditContainer, oldMode, newMode)
        {
            // Deconfigure the editor
            $curEditContainer.unbind();
            $curEditContainer.removeClass('mode-' + oldMode);
            isEdit[oldMode] = false;
            delete $editContainers[oldMode];

            // Terminate any existing editors in static modes
            clearCellNav();
            if (isEdit[SELECT_EDIT_MODE])
                endEdit(true, SELECT_EDIT_MODE);
            if (isEdit[DEFAULT_EDIT_MODE])
                endEdit(true, DEFAULT_EDIT_MODE);

            // Activate the cell
            cellNavTo(cell);
            hideHotExpander();

            // Reconfigure
            $curEditContainer.addClass('mode-' + newMode);
            configureEditor(cell, $curEditContainer, newMode);
        }

        var configureEditor = function(cell, $curEditContainer, mode)
        {
            var blistEditor = $curEditContainer.blistEditor();
            $curEditContainer.bind('edit_end', function(e, isSave, oe)
                { handleEditEnd(e, isSave, oe, mode); });
            if (mode == SELECT_EDIT_MODE)
            { $curEditContainer.keydown(navKeyDown).keypress(navKeyPress); }

            var $editor = blistEditor.$editor();

            isEdit[mode] = true;
            $editContainers[mode] = $curEditContainer;

            if (mode == DEFAULT_EDIT_MODE) { hideActiveCell(); }

            var cellLoc = cellXY(cell);

            var resizeEditor = function()
            {
                if (cellLoc)
                {
                    var $cell = cellFromXY(cellLoc.x, cellLoc.y);
                    if ($cell)
                    {
                        // Note -- + 1 assumes 1px borders
                        blistEditor.adjustSize($cell[0].offsetWidth + 1,
                                $cell[0].offsetHeight + 1,
                                $scrolls.width() * 0.8, $scrolls.height() * 0.8);
                        positionCellOverlay($curEditContainer, $cell);
                    }
                }
            };

            var displayCallback = function()
            {
                resizeEditor();
                $curEditContainer.bind('resize', function() { resizeEditor(); });
                $editor.closest('.blist-table-edit-container')
                    .removeClass('blist-table-util').addClass('shown');
                if (mode != EXPAND_EDIT_MODE)
                { blistEditor.focus(); }
            }

            blistEditor.initComplete(displayCallback);
        };

        var endEdit = function(isSave, mode)
        {
            if (!mode) { mode = DEFAULT_EDIT_MODE; }
            if (!isEdit[mode]) { return; }

            if (mode == DEFAULT_EDIT_MODE) { focus(); }
            delete isEdit[mode];

            var $curEditContainer = $editContainers[mode];
            if (!$curEditContainer) { return; }

            var editor = $curEditContainer.blistEditor();
            editor.finishEdit();

            var origValue = editor.originalValue;
            var value = editor.currentValue();
            var row = editor.row;
            var isValid = editor.isValid();
            var col = $curEditContainer.data('realColumn');

            delete $editContainers[mode];

            if (isSave && (!$.compareValues(origValue, value) ||
                model.isCellError(row, col)))
            { model.saveRowValue(value, row, col, isValid); }

            // Need to defer this because saveRowValue eventually calls
            // to renderRows, which defers rendering even for loaded rows, and
            // if we don't defer, there is a flash of the old value in the cell
            // when the editor disappears from above it
            _.defer(function() { $curEditContainer.remove(); });
        };

        var handleEditEnd = function(event, isSave, origEvent, mode)
        {
            endEdit(isSave, mode);
            origEvent = origEvent || {};
            if (origEvent.type == 'keydown')
            {
                // If they hit esc or F2,
                // re-expand the active cell and prevent keyPress
                if (mode == DEFAULT_EDIT_MODE &&
                    (origEvent.keyCode == 27 || origEvent.keyCode == 113))
                {
                    didNavKeyDown = true;
                    expandActiveCell();
                }
                else { navKeyDown(origEvent); }
            }
            if (!isEdit[DEFAULT_EDIT_MODE] && (origEvent.type != 'mousedown' ||
                isElementInScrolls(origEvent.target)))
            {
                focus();
            }
            else
            {
                cellNav.deactivate();
            }
        };

        /*** CELL HOVER EXPANSION ***/

        var hotExpander;
        var hotExpanderVisible;

        var hideHotExpander = function()
        {
            if (hotExpander)
            {
                hotExpander.style.top = '-10000px';
                hotExpander.style.left = '-10000px';
                hotExpanderVisible = false;
            }
        };

        var killHotExpander = function()
        {
            if (hotCellTimer)
            {
                clearTimeout(hotCellTimer);
                hotCellTimer = null;
            }
            endEdit(true, EXPAND_EDIT_MODE);
            hideHotExpander();
        };

        var setHotCell = function(newCell, event)
        {
            // Update cell hover state
            if (hotCell)
            {
                onCellOut(event);
            }
            hotCell = newCell;
            if (newCell)
            {
                $(newCell).addClass('blist-hot');
                if (options.cellExpandEnabled)
                {
                    hotCellTimer = setTimeout(expandHotCell, EXPAND_DELAY);
                }
            }
        };

        var expandHotCell = function()
        {
            if (options.noExpand) { return; }

            if (!hotCellTimer) { return; }
            hotCellTimer = null;

            var column = getColumn(hotCell);
            var type = column ? column.renderType : null;
            // If this is an inline edit type in edit mode, then just launch the
            //  editor instead of hover
            if (type && type.isInlineEdit)
            {
                if (editCell(hotCell, EXPAND_EDIT_MODE)) { return; }
            }

            // Obtain an expanding node in utility (off-screen) mode
            if (!hotExpander)
            {
                // Create the expanding element
                hotExpander = document.createElement('div');
                var $hotExpander = $(hotExpander);
                $hotExpander.addClass('blist-table-expander');
                $hotExpander.addClass('blist-table-util');
            }
            else
            {
                hideHotExpander();
                $hotExpander = $(hotExpander);
            }
            // If hotExpander is not in the tree anywhere, stick it inside
            if (hotExpander.parentNode == null ||
                hotExpander.parentNode.nodeType == 11) // doc fragment
            {
                $render.append($hotExpander);
            }

            // Clone the node
            var $hotCell = $(hotCell);
            var $wrap = $hotCell.clone();
            $wrap.width('auto').height('auto');
            $hotExpander.width('auto').height('auto');
            $hotExpander.empty();
            $hotExpander.append($wrap);

            // Determine if expansion is necessary.  The + 2 prevents us from
            // expanding if the box would just be slightly larger than the
            // containing cell.  This is a nicety except in the case of
            // picklists where the 16px image tends to be just a tad larger
            // than the text (currently configured at 15px).
            var hotWidth = $hotCell.outerWidth();
            var hotHeight = $hotCell.outerHeight();
            if ($wrap.outerWidth() <= hotWidth + 2 &&
                $wrap.outerHeight() <= hotHeight + 2)
            {
                // Expansion is not necessary
                hideHotExpander();
                return;
            }

            // Size the expander
            var rc = sizeCellOverlay($hotExpander, $wrap, $hotCell, null, true);
            // Position the expander
            rc = $.extend(rc, positionCellOverlay($hotExpander,
                $hotCell, true, rc));

            $hotExpander.removeClass('blist-table-util');

            hotExpanderVisible = true;
            // Expand the element into position
            // We need to catch if the expander was hidden while animating,
            // in which case we need to re-hide it at the end of the animation
            $hotExpander.animate(rc, EXPAND_DURATION, null,
                function() { if (!hotExpanderVisible) { hideHotExpander(); } });
        };


        /***  CELL EXPANSION & POSITIONING  ***/

        var positionCellOverlay = function($container, $refCell, animate, curSize)
        {
            // Locate a position for the expansion.  We prefer the expansion to
            // align top-left with the cell, but can lock to one of the other
            // edges if it fits better there
            //
            // Note that -1 on top but not left assumes top border is on cell
            // above (and is 1px) but left border is on this cell.  More flexible
            // alternative would be to subtract right border width on cell to the
            // left and bottom border width on cell above.  Doesn't seem worth
            // the pain, though -- our CSS is unlikely to change short of a major
            // rewrite that would require this code to be revisited anyway.
            //
            // Calculate these relative to the parent offset & scrolling to
            // correctly deal with different reference frames
            var $parent = $container.parent();
            var left = $refCell.offset().left - $parent.offset().left +
                $parent.scrollLeft();
            var top = $refCell.offset().top - $parent.offset().top -
                1 + $parent.scrollTop();
            var origOffset = { top: top, left: left };
            var maxWidth;
            var maxHeight;

            // Ensure viewport is in the window horizontally
            var contWidth = curSize ? curSize.width : $container.outerWidth();
            var viewportWidth = $scrolls.width();
            if ($scrolls[0].scrollHeight > $scrolls[0].clientHeight)
            {
                viewportWidth -= scrollbarWidth;
            }
            var scrollLeft = $scrolls.scrollLeft();
            var refWidth = $refCell.outerWidth();
            // If the left end falls off the edge, then check if we can get
            // more space by expanding from the right
            if (left + contWidth > scrollLeft + viewportWidth &&
                left + refWidth - scrollLeft > scrollLeft + viewportWidth - left)
            {
                maxWidth = left + refWidth - scrollLeft;
                left -= Math.min(maxWidth, contWidth) - refWidth;
            }
            else { maxWidth = scrollLeft + viewportWidth - left; }

            // Ensure viewport is in the window vertically
            var contHeight = curSize ? curSize.height : $container.outerHeight();
            var viewportHeight = $scrolls.height();
            if ($footerScrolls.is(':visible'))
            { viewportHeight -= $footerScrolls.outerHeight() - 1; }
            if ($scrolls[0].scrollWidth > $scrolls[0].clientWidth)
            {
                viewportHeight -= scrollbarWidth;
            }

            // Figure out how much the parent is scrolled by, plus the offset
            // of the parent from the viewport
            var scrollTop = $parent.scrollTop() +
                ($scrolls.offset().top - $parent.offset().top);
            var refHeight = $refCell.outerHeight();

            // If the bottom falls off the edge, see if aligning it to the
            // bottom will help
            if (top + contHeight > scrollTop + viewportHeight &&
                top + refHeight - scrollTop > scrollTop + viewportHeight - top)
            {
                maxHeight = top + refHeight - scrollTop;
                top -= Math.min(maxHeight, contHeight) - refHeight;
            }
            else
            {
                maxHeight = scrollTop + viewportHeight - top;
            }

            if (!animate)
            {
                origOffset = { top: top, left: left };
            }
            $container.css('top', origOffset.top + 'px');
            $container.css('left', origOffset.left + 'px');
            $container.css('max-width', maxWidth + 'px');
            $container.css('max-height', maxHeight + 'px');

            return ({left: left, top: top});
        };

        var sizeCellOverlay = function($container, $expandCells, $refCells, $extraItems,
            animate)
        {
            $expandCells.eq(0).addClass('blist-first');
            $expandCells.eq($expandCells.length - 1).addClass('blist-last');

            $container.css('max-width', '').css('max-height', '');
            // Determine the cell's "natural" size
            var rc = { width: $container.outerWidth(),
                height: $container.outerHeight() };
            var refWidth = 0;
            var refHeight = 0;
            var minWidths = [];
            // $().add().each would be wonderful here; but it reorders elements
            // into DOM order, which can make $extraItems come before $refCells,
            // in which case the minWidths order is all screwed up
            _.each($.makeArray($refCells).concat($.makeArray($extraItems)), function(t)
            {
                var $t = $(t);
                var w = $t.outerWidth();
                refWidth += w;
                minWidths.push(w);
                refHeight = Math.max(refHeight, $t.outerHeight());
            });

            // Overlays are positioned on overlapping borders so we need to correct
            // the reference dimensions
            refWidth += 1;
            refHeight += 1;

            // The expander must be at least as large as the hot cell
            if (rc.width < refWidth)
            {
                rc.width = refWidth;
            }
            if (rc.height < refHeight)
            {
                rc.height = refHeight;
            }

            // Determine the size to which the contents expand, constraining to
            // predefined maximums
            var maxWidth = $scrolls.width();
            if ($scrolls[0].scrollHeight > $scrolls[0].clientHeight)
            { maxWidth -= scrollbarWidth; }
            // Adjust for position of cell
            var scrollsLeft = $scrolls.offset().left;
            maxWidth = Math.max(maxWidth - ($refCells.eq(0).offset().left - scrollsLeft),
                ($refCells.eq(-1).offset().left - scrollsLeft) + $refCells.eq(-1).outerWidth(true));
            maxWidth = Math.floor(maxWidth * 0.8);
            if (rc.width > maxWidth)
            {
                // Constrain the width and determine the height
                $container.width(maxWidth);
                rc.width = maxWidth;
                rc.height = $container.outerHeight();
            }

            var maxHeight = $scrolls.height();
            if ($scrolls[0].scrollWidth > $scrolls[0].clientWidth)
            { maxHeight -= scrollbarWidth; }
            // Adjust for position of cell
            var scrollsTop = $scrolls.offset().top;
            maxHeight = Math.max(maxHeight - ($refCells.eq(0).offset().top - scrollsTop),
                ($refCells.eq(-1).offset().top - scrollsTop) + $refCells.eq(-1).outerHeight(true));
            maxHeight = Math.floor(maxHeight * 0.9);
            if (rc.height > maxHeight)
            {
                rc.height = maxHeight;
            }

            // Compute container padding
            var outerPadx = $container.outerWidth() - $container.width();
            var outerPady = $container.outerHeight() - $container.height();
            rc.width -= outerPadx;
            rc.height -= outerPady;

            var availW = rc.width;
            if (!$.isBlank($extraItems))
            {
                $extraItems.each(function()
                {
                    var $t = $(this);
                    availW -= $t.outerWidth();
                });
            }

            var countedScroll = false;
            var extraPadding = 0;
            $expandCells.each(function(i)
            {
                var minW = minWidths.shift();
                var $t = $(this);
                // Compute cell padding
                var w = $t.outerWidth();
                var innerPadx = w - $t.width();
                // If we have more than one cell, take off the left border width
                // to make sure the cells line up
                if (i == 0 && $expandCells.length > 1)
                { innerPadx += outerPadx / 2; }

                // If the cell is taller than the parent, subtract off the
                // scrollbar size
                if (!countedScroll && $t.outerHeight() > rc.height)
                {
                    availW -= scrollbarWidth;
                    countedScroll = true;
                }

                // Size the cell
                // If necessary, bump up by one pixel to offset any text that
                // is not exactly on a pixel boundary
                if (w > minW)
                {
                    innerPadx--;
                    extraPadding++;
                }
                $t.width(Math.min(Math.max(minW, w), availW) - innerPadx);

                availW -= $t.outerWidth();

                if (rc.height > $t.outerHeight())
                {
                    var innerPady = $t.outerHeight() - $t.height();
                    $t.height(rc.height - innerPady);
                }
            });

            // Account for the extra pixels already added for rounding to the
            // insides
            rc.width += extraPadding;

            if (!animate)
            {
                refWidth = rc.width;
                refHeight = rc.height;
            }

            // Size the content wrapper
            $container.width(refWidth);
            $container.height(refHeight);

            return rc;
        };


        /*** MOUSE HANDLING ***/

        // Handle mouse movement within the inside (cell) area
        var hotCell;
        var hotRowID;
        var hotCellTimer;
        var hotHeader;
        // 1 = hover, 2 = resize, 3 = control hover, 4 = move, 5 = multi-select
        var hotHeaderMode;
        var hotHeaderDrag = false;
        var skipHeaderClick;
        var mouseDownAt;
        var dragHeaderLeft;
        var clickTarget;
        var clickCell;
        var selectFrom;

        var findContainer = function(event, selector)
        {
            var $container;
            // Firefox will sometimes return a XULElement for relatedTarget
            //  Catch the error when trying to access anything on it,
            //  and fall back to the target (which is technically what we're
            //  leaving; but it seems to work OK)
            try
            {
                $container = $(event.type == "mouseout" ?
                    event.relatedTarget : event.target);
            }
            catch (ignore) { $container = $(event.target); }
            if (!$container)
            {
                return null;
            }
            if (!$container.is(selector))
            {
                $container = $container.closest(selector);
                if (!$container.length)
                {
                    return null;
                }
            }
            return $container[0];
        };

        var findCell = function(event)
        {
            var cell = findContainer(event, '.blist-td, .blist-table-expander, ' +
                '.blist-table-active-container, .blist-table-edit-container');
            if (!cell) { return null; }

            var $cell = $(cell);

            // Can't interact with fill
            if ($cell.is('.blist-tdfill, .blist-opener-space'))
            { return null; }

            // If we are looking at the selection expansion, return
            //  the first active cell
            if ($activeCells &&
                (($activeContainer &&
                    ($cell[0] == $activeContainer[0] ||
                    $cell.parent()[0] == $activeContainer[0])) ||
                $cell.closest('.blist-table-edit-container.mode-' +
                    DEFAULT_EDIT_MODE).length > 0 ||
                $cell.closest('.blist-table-edit-container.mode-' +
                    SELECT_EDIT_MODE).length > 0))
            { return $activeCells[0]; }

            // Nested table header send focus to the opener
            if ($cell.hasClass('blist-tdh'))
            {
                while (!$cell.hasClass('blist-opener'))
                { $cell = $(cell = cell.previousSibling); }
                return cell;
            }

            // If the mouse strays over the hot expander return the hot cell
            if (cell == hotExpander || cell.parentNode == hotExpander ||
                $cell.closest('.blist-table-edit-container.mode-' + EXPAND_EDIT_MODE)
                    .length > 0)
            { return hotCell; }

            // Normal cell
            return cell;
        };

        var handleHeaderHover = function(event)
        {
            if (hotHeaderMode == 4 && hotHeaderDrag || isDisabled)
            { return false; }

            var container = findContainer(event, '.blist-tr, .blist-table-header');
            if (!container) {
                return false;
            }

            var x = event.clientX;
            var hh, hhm;
            var foundRealHeader = false;

            var $headers = $('.blist-th:not(.blist-table-ghost), .blist-tdh',
                    container);

            $headers.each(function(i)
                {
                    var header = $(this);
                    var left = header.offset().left;
                    if (left > x) { return false; }
                    var width = header.outerWidth();
                    var right = left + width;

                    var isCtl = header.is('.blist-opener, ' +
                        '.blist-table-row-handle, .blist-table-ghost, .blist-column-adder');
                    var isSizable = !isCtl && !header.is('.nested_table') &&
                        !(options.disableLastColumnResize &&
                            (i == ($headers.length - 1)));

                    if (isSizable && x >= right - options.resizeHandleAdjust &&
                        x < right + options.resizeHandleAdjust)
                    {
                        hh = header[0];
                        hhm = 2;
                        dragHeaderLeft = left;
                        foundRealHeader =
                            header.is('.blist-th, .blist-tr-open .blist-tdh');
                        return false;
                    }

                    if (x >= left && x < right)
                    {
                        hh = header[0];
                        var $dragHandle = header.find('.dragHandle');
                        if ($dragHandle.length < 1) { return false; }

                        var dragLeft = $dragHandle.offset().left;
                        var dragRight = dragLeft + $dragHandle.outerWidth();
                        if (x >= dragLeft && x < dragRight)
                        {
                            hhm = 4;
                        }
                        else
                        {
                            hhm = isCtl ? 3 : 1;
                        }
                        foundRealHeader =
                            header.is('.blist-th, .blist-tr-open .blist-tdh');
                        return false;
                    }
                });

            if (hh)
            {
                if (hh != hotHeader || hhm != hotHeaderMode)
                {
                    hotHeader = hh;
                    hotHeaderMode = hhm;
                    var $hh = $(hotHeader);
                    var isNT = $hh.hasClass('blist-tdh');
                    if (hotHeaderMode == 2)
                    {
                        $outside.css('cursor', 'col-resize');
                        if (isNT) { $hh.css('cursor', 'col-resize'); }
                    }
                    else
                    {
                        $outside.css('cursor', 'default');
                        if (isNT) { $hh.css('cursor', 'default'); }
                    }
                }
                return foundRealHeader;
            }
            return false;
        };

        var handleColumnResize = function(event, isFinished) {
            var width = event.clientX - dragHeaderLeft - paddingX;
            if (width < MINIMUM_HEADER_SIZE) {
                width = MINIMUM_HEADER_SIZE;
            }
            var col = getColumnForHeader(hotHeader);
            if (col.hasOwnProperty('minWidth') && width < col.minWidth)
            { width = col.minWidth; }

            if (col.hasOwnProperty('percentWidth'))
            {
                varDenom[0] -= col.percentWidth;
                delete col.percentWidth;
                variableColumns[0] = $.grep(variableColumns[0], function (c, i)
                    { return c.id == col.id; }, true);
                if (col.minWidth)
                {
                    varMinWidth[0] -= col.minWidth;
                }
            }
            col.update({width: width});
            // HACK
            col.view._markTemporary(!col.view.isDefault() || !col.view.isPublished());
            adjustHeaderStyling($(col.dom), true);
            $this.trigger('column_resized', [col, isFinished]);
            updateColumnSelection();
        };

        var makeHotRow = function(rowID)
        {
            $/*inside.find*/('#' + id + '-r' + rowID)
                .addClass('blist-hot-row');
            $/*$locked.find*/('#' + id + '-l' + rowID)
                .addClass('blist-hot-row');
            model.view.highlightRows({id: rowID});
        };

        var unHotRow = function(rowID)
        {
            $/*inside.find*/('#' + id + '-r' + rowID)
                .removeClass('blist-hot-row');
            $/*$locked.find*/('#' + id + '-l' + rowID)
                .removeClass('blist-hot-row');
            if (rowID == hotRowID) { hotRowID = null; }
            model.view.unhighlightRows({id: rowID});
        };

        var onMouseMove = function(event)
        {
            if (hotHeaderDrag)
            {
                if (hotHeaderMode == 2) {
                    handleColumnResize(event);
                    return;
                }
                else if (hotHeaderMode == 4) { return; }
            }

            // Handle mouse down movement
            if (mouseDownAt) {
                if (clickTarget && Math.abs(event.clientX - mouseDownAt.x) > 3 ||
                    Math.abs(event.clientY - mouseDownAt.y > 3))
                {
                    // No longer consider this a potential click event
                    clickTarget = null;
                    clickCell = null;
                }

                // If we are selecting and can't be in a click then update the
                // selection
                if (selectFrom && !clickTarget)
                {
                    // Ensure that the cell we started dragging from is the
                    // beginning of the current selection
                    if (!cellNav.selectionInit(cellXY(selectFrom))) {
                        cellNavTo(selectFrom, event);
                    }

                    // If we've moved over another cell, update the selection
                    var over = findCell(event);
                    if (over &&
                        $(over).closest('.blist-table-edit-container').length <= 0)
                    {
                        cellNavTo(over, event, true);
                    }
                }

                return;
            }

            if (handleHeaderHover(event))
            {
                if (hotCell) { onCellOut(event); }
            }
            else if (hotHeader)
            {
                hotHeader = null;
                $outside.css('cursor', 'auto');
            }

            // Locate the cell the mouse is in, if any
            over = findCell(event);

            // If the hover cell is currently hot or is an editor or is the
            // selected (active) cell, nothing to do
            if (over == hotCell ||
                ($activeCells && $activeCells.index(over) >= 0) ||
                $(over).closest('.blist-table-edit-container').length > 0)
            {
                return;
            }

            // Update row hover state
            // + 2 for "-r"/"-l" suffix prior to row ID
            var $nhr = $(over).closest('.blist-tr');
            var newHotID = $nhr.length > 0 ?
                ($nhr.attr('id') || '').substring(id.length + 2) : null;
            if (!isDisabled && newHotID != hotRowID)
            {
                if (hotRowID)
                {
                    unHotRow(hotRowID);
                }
                if (newHotID)
                {
                    makeHotRow(newHotID);
                }
                hotRowID = newHotID;
            }

            setHotCell(over, event);
        };

        var onCellOut = function(event)
        {
            // If we moused into a menu, don't count it as cell out
            if ($(event.relatedTarget).closest('.columnHeaderMenu, .rowMenu').length > 0)
            { return; }

            if (hotCell)
            {
                // Find the cell focus is moving to
                var to = findCell(event);
                if (to == hotCell)
                {
                    // Ignore -- hot cell isn't changing
                    return;
                }

                // The row is no longer hot if we're changing rows
                if (hotRowID)
                {
                    var $nhr = $(to).closest('.blist-tr');
                    var newHotID = $nhr.length > 0 ?
                        $nhr.attr('id').substring(id.length + 2) : null;
                    if (newHotID != hotRowID)
                    {
                        unHotRow(hotRowID);
                    }
                }

                // Cell is no longer hot
                $(hotCell).removeClass('blist-hot');
                hotCell = null;
                killHotExpander();
            }
        };

        var onCellClick = function(event, origEvent)
        {
            var cell = findCell(event);
            if (cell)
            {
                // Retrieve the row
                var row = getRow(cell);
                if (!row) { return; }

                // Retrieve the column
                var column = getColumn(cell);

                // Notify listeners
                var cellEvent = $.Event('cellclick');
                $this.trigger(cellEvent, [ row, column, origEvent ]);
                if (cellEvent.isDefaultPrevented()) { return; }

                var skipSelect = false;
                // If this is a row opener, invoke expand on the model
                if ($(cell).hasClass('blist-opener') &&
                    !$(cell).hasClass('blist-opener-inactive'))
                {
                    clearCellNav();
                    endEdit(DEFAULT_EDIT_MODE);
                    model.expand(row);
                    skipSelect = true;
                }

                if (!isDisabled && !skipSelect &&
                    (!cellNav || !cellNav.isActive()) && options.selectionEnabled)
                {
                    if (origEvent.shiftKey)
                    {
                        model.selectRowsTo(row);
                    }
                    else
                    {
                        model.selectRow(row);
                    }
                    unHotRow(row.id);
                }
            }
        };

        // Adapted from http://cubiq.org/scrolling-div-on-iphone-ipod-touch
        var touchLastY, touchLastX;
        var onTouchStart = function(event)
        {
            var e = event.originalEvent;
            touchLastY = e.targetTouches[0].clientY;
            touchLastX = e.targetTouches[0].clientX;
        };

        var onTouchMove = function(event)
        {
            var e = event.originalEvent;

            if (_.isUndefined(e.targetTouches) ||
               (e.targetTouches.length !== 1))
            {
                return false;
            }

            var $scrolls = $outside.find('.blist-table-scrolls');

            var deltaY = touchLastY - e.targetTouches[0].clientY;
            // in reality scrolling exactly with detection runs ~2x speed
            deltaY /= 2;
            $scrolls[0].scrollTop = $scrolls[0].scrollTop + deltaY;

            var deltaX = touchLastX - e.targetTouches[0].clientX;
            $scrolls[0].scrollLeft = $scrolls[0].scrollLeft + deltaX;
        };

        var $prevActiveCells;
        var onMouseDown = function(event)
        {
            clickTarget = event.target;

            if (isDisabled) { return; }

            clickCell = findCell(event);
            var $clickTarget = $(clickTarget);

            if ($clickTarget.hasClass('commentLink') || $clickTarget.parent().hasClass('commentLink'))
            { return; }

            // IE & WebKit only detect mousedown on scrollbars, not mouseup;
            // so we need to ignore clicks on the scrollbar to avoid having a
            // false drag event
            // If they clicked on the scrollbar, ignore
            if ($clickTarget.is('.blist-table-scrolls, .blist-table-expander'))
            { return; }

            if (isEdit[DEFAULT_EDIT_MODE] &&
                $clickTarget.parents().andSelf()
                    .index($editContainers[DEFAULT_EDIT_MODE]) >= 0)
            { return; }


            mouseDownAt = { x: event.clientX, y: event.clientY };

            if (hotHeader && hotHeaderMode != 3)
            {
                if ($clickTarget.closest('.action-item').length < 1 &&
                    ($clickTarget.closest('.blist-tdh').length < 1 ||
                        hotHeaderMode == 2))
                {
                    clickTarget = null;
                    clickCell = null;
                    hotHeaderDrag = true;
                    // stopProp doesn't work with draggable
                    if (hotHeaderMode != 4) { event.stopPropagation(); }
                    event.preventDefault();
                }

                // Kill off edit & select modes
                if (isEdit[DEFAULT_EDIT_MODE]) { endEdit(true); }
                if (cellNav)
                {
                    cellNav.deactivate();
                    hideActiveCell();
                }

                // Don't stop the click if they clicked on an action item
                if ($clickTarget.closest('.action-item').length < 1)
                { event.preventDefault(); }

                return;
            }

            selectFrom = null;

            // We may have clicked in something that will get removed from
            // the page before the document mouseDown handler can deal with;
            // so provide a hint here
            clickedInGrid = isElementInScrolls(clickTarget);

            if (cellNav)
            {
                var cell = findCell(event);
                // If this is a row opener, header, handle, or adder, we don't
                // allow normal cell nav clicks on them; so skip the rest
                if ($(cell).is('.blist-opener, .blist-tdh, ' +
                    '.blist-table-row-handle, .blist-column-adder'))
                {
                    return;
                }

                if (cell && $activeCells && $activeCells.index(cell) >= 0)
                {
                    $prevActiveCells = $activeCells;
                }
                else
                {
                    $prevActiveCells = null;
                    if (!event.shiftKey && !event.metaKey)
                    {
                        clearCellNav();
                    }
                }
                if (cell && cellNavTo(cell, event))
                {
                    if (isEdit[DEFAULT_EDIT_MODE]) { endEdit(true); }
                    selectFrom = cell;
                }

            }
        };

        var onMouseUp = function(event)
        {
            mouseDownAt = null;

            if (isEdit[DEFAULT_EDIT_MODE]) { return; }

            if (!isDisabled && hotHeaderDrag) {
                $curHeaderSelect = null;
                origColSelects = null;
                curColSelects = {};
                hotHeaderDrag = false;
                // First finish up resize before doing last mouse move,
                // or else resizing when at the right edge of a wide dataset
                // will cause the mouse events to screwy as the scrollbar
                // shrinks and the header moves
                if (hotHeaderMode == 2) { handleColumnResize(event, true); }
                if (hotHeaderMode > 1 ) { skipHeaderClick = true; }
                onMouseMove(event);
                event.stopPropagation();
                event.preventDefault();
                return true;
            }

            var $target = $(event.target);
            if ($target.closest('.action-item').length > 0) { return; }
            if ($target.parents().index($outside) < 0) { return; }

            if ($target.hasClass('commentLink') || $target.parent().hasClass('commentLink'))
            { return; }

            var cell = findCell(event);
            var editMode = false;
            if (!isDisabled && cellNav && cell !== null && cell == clickCell)
            {
                var curActiveCell = (cellNav.isActive() && $activeCells) ?
                    $activeCells[0] : null;
                if (curActiveCell && $prevActiveCells &&
                        $prevActiveCells.index(curActiveCell) >= 0)
                {
                    // They clicked on a selected cell, go to edit mode
                    editMode = editCell(curActiveCell);
                }
                else if (curActiveCell)
                {
                    $prevActiveCells = $activeCells;
                }
                if (!editMode) { focus(); }
            }

            if (clickTarget && clickTarget == event.target &&
                !$(clickTarget).is('a'))
            {
                $(clickTarget).trigger('table_click', event);
            }

            if (!isDisabled && cellNav && !editMode) { expandActiveCell(); }
        };

        var onClick = function(event)
        {
            var $t = $(event.target);
            if ($t.hasClass('commentLink') || $t.parent().hasClass('commentLink'))
            {
                event.preventDefault();
                var $a = $t.closest('.commentLink');
                $a.trigger('comment_click', [$a.data('rowId'), $a.data('tableColumnId')]);
            }
        };

        var onDoubleClick = function(event)
        {
            if (isDisabled) { return; }

            if (isEdit[DEFAULT_EDIT_MODE] &&
                $(event.target).parents().andSelf()
                    .index($editContainers[DEFAULT_EDIT_MODE]) >= 0)
            { return; }

            clickTarget = event.target;

            if (cellNav)
            {
                var cell = findCell(event);
                if (cell)
                {
                    // They clicked on a cell, go to edit mode
                    editCell(cell);
                }
            }
        };


        /*** KEYBOARD HANDLING ***/

        // Page size is configured in renderRows()
        var pageSize = 1;

        // Is the navigator focused?
        var navFocused = false;

        // Move the active cell an arbitrary number of columns
        var navigateX = function(deltaX, event, wrap)
        {
            var to = cellNav.navigateX(deltaX, event, wrap);
            if (to) { cellNavToXY(to, event, false, wrap); }
        };

        // Move the active cell an arbitrary number of rows.  Supports an value
        // for deltaY, including negative offsets
        var navigateY = function(deltaY, event, wrap)
        {
            var to = cellNav.navigateY(Math.floor(deltaY), event, wrap);
            if (to) {
                cellNavToXY(to, event, false, wrap);
            }
        };

        var onCopy = function(event) {
            if (cellNav) {
                $navigator.val(cellNav.getSelectionDoc());
                $navigator[0].select();
            }
        };

        var didNavKeyDown = false;
        var navKeyDown = function(event)
        {
            didNavKeyDown = true;
            doKeyNav(event);
        };

        var navFocus = function()
        {
            navFocused = true;
        }

        var navBlur = function()
        {
            navFocused = false;
        }

        var navHasSelection = function()
        {
            if (!navFocused)
            {
                return false;
            }

            if (document.selection)
            {
                // IE
                return document.selection.createRange().text.length > 0;
            }

            return Math.abs($navigator.selectionEnd - $navigator.selectStart) > 0;
        }

        // This call fires immediately after certain events that may indicate user input
        var checkForEditorInput = function()
        {
            // If the navigator has selection then the user didn't enter anything.  Otherwise the selection would have
            // been replaced
            if (navHasSelection())
            {
                return;
            }

            // If the value is empty then the user didn't enter anything.  Otherwise it would be present
            var newValue = $navigator.val();
            if (!newValue)
            {
                return;
            }

            // OK, we determined the user entered something.
            editCurrentCell(newValue);
        }

        // Begin editing the current cell in default edit mode, optionally replacing the value in the cell
        var editCurrentCell = function(newValue) {
            // Find the cell that will receive the input
            var curActiveCell = (cellNav.isActive() && $activeCells) ? $activeCells[0] : null;
            if (!curActiveCell)
            {
                return;
            }

            // Enter edit mode
            editCell(curActiveCell, null, newValue);
        }

        var navKeyPress = function(event)
        {
            if (cellNav && cellNav.isActive())
            {
                if (!navHasSelection())
                {
                    $navigator.val('');
                }
                setTimeout(checkForEditorInput, 1);
            }

            if (didNavKeyDown)
            {
                didNavKeyDown = false;
                return;
            }
            doKeyNav(event);
        };

        var doKeyNav = function(event)
        {
            if (!cellNav) { return; }

            switch (event.keyCode)
            {
                case 90:
                    // Ctrl-z
                    if (event.metaKey) { if (model.canUndo()) { model.undo(); } }
                    else { return; }
                    break;

                case 89:
                    // Ctrl-y
                    if (event.metaKey) { if (model.canRedo()) { model.redo(); } }
                    else { return; }
                    break;

                case 33:
                    // Page up
                    navigateY(-pageSize, event);
                    break;

                case 34:
                    // Page down
                    navigateY(pageSize, event);
                    break;

                case 37:
                    // Left
                    navigateX(-1, event);
                    break;

                case 38:
                    // Up
                    navigateY(-1, event);
                    break;

                case 39:
                    // Right
                    navigateX(1, event);
                    break;

                case 40:
                    // Down
                    navigateY(1, event);
                    break;

                case 8:
                    // Backspace
                    editCurrentCell('');
                    break;

                case 9:
                    // Tab
                    var direction = event.shiftKey ? -1 : 1;
                    event.shiftKey = false;
                    navigateX(direction, event, true);
                    break;

                case 13:
                    // Enter
                    if (!event.shiftKey &&
                        $activeCells && $activeCells.hasClass('blist-opener') &&
                        !$activeCells.hasClass('blist-opener-inactive'))
                    {
                        model.expand(getRow($activeCells[0]));
                    }
                    else
                    {
                        direction = event.shiftKey ? -1 : 1;
                        event.shiftKey = false;
                        navigateY(direction, event, true);
                    }
                    break;

                case 27:
                    // Esc
                    clearCellNav();
                    break;

                case 113:
                    // F2
                    var curActiveCell = $activeCells ? $activeCells[0] : null;
                    if (curActiveCell)
                    {
                        if (editCell(curActiveCell))
                        {
                            event.preventDefault();
                            return;
                        }
                    }
                    break;

                default:
                    return;
            }

            hideActiveCell();
            focus();
            setTimeout(expandActiveCell, 0);

            // We may be handling an event from the rich text editor iframe,
            //  which in IE we cannot access.  If it throws an error, just ignore
            //  it, and we'll manage OK
            try { event.preventDefault(); }
            catch (err) {}
        };

        var isElementInScrolls = function(element)
        {
            return $(element).closest('.blist-table-scrolls')[0] == $scrolls[0];
        }

        if (options.simpleCellExpand)
        {
            $('.blist-td:not(.blist-td-popout)').live('mouseover', function (event)
            {
                var $this = $(this);

                var innerContentWidth = 0;
                $this.children().each(function() { innerContentWidth += $(this).outerWidth(true); });

                if (innerContentWidth <= $this.innerWidth()) {
                    return;
                }

                var offsetPos = $this.offset();
                offsetPos.top += $this.offsetParent().scrollTop();

                var $copy = $this.clone();
                var outTimer;
                var clearCopy = function()
                {
                    $copy.stop().fadeOut('fast', function() { $copy.remove(); });
                };
                $copy
                    .addClass('blist-td-popout')
                    .css('left', offsetPos.left)
                    .css('top', offsetPos.top)
                    .mouseover(function()
                    { clearTimeout(outTimer); })
                    .mouseleave(clearCopy)
                    .fadeIn();
                $this.mouseleave(function()
                { outTimer = setTimeout(clearCopy, 0); });
                $(document.body).append($copy);
            });
        }


        /*** HTML RENDERING ***/

        var headerStr =
            '<input type="text" class="blist-table-navigator hiddenTextField" />' +
            '<div class="blist-table-locked-scrolls">' +
            '   <div class="blist-table-locked-header">&nbsp;</div>' +
            '   <div class="blist-table-locked">' +
            '     <div class="blist-table-render">&nbsp;</div>' +
            '   </div>' +
            '   <div class="blist-table-locked-footer">&nbsp;</div>' +
            '</div>' +
            '<div class="blist-table-top">' +
            '  <div class="blist-table-header-scrolls">' +
            '    <div class="blist-table-header">&nbsp;</div>' +
            '    <div class="indicator-container"></div>' +
            '</div></div>' +
            '<div class="blist-table-scrolls">' +
            '  <div class="blist-table-inside">' +
            '    <div class="blist-table-render">&nbsp;</div>' +
            '    <div class="blist-table-no-results hide">' + $.t('controls.grid.no_rows') + '</div>' +
            '  </div>' +
            '</div>' +
            '<div class="blist-table-footer-scrolls">' +
            '    <div class="blist-table-footer">&nbsp;</div>' +
            '</div>' +
            '<div class="blist-table-util"></div>';

        $(document)
            .mouseup(onMouseUp);

        // Render container elements
        var $outside = $this
            .addClass('blist-table')
            .mousedown(onMouseDown)
            .mousemove(onMouseMove)
            .click(onClick)
            .dblclick(onDoubleClick)
            .html(headerStr);

        if (options.columnDrag)
        {
            $outside.append($('<div class="dropIndicator"/>'));
            $dropIndicator = $('.dropIndicator', $outside)
                .css('left', -10000).hide();
        }

        var $lockedScrolls = $outside.find('.blist-table-locked-scrolls');
        var $lockedHeader = $lockedScrolls.find('.blist-table-locked-header');
        var $locked = $lockedScrolls.find('.blist-table-locked')
            .bind('table_click', onCellClick);
        var $lockedRender = $locked.find('.blist-table-render');
        var $lockedFooter = $lockedScrolls.find('.blist-table-locked-footer');

        // The top area
        var $top = $outside.find('.blist-table-top');

        // The table header elements
        var $headerScrolls = $top
            .find('.blist-table-header-scrolls');
        var $header = $headerScrolls
            .find('.blist-table-header');

        // The scrolling container
        var $scrolls = $outside
            .find('.blist-table-scrolls')
            .scroll(_.throttle(function() { onScroll(); renderRows(); }, 200))
            .bind('touchstart', onTouchStart)
            .bind('touchmove', onTouchMove);

        // The non-scrolling row container
        var inside = $scrolls
            .find('.blist-table-inside')
            .mouseout(onCellOut)
            .bind('table_click', onCellClick);

        // Container that rows render in that is moved around
        var $render = inside.find('.blist-table-render');
        var renderDOM = $render[0];

        var $noResults = inside.find('.blist-table-no-results');

        // Keep track of factor to scale by when scrolling
        var scalingFactor = 1;
        // This is roughly rowOffset / scalingFactor, adjusted to the exact
        // ratio to allow us to turn a scroll position into the exact top row
        var renderScaling = 1;

        // Footer pieces
        var $footerScrolls = $outside.find('.blist-table-footer-scrolls');
        var $footer = $footerScrolls.find('.blist-table-footer');

        // These utility nodes are used to append rows and measure cell text,
        // respectively
        var appendUtil = $(document.createElement('div'));
        var appendUtilDOM = appendUtil[0];
        var measureUtil = $outside
            .find('.blist-table-util');
        var measureUtilDOM = measureUtil[0];

        // This guy receives focus when the user interacts with the grid
        var $navigator = $outside.find('.blist-table-navigator')
            .keydown(navKeyDown)
            .keypress(navKeyPress)
            .bind('copy', onCopy)
            .bind('blur', navBlur);

        // Set up initial top of locked section
        $locked.css('top', $header.outerHeight());

        // Install global listener to disable the active cell indicator when we lose focus
        var clickedInGrid = false;
        if (cellNav) {
            var onDocumentMouseDown = function(e) {
                // Process clicks outside of the grid
                if (cellNav.isActive() && !clickedInGrid &&
                    !isElementInScrolls(e.target))
                {
                    // Leaving table
                    cellNav.deactivate();
                    hideActiveCell();
                }
                clickedInGrid = false;
            }
            $(document).mousedown(onDocumentMouseDown);
        }


        /*** SCROLLING AND SIZING ***/

        // Measure the scroll bar
        var scrollbarWidth = (function scrollbarWidth()
        {
            var div = $('<div style="width:50px;height:50px;overflow:hidden;' +
                'position:absolute;top:-200px;left:-200px;">' +
                '<div style="height:100px;"></div></div>');
            $('body').append(div);
            var w1 = div[0].clientWidth;
            div.css('overflow', 'scroll');
            var w2 = div[0].clientWidth;
            $(div).remove();
            return w1 - w2;
        })();

        // Window sizing
        var updateLayout = function()
        {
            if (!dsReady || rowOffset < 1) { return; }

            begin("updateLayout.size.header");
            $headerScrolls.height($header.outerHeight());
            end("updateLayout.size.header");

            begin("updateLayout.size.scrolls");
            // Size the scrolling area.  TODO - change to absolute positioning
            // when IE6 is officially dead (2015?)
            $scrolls.height($outside.height() - $top.outerHeight() -
                ($scrolls.outerHeight() - $scrolls.height()) - 1);
            $scrolls.width($outside.width() -
                ($scrolls.outerWidth() - $scrolls.width()));
            end("updateLayout.size.scrolls");

            // If we ended up with too small a scrolls height, then this
            // is actually hidden; and we should bail
            if ($scrolls.height() < 5) { return; }

            begin("updateLayout.size.calculate");
            // Figure out how much space we have to display rows
            var scrollHeight = $scrolls[0].clientHeight;
            // Count the scrolling page size
            pageSize = (scrollHeight / rowOffset) || 1;

            // Size the inside row container
            var rowCount = model !== undefined ? model.length() : 0;
            var insideHeight = rowOffset * rowCount;
            end("updateLayout.size.calculate");

            begin("updateLayout.size.footer");
            // Calculate the height of the footer, to use for display
            var footerHeight = 0;
            if ($footerScrolls.is(':visible'))
            { footerHeight += $footerScrolls.outerHeight() - 1; }
            if (insideHeight + footerHeight < scrollHeight)
            { footerHeight += scrollHeight - footerHeight - insideHeight; }
            end("updateLayout.size.footer");

            begin("updateLayout.size.scale");
            var origHeight = insideHeight;
            // Adjust by existing scaling factor so we don't have to keep
            // refiguring the size after it has been done once
            insideHeight /= scalingFactor;
            inside.height(insideHeight + footerHeight);
            // Account for slight rounding errors/adjustments in height
            while (inside.height() < insideHeight + footerHeight - 2)
            {
                // Div didn't make it to the full height; we need to adjust
                // our scaling factor
                scalingFactor++;
                insideHeight = origHeight / scalingFactor;
                inside.height(insideHeight + footerHeight);
            }

            // Calculate how much size & how many rows are in the last page;
            // by subtracting those out, we end up with ranges from 0 to max
            // scrollTop and 0 to max first displayed row on a page; this
            // can give us a ratio to map any scroll position to the first row
            // that should be displayed on that page
            var lastPageHeight = scrollHeight - footerHeight;
            var lastPageSize = (lastPageHeight / rowOffset) || 1;
            renderScaling = ((insideHeight - lastPageHeight) /
                (rowCount - lastPageSize)) || 1;
            $locked.height(insideHeight + footerHeight);

            // If the div was resized smaller than the current position,
            // pull it to the new bottom
            if ($render.position().top + $render.height() >
                insideHeight + footerHeight)
            {
                var adjTop = insideHeight + footerHeight - $render.height();
                $render.css('top', adjTop);
                $lockedRender.css('top', adjTop);
            }
            end("updateLayout.size.scale");

            begin("updateLayout.size.scrollUpdate");
            // Force a scroll update since IE won't fire it if the div changed
            // size (shortened), which would cause locked to misalign
            $scrolls.scroll();
            end("updateLayout.size.scrollUpdate");

            begin("updateLayout.renderRows");
            // This is already covered by the scroll event above
            //renderRows();
            end("updateLayout.renderRows");
            begin("updateLayout.configWidths");
            configureWidths();
            end("updateLayout.configWidths");

            begin("updateLayout.footer");
            // Move footer up to bottom, or just above the scrollbar
            var lockedBottom = parseFloat($scrolls.css('border-bottom-width')) + 1;
            var footerBottom = parseFloat($scrolls.css('border-bottom-width')) +
                $footerScrolls.outerHeight();
            if ($scrolls[0].scrollWidth > $scrolls[0].clientWidth)
            {
                lockedBottom += scrollbarWidth;
                footerBottom += scrollbarWidth;
            }
            $lockedScrolls.height($outside.height() - lockedBottom);
            $footerScrolls.css('bottom', footerBottom);

            // Adjust the margin footer for the scrollbar if necessary
            // Adjusting the width directly caused Safari to lose scrolling
            //  events after resizing the browser window a few times, and making
            //  the grid vertical scrollbar go from on->off->on
            var marginR = $scrolls.outerHeight() - $scrolls.height();
            if ($scrolls[0].scrollHeight > $scrolls[0].clientHeight)
            {
                marginR += scrollbarWidth;
            }
            $footerScrolls.css('margin-right', marginR);
            end("updateLayout.footer");
        };

        if (options.manualResize)
        {
            $this.bind('resize', updateLayout);
        }
        else
        {
            $(window).resize(updateLayout);
        }

        // Install scrolling handler
        var headerScrolledTo = 0;
        var rowsScrolledTo = 0;
        var onScroll = function()
        {
            begin('onScroll');
            // Make column & row menus close
            $(document).trigger('click');

            var scrollHoriz = $scrolls[0].scrollLeft;
            var horizontalChange = false;
            if (scrollHoriz != headerScrolledTo)
            {
                $header[0].style.left = -scrollHoriz + 'px';
                $footer[0].style.left = -scrollHoriz + 'px';
                headerScrolledTo = scrollHoriz;
                horizontalChange = true;
            }

            var doVertScroll = function()
            {
                var scrollVert = $scrolls[0].scrollTop;
                if (scrollVert != rowsScrolledTo)
                {
                    // If we have a large scaling factor, we risk scrolling far
                    // too much with a single arrow click.  Unfortunately, we
                    // can't directly detect an arrow click versus dragging
                    // the scrollbar (or any other type of scrolling).  So we
                    // arbitrarily pick a cutoff to determine 'small scrolling',
                    // and then check if that makes us go more than about a page
                    // of rows.  If so, we cut back on the scrolling to (hopefully)
                    // a fraction of a page
                    var scrollDiff = scrollVert - rowsScrolledTo;
                    var absDiff = Math.abs(scrollDiff);
                    if (absDiff < 75 &&
                        absDiff / renderScaling > pageSize * 0.8)
                    {
                        var adjDiff = Math.ceil(pageSize * 0.5 * renderScaling) *
                            (scrollDiff < 0 ? -1 : 1);
                        scrollVert = rowsScrolledTo + adjDiff;
                        $scrolls[0].scrollTop = scrollVert;
                    }
                    $locked.css('top', $header.outerHeight() - scrollVert);

                    // IE can't handle opacity on divs over ~30000px; so
                    // for large datasets, we have to scroll the overlays
                    // with the content
                    if ($.browser.msie)
                    {
                        inside.find('.select-overlay, .disabled-overlay')
                            .css('top', scrollVert);
                    }
                    rowsScrolledTo = scrollVert;
                }
            };

            // If we scrolled horizontally, delay the check for vertical
            // scrolling.  Why?  Because if it hasn't changed then
            // $scrolls[0].scrollTop is very expensive
            if (horizontalChange)
            {
                setTimeout(doVertScroll, 50);
            }
            else
            {
                doVertScroll();
            }
            end('onScroll');
        };


        /*** CSS STYLE MANIPULATION ***/

        var sheetName = id + '_blistTable';
        var css;
        var ghostClass;
        var openerClass;

        // shortcuts for styles
        var addStyle = function(name, selector)
        { blist.styles.addStyle(sheetName, name, selector); };

        var style = function(name)
        { return blist.styles.getStyle(sheetName, name); };

        // Obtain a CSS class for a column
        var getColumnClass = function(column)
        { return id + '-c' + column.id; };

        // Obtain a CSS style for a column
        var getColumnStyle = function(column)
        {
            var result = style('column-' + column.id);
            if (!result)
            { throw "Uninitialized column style access for " + column.id; }
            return result;
        };

        var addColumnStyle = function(column)
        { addStyle('column-' + column.id, '.' + getColumnClass(column)); };

        // Initialize my stylesheet
        (function() {
            ghostClass = id + "-ghost";
            openerClass = id + "-opener";

            // Dynamic style applied to the ghost column
            addStyle('ghostStyle', '.' + ghostClass);

            // Dynamic style applied to nested table openers
            addStyle('openerStyle', 'div.' + openerClass);

            // Dynamic style applied to rows
            addStyle('rowStyle', '#' + id + ' .blist-tr');
            addStyle('unlockedRowStyle',
                '#' + id + ' .blist-table-inside .blist-tr');

            // Dynamic style available to cell renderers to fill height properly
            addStyle('cellStyle', '#' + id + ' .blist-cell');

            // Dynamic style applied to "special" row cells
            addStyle('groupHeaderStyle', '#' + id + ' .blist-td-header');
        })();


        /*** COLUMNS ***/

        // Internal representation of visible top-level columns in the model
        var columns = [];
        var lockedColumns = [];
        var variableColumns = [];

        // Information about physical DOM nodes, represented as an array for each level
        var layout = [];

        // This is the row rendering function.  Precompiled using eval() for perf.
        var rowRenderFn;
        var rowLockedRenderFn;

        // Column configuration
        var rowHeight;
        var rowOffset;
        var handleDigits;
        var paddingX;
        var lockedWidth;
        var openerWidth;
        var handleWidth = 0;
        var adderWidth = 0;
        var varMinWidth = [];
        var varDenom = [];
        var insideWidth;

        // Special columns
        var rowNumberColumn;
        var rowHandleColumn;

        // Rendering
        var customCellClasses = {};

        /* Render a single cell */
        var renderCell = function(html, index, renderIndex, row, col, colIndex, level, contextVariables)
        {
            if (!$.isBlank(col.visibleChildColumns) && level == 0)
            {
                var children = col.visibleChildColumns;
                // If there is data, render nested table headers for the row
                if (!_.isEmpty(row.data[col.lookup]) || model.useBlankRows())
                {
                    html.push('<div class="', getColumnClass(col),
                            ' blist-td blist-tdh blist-opener ', openerClass, '"></div>');
                    if (options.showRowHandle)
                    {
                        html.push('<div class="', getColumnClass(rowHandleColumn),
                                ' blist-td blist-tdh blist-table-row-handle">',
                                '</div>');
                    }

                    for (var k = 0; k < children.length; k++)
                    {
                        var child = children[k];
                        html.push('<div class="blist-td blist-tdh ', getColumnClass(child),
                                ' ', child.renderTypeName,
                                '" parentColId="', child.parentColumn.id,
                                '" colId="', child.id, '">',
                                (canEdit() ?
                                 '<div class="blist-th-icon"></div>' : ''),
                                '<a class="menuLink action-item" href="#column-menu"></a>',
                                '<div class="button-wrapper"> <div class="info-button action-item"></div> </div>',
                                '<span class="info-container">',
                                '<div class="name-wrapper">',
                                '<span class="blist-th-name">',
                                htmlEscape(child.name),
                                '</span></div></span></div>');
                    }

                    if (options.showAddColumns)
                    {
                        html.push('<div class="', getColumnClass(col),
                                ' blist-td blist-tdh blist-column-adder">',
                                '<div class="blist-column-adder-icon" ',
                                'title="' + $.t('controls.grid.add_column') + '"></div></div>');
                    }
                }

                // Else, the sub-table is empty, so render empty-space
                // headers
                else
                {
                    html.push('<div class="', getColumnClass(col),
                            ' blist-td blist-tdh blist-opener blist-opener-inactive ',
                            openerClass, '"></div>');
                    if (options.showRowHandle)
                    {
                        html.push('<div class="', getColumnClass(rowHandleColumn),
                                ' blist-td blist-tdh blist-table-row-handle handle-inactive"></div>');
                    }

                    for (k = 0; k < children.length; k++)
                    {
                        var child = children[k];
                        html.push('<div class="blist-td blist-tdh ', getColumnClass(child),
                                '" parentColId="', child.parentColumn.id,
                                '" colId="', child.id, '"></div>');
                    }

                    if (options.showAddColumns)
                    {
                        html.push('<div class="', getColumnClass(col),
                                ' blist-td blist-tdh blist-column-adder">',
                                '<div class="blist-column-adder-icon" ',
                                'title="' + $.t('controls.grid.add_column') + '"></div></div>');
                    }
                }
            }

            else if (!$.isBlank(col.visibleChildColumns))
            {
                // Nested table row -- render cells if the row is present
                // or filler if not
                var children = col.visibleChildColumns;
                // If there is data, recursively render the row and add
                // the extra columns on the front and back
                if (!$.isBlank(row.data[col.lookup]))
                {
                    html.push('<div class="blist-td blist-opener-space ', openerClass, '"></div>');
                    if (options.showRowHandle)
                    {
                        html.push('<div class="blist-td ', getColumnClass(rowHandleColumn),
                                ' blist-table-row-handle">');
                        options.rowHandleRenderer(html, index, renderIndex, row, col, contextVariables)
                        html.push('</div>');
                    }
                    for (var j = 0; j < children.length; j++)
                    { renderCell(html, index, renderIndex, row, children[j], j, level, contextVariables); }
                    if (options.showAddColumns)
                    {
                        html.push('<div class="blist-td ',
                                'blist-column-adder-space blist-column-adder">',
                                '</div>');
                    }
                }

                else
                {
                    // Otherwise just render filler
                    html.push('<div class="blist-td blist-opener-space ',
                            'blist-tdfill ', openerClass, '"></div>');
                    if (options.showRowHandle)
                    {
                        html.push('<div class="blist-td blist-tdfill ', getColumnClass(rowHandleColumn),
                                ' blist-table-row-handle"></div>');
                    }
                    for (var j = 0; j < children.length; j++)
                    {
                        html.push('<div class="blist-td blist-tdfill blist-td-colfill ',
                                getColumnClass(children[j]), '"></div>');
                    }
                    if (options.showAddColumns)
                    {
                        html.push('<div class="blist-td blist-column-adder-space blist-column-adder ',
                                'blist-tdfill"></div>');
                    }
                }
            }

            else if (col.renderTypeName == 'fill')
            {
                // Fill column -- covers background for a range of columns
                // that aren't present in this row
                html.push('<div class="blist-td blist-tdfill ',
                        getColumnClass(col), (colIndex == 0 ? ' initial-tdfill' : ''),
                        '">&nbsp;</div>');
            }

            else
            {
                // Standard cell
                var type = col.renderType;

                var cls = col.cls || type.cls;
                cls = cls ? ' blist-td-' + cls : '';

                var curRow = row;
                if (!$.isBlank(col.parentColumn))
                { curRow = row.data[col.parentColumn.lookup]; }

                var renderType = curRow.invalid[col.lookup] ? blist.datatypes.invalid : type;

                html.push('<div class="blist-td ', getColumnClass(col), cls,
                        (col.format.drill_down ? ' drill-td' : ''),
                        (col.format.align ? ' align-' + col.format.align : ''),
                        (curRow.invalid[col.lookup] ? ' invalid' : ''),
                        (curRow.changed && curRow.changed[col.lookup] ? ' saving' : ''),
                        (curRow.error && curRow.error[col.lookup] ? ' error' : ''),
                        (curRow.sessionMeta && curRow.sessionMeta.highlightColumn == col.id ?
                            ' blist-td-highlight' : ''));
                if ($.isBlank(col.parentColumn))
                {
                    html.push(' ', ((contextVariables.cellClasses[row.id] || {})
                            [col.lookup] || []).join(' '));
                }
                html.push('">');
                if (col.format.drill_down)
                {
                    var v = curRow.data[col.lookup];
                    if (!$.isBlank(v) && !_.isString(v))
                    { v = v.toString(); }
                    html.push('<a class="drillDown" cellvalue="',
                        $.escapeQuotes($.htmlStrip(v)),
                        '" column="', col.fieldName,
                        '" href="#drillDown"></a>');
                }

                html.push(renderType.renderer(curRow.data[col.lookup], col, false, false, contextVariables));

                if ($.isBlank(col.parentColumn) && !$.isBlank((curRow.annotations || {})[col.lookup]))
                {
                    html.push('<span class="annotation ', curRow.annotations[col.lookup],
                            '"></span>');
                }
                html.push('</div>');
            }
        };

        /* Turn the columns into a layout for use later */
        var processLogicalColumns = function(mcols, lcols, level)
        {
            for (var j = 0; j < mcols.length; j++)
            {
                var mcol = mcols[j];

                if (!$.isBlank(mcol.visibleChildColumns) && level == 0)
                {
                    lcols.push({
                        renderTypeName: 'opener',
                        skippable: true,
                        skipCount: mcol.visibleChildColumns.length,
                        mcol: mcol,
                        logical: mcol.id
                    });
                    if (options.showRowHandle)
                    {
                        lcols.push({
                            renderTypeName: 'handle',
                            canFocus: false,
                            mcol: mcol,
                            logical: mcol.id
                        });
                    }
                    for (var k = 0; k < mcol.visibleChildColumns.length; k++)
                    {
                        lcols.push({
                            renderTypeName: 'header',
                            canFocus: false,
                            mcol: mcol.visibleChildColumns[k],
                            logical: mcol.id
                        });
                    }

                    if (options.showAddColumns)
                    {
                        lcols.push({
                            renderTypeName: 'adder',
                            canFocus: false,
                            mcol: mcol,
                            logical: mcol.id
                        });
                    }
                }
                else if (!$.isBlank(mcol.visibleChildColumns))
                {
                    // First for opener
                    lcols.push({
                        renderTypeName: 'nest-header',
                        canFocus: false,
                        skippable: true,
                        skipCount: mcol.visibleChildColumns.length,
                        mcol: mcol,
                        logical: mcol.id
                    });
                    if (options.showRowHandle)
                    {
                        // Second for handle
                        lcols.push({
                            renderTypeName: 'nest-header',
                            canFocus: false,
                            skippable: true,
                            mcol: mcol,
                            logical: mcol.id
                        });
                    }
                    processLogicalColumns(mcol.visibleChildColumns, lcols, level);
                    if (options.showAddColumns)
                    {
                        // Finally for adder
                        lcols.push({
                            renderTypeName: 'nest-header',
                            canFocus: false,
                            skippable: true,
                            mcol: mcol,
                            logical: mcol.id
                        });
                    }
                }
                else if (mcol.renderTypeName == 'fill')
                {
                    lcols.push({
                        renderTypeName: 'fill',
                        canFocus: false,
                        mcol: mcol
                    });
                }
                else
                {
                    lcols.push({
                        mcol: mcol,
                        logical: mcol.id
                    });
                }

                // Initialize column heights (TODO - we don't support variable
                // heights; can we do this on a single style rather than for
                // each column style individually?)
                if (options.generateHeights)
                { getColumnStyle(mcol).height = rowHeight + 'px'; }
            }
        };


        /**
         * Initialize based on current model metadata.
         */
        var initMeta = function()
        {
            begin("initMeta");

            clearCellNav();
            endEdit(DEFAULT_EDIT_MODE);

            // Convert the model columns to table columns
            columns = [];
            variableColumns = [];
            varMinWidth = [];
            varDenom = [];

            // Set up variable columns at each level
            for (var j = 0; j < model.columns().length; j++)
            {
                variableColumns[j] = [];
                varMinWidth[j] = 0;
                varDenom[j] = 0.0;
                var cols = model.columns()[j];
                for (var i = 0; i < cols.length; i++)
                {
                    var col = cols[i];
                    if (col.hasOwnProperty('percentWidth'))
                    {
                        varDenom[j] += col.percentWidth;
                        if (col.minWidth)
                        {
                            varMinWidth[j] += col.minWidth;
                        }
                        col.width = 0;
                        variableColumns[j].push(col);
                    }

                    if (j == 0)
                    {
                        columns.push(col);
                    }

                    addColumnStyle(col);

                    if (!$.isBlank(col.visibleChildColumns))
                    {
                        _.each(col.visibleChildColumns, function(c)
                        { addColumnStyle(c); });
                    }
                }
            }

            if (variableColumns[0].length < 1 && options.showGhostColumn)
            {
                variableColumns[0].push({percentWidth: 100,
                        minWidth: options.ghostMinWidth,
                        ghostColumn: true});
                varMinWidth[0] += options.ghostMinWidth;
                varDenom[0] += 100;
            }
            else
            {
                options.showGhostColumn = false;
            }

            lockedColumns = [];
            if (options.showRowNumbers)
            {
                lockedColumns.push(rowNumberColumn = {id: 'rowNumberCol',
                    cls: 'blist-table-row-numbers',
                    measureText: Math.max(model.length(), 100),
                    renderer: function(html, index, renderIndex, row)
                    {
                        row.type == 'blank' ? html.push($.t('controls.grid.new_row')) :
                            row.noMatch ? html.push('<span title="'
                            + $.t('controls.grid.row_does_not_match') + '">X</span>') :
                             html.push('<a href="', model.view.url, '/', row.id, '" ',
                             'title="' + $.t('controls.grid.view_row') +
                             '" class="noInterstitial noRedirPrompt">',
                             (renderIndex + 1), '</a>');
                    },
                    footerText: $.t('controls.grid.totals')});
                addColumnStyle(rowNumberColumn);
            }
            if (options.showRowHandle)
            {
                lockedColumns.push(rowHandleColumn = {id: 'rowHandleCol',
                    cls: 'blist-table-row-handle',
                    width: options.rowHandleWidth,
                    renderer: options.rowHandleRenderer});
                addColumnStyle(rowHandleColumn);
            }

            handleDigits = calculateHandleDigits();

            // Measure width of a default cell and height and width of the cell
            // Note, .width returns a float (partial pixels) in chrome; though
            // .outerWidth still returns an int. Make sure to floor the result of
            // .width on the measured Div/Col
            measureUtilDOM.innerHTML = '<div class="blist-td">x</div>';
            var $measureDiv = $(measureUtilDOM.firstChild);
            var measuredInnerDims = { width: Math.max(0, Math.floor($measureDiv.width())),
                height: Math.max(0, $measureDiv.height()) };
            var measuredOuterDims = { width: $measureDiv.outerWidth(),
                height: $measureDiv.outerHeight() };

            // Record the amount of padding and border in a table cell
            paddingX = measuredOuterDims.width - measuredInnerDims.width;

            // Row positioning information
            rowHeight = measuredInnerDims.height;
            rowOffset = measuredOuterDims.height;
            style('rowStyle').height = rowOffset + 'px';

            // Reset scaling factor, since many things may have changed
            scalingFactor = 1;

            // Set row heights
            if (options.generateHeights && options.showGhostColumn)
            {
                style('ghostStyle').height = rowHeight + 'px';
            }
            if (options.generateHeights)
            {
                style('cellStyle').height = rowHeight + 'px';
            }
            // Update the locked column styles with proper dimensions
            lockedWidth = 0;
            _.each(lockedColumns, function (c)
            {
                measureUtilDOM.innerHTML =
                    '<div class="blist-tr">' +
                    '<div class="' + (c.width ? getColumnClass(c) : '') + ' ' +
                        (c.cls || '') + ' blist-td">' +
                        (c.measureText || '') + '</div></div>';
                var $measureCol = $(measureUtilDOM).find('.blist-td');
                var colStyle = getColumnStyle(c);
                if (c.width)
                {
                    colStyle.width = c.width + 'px';
                }
                else
                {
                    // Get the width of the measured column, but make sure it's
                    // an integer instead of a partial pixel
                    var w = Math.floor($measureCol.width());
                    if (w >= 0) { colStyle.width = w + 'px'; }
                }
                lockedWidth += $measureCol.outerWidth();
                if (options.generateHeights)
                {
                    colStyle.height = rowHeight + 'px';
                }
            });

            // Record the width of extra nested table columns
            openerWidth = measuredInnerDims.width * 1.5;
            if (options.showAddColumns)
            {
                measureUtilDOM.innerHTML =
                    '<div class="blist-td blist-column-adder">x</div>';
                $measureDiv = $(measureUtilDOM.firstChild);
                adderWidth = Math.floor($measureDiv.width()) + paddingX;
            }
            if (options.showRowHandle)
            {
                handleWidth =
                    parseFloat(getColumnStyle(rowHandleColumn).width) + paddingX;
            }
            style('openerStyle').width = openerWidth + 'px';
            if (options.generateHeights)
            { style('openerStyle').height = rowHeight + 'px'; }

            // These variables are available to the rendering function
            var contextVariables = {
                permissions: {
                    canRead: model.canRead(),
                    canWrite: model.canWrite(),
                    canAdd: model.canAdd(),
                    canDelete: model.canDelete(),
                    canEdit: canEdit()
                },
                cellClasses: customCellClasses
            };

            // Create default column rendering
            for (i = 0; i < model.columns().length; i++)
            {
                var cols = model.columns()[i];
                var lcols = layout[i] = [];
                processLogicalColumns(cols, lcols, i);
            }

            if (cellNav)
            {
                cellNav.updateModel(model);
                cellNav.updateLayout(layout);
            }
            else
            {
                cellNav = options.cellNav ?
                    new blist.data.TableNavigation(model, layout, $navigator) : null;
            }

            var rowDivContents = function(html, index, renderIndex, row)
            {
                html.push('class="blist-tr',
                        (renderIndex % 2 ? ' blist-tr-even' : ''),
                        (row.noMatch ? ' blist-tr-noMatch' : ''),
                        (!$.isBlank(row.level) ? ' blist-tr-level' + row.level : ''),
                        (row.level > 0 ? ' blist-tr-sub' : ''),
                        (row.type ? ' blist-tr-' + row.type : ''),
                        (row.expanded ? ' blist-tr-open' : ''),
                        (row.pending ? ' blist-tr-pending' : ''),
                        (row.sessionMeta && row.sessionMeta.highlight ? ' blist-tr-highlight' : ''),
                        (row.groupLast ? ' last' : ''),
                        '" style="top:', (index * rowOffset), 'px',
                        (row.color ? ';background-color:' + row.color : ''), ';"');
            };

            // Create the rendering function.
            rowRenderFn = function(html, index, renderIndex, row)
            {
                html.push('<div id="', id, '-r', row.id, '"');
                rowDivContents(html, index, renderIndex, row);
                html.push('>');
                var level = row.level || 0;
                if (level < model.columns().length)
                {
                    var mcols = model.columns()[level];
                    for (var i = 0; i < mcols.length; i++)
                    { renderCell(html, index, renderIndex, row, mcols[i], i, level, contextVariables); }
                }

                if (options.showGhostColumn)
                {
                    html.push('<div class="blist-td ',
                            ghostClass, ' blist-table-ghost"></div>');
                }
                html.push('</div>');
            };

            rowLockedRenderFn = function(html, index, renderIndex, row)
            {
                html.push('<div id="', id, '-l', (row.id || row[0]),
                        '" ');
                rowDivContents(html, index, renderIndex, row);
                html.push('>');
                for (var i = 0; i < lockedColumns.length; i++)
                {
                    var c = lockedColumns[i];
                    html.push('<div class="', (c.cls || ''), ' blist-td ',
                            getColumnClass(c), '">');
                    c.renderer(html, index, renderIndex, row, null, contextVariables);
                    html.push('</div>');
                }
                html.push('</div>');
            };

            // Configure the left position of grid rows
            style('groupHeaderStyle').left = lockedWidth + 'px';
            style('unlockedRowStyle').left = lockedWidth + 'px';

            $headerScrolls.css('margin-left', lockedWidth);
            $footerScrolls.css('margin-left', lockedWidth);

            end("initMeta");

            configureWidths();
        };

        /**
         * Configure column widths.
         */
        var configureWidths = function()
        {
            begin("configureWidths");

            // Compute the actual width for all columns with static widths
            begin("configureWidths.levels");
            insideWidth = 0;
            var mcols = model.columns();
            for (var i = 0; i < mcols.length; i++)
            {
                configureLevelWidths(mcols[i], i);
            }
            end("configureWidths.levels");

            // Configure grouping header column widths
            style('groupHeaderStyle').width = Math.max(0,
                (insideWidth - lockedWidth - paddingX)) + 'px';

            // Set the scrolling area width
            var scrollWidth = $scrolls.width();
            if ($scrolls[0].scrollHeight > $scrolls[0].clientHeight)
            {
                scrollWidth -= scrollbarWidth;
            }
            var totalWidth = Math.max(insideWidth, scrollWidth);
            $header.width(totalWidth);
            $footer.width(totalWidth);
            inside.width(totalWidth);

            $lockedScrolls.width(lockedWidth);
            $locked.width(lockedWidth);

            end("configureWidths");
        };

        var configureLevelWidths = function(mcols, level)
        {
            var hpos = lockedWidth;
            if (level == 0 && options.showGhostColumn) { hpos += paddingX; }

            for (var j = 0; j < mcols.length; j++)
            {
                var mcol = mcols[j];
                var colWidth;

                if (!$.isBlank(mcol.visibleChildColumns))
                {
                    if (level == 0)
                    {
                        // Nested table header -- set width based on child widths
                        colWidth = openerWidth + paddingX;
                        colWidth += handleWidth;
                        colWidth += adderWidth;
                        var children = mcol.visibleChildColumns;
                        for (var k = 0; k < children.length; k++)
                        {
                            colWidth += children[k].width + paddingX;
                        }
                    }
                    else
                    {
                        // Nested table row -- column width is irrelevant because
                        // the only nested columns are actually rendered into the
                        // DOM, so only compute width for nested children
                        colWidth = null;
                        configureLevelWidths(mcol.visibleChildColumns, level);
                    }
                }
                else if (mcol.fillFor)
                {
                    // Fill column -- covers background for a range of columns
                    // that aren't present in this row; set width to that of
                    // covered columns
                    colWidth = 0;
                    for (k = 0; k < mcol.fillFor.length; k++) {
                        var fillFor = mcol.fillFor[k];
                        colWidth += (fillFor.width ||
                            parseFloat(getColumnStyle(fillFor).width)) + paddingX;
                    }
                }
                else
                {
                    // Standard cell
                    colWidth = (mcol.width || 0) + paddingX;
                }

                // Cache position information for cell navigation
                // TODO
                //columnLayout[mcol.id] = { left: hpos, width: colWidth };

                // Initialize the column's style
                if (colWidth)
                {
                    hpos += colWidth;
                    // If we're in the middle of a refresh, the visible columns
                    // on a nested table might be updated slightly before
                    // we actually get the columns_changed event to initialze
                    // the column styles.  If that happens, just ignore this
                    // error because things will be re-rendered shortly
                    try { var style = getColumnStyle(mcol); }
                    catch (e) { continue; }

                    var widthStyle = (colWidth - paddingX) + 'px';

                    // This test is incredibly important for perf. on Safari
                    if (style.width != widthStyle)
                    {
                        style.width = widthStyle;
                    }
                }
            }

            hpos += varMinWidth[level];

            configureVariableWidths(level, hpos);

            // Expand the inside width if the level is wider
            if (hpos > insideWidth)
            {
                insideWidth = hpos;
            }
        };

        var configureVariableWidths = function(level, levelWidth)
        {
            if (variableColumns[level] instanceof Array &&
                variableColumns[level].length > 0)
            {
                // Start with the total fixed width for this level
                var pos = levelWidth;

                var varSize = $scrolls.width() - pos;
                if ($scrolls[0].scrollHeight > $scrolls[0].clientHeight)
                {
                    varSize -= scrollbarWidth;
                }
                varSize = Math.max(varSize, 0);
                for (i = 0; i < variableColumns[level].length; i++)
                {
                    var c = variableColumns[level][i];
                    if (c.ghostColumn)
                    {
                        style('ghostStyle').width = (c.minWidth + varSize)  + "px";
                    }
                    else
                    {
                        getColumnStyle(c).width = ((c.minWidth || 0) +
                            ((c.percentWidth / varDenom[level]) * varSize)) + 'px';
                    }
                }

                // If we're not dealing with just the ghost column,
                //  readjust column lefts
                if (level == 0 && !options.showGhostColumn)
                {
                    pos = lockedWidth;
                    for (var i = 0; i < columns.length; i++)
                    {
                        var col = columns[i];
                        col.left = pos;
                        pos += paddingX;
                        pos += col.width || parseFloat(getColumnStyle(col).width);
                    }
                }
            }
        };

        var columnHeaderClick = function(event, $target)
        {
            if (isDisabled) { return; }

            var col = $target.closest('.blist-th').data('column');
            if ($.isBlank(col)) { return; }

            $(event.currentTarget).removeClass('hover')
                .data('column-clicked', false);

            if ($target.closest('.filter').length > 0)
            {
                clearCellNav();
                $this.trigger('clear_filter', [col]);
                return;
            }

            if (($target.closest('.sort').length > 0 ||
                        (!event.metaKey && !event.shiftKey)) &&
                    ((col.renderType !== undefined &&
                      col.renderType.sortable) ||
                     col.sortable))
            {
                clearCellNav();
                sort(col);
                return;
            }

            if (event.metaKey) // ctrl/cmd key
            { selectColumn(col, !cellNav.isColumnSelected(col)); }
            else if (event.shiftKey)
            { selectColumnTo(col); }
            else
            { clearCellNav(); }
        };

        /**
         * Create column header elements for the current row configuration and
         * install event handlers.
         */
        var renderHeader = function()
        {
            begin("renderHeader-assemble");

            var html = [];


            //Cycle through each column containing data and render
            for (var i = 0; i < columns.length; i++)
            {
                var col = columns[i];
                var cls = col.cls ? ' blist-th-' + col.cls : '';
                var colName = col.name == null ? '' : htmlEscape(col.name);
                html.push(
                    '<div class="blist-th ',
                    !i ? 'blist-th-first ' : '',
                    (col.dataTypeName || col.renderTypeName),
                    ' ',
                    getColumnClass(col),
                    cls,
                    //'" title="',
                    //colName,
                    '" colId="',
                    col.id,
                    '">');
                if (col.renderTypeName == 'nested_table')
                {
                    html.push('<div class="blist-tdh blist-opener ',
                        openerClass,
                        '"></div>');
                }
                if (options.columnDrag)
                {
                    html.push(
                            '<div class="dragHandle"',
                            options.generateHeights ? ' style="height: ' +
                            rowOffset + 'px"' : '',
                            '></div>');
                }
                html.push(
                    ' <a class="menuLink action-item" href="#column-menu"></a>',
                    '<div class="button-wrapper"> <div class="info-button action-item"></div> </div>',
                    '<span class="info-container',
                    canEdit() ? ' icon-display' : '',
                    '">');
                if (canEdit())
                { html.push('<span class="blist-th-icon"></span>'); }
                html.push(
                    '<div class="name-wrapper"><span class="blist-th-name">',
                    colName,
                    '</span></div>',
                    '</span>',
                    '<div class="indicator-container">',
                    '<div class="filter" title="'+ $.t('controls.filter.actions.remove_filter') +'"',
                    options.generateHeights ? ' style="height: ' +
                    rowOffset + 'px"' : '',
                    '></div>',
                    '<div class="sort sort-desc" title="' + $.t('controls.grid.sort_ascending') + '"',
                    options.generateHeights ? ' style="height: ' +
                        rowOffset + 'px"' : '',
                    '></div>',
                    '</div>',
                    '</div>');
            }
            if (options.showGhostColumn)
            {
                html.push('<div class="blist-th blist-table-ghost ',
                    columns.length < 1 ? 'blist-th-first ' : '',
                    ghostClass, '">' +
                    (options.showAddColumns ?
                        '<div class="blist-column-adder add-column" ' +
                        'title="' + $.t('controls.grid.add_column') + '"></div>' : '') +
                    '<div class="indicator-container"></div>' +
                    '</div>');
            }
            html = html.join('');
            end("renderHeader-assemble");
            begin("renderHeader-render");

            $header.trigger('rerender');
            // JQuery version sucks wind, my profiler is horked so not sure why, but direct version appears to work
            $header[0].innerHTML = html;
            //$header.html(html);

            end("renderHeader-render");

            begin("renderHeader-augment");
            //console.profile();
            $(".blist-th", $header).each(function(index)
            {
                if (index >= columns.length)
                {
                    // Skip the ghost column
                    return;
                }
                columns[index].dom = this;

                var $col = $(this);

                var interactionsInitialized = false;
                var initializeInteractions = function()
                {
                    interactionsInitialized = true;

                    $col
                        .mouseleave(function ()
                        {
                            $(this).removeClass('hover');
                        })
                        .bind('click', function(event)
                        {
                            if (isDisabled) { return; }

                            if (skipHeaderClick)
                            {
                                skipHeaderClick = false;
                                return;
                            }

                            var $target = $(event.target);
                            if ($target.closest('.action-item').length > 0) { return; }

                            if ($target.closest('.blist-th .indicator-container, ' +
                                '.blist-th .dragHandle, ' +
                                '.blist-th .action-item').length < 1)
                            {
                                if ($col.data('column-clicked'))
                                {
                                    // We don't really do anything here, since we
                                    // have to listen to the real double-click event.
                                    // That is fired in all browsers, but IE only
                                    // fires that -- it never gets here
                                }
                                else
                                {
                                    $col.data('column-clicked', true);
                                    setTimeout(function()
                                        {
                                            if ($col.data('column-clicked'))
                                            { columnHeaderClick(event, $target); }
                                        }, 500);
                                }
                            }
                            else { columnHeaderClick(event, $target); }
                        })
                        .bind('dblclick', function(event)
                        {
                            if ($(event.target).closest(
                                '.blist-th .indicator-container, ' +
                                '.blist-th .dragHandle, ' +
                                '.blist-th .action-item').length < 1)
                            {
                                $col.data('column-clicked', false);
                                $this.trigger('column_name_dblclick', [ event ]);
                            }
                        });

                    if (options.columnDrag)
                    {
                        $col
                            .draggable({
                                appendTo: '.blist-table',
                                axis: 'x',
                                drag: function(event, ui)
                                {
                                    var dragPos = findHeaderDragPosition(event);
                                    if (curDropPos != dragPos)
                                    {
                                        curDropPos = dragPos;
                                        drawHeaderDragPosition(curDropPos);
                                    }
                                },
                                handle: '.dragHandle',
                                helper: function(event)
                                {
                                    var $drag = $('<div class="blist-th-drag"/>');
                                    $drag.append($(this).clone());
                                    return $drag;
                                },
                                opacity: 0.85,
                                start: function(event, ui)
                                {
                                    hotHeaderDrag = true;
                                    hotHeaderMode = 4;
                                },
                                stop: function(event, ui)
                                {
                                    hotHeaderMode = null;
                                    $dropIndicator.css('left', -10000).hide();
                                    if (curDropPos == null) { return; }

                                    var col = $(this).data('column');
                                    $this.trigger('column_moved',
                                        [col, curDropPos]);
                                    curDropPos = null;
                            }});
                    }

                    if (options.headerMods != null)
                    {
                        options.headerMods(columns[index]);
                    }
                }

                $col
                    .data('column', columns[index])
                    .mouseenter(function ()
                        {
                            if (!interactionsInitialized)
                            {
                                // Lazy initialize bulk of header interactivity on first hover.  This initialization
                                // is very expensive (~1s. w/ 28 headers on IE8)
                                initializeInteractions();
                            }

                            if (isDisabled) { return; }

                            if (!hotHeaderDrag || hotHeaderMode != 4)
                            {
                                $(this).addClass('hover');
                            }
                        });

                adjustHeaderStyling($col);
            });

            var lockedHtml = '';
            $.each(lockedColumns, function (i, c)
            {
                lockedHtml += '<div class="blist-th ' + (c.cls || '') +
                    ' ' + getColumnClass(c) +
                    '">' +
                    '<div class="indicator-container"></div>' +
                    '</div>';
            });
            $lockedHeader.html(lockedHtml);

            // Render sort & filter headers
            adjustHeaderIndicators();

            //console.profileEnd();
            end("renderHeader-augment");
        };

        var adjustHeaderIndicators = function()
        {
            configureSortHeader();
            configureFilterHeaders();
            $outside.toggleClass('indicators-inactive',
                    ((model.view.metadata.jsonQuery || {}).order || []).length <= 0 &&
                    _.all(columns, function(c)
                        { return $.isBlank(c.currentFilter); }));

            // Readjust locked position since the header height may have changed
            $locked.css('top', $header.outerHeight() - $scrolls[0].scrollTop);
        };

        // Adjust styling for the header.  If tertiary is a boolean indicating whether this is the first time a
        // header has been adjusted (false) or a tertiary time (true)
        var adjustHeaderStyling = function($colHeader, tertiary)
        {
            var $orig = $colHeader;
            if (tertiary)
            {
                // Adjust a clone in tertiary mode
                $colHeader = $orig.clone();
                measureUtil.append($colHeader);

                // Also clear narrow indicators if present
                $colHeader.removeClass('narrow narrower');
            }
            var $infoC = $colHeader.find('.info-container');
            //Account for two additional buttons as content
            var infoW = $infoC.outerWidth(true) + ($orig.find('.info-button').outerWidth(false) * 2);
            var innerW = $colHeader.width();
            // Make an initial guess & do checks incrementally to shave off ms
            if (infoW + 20 > innerW)
            { 
                infoW += parseInt($infoC.css('left'));
                if (infoW > innerW)
                {
                    var iconW =
                        $colHeader.find('.blist-th-icon').outerWidth(true) || 0;
                    $orig.toggleClass('narrower', infoW - iconW > innerW);
                    $orig.addClass('narrow');
                }
                else if (tertiary) { $orig.removeClass('narrow narrower'); }
            }
            else if (tertiary) { $orig.removeClass('narrow narrower'); }
            if (tertiary) { $colHeader.remove(); }
        };

        var curDropPos = null;
        var $dropIndicator;
        var findHeaderDragPosition = function(event)
        {
            var x = event.originalEvent.pageX;
            var $headers = $('.blist-th:not' +
                '(.ui-draggable-dragging, .blist-table-ghost)', $header);
            if (x < $headers.eq(0).offset().left) { return 0; }
            var $lastHeader = $headers.eq($headers.length - 1);
            if (x > $lastHeader.offset().left + $lastHeader.outerWidth())
            { return $headers.length; }

            var dropPos;
            $headers.each(function(i)
            {
                var $col = $(this);
                var left = $col.offset().left;
                if (x < left) { return true; }

                var width = $col.outerWidth();
                var right = left + width;
                if (x > right) { return true; }

                dropPos = (x - left) < (width / 2) ? i : i + 1;
                return false;
            });
            return dropPos;
        };

        var drawHeaderDragPosition = function(pos)
        {
            var $headers = $('.blist-th:not' +
                '(.ui-draggable-dragging, .blist-table-ghost)', $header);
            var x;
            if (pos >= $headers.length)
            {
                var $lh = $headers.eq($headers.length - 1);
                x = $lh.offset().left + $lh.outerWidth();
            }
            else
            {
                x = $headers.eq(pos).offset().left;
            }
            x += lockedWidth - $headerScrolls.offset().left -
                $dropIndicator.width() / 2;

            $dropIndicator.css('left', x).show();
        };

        var updateHeader = function (model)
        {
            begin("updateHeader");

            adjustHeaderIndicators();

            end("updateHeader");
        };

        var pendingAggs = false;

        /**
         * Create column footer elements for the current row configuration
         */
        var renderFooter = function()
        {
            if (pendingAggs) { return; }

            var gotAggs = function()
            {
                var html = [];
                var showAgg = false;
                var renderColFooter = function (col)
                {
                    var cls = col.cls ? ' blist-tf-' + col.cls : '';
                    var agg = col.aggregates[col.format.aggregate];
                    showAgg = showAgg || !$.isBlank(agg);

                    var val = agg;
                    // specific aggregates are formatted for the column;
                    // for ex., money will show $99.99
                    if (!$.isBlank(agg) &&
                            _.include(['sum', 'average', 'maximum', 'minimum'],
                                col.format.aggregate))
                    {
                        var c = col;
                        if (col.format.aggregate == 'average')
                        { c = $.extend(true, {format: {precision: 3}}, col); }
                        val = col.renderType.renderer(agg, c);
                    }

                    html.push(
                        '<div class="blist-tf ',
                        !i ? 'blist-tf-first ' : '',
                        getColumnClass(col),
                        cls,
                        '" title="',
                        (col.format.aggregate || '').capitalize(),
                        '" colId="',
                        col.id,
                        '">',
                        '<span class="blist-tf-value">',
                        (val || ''),
                        '</span></div>');
                };

                for (var i = 0; i < columns.length; i++)
                {
                    var col = columns[i];
                    if (!$.isBlank(col.visibleChildColumns))
                    {
                        // This assumes that columns with children in the body
                        //  fit inside the width of this column, and override any
                        //  parent aggregate
                        html.push(
                            '<div class="blist-tf blist-opener ',
                            id,
                            '-opener"></div>');
                        if (options.showRowHandle)
                        {
                            html.push('<div class="' +
                                getColumnClass(rowHandleColumn) +
                                ' blist-tf blist-table-row-handle"></div>');
                        }
                        _.each(col.visibleChildColumns,
                            function(cc) {renderColFooter(cc);});
                        if (options.showAddColumns)
                        {
                            html.push('<div class="blist-tf blist-column-adder">' +
                                '</div>');
                        }
                    }
                    else
                    {
                        renderColFooter(col);
                    }
                }
                if (options.showGhostColumn)
                {
                    html.push('<div class="blist-tf blist-table-ghost ',
                        columns.length < 1 ? 'blist-tf-first ' : '',
                        ghostClass, '"></div>');
                }
                if (showAgg)
                {
                    $footer.html(html.join(''));
                    $footerScrolls.show();
                    $lockedFooter.show();
                }
                else
                {
                    $footerScrolls.hide();
                    $lockedFooter.hide();
                }

                var lockedHtml = '';
                _.each(lockedColumns, function (c)
                {
                    lockedHtml += '<div class="blist-tf ' + (c.cls || '') +
                        ' ' + getColumnClass(c) +
                        '"><span class="blist-tf-value">' +
                        (c.footerText || '') + '</span></div>';
                });
                $lockedFooter.html(lockedHtml);

                pendingAggs = false;
            };

            if (model.getAggregates(function() { _.defer(gotAggs); }))
            { pendingAggs = true; }
        };

        var showNoResults = function(doShow)
        {
            $noResults.toggleClass('hide', !doShow);
        };

        /*** ROWS ***/

        var renderedRows = {}; // All rows that are rendered, by ID
        var dirtyRows = {}; // Rows that are rendered but need to re-render
        var rowIndices = {}; // Position of rendered rows (triggers re-rendering if a row moves)

        var appendRows = function(html) {
            // These functions only exist for profiling purposes.  We call this relatively infrequently so it's OK to
            // leave these in for production purposes.
            var appendRows_render = function() {
                appendUtilDOM.innerHTML = html;
            };
            var appendRows_append = function() {
                while (appendUtilDOM.firstChild) {
                    var row = appendUtilDOM.firstChild;
                    var rowID = row.id.substring(id.length + 2); // + 2 for "-r" suffix prior to row ID
                    if (!renderedRows[rowID])
                    {
                        renderedRows[rowID] = {};
                    }
                    renderedRows[rowID].row = row;
                    if (dirtyRows[rowID]) {
                        renderDOM.replaceChild(row, dirtyRows[rowID].row);
                        delete dirtyRows[rowID];
                    } else {
                        renderDOM.appendChild(row);
                    }
                }
            };

            // Call the append functions
            begin("appendRows.render");
            appendRows_render();
            end("appendRows.render");
            begin("appendRows.append");
            appendRows_append();
            end("appendRows.append");
        };

        // TODO: This should probably be consolidated with appendRows...
        var appendLockedRows = function(html)
        {
            // These functions only exist for profiling purposes.  We call this
            // relatively infrequently so it's OK to leave these in for
            // production purposes.
            var appendRows_render = function()
            {
                appendUtilDOM.innerHTML = html;
            };
            var appendRows_append = function()
            {
                while (appendUtilDOM.firstChild)
                {
                    var row = appendUtilDOM.firstChild;
                    // + 2 for "-l" suffix prior to row ID
                    var rowID = row.id.substring(id.length + 2);
                    if (renderedRows[rowID] === undefined)
                    {
                        renderedRows[rowID] = {};
                    }
                    renderedRows[rowID].locked = row;
                    if (dirtyRows[rowID] !== undefined)
                    {
                        $lockedRender[0].replaceChild(row,
                            dirtyRows[rowID].locked);
                    } else {
                        $lockedRender[0].appendChild(row);
                    }
                }
            };

            // Call the append functions
            appendRows_render();
            appendRows_append();
        };


        var pendingTop;
        var prevTop;
        var setTop;
        /**
         * Render all rows that should be visible but are not yet rendered.
         * Removes invisible rows.
         */
        var renderRows = function()
        {
            if (!model) { return; }

            begin("renderRows.setup");
            // Compute the first row to render
            var start = Math.floor($scrolls.scrollTop() / renderScaling);

            // Determine the range of rows we need to render, with safety
            // checks to be sure we don't attempt the impossible
            var stop = Math.ceil(start + pageSize * 1.5);
            if (start < 0) { start = 0; }
            if (stop > model.length()) { stop = model.length(); }

            // Calculate how big the render sections need to be, and where they
            // start based on the first row
            var renderHeight = (stop - start) * rowOffset;
            var renderTop = start * renderScaling;
            // Make sure we don't extend beyond the bottom
            var insideHeight = inside.height();
            if ($footerScrolls.is(':visible'))
            { insideHeight -= $footerScrolls.outerHeight() - 1; }
            if (renderTop + renderHeight > insideHeight)
            { renderTop = insideHeight - renderHeight; }

            end("renderRows.setup");

            var cleanRow = function(rowID, rowSet)
            {
                if (!rowSet[rowID]) { return; }
                row = rowSet[rowID].row;
                if (row !== undefined) { row.parentNode.removeChild(row); }
                row = rowSet[rowID].locked;
                if (row !== undefined) { row.parentNode.removeChild(row); }
                delete rowSet[rowID];
            };

            begin("renderRows.destroy");
            // Destroy the rows that are no longer visible
            for (var rowID in renderedRows)
            {
                if (rowIndices[rowID] < start || rowIndices[rowID] >= stop)
                { cleanRow(rowID, renderedRows); }
            }
            for (var rowID in dirtyRows)
            {
                if (rowIndices[rowID] < start || rowIndices[rowID] >= stop)
                { cleanRow(rowID, dirtyRows); }
            }

            // Now check for dirty rows that don't exist anymore
            var dirtyIds =_.keys(dirtyRows);
            for (var i = 0; i < dirtyIds.length; i++)
            {
                var rowID = dirtyIds[i];
                if ($.isBlank(model.getByID(rowID)))
                { cleanRow(rowID, dirtyRows); }
            }
            end("renderRows.destroy");

            pendingTop = renderTop;
            prevTop = Math.round(parseFloat($render.css('top')));

            // Render the rows that are newly visible
            var rowsLoaded = function(rows)
            {
                if (!$.isBlank(pendingTop) &&
                    Math.round(parseFloat($render.css('top'))) ==
                        Math.round(prevTop))
                {
                    // Adjust render divs to the new positions/sizes
                    $render.css('top', pendingTop);
                    $render.height(renderHeight);
                    $lockedRender.css('top', pendingTop);
                    $lockedRender.height(renderHeight);

                    setTop = pendingTop;
                    pendingTop = undefined;
                    prevTop = Math.round(parseFloat($render.css('top')));
                }

                // If it moved while we were loading, then skip rendering
                if (Math.round(setTop) != Math.round(renderTop))
                { return; }

                var badRows = [];
                var html = [];
                var lockedHtml = [];
                begin("renderRows.render");
                for (var i = 0; i < rows.length; i++)
                {
                    var row = rows[i];
                    var rowID = row.id;
                    var rowIndex = model.index(row);
                    if (renderedRows[rowID] && rowIndices[rowID] == rowIndex)
                    {
                        // We need to adjust top positions, since the render
                        // divs (may) have moved, and rows are rendered relative
                        // to those
                        // Cache the jQuery wrapping?
                        $(renderedRows[rowID].row).css('top',
                            (rowIndex - start) * rowOffset);
                        var locked = renderedRows[rowID].locked;
                        if (locked !== undefined)
                        { $(locked).css('top', (rowIndex - start) * rowOffset); }
                    }
                    else
                    {
                        if (renderedRows[rowID])
                        {
                            // Existing row, but not in the right place; destroy
                            badRows.push(rowID);
                        }
                        // Add a new row
                        // Rows are rendered in position relative to the top
                        // of the render div, which is why we subtract start from i
                        rowRenderFn(html, rowIndex - start, rowIndex, row);
                        if (rowLockedRenderFn != null)
                        {
                            rowLockedRenderFn(lockedHtml,
                                rowIndex - start, row.index, row);
                        }
                        rowIndices[rowID] = rowIndex;
                    }
                }
                end("renderRows.render");

                for (var i = 0; i < badRows.length; i++)
                { cleanRow(badRows[i], renderedRows); }

                // Now add new/moved rows
                // appendLockedRows must be called first; it should probably
                //  be consolidated with appendRows
                begin("renderRows.appendLocked");
                appendLockedRows(lockedHtml.join(''));
                end("renderRows.appendLocked");
                begin("renderRows.append");
                appendRows(html.join(''));
                end("renderRows.append");

                begin("renderRows.rowMods");
                if (options.rowMods !== null) { options.rowMods(renderedRows); }
                end("renderRows.rowMods");

                begin("renderRows.cellNav");
                if (cellNav)
                {
                    // Cell selection and navigation
                    updateCellNavCues();
                    expandActiveCell();
                }
                end("renderRows.cellNav");

                begin("renderRows.selection");
                if (!$.isBlank(hotRowID)) { makeHotRow(hotRowID); }
                // Row selection
                updateRowSelection();
                end("renderRows.selection");
            };

            if (start != stop)
            {
                model.loadRows(start, stop, function(r) { rowsLoaded(r); });
                showNoResults(false);
            }
            else
            { showNoResults(true); }
        };

        var updateRowSelection = function()
        {
            begin('rowSelection.removeSelect.inside');
            inside.find('.blist-select-row').removeClass('blist-select-row');
            end('rowSelection.removeSelect.inside');
            begin('rowSelection.removeSelect.locked');
            $locked.find('.blist-select-row').removeClass('blist-select-row');
            end('rowSelection.removeSelect.locked');
            begin('rowSelection.addSelect');
            _.each((model.view.highlightTypes || {}).select, function (v, k)
            {
                $('#' + id + '-r' + k).addClass('blist-select-row');
                $('#' + id + '-l' + k).addClass('blist-select-row');
            });
            end('rowSelection.addSelect');
            begin('rowSelection.cellNav');
            updateCellNavCues();
            end('rowSelection.cellNav');
        };

        /**
         * Initialize the row container for the current row set.
         */
        var initRows = function()
        {
            //inside.css("display", "hidden");
            begin("initRows.handle");
            if (handleDigits != calculateHandleDigits()) {
                // The handle changed.  Reinitialize columns.
                initMeta();
                renderHeader();
                renderFooter();
            }
            end("initRows.handle");

            begin("initRows.cleaning");
            $lockedRender[0].innerHTML = '';
            $render[0].innerHTML = '';
            renderedRows = {};
            dirtyRows = {};
            end("initRows.cleaning");

            updateLayout();
            //inside.css("display", "block");
        };

        /**
         * Re-render a set of rows (if visible).
         */
        var updateRows = function(rows)
        {
            rows = $.makeArray(rows);
            for (var i = 0; i < rows.length; i++)
            {
                var row = rows[i];
                var rowID = row.id;
                var rendered = renderedRows[rowID];
                if (rendered)
                {
                    delete renderedRows[rowID];
                    dirtyRows[rowID] = rendered;
                }
            }
            updateLayout();
            if (model.dataLength() < 0)
            { model.loadRows(0, 50); }
        };

        var setUpColumnChoose = function(types, callback)
        {
            var allTypes = _.isEmpty(types);
            $outside.css('cursor', 'crosshair');

            $lockedScrolls.append('<div class="disabled-overlay"></div>');
            var rightPos = 0;
            _.each(columns, function(c)
            {
                var $c = $(c.dom);
                var left = $c.position().left;
                var divClass = 'disabled-overlay';
                if (allTypes || _.include(types, c.renderTypeName))
                { divClass = 'select-overlay'; }

                var $h = $('<div class="' + divClass + ' col-' + c.id + '"></div>')
                    .width($c.outerWidth())
                    .css('left', left)
                    .hover(
                        function()
                        { $h.add($f).add($m).addClass('overlay-hover'); },
                        function()
                        { $h.add($f).add($m).removeClass('overlay-hover'); }
                    );

                if (allTypes || _.include(types, c.renderTypeName))
                {
                    $h.click(function()
                    { if (_.isFunction(callback)) { callback(c); } });
                }

                var $f = $h.clone(true);
                var $m = $h.clone(true).css('left', left + lockedWidth);
                $header.append($h);
                $footer.append($f);
                inside.append($m);

                rightPos = $c.outerWidth() + $c.position().left;
            });
            var $or = $('<div class="disabled-overlay"></div>')
                .width($header.width() - rightPos).css('left', rightPos);
            $header.append($or);
            $footer.append($or.clone());
            inside.append($or.clone().css('left', rightPos + lockedWidth)
                .width($or.width() - lockedWidth));
        };

        var finishColumnChoose = function()
        {
            $outside.css('cursor', 'auto');
            $outside.find('.disabled-overlay, .select-overlay').remove();
        };


        /*** MODEL ***/

        // Monitor model events

        var table = this;
        var curView;
        // Need to listen for view to be set
        $this.bind('dataset_ready', function(event, newModel)
        {
            model = newModel;

            var isReady = function()
            {
                if (!dsReady)
                {
                    initMeta();
                    renderHeader();
                    renderFooter();
                    initRows();

                    // Bind to events on the DOM that are thrown by the model
                    $this.bind('columns_changed', function()
                            {
                                // This seem a bit heavy-handed...
                                initMeta();
                                renderHeader();
                                renderFooter();
                                initRows();
                            })
                        .bind('rows_changed', function(event)
                            {
                                begin("updateRows");
                                initRows();
                                end("updateRows");
                            })
                        .bind('selection_change', function(event, rows)
                            {
                                begin("selectionChange");
                                updateRowSelection(rows);
                                end("selectionChange");
                            })
                        .bind('show', function()
                            {
                                initMeta();
                                renderHeader();
                                renderFooter();
                                initRows();
                            });
                }

                dsReady = true;

                // If the rows are already all available the first time we run this,
                // then the row_change event below will never get fired and the
                // size/layout will never be updated
                updateLayout();

                if (!$.isBlank(curView))
                { curView.unbind(null, null, table); }
                curView = model.view;

                // Request comment indicators
                // This will only be false if the cell comment module is enabled.
                if ($.deepGet(blist, 'sidebarHidden', 'feed', 'cellFeed') === false)
                { model.view.getCommentLocations(); }

                model.view.bind('row_change', function(rows)
                        { updateRows(rows); }, table)
                    .bind('query_change', updateHeader, table)
                    .bind('column_resized', configureWidths, table)
                    .bind('column_totals_changed', function() { _.defer(renderFooter); }, table);

            };

            // Need to get first batch of rows so that the total count is
            // available
            if (model.dataLength() < 0)
            {
                var doLoad;
                doLoad = function()
                { model.loadRows(0, 50, function() { isReady(); }, function(arg)
                        { if ((arg || {}).cancelled) { doLoad(); } }); };
                doLoad();
            }
            else { isReady(); }
        });

        // Install the model
        $this.blistModel(options.model);


        var isDisabled = false;
        var blistTableObj = function()
        {
            this.getSelectedColumns = function()
            {
                return cellNav ? cellNav.getSelectedColumns() : {};
            };

            this.disable = function()
            {
                isDisabled = true;
                $this.addClass('disabled');
                clearCellNav();
            };

            this.enable = function()
            {
                isDisabled = false;
                $this.removeClass('disabled');
                finishColumnChoose();
            };

            this.enterColumnChoose = function(types, callback)
            {
                types = $.makeArray(types);
                setUpColumnChoose(types, callback);
            };

            this.exitColumnChoose = function()
            {
                finishColumnChoose();
            };

            this.setCommentCell = function(rowId, tcId)
            {
                customCellClasses[rowId] = customCellClasses[rowId] || {};
                var colId = model.view.columnForTCID(tcId).id;
                customCellClasses[rowId][colId] = customCellClasses[rowId][colId] || [];
                customCellClasses[rowId][colId].push('comments-active');
                updateRows([{id: rowId}]);
            };

            this.clearCommentCell = function(rowId, tcId)
            {
                var colId = model.view.columnForTCID(tcId).id;
                if ($.isBlank(customCellClasses[rowId]) ||
                    $.isBlank(customCellClasses[rowId][colId]))
                { return; }

                customCellClasses[rowId][colId] = _.without(customCellClasses[rowId][colId],
                    'comments-active');
                updateRows([{id: rowId}]);
            };
        };

        $this.data('blistTableObj', new blistTableObj());
    };

    var blistTableDefaults = {
        cellComments: false,
        cellExpandEnabled: true,
        cellNav: false,
        columnDrag: false,
        disableLastColumnResize: false,
        editEnabled: false,
        generateHeights: true,
        ghostMinWidth: 20,
        headerMods: function (col) {},
        manualResize: false,
        resizeHandleAdjust: 3,
        rowHandleRenderer: function(html, index, renderIndex, row, col, context) {},
        rowHandleWidth: 1,
        rowMods: function(renderedRows) {},
        selectionEnabled: true,
        showGhostColumn: false,
        showRowNumbers: true,
        showRowHandle: false,
        showAddColumns: false
    };

    $.fn.extend({
        /**
         * Make an element into a Blist Table.
         */
        blistTable: function(options) {
            // Create the table
            return this.each(function() {
                if (!$(this).is('.blist-table'))
                {
                    makeTable.apply(this, [ $.extend({}, blistTableDefaults, options) ]);
                }
            });
        },

        blistTableAccessor: function()
        {
            return this.data('blistTableObj');
        }
    });
})(jQuery);
