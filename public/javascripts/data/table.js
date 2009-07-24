/**
 * This file implements the Blist table control.  This control offers an interactive presentation of tabular data to
 * the user.
 *
 * The table renders data contained within a Blist "model" class.  The table uses the model associated with its root
 * DOM node.
 *
 * Most events triggered by the table are managed by the model class.  Events supported directly by the table are:
 *
 * <ul>
 *   <li>cellclick - fired whenever the user clicks a cell and the table does not perform a default action</li>
 *   <li>table_click - fired when the mouse is clicked within the table and the table does not fire a default
 *      action</li>
 * </ul>
 *
 * Implementation note: We process mouse up and mouse down events manually.  We treat some mouse events differently
 * regardless of the element on which they occur.  For example, a mouse down within a few pixels of a column heading
 * border is a resize, but the mouse may in fact be over a control.  Because of this and the fact that you can't
 * cancel click events in mouseup handlers we generally can't use the browser's built in "click" event.  Instead the
 * table fires a "table_click" event.  You should be able to use this anywhere you would instead handle "click".
 */

(function($)
{
    // Milliseconds to delay before expanding a cell's content
    var EXPAND_DELAY = 100;

    // Milliseconds in which expansion should occur
    var EXPAND_DURATION = 200;

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

    // Make a DOM element into a table
    var makeTable = function(options)
    {
        var model;

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
        var calculateHandleDigits = function(model)
        {
            return Math.ceil(Math.log(model.rows().length || 1) * Math.LOG10E);
        };

        // Sort data
        var sortBy = -1;
        var sortDescending;
        var sort = function(index)
        {
            if (sortBy == index)
            {
                sortDescending = !sortDescending;
            }
            else
            {
                sortBy = index;
                sortDescending = false;
            }
            configureSortHeader();
            model.sort(index, sortDescending);
        };

        var configureSortHeader = function()
        {
            $('.sort.active', $header)
                .removeClass('sort-asc').addClass('sort-desc')
                .attr('title', 'Sort ascending')
                .removeClass('active')
                .parent().removeClass('sorted');
            if (sortBy >= 0)
            {
                var col = columns[sortBy];
                var oldClass = 'sort-' + (sortDescending ? 'asc' : 'desc');
                var newClass = 'sort-' + (sortDescending ? 'desc' : 'asc');
                var newTitle = 'Sort ' +
                    (sortDescending ? 'ascending' : 'descending');
                $('.sort', col.dom)
                    .removeClass(oldClass).addClass(newClass)
                    .attr('title', newTitle)
                    .addClass('active')
                    .parent().addClass('sorted');
            }
        };

        var configureFilterHeaders = function()
        {
            $('.filter.active', $header).removeClass('active');
            var colFilters = model.meta().columnFilters;
            if (colFilters != null)
            {
                $.each(columns, function (i, c)
                {
                    if (colFilters[c.dataIndex] != null)
                    {
                        $('.filter', c.dom).addClass('active');
                    }
                });
            }
        };

        // Filter data
        var applyFilter = function()
        {
            setTimeout(function() {
                var searchText = $filterBox[0].value;
                model.filter(searchText, 250);
                if (!searchText || searchText == '')
                {
                    $filterClear.hide();
                }
                else
                {
                    $filterClear.show();
                }
            }, 10);
        }

        var clearFilter = function(e)
        {
            e.preventDefault();
            $filterBox.val('').blur();
            $filterClear.hide();
            model.filter('');
        }

        // Obtain a model column associated with a column header DOM node
        var getColumnForHeader = function(e) {
            return model.column(e.getAttribute('uid'));
        }

        // Given a DOM node, retrieve the logical row in which the cell resides
        var getRow = function(cell) {
            var rowDOM = cell.parentNode;
            if (!rowDOM) { return null; }

            // + 2 for "-r" suffix prior to row ID
            var rowID = rowDOM.id.substring(id.length + 2);
            return model.getByID(rowID);
        }

        // Given a DOM node, retrieve the logical column in which the cell resides
        var getColumn = function(cell) {
            // The cell will have a class like 'tableId-c4'; we need to
            //  extra the part after the tableId-c, which is the uid of
            //  the column that can be looked up
            var classIndex = cell.className.indexOf(id + '-c');
            if (classIndex == -1)
                return null;
            var endOfUID = cell.className.indexOf(' ', classIndex);
            if (endOfUID == -1)
                endOfUID = cell.className.length;
            var colUID = cell.className.slice(classIndex + id.length + 2, endOfUID);
            if (colUID == 'rowHandleCol')
            {
                return rowHandleColumn;
            }
            else if (colUID == 'rowNumberCol')
            {
                return rowNumberColumn;
            }
            return model.column(colUID);
        }

        // Get the value in a row for a column
        var getRowValue = function(row, column)
        {
            var value;
            eval('value = row' + column.dataLookupExpr + ';');
            return value;
        };

        // Set the value in a row for a column
        var setRowValue = function(value, row, column)
        {
            eval('row' + column.dataLookupExpr + ' = value;');
        };

        // Takes a column, and gets the real px width for it
        var getColumnWidthPx = function(col)
        {
            if (col.type == 'opener')
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

        /*** CELL SELECTION AND NAVIGATION ***/

        // Is cell selection and navigation on?
        var cellNav = options.cellNav;

        // Active cell
        var activeCellOn = false;
        var activeCellXStart;  // Index of the first physical column that is active
        var activeCellXNum;    // Number of X cells to select
        var activeCellY;       // Row ID (of a row in the model active set)
        var $activeCells;

        // Cell selection information.  The cell selection consists of one or more rectangular areas each including
        // one or more cells.  The selections are stored in an array with the following values:
        //   x1, the first selected column index
        //   y1, the first selected row index
        //   x2, the last selected column index (inclusive)
        //   y2, the last selected row index (inclusive)
        var selectionLevel = -1;
        var cellSelection = [];

        // Convert selection into a sorted array of arrays for quickly identifying selected cells
        var convertCellSelection = function() {
            var converted = [];

            for (var i = 0; i < cellSelection.length; i++) {
                var sel = cellSelection[i];
                var sel2 = sel.slice(0);
                if (sel2[1] > sel2[3]) {
                    var tmp = sel2[3];
                    sel2[3] = sel2[1];
                    sel2[1] = tmp;
                }
                if (sel2[0] > sel2[2]) {
                    tmp = sel2[2];
                    sel2[2] = sel2[0];
                    sel2[0] = tmp;
                }
                converted.push(sel2);
            }

            converted.sort(function(a, b) {
                // Order by first row...
                var diff = a[1] - b[1];
                if (diff)
                    return diff;

                // Or by last row
                return a[3] - b[3];
            });
            return converted;
        }

        var getRenderedRowsWithPosition = function() {
            var rows = [];
            for (var id in renderedRows) {
                var row = renderedRows[id];
                rows.push([ rowIndices[id], row ]);
            }
            return rows.sort(function(a, b) { return a[0] - b[0] });
        }

        var clearRowSelection = function(row) {
            for (var cell = row.row.firstChild; cell; cell = cell.nextSibling)
                if (cell._sel) {
                    $(cell).removeClass('blist-cell-selected');
                    cell._sel = false;
                }
            delete row.selected;
        }

        var setRowSelection = function(row, selmap) {
            row.selected = true;
            for (var pos = 0, node = row.row.firstChild; node; node = node.nextSibling, pos++) {
                if (selmap[pos]) {
                    if (!node.selected) {
                        $(node).addClass('blist-cell-selected');
                        node._sel = true;
                    }
                } else if (node._sel) {
                    $(node).removeClass('blist-cell-selected');
                    node._sel = false;
                }
            }
        }

        var createSelectionMap = function(selectionComponents, selectionComponentCount) {
            var selectionMap = [];

            // Mark all selected positions in the selection map
            for (var selectionComponentID = 0; selectionComponentID < selectionComponentCount; selectionComponentID++) {
                var selectionComponent = selectionComponents[selectionComponentID];
                for (var columnID = selectionComponent[0]; columnID <= selectionComponent[2]; columnID++)
                    selectionMap[columnID] = true;
                
                // For the last position, mark any following positions that are associated with the same logical column
                var layoutLevel = layout[selectionLevel];
                columnID = selectionComponent[2];
                var uid = layoutLevel[columnID].logical;
                for (columnID++; columnID < layoutLevel.length && layoutLevel[columnID].logical == uid; columnID++)
                    selectionMap[columnID] = true;
            }

            return selectionMap;
        }

        var updateSelectionCues = function() {
            // Convert the selection into canonical and sorted form to optimize processing
            var selection = convertCellSelection();

            // Obtain a list of rendered rows in natural order
            var rows = getRenderedRowsWithPosition();

            // This "selmap" is an array of booleans indicating whether each column in a row is selected.  This is
            // computed from the set of selections and cached between rows unless the set of selections that applies
            // change.
            var selmap;
            var selmapSelectionCount;

            for (var i = 0, len = rows.length; i < len; i++) {
                var index = rows[i][0];
                var row = rows[i][1];

                // Clear the selection if the row isn't in the selection level
                if ((model.get(index).level || 0) != selectionLevel) {
                    clearRowSelection(row);
                    continue;
                }
                
                // Drop selection boxes that appear before this row
                while (selection.length && selection[0][3] < index) {
                    selection.shift();
                    selmap = undefined;
                }

                // Count the number of selection boxes that apply to this row
                for (var selCount = 0; selCount < selection.length; selCount++)
                    if (selection[selCount][1] > index)
                        break;

                // Update the row
                if (selCount == 0) {
                    clearRowSelection(row);
                    continue;
                }

                // Build the selection map if a cached version isn't available
                if (!selmap || selmapSelectionCount != selCount) {
                    selmapSelectionCount = selCount;
                    selmap = createSelectionMap(selection, selCount);
                }

                // Update the selection
                setRowSelection(row, selmap);
            }
        }

        var updateCellNavCues = function()
        {
            // Update the active cell
            if (activeCellOn)
            {
                var physActive = renderedRows[activeCellY];
                if (physActive)
                {
                    var $newActive = $(physActive.row).children()
                        .slice(activeCellXStart,
                            activeCellXStart + activeCellXNum);
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

            // Update selection rendering
            updateSelectionCues();
        }

        var $activeContainer;

        var expandActiveCell = function()
        {
            // Obtain an expanding node in utility (off-screen) mode
            if (!$activeContainer)
            {
                // Create the expanding element
                $activeContainer = $('<div class="blist-table-active-container ' +
                    'blist-table-util"></div>');
                inside.append($activeContainer);
            }
            // If activeContainer is not in the tree anywhere, stick it inside
            else if ($activeContainer[0].parentNode == null ||
                $activeContainer[0].parentNode.nodeType == 11) // doc fragment
            {
                inside.append($activeContainer);
            }

            if (!activeCellOn)
            {
                $activeContainer.css('top', -10000);
                $activeContainer.css('left', -10000);
                return;
            }

            var row = model.getByID(activeCellY);
            if (row.expanded) { $activeContainer.addClass('blist-tr-open'); }
            else { $activeContainer.removeClass('blist-tr-open'); }
            if (!$activeCells)
            {
                // Display a placeholder at the appropriate location
                $activeContainer.empty();

                $activeContainer.height(rowOffset -
                    ($activeContainer.outerHeight() - $activeContainer.height()));
                var width = 0;
                for (var j = 0; j < activeCellXNum; j++)
                {
                    width += getColumnWidthPx(layout[0][activeCellXStart + j]);
                }
                $activeContainer.width(width -
                    ($activeContainer.outerWidth() - $activeContainer.width()));

                var rowIndex = model.index(activeCellY);
                $activeContainer.css('top', rowIndex * rowOffset);
                var left = lockedWidth;
                for (var i = 0; i < activeCellXStart; i++)
                {
                    left += getColumnWidthPx(layout[0][i]);
                }
                $activeContainer.css('left', left);
                return;
            }

            // Clone the cell
            var $activeExpand = $activeCells.clone();
            $activeExpand.width('auto').height('auto');
            $activeContainer.width('auto').height('auto');
            $activeContainer.empty();
            $activeContainer.append($activeExpand);

            // Size the expander
            sizeCellOverlay($activeContainer, $activeExpand, $activeCells);
            // Position the expander
            positionCellOverlay($activeContainer, $activeCells);

            $activeContainer.removeClass('blist-table-util');
        };

        /**
         * Remove all navigation cues, both logically and visually.
         */
        var clearCellNav = function(selectionOnly)
        {
            var needRefresh;

            if (!selectionOnly && activeCellOn)
            {
                activeCellOn = false;
                $activeCells = null;
                needRefresh = true;
            }

            if (cellSelection.length) {
                cellSelection = [];
                needRefresh = true;
            }

            if (needRefresh)
            {
                updateCellNavCues();
                expandActiveCell();
            }
        }

        /**
         * Navigate to a particular cell (a DOM element).  Returns true iff the
         * cell is a focusable table cell.  This is used for mouse handling.
         */
        var cellNavTo = function(cell, event, selecting)
        {
            // Obtain the row for the cell
            var row = getRow(cell);
            if (!row)
            {
                clearCellNav();
                return false;
            }

            var levelID = row.level || 0;

            // Check if we clicked in a locked section or on a nested table
            // header; ignore those for now
            if ($(event.target).closest('.blist-table-locked').length > 0 ||
                (!selecting && $(event.target).closest('.blist-tdh') > 0))
            {
                return false;
            }

            // Find the index of the cell in the layout level
            var rowLayout = layout[levelID];
            for (var x = 0, node = cell.parentNode.firstChild; node;
                node = node.nextSibling)
            {
                var lcol = rowLayout[x];
                if (!lcol)
                    break;
                if (node == cell)
                    break;
                if (lcol.skippable && $(node).hasClass('blist-skip'))
                    // Children aren't rendered, so skip them
                    x += lcol.skipCount;
                x++;
            }

            // If we found the column, focus now
            if (lcol)
            {
                model.unselectAllRows();
                if ($(event.target).is('a') && !selecting)
                {
                    // Special case for anchor clicks -- do not select the cell
                    // immediately but do enter "possible drag" mode
                    clearCellNav();
                    return true;
                }

                // Standard cell -- activate the cell
                return cellNavToXY(x, row.id, event, selecting);
            }

            // Not a valid navigation target; ignore
            clearCellNav();
            return false;
        }

        /**
         * Navigate to a particular location (column UID, row ID pair).
         * Returns true iff the location contains a focusable table cell.
         */
        var cellNavToXY = function(x, y, event, selecting, wrap)
        {
            // Decide what affect this navigation has on the selection
            var selectionMode;
            if (selecting || event.shiftKey)
            {
                // Shift key -- selection continuation (continues the last
                // selection box or starts a new box)
                if (!cellSelection.length)
                    selectionMode = 'start';
                else
                    selectionMode = 'continue';
            }
            else if (event.metaKey)
            {
                // Control or command key -- starts a new box
                selectionMode = 'start-new';
            }
            else if (cellSelection.length)
            {
                // No modifier keys -- remove the selection
                cellSelection = [];
            }

            var row = model.getByID(y);
            // Selection must occur in the same level -- otherwise, ignore
            if (cellSelection.length && (row.level || 0) != selectionLevel)
                return false;

            var layoutLevel = layout[row.level || 0];
            var xNum = 1;
            var col = layoutLevel[x];
            var uid = col.logical;

            // If we are wrapping into a non-expanded header, expand it
            // if it has children
            if (wrap && !row.expanded &&
                    (col.type == 'opener' || col.type == 'header'))
            {
                var subT = getRowValue(row, col.mcol);
                if (subT.length > 0) { model.expand(row); }
            }

            // See if we selected into a closed nested table; if so, select
            // all headers
            if ((!row.expanded || !wrap) &&
                    (col.type == 'opener' || col.type == 'header'))
            {
                for (var i = x + 1; i < layoutLevel.length &&
                        layoutLevel[i].logical == uid; i++)
                {
                    xNum++;
                }
            }

            // If we are naving into an expanded header, then go into the
            //  first navigable child cell
            if (row.expanded && wrap &&
                    (col.type == 'opener' || col.type == 'header'))
            {
                y = row.childRows[0].id;
                row = model.getByID(y);
                layoutLevel = layout[row.level || 0];
                col = layoutLevel[x];
                while (col.skippable)
                {
                    x++;
                    col = layoutLevel[x];
                }
            }

            // Locate the selection box we're modifying, if any
            var selection;
            if (selectionMode == 'start' || selectionMode == 'start-new')
            {
                // Begin a new selection box
                if (!cellSelection.length)
                    selectionLevel = model.getByID(y).level || 0;
                var startX = selectionMode == 'start' && activeCellOn ?
                    activeCellXStart : x;
                var startY = model.index(selectionMode == 'start' &&
                    activeCellOn ? activeCellY : y);
                cellSelection.push(selection = [ startX, startY ]);
            }
            else if (selectionMode == 'continue')
            {
                // Add to final selection box
                selection = cellSelection[cellSelection.length - 1];
            }

            // Update the selection box, if any
            if (selection)
            {
                selection[2] = x < selection[0] ?
                    x : x + xNum - 1;
                selection[3] = model.index(y);
            }

            // Update the active cell
            activeCellOn = true;
            activeCellXStart = x;
            activeCellXNum = xNum;
            activeCellY = y;

            // Scroll the active cell into view if it isn't visible vertically
            var scrollTop = $scrolls[0].scrollTop;
            var scrollHeight = $scrolls.height();
            if ($scrolls[0].scrollWidth > $scrolls[0].clientWidth)
                scrollHeight -= scrollbarWidth;
            if ($footerScrolls.is(':visible'))
                scrollHeight -= $footerScrolls.outerHeight() - 1;
            var scrollBottom = scrollTop + scrollHeight;
            var top = model.index(y) * rowOffset;
            var bottom = top + rowOffset;
            var origScrollTop = scrollTop;

            if (scrollBottom < bottom)
                scrollTop = bottom - scrollHeight;
            if (scrollTop > top)
                scrollTop = top;
            if (scrollTop != origScrollTop)
                $scrolls.scrollTop(scrollTop);

            // Scroll the active cell into view if it isn't visible horizontally
            // Set up scroll variables to use
            var scrollLeft = $scrolls.scrollLeft();
            var scrollWidth = $scrolls.width();
            if ($scrolls[0].scrollHeight > $scrolls[0].clientHeight)
                scrollWidth -= scrollbarWidth;
            var scrollRight = scrollLeft + scrollWidth;

            var layoutLevel = layout[model.getByID(y).level || 0];
            // Calculate left & right positions
            var cellLeft = lockedWidth;
            for (var i = 0; i < x; i++)
            {
                cellLeft += getColumnWidthPx(layoutLevel[i]);
            }
            var cellRight = cellLeft;
            for (var j = 0; j < xNum; j++)
            {
                cellRight += getColumnWidthPx(layoutLevel[x + j]);
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

            // Reset standard grid state
            $navigator[0].focus();
            killHotExpander();
            updateCellNavCues();

            return true;
        }


        /*** CELL EDITING ***/
        var $editContainer;
        var isEdit = false;

        var editCell = function(cell)
        {
            var row = getRow(cell);
            var col = getColumn(cell);
            if (!col || !row) { return; }
            var value = getRowValue(row, col);

            // Obtain an expanding node in utility (off-screen) mode
            if (!$editContainer)
            {
                $editContainer = $('<div class="blist-table-edit-container ' +
                    'blist-table-util"></div>');
                $editContainer.blistEditor();
                $editContainer.bind('keydown.blistTableEdit', editorKeyDown);
                inside.append($editContainer);
            }
            // If editContainer is not in the tree anywhere, stick it inside
            else if ($editContainer[0].parentNode == null ||
                    $editContainer[0].parentNode.nodeType == 11) // doc fragment
            {
                inside.append($editContainer);
            }

            var $editor = $editContainer.blistEditor().setEditor(row, col, value);

            $editor.width('auto').height('auto');
            $editContainer.width('auto').height('auto');

            isEdit = true;
            $(document).bind('mousedown.blistTableEdit', editMouseDown);

            sizeCellOverlay($editContainer, $editor, $(cell));
            positionCellOverlay($editContainer, $(cell));
            $editContainer.removeClass('blist-table-util').addClass('shown');

            $editor.find(':text').focus();
        };

        var endEdit = function(isCancel)
        {
            isEdit = false;
            $(document).unbind('.blistTableEdit');
            $navigator[0].focus();

            if (!$editContainer) { return; }
            $editContainer.css('top', -10000);
            $editContainer.css('left', -10000);
            $editContainer.removeClass('shown');

            if (isCancel) { return; }

            var editor = $editContainer.blistEditor();
            var origValue = editor.originalValue;
            var value = editor.currentValue();
            if (origValue != value)
            {
                var row = editor.row;
                var col = editor.column;
                setRowValue(value, row, col);
                model.change([row]);

                var data = {};
                data[col.id] = value;
                var url = '/views/' + model.meta().view.id + '/rows/';
                if (col.nestedIn)
                {
                    var parCol = col.nestedIn.header;
                    var childRow = getRowValue(row, parCol);
                    url += row.parent.id +
                        '/columns/' + parCol.id +
                        '/subrows/' + (childRow.id || childRow[0]) +
                        '.json';
                }
                else
                {
                    url += row.id + '.json';
                }

                $.ajax(
                    { url: url,
                    type: 'PUT',
                    contentType: 'application/json',
                    data: $.json.serialize(data)
                });
            }
        };

        var editMouseDown = function(event)
        {
            if ($(event.target).parents().andSelf().index($editContainer) < 0)
            {
                endEdit();
            }
        };

        var editorKeyDown = function(event)
        {
            if (event.keyCode == 13) // Enter
            {
                endEdit();
                navigateY(1, event);
            }
        };

        /*** CELL HOVER EXPANSION ***/

        var hotExpander;

        var hideHotExpander = function()
        {
            if (hotExpander)
            {
                hotExpander.style.top = '-10000px';
                hotExpander.style.left = '-10000px';
            }
        }

        var killHotExpander = function()
        {
            if (hotCellTimer)
            {
                clearTimeout(hotCellTimer);
                hotCellTimer = null;
            }
            hideHotExpander();
        }

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
            if (options.noExpand) return;

            if (!hotCellTimer)
            {
                return;
            }
            hotCellTimer = null;

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
                inside.append($hotExpander);
            }

            // Clone the node
            var wrap = hotCell.cloneNode(true);
            var $wrap = $(wrap);
            $wrap.width('auto').height('auto');
            $hotExpander.width('auto').height('auto');
            $hotExpander.empty();
            $hotExpander.append(wrap);

            // Determine if expansion is necessary.  The + 2 prevents us from
            // expanding if the box would just be slightly larger than the
            // containing cell.  This is a nicety except in the case of
            // picklists where the 16px image tends to be just a tad larger
            // than the text (currently configured at 15px).
            var $hotCell = $(hotCell);
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
            var rc = sizeCellOverlay($hotExpander, $wrap, $hotCell, true);
            // Position the expander
            rc = $.extend(rc, positionCellOverlay($hotExpander, $hotCell, true));

            $hotExpander.removeClass('blist-table-util');

            // Expand the element into position
            $hotExpander.animate(rc, EXPAND_DURATION);
        };


        /***  CELL EXPANSION & POSITIONING  ***/
        var positionCellOverlay = function($container, $refCell, animate)
        {
            // Locate a position for the expansion.  We prefer the expansion to
            // align top-left with the cell but do our best to ensure the
            // expansion remains within the viewport
            var left = $refCell.offset().left - inside.offset().left;
            var top = $refCell.offset().top - inside.offset().top;
            var origOffset = { top: top, left: left };

            // Ensure viewport is in the window horizontally
            var viewportWidth = $scrolls.width();
            if ($scrolls[0].scrollHeight > $scrolls[0].clientHeight)
                viewportWidth -= scrollbarWidth;
            var scrollLeft = $scrolls.scrollLeft();
            if (left + $container.width() > scrollLeft + viewportWidth)
                left = scrollLeft + viewportWidth - $container.width();
            if (left < scrollLeft)
                left = scrollLeft;

            // Ensure viewport is in the window vertically
            var viewportHeight = $scrolls.height();
            if ($scrolls[0].scrollWidth > $scrolls[0].clientWidth)
                viewportHeight -= scrollbarWidth;
            var scrollTop = $scrolls.scrollTop();
            if (top + $container.height() > scrollTop + viewportHeight)
                top = scrollTop + viewportHeight - $container.height();
            if (top < scrollTop - 1)
                top = scrollTop - 1;

            if (!animate)
            {
                origOffset = { top: top, left: left };
            }
            $container.css('top', origOffset.top + 'px');
            $container.css('left', origOffset.left + 'px');

            return ({left: left, top: top});
        };

        var sizeCellOverlay = function($container, $expandCells, $refCells,
            animate)
        {
            $expandCells.eq(0).addClass('blist-first');
            $expandCells.eq($expandCells.length - 1).addClass('blist-last');

            // Determine the cell's "natural" size
            var rc = { width: $container.outerWidth(),
                height: $container.outerHeight() };
            var refWidth = 0;
            var refHeight = 0;
            var minWidths = [];
            $refCells.each(function()
            {
                var $t = $(this);
                var w = $t.outerWidth();
                refWidth += w;
                minWidths.push(w);
                refHeight = Math.max(refHeight, $t.outerHeight());
            });

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
            var maxWidth = Math.floor($scrolls.width() * .5);
            if (rc.width > maxWidth)
            {
                // Constrain the width and determine the height
                $container.width(maxWidth);
                rc.width = maxWidth;
                rc.height = $container.height();
            }
            var maxHeight = Math.floor(inside.height() * .75);
            if (rc.height > maxHeight)
                rc.height = maxHeight;

            // Compute container padding
            var outerPadx = $container.outerWidth() - $container.width();
            var outerPady = $container.outerHeight() - $container.height();
            rc.width -= outerPadx;
            rc.height -= outerPady;

            var numCells = $expandCells.length;
            $expandCells.each(function(i)
            {
                var minW = minWidths.shift();
                if (i == 0) { minW -= outerPadx / 2; }
                if (i == numCells - 1) { minW -= outerPadx / 2; }
                var $t = $(this);
                // Compute cell padding
                var w = $t.outerWidth();
                var innerPadx = w - $t.width();
                var innerPady = $t.outerHeight() - $t.height();
                // Size the cell; bump up by one pixel to offset any rounding
                $t.width(Math.max(minW, w) - innerPadx + 1);
                $t.height(rc.height - innerPady);
            });
            // Account for rounding, and the extra pixels already added for
            // rounding to the insides
            rc.width += 1 + $expandCells.length;

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
        var hotHeaderMode; // 1 = hover, 2 = resize, 3 = control hover, 4 = move
        var hotHeaderDrag;
        var mouseDownAt;
        var dragHeaderLeft;
        var clickTarget;
        var selectFrom;

        var findContainer = function(event, selector)
        {
            var $container;
            // Firefox will sometimes return a XULElement for relatedTarget
            //  Catch the error when trying to access anything on it, and ignore
            try
            {
                $container = $(event.type == "mouseout" ?
                    event.relatedTarget : event.target);
            }
            catch (ignore) {}
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
        }

        var findCell = function(event)
        {
            var cell = findContainer(event, '.blist-td, .blist-table-expander, ' +
                '.blist-table-active-container');
            if (!cell)
                return null;
            var $cell = $(cell);

            // Can't interact with fill
            if ($cell.hasClass('blist-tdfill'))
                return null;

            // If we are looking at the selection expansion, return
            //  the first active cell
            if ($activeContainer && $activeCells &&
                ($cell[0] == $activeContainer[0] ||
                $cell.parent()[0] == $activeContainer[0]))
                return $activeCells[0];

            // Nested table header send focus to the opener
            if ($cell.hasClass('blist-tdh'))
            {
                while (!$cell.hasClass('blist-opener'))
                    $cell = $(cell = cell.previousSibling);
                return cell;
            }

            // If the mouse strays over the hot expander return the hot cell
            if (cell == hotExpander || cell.parentNode == hotExpander)
                return hotCell;

            // Normal cell
            return cell;
        }

        var handleHeaderHover = function(event)
        {
            if (hotHeaderMode == 4) { return false; }

            var container = findContainer(event, '.blist-tr, .blist-table-header');
            if (!container)
                return false;

            var x = event.clientX;
            var hh, hhm;

            var $headers = $('.blist-th:not(.blist-table-ghost), .blist-tdh',
                    container);
            $headers.each(function(i)
                {
                    var header = $(this);
                    var left = header.offset().left;
                    if (left > x) { return false; }
                    var width = header.outerWidth();
                    var right = left + width;

                    var isCtl = header.is('.blist-opener');
                    var isSizable = !isCtl && !header.is('.nested_table') &&
                        !(options.disableLastColumnResize &&
                            (i == ($headers.length - 1)));

                    if (isSizable && x >= right - options.resizeHandleAdjust &&
                        x < right + options.resizeHandleAdjust)
                    {
                        hh = header[0];
                        hhm = 2;
                        dragHeaderLeft = left;
                        return false;
                    }

                    if (x >= left && x < right)
                    {
                        hh = header[0];
                        hhm = isCtl ? 3 : 1;
                        return false;
                    }
                });

            if (hh)
            {
                if (hh != hotHeader || hhm != hotHeaderMode)
                {
                    hotHeader = hh;
                    hotHeaderMode = hhm;
                    if (hotHeaderMode == 2)
                        $outside.css('cursor', 'col-resize');
                    else
                        $outside.css('cursor', 'pointer');
                }
                return true;
            }
            return false;
        }

        var handleColumnResize = function(event, isFinished) {
            var width = event.clientX - dragHeaderLeft - paddingX;
            if (width < MINIMUM_HEADER_SIZE)
                width = MINIMUM_HEADER_SIZE;
            var col = getColumnForHeader(hotHeader);
            if (col.hasOwnProperty('percentWidth'))
            {
                varDenom[0] -= col.percentWidth;
                delete col.percentWidth;
                variableColumns[0] = $.grep(variableColumns[0], function (c, i)
                    { return c.dataIndex == col.dataIndex; }, true);
                if (col.minWidth)
                {
                    varMinWidth[0] -= col.minWidth;
                }
            }
            col.width = width;
            model.colWidthChange(col, isFinished);
            updateCellNavCues();
        }

        var unHotRow = function(rowID)
        {
            inside.find('#' + id + '-r' + rowID)
                .removeClass('blist-hot-row');
            $locked.find('#' + id + '-l' + rowID)
                .removeClass('blist-hot-row');
        }

        var isSelectingFrom = function(cell) {
            if (!cellSelection.length || !cell || !cell.parentNode)
                return false;
            var row = getRow(cell);
            var sel = cellSelection[cellSelection.length - 1];
            return cell.parentNode.childNodes[sel[0]] == cell && sel[1] == model.index(row);
        }

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
                if (clickTarget && Math.abs(event.clientX - mouseDownAt.x) > 3 || Math.abs(event.clientY - mouseDownAt.y > 3)) {
                    // No longer consider this a potential click event
                    clickTarget = null;
                }

                // If we are selecting and can't be in a click then update the
                // selection
                if (selectFrom && !clickTarget)
                {
                    // Ensure that the cell we started dragging from is the
                    // beginning of the current selection
                    if (!isSelectingFrom(selectFrom))
                    {
                        activeCellOn = false;
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

            if (handleHeaderHover(event)) {
                if (hotCell)
                    onCellOut(event);
                return;
            }
            if (hotHeader) {
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
                $nhr.attr('id').substring(id.length + 2) : null;
            if (newHotID != hotRowID)
            {
                if (hotRowID)
                {
                    unHotRow(hotRowID);
                }
                if (newHotID)
                {
                    inside.find('#' + id + '-r' + newHotID)
                        .addClass('blist-hot-row');
                    $locked.find('#' + id + '-l' + newHotID)
                        .addClass('blist-hot-row');
                }
                hotRowID = newHotID;
            }

            setHotCell(over, event);
        };

        var onCellOut = function(event)
        {
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

                // If this is a row opener, invoke expand on the model
                if ($(cell).hasClass('blist-opener') && !$(cell).hasClass('blist-opener-inactive')) {
                    model.expand(row);
                    clearCellNav();
                }

                // Retrieve the column
                var column = getColumn(cell);

                // Notify listeners
                var cellEvent = $.Event('cellclick');
                $this.trigger(cellEvent, [ row, column, origEvent ]);
                if (!activeCellOn && options.selectionEnabled &&
                    !cellEvent.isDefaultPrevented() && !(row.level < 0))
                {
                    if (origEvent.metaKey) // ctrl/cmd key
                    {
                        model.toggleSelectRow(row);
                    }
                    else if (origEvent.shiftKey)
                    {
                        model.selectRowsTo(row);
                    }
                    else
                    {
                        model.selectSingleRow(row);
                    }
                    unHotRow(row.id);
                }
            }
        };

        var $prevActiveCells;
        var onMouseDown = function(event)
        {
            // IE & Chrome only detetct mousedown on scrollbars, not mouseup;
            // so we need to ignore clicks on the scrollbar to avoid having a
            // false drag event
            // If they clicked on the scrollbar, ignore
            if ($(event.target).is('.blist-table-scrolls')) { return; }

            if (isEdit &&
                $(event.target).parents().andSelf().index($editContainer) >= 0)
            { return; }

            clickTarget = event.target;

            mouseDownAt = { x: event.clientX, y: event.clientY };

            if (hotHeader && hotHeaderMode != 3) {
                clickTarget = null;
                hotHeaderDrag = true;
                event.stopPropagation();
                event.preventDefault();
                return false;
            }

            selectFrom = null;

            if (cellNav)
            {
                var cell = findCell(event);
                if (cell && $activeCells && $activeCells.index(cell) >= 0)
                {
                    $prevActiveCells = $activeCells;
                }
                else
                {
                    $prevActiveCells = null;
                    clearCellNav();
                }
                if (cell && cellNavTo(cell, event))
                {
                    if (isEdit) { endEdit(); }
                    selectFrom = cell;
                }

            }
        }

        var onMouseUp = function(event)
        {
            mouseDownAt = null;

            if (isEdit) { return; }

            if (hotHeaderDrag) {
                hotHeaderDrag = false;
                // First finish up resize before doing last mouse move,
                // or else resizing when at the right edge of a wide dataset
                // will cause the mouse events to screwy as the scrollbar
                // shrinks and the header moves
                if (hotHeaderMode == 2) { handleColumnResize(event, true); }
                onMouseMove(event);
                event.stopPropagation();
                event.preventDefault();
                return true;
            }

            if (clickTarget && clickTarget == event.target &&
                !$(clickTarget).is('a'))
            {
                var editMode = false;
                if (cellNav && options.editEnabled)
                {
                    var curActiveCell = $activeCells ? $activeCells[0] : null;
                    if (curActiveCell && $prevActiveCells &&
                        $prevActiveCells.index(curActiveCell) >= 0)
                    {
                        // They clicked on a selected cell, go to edit mode
                        editCell(curActiveCell);
                        editMode = true;
                    }
                }

                $(clickTarget).trigger('table_click', event);
                if (!editMode) { $navigator[0].focus(); }
            }

            expandActiveCell();
        }

        var onDoubleClick = function(event)
        {
            if (isEdit &&
                $(event.target).parents().andSelf().index($editContainer) >= 0)
            { return; }

            clickTarget = event.target;

            if (cellNav)
            {
                var cell = findCell(event);
                if (options.editEnabled && cell)
                {
                    // They clicked on a cell, go to edit mode
                    editCell(cell);
                }
            }
        };

        var onKeyDown = function(event)
        {
            if (event.keyCode == 27) // ESC
            {
                if (isEdit) { endEdit(true); }
                else { clearCellNav(); }
            }
        };

        /*** KEYBOARD HANDLING ***/

        // Page size is configured in renderRows()
        var pageSize = 1;

        var preNav = function(event, wrap) {
            if (!activeCellOn) {
                // First keyboard nav without cell nav on -- move to position 0, 0
                if (model.length() && model.column(0))
                    cellNavToXY(0, model.get(0).id, event, false, wrap);
                return false;
            }
            return true;
        }

        var getAdjustedY = function(deltaY, event, baseX, baseY, wrap)
        {
            // Locate our current position
            var yIndex = model.index(baseY);
            if (yIndex == undefined)
                return null;

            // Update the y position
            yIndex += deltaY;

            var x = baseX;

            var oldRow = model.getByID(baseY);
            var oldLevel = oldRow.level || 0;
            var oldCol = layout[oldLevel][baseX];

            // If we're wrapping and we go off the top or bottom, wrap to
            // the next/previous column
            if (wrap && (yIndex < 0 || yIndex >= model.length()))
            {
                // First catch the case where we are in a nested table, and
                // should wrap to the next/previous nested table column before
                // wrapping to the next parent column
                if (oldCol.type != 'header' && oldCol.type != 'opener' &&
                    oldCol.mcol && oldCol.mcol.nestedIn &&
                    ((oldCol.mcol.indexInLevel > 0 && deltaY < 0) ||
                    (oldCol.mcol.indexInLevel <
                        oldCol.mcol.nestedIn.children.length - 1 && deltaY > 0)))
                {
                    yIndex += (deltaY < 0 ? 1 : -1) *
                        oldRow.parent.childRows.length;
                    x += deltaY < 0 ? -1 : 1;
                }
                else
                {
                    // If we're moving out of a header, go to the start of the
                    // parent column
                    if (oldCol.type == 'header')
                    {
                        for (var h = 0; h < layout[oldLevel].length; h++)
                        {
                            if (layout[oldLevel][h].mcol ==
                                oldCol.mcol.nestedIn.header)
                            {
                                x = h;
                                break;
                            }
                        }
                    }

                    var newYIndex = yIndex < 0 ? model.length() - 1 : 0;
                    var newY = model.get(newYIndex);
                    if (typeof newY == "object")
                        newY = newY.id;
                    var adjX = getAdjustedX(yIndex < 0 ? -1 : 1, event, x, newY);
                    if (adjX && adjX.x != x)
                    {
                        x = adjX.x;
                        yIndex = model.index(adjX.y);
                    }
                }
            }

            // Bounds checking
            if (yIndex < 0)
                yIndex = 0;
            if (yIndex >= model.length())
                yIndex = model.length() - 1;

            // Convert y to a row ID
            var y = model.get(yIndex);
            if (typeof y == "object")
                y = y.id;

            // No need to update if we didn't make changes
            if (y == baseY)
                return null;

            var newRow = model.getByID(y);
            var newLevel = newRow.level || 0;
            var newCol = layout[newLevel][x];
            // If we're leaving a child row, then we will either wrap back to
            // the top of the nested table, or go back to the first column in
            // the nested table in the next parent row
            if (wrap && baseX == x && oldCol.mcol.nestedIn &&
                oldRow.parent && (!newRow.parent ||
                    newRow.parent != oldRow.parent))
            {
                // If we're going out of the nested table completely, then
                // adjust back to the first/last nt column, but let the normal
                // y flow take affect
                if ((oldCol.mcol.indexInLevel == 0 && deltaY < 0) ||
                    (oldCol.mcol.indexInLevel ==
                     oldCol.mcol.nestedIn.children.length - 1 && deltaY > 0))
                {
                    x += (deltaY < 0 ? 1 : -1) *
                        (oldCol.mcol.nestedIn.children.length - 1);
                    newCol = layout[newLevel][x];
                }
                else
                {
                    // Otherwise, we are staying within this nested table,
                    // so we need to adjust columns by one and set y to the
                    // first or last child row in this nt
                    var childRows = oldRow.parent.childRows;
                    var ntY = deltaY < 0 ?
                        childRows[childRows.length - 1].id : childRows[0].id;
                    var adjXNT = getAdjustedX(deltaY < 0 ? -1 : 1, event, x, ntY);
                    if (adjXNT)
                    {
                        x = adjXNT.x;
                        y = adjXNT.y;
                        newRow = model.getByID(y);
                        newLevel = newRow.level || 0;
                        newCol = layout[newLevel][x];
                    }
                }
            }

            // If we hit a header, then there is special behavior
            if (newCol.type == 'opener' || newCol.type == 'header')
            {
                // If hit an opener or header in an expanded row, skip it
                if (newRow.expanded && wrap)
                {
                    return getAdjustedY(deltaY < 0 ? -1 : 1, event, x, y, wrap);
                }
                else
                {
                    // If it is not expanded, then select the whole header
                    var targetCol = newCol.mcol.type == 'nested_table' ?
                        newCol.mcol : newCol.mcol.nestedIn.header;
                    for (var j = 0; j < layout[newLevel].length; j++)
                    {
                        if (layout[newLevel][j].mcol == targetCol)
                        {
                            x = j;
                            // We found a collapsed header; let's return!
                            return {x: x, y: y};
                        }
                    }
                }
            }

            // Handle level changes
            // TODO -- this logic is a bit of a cop out, it relies on the fact
            // that we won't have cell nav on w/ more than 2 levels and that
            // BnB parent/child linkage will be available
            if (newLevel != oldLevel && baseX == x)
            {
                if (event.shiftKey || event.metaKey)
                {
                    // Can't select into a different level
                    var needScan = true;
                }
                else
                {
                    // Non-selecting nav into a different level
                    if (newLevel > oldLevel)
                    {
                        if (oldCol.mcol && oldCol.mcol.body)
                        {
                            // If we are leaving a top-level nt column,
                            // then we're navigating into a nested row
                            var newMCol = oldCol.mcol.body.children[0];
                        }
                        else if (oldCol.mcol && oldCol.mcol.nestedIn)
                        {
                            // Else we are leaving the header of a nested
                            // column, and we're navigating into a nested row
                            newMCol = oldCol.mcol;
                        }
                        else
                        {
                            // Otherwise scan for a new top-level row
                            needScan = true;
                        }
                    }
                    else if (newLevel < oldLevel && oldCol.mcol &&
                        oldCol.mcol.nestedIn)
                    {
                        // Navigating out of a nested row
                        newMCol = oldCol.mcol.nestedIn.header;
                    }
                    else
                    {
                        needScan = true;
                    }
                }

                if (needScan)
                {
                    // Find next row in the same level
                    y = model.nextInLevel(baseY, deltaY < 0);
                    if (y == null)
                    {
                        if (!wrap) { return null; }
                        // If we can't find another row in the same level,
                        // then we may need to wrap
                        var wrapYI = deltaY < 0 ? model.length() - 1 : 0;
                        var wrapY = model.get(wrapYI);
                        if (typeof wrapY == "object")
                            wrapY = wrapY.id;
                        var wrapXY = getAdjustedX(deltaY < 0 ? -1 : 1,
                                event, x, wrapY);
                        if (wrapXY && wrapXY.x != x)
                        {
                            return wrapXY;
                        }
                        return null;
                    }
                    if (typeof y == "object") { y = y.id; }
                }
                else if (newMCol)
                {
                    // Moving into a different level -- find the physical
                    // position for the model column
                    var newLevelLayout = layout[newLevel];
                    for (var i = 0; i < newLevelLayout.length; i++)
                    {
                        if (newLevelLayout[i].mcol == newMCol)
                        {
                            x = i;
                            newCol = layout[newLevel][x];
                            break;
                        }
                    }
                    if (i == newLevelLayout.length)
                    {
                        // Bug -- selected model column does not reside in this
                        // level
                        return null;
                    }
                }
                else
                {
                    // Bug -- should have selected a new column or decided to scan
                    return null;
                }
            }

            // If we're in a nested table, check if the row we are on is
            // completely empty; if so, skip over it
            if (newCol.mcol && (newCol.mcol.nestedIn ||
                newCol.type == 'nest-header'))
            {
                var subRow = getRowValue(newRow, (newCol.type == 'nest-header' ?
                            newCol.mcol.header :
                            newCol.mcol.nestedIn.header) );
                if (!subRow)
                {
                    var adjDelta = deltaY < 0 ? -1 : 1;
                    if (!wrap && model.index(y) + adjDelta >= model.length())
                    { return null; }
                    return getAdjustedY(adjDelta, event, x, y, wrap);
                }
            }

            return {x: x, y: y};
        };

        // Move the active cell an arbitrary number of rows.  Supports an value
        // for deltaY, including negative offsets
        var navigateY = function(deltaY, event, wrap)
        {
            if (!preNav(event, wrap))
                return;

            var adjPos = getAdjustedY(deltaY, event, activeCellXStart,
                activeCellY, wrap);
            if (!adjPos) { return; }

            // Update the column
            cellNavToXY(adjPos.x, adjPos.y, event, false, wrap);
        }

        var getAdjustedX = function(deltaX, event, baseX, baseY, wrap)
        {
            // Scan for the next focusable cell
            var y = baseY;
            var origLevel = model.getByID(y).level || 0;
            var layoutLevel = layout[origLevel];
            var x = baseX;
            var origCol = layoutLevel[x];
            var prevCol = origCol;
            var cellsToMove = Math.abs(deltaX);
            var delta = deltaX / cellsToMove;
            for (var i = 0; i < cellsToMove; i++)
            {
                for (var newX = x + delta; newX >= 0 &&
                    newX < layoutLevel.length; newX += delta)
                {
                    var curCol = layoutLevel[newX];

                    // If we're wrapping, and we hit the edge of nested table
                    //  we're in, wrap within the table
                    if (wrap && prevCol && prevCol.mcol &&
                        prevCol.mcol.nestedIn &&
                        (!curCol.mcol ||
                            curCol.mcol.nestedIn != prevCol.mcol.nestedIn))
                    {
                        var dY = delta < 0 ? -1 : 1;
                        var adjX = newX + (delta < 0 ? 1 : -1) *
                            prevCol.mcol.nestedIn.children.length;
                        var adjP = getAdjustedY(dY, event, adjX, y);

                        // Make sure this wouldn't make us change levels or
                        // parent rows; if it does, then skip setting this data
                        // and let the normal flow happen
                        if (adjP &&
                            origLevel == (model.getByID(adjP.y).level || 0) &&
                            model.getByID(y).parent ==
                                model.getByID(adjP.y).parent)
                        {
                            y = adjP.y;
                            newX = adjP.x;
                            layoutLevel = layout[model.getByID(y).level || 0];
                            break;
                        }
                    }

                    // Always skip over nest headers and headers
                    if (curCol.type == 'nest-header' ||
                        curCol.type == 'header') { continue; }

                    // If going into an empty nested table, skip it
                    if (curCol.mcol && curCol.mcol.type == 'nested_table')
                    {
                        var curRow = model.getByID(y);
                        if (curRow.expanded)
                        {
                            var subTable = getRowValue(curRow, curCol.mcol);
                            if (subTable.length < 1) { continue; }
                        }
                    }

                    // If we hit a fill or switched nested tables, go up to the
                    // parent
                    if (curCol.type == 'fill' ||
                        (prevCol && prevCol.mcol && prevCol.mcol.nestedIn &&
                         curCol.mcol && curCol.mcol.nestedIn &&
                         curCol.mcol.nestedIn != prevCol.mcol.nestedIn))
                    {
                        var newRow = model.getByID(y).parent;
                        // If we switched to an expanded & empty nt, skip it
                        if (curCol.mcol && curCol.mcol.nestedIn &&
                            newRow.expanded)
                        {
                            var subT = getRowValue(newRow,
                                curCol.mcol.nestedIn.header);
                            if (subT.length < 1) { continue; }
                        }

                        y = newRow.id;
                        layoutLevel = layout[newRow.level || 0];
                        break;
                    }
                    else if (curCol.canFocus !== false)
                    {
                        // Found new cell to focus on
                        break;
                    }
                }
                if (newX < 0 || newX >= layoutLevel.length)
                {
                    // Can't move further left/right
                    if (!wrap) { break; }

                    if (prevCol && prevCol.mcol && prevCol.mcol.nestedIn)
                    {
                        var dY = delta < 0 ? -1 : 1;
                        var adjX = newX + (delta < 0 ? 1 : -1) *
                            prevCol.mcol.nestedIn.children.length;
                        var adjP = getAdjustedY(dY, event, adjX, y);

                        // Make sure this wouldn't make us change levels or
                        // parent rows; if it does, then skip setting this data
                        // and let the normal flow happen
                        if (adjP &&
                            origLevel == (model.getByID(adjP.y).level || 0) &&
                            model.getByID(y).parent ==
                                model.getByID(adjP.y).parent)
                        {
                            y = adjP.y;
                            x = adjP.x;
                            layoutLevel = layout[model.getByID(y).level || 0];
                            prevCol = layoutLevel[newX];
                            continue;
                        }
                    }

                    // We're wrapping a whole row, so find the next/prev
                    // parent row
                    var curRow = model.getByID(y);
                    if (curRow.parent) { curRow = curRow.parent; }
                    y = model.nextInLevel(curRow.id, delta < 0);
                    if (y == null) { return null; }

                    if (typeof y == 'object') { y = y.id; }
                    newX = newX < 0 ? layoutLevel.length : -1;
                    layoutLevel = layout[model.getByID(y).level || 0];
                    i--;
                }
                x = newX;
                prevCol = layoutLevel[x];
            }

            return {x: x, y: y};
        };

        // Move the active cell an arbitrary number of columns
        var navigateX = function(deltaX, event, wrap)
        {
            if (!preNav(event, wrap))
                return;

            var adjPos = getAdjustedX(deltaX, event, activeCellXStart,
                activeCellY, wrap);
            if (!adjPos) { return; }

            // Update if we made changes
            if (adjPos.x != activeCellXStart || adjPos.y != activeCellY)
                cellNavToXY(adjPos.x, adjPos.y, event, false, wrap);
        }

        var onKeyPress = function(event) {
            switch (event.keyCode || event.charCode) {
                case 34:
                    // Page up
                    navigateY(-pageSize, event);
                    break;

                case 35:
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

                case 9:
                    // Tab
                    var direction = event.shiftKey ? -1 : 1;
                    event.shiftKey = false;
                    navigateX(direction, event, true);
                    break;

                case 13:
                case 32:
                    // Enter/Space
                    if (!event.shiftKey &&
                        $activeCells && $activeCells.hasClass('blist-opener') &&
                        !$activeCells.hasClass('blist-opener-inactive'))
                    {
                        model.expand(getRow($activeCells[0]));
                    }
                    else
                    {
                        var direction = event.shiftKey ? -1 : 1;
                        event.shiftKey = false;
                        navigateY(direction, event, true);
                    }
                    break;

                default:
                    return true;
            }
            setTimeout(expandActiveCell, 1);

            return false;
        }
        
        if (options.simpleCellExpand)
        {
            $('.blist-td:not(.blist-td-popout)').live('mouseover', function (event)
            {
                var $this = $(this);

                var innerContentWidth = 0;
                $this.children().each(function() { innerContentWidth += $(this).outerWidth(true); });

                if (innerContentWidth <= $this.innerWidth())
                    return;

                var offsetPos = $this.offset();
                offsetPos.top += $this.offsetParent().scrollTop();

                var $copy = $this.clone();
                $copy
                    .addClass('blist-td-popout')
                    .css('left', offsetPos.left)
                    .css('top', offsetPos.top)
                    .mouseleave(function (event)
                    {
                        $(this).fadeOut('fast', function() {
                            $(this).remove();
                        });
                    })
                    .fadeIn();
                $(document.body).append($copy);
            });
        }


        /*** HTML RENDERING ***/

        var headerStr =
            '<textarea class="blist-table-navigator"></textarea>\
             <div class="blist-table-locked-scrolls">\
                <div class="blist-table-locked-header">&nbsp;</div>\
                <div class="blist-table-locked">&nbsp;</div>\
                <div class="blist-table-locked-footer">&nbsp;</div>\
            </div>\
            <div class="blist-table-top">';
        if (options.showTitle)
        {
            headerStr +=
                '<div class="blist-table-title-tl">\
                  <div class="blist-table-title-tr">\
                    <div class="blist-table-title">\
                      <div class="blist-table-filter-l">\
                        <div class="blist-table-filter-r">\
                          <input class="blist-table-filter"/>\
                          <a class="blist-table-clear-filter" title="Clear Search" href="#clear_filter">Clear Search</a>\
                      </div></div>';
            if (options.showName)
            {
                headerStr += '<div class="blist-table-name">&nbsp;</div>';
            }
            headerStr += '</div></div></div>';
        }
        headerStr +=
            '  <div class="blist-table-header-scrolls">\
                <div class="blist-table-header">&nbsp;</div>\
            </div></div>\
            <div class="blist-table-scrolls">\
              <div class="blist-table-inside">&nbsp;</div></div>\
            <div class="blist-table-footer-scrolls">\
                <div class="blist-table-footer">&nbsp;</div>\
            </div>\
            <div class="blist-table-util"></div>';

        $(document)
            .mouseup(onMouseUp);

        // Render container elements
        var $outside = $this
            .addClass('blist-table')
            .mousedown(onMouseDown)
            .mousemove(onMouseMove)
            .dblclick(onDoubleClick)
            .keydown(onKeyDown)
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
        var $lockedFooter = $lockedScrolls.find('.blist-table-locked-footer');

        // The top area
        var $top = $outside.find('.blist-table-top');

        var $title;
        var $nameLabel;
        var $filterBox;
        var $filterClear;
        if (options.showTitle)
        {
            // The title bar
            $title = $top.find('.blist-table-title');
            $nameLabel = $title.find('.blist-table-name');
            $filterBox = $title
                .find('.blist-table-filter')
                .keydown(applyFilter)
                .change(applyFilter)
                .example('Find');
            $filterClear = $title.find('.blist-table-clear-filter')
                .bind('click', clearFilter).hide();
        }

        // The table header elements
        var $headerScrolls = $top
            .find('.blist-table-header-scrolls');
        var $header = $headerScrolls
            .find('.blist-table-header')

        // The scrolling container
        var $scrolls = $outside
            .find('.blist-table-scrolls')
            .scroll(function () {onScroll(); renderRows();});

        // The non-scrolling row container
        var inside = $scrolls
            .find('.blist-table-inside')
            .mouseout(onCellOut)
            .bind('table_click', onCellClick);
        var insideDOM = inside[0];

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
        var $navigator = $($outside.find('.blist-table-navigator'))
            .keypress(onKeyPress);

        // Set up initial top of locked section
        $locked.css('top', $header.outerHeight());

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
            $headerScrolls.height($header.outerHeight());

            // Size the scrolling area.  TODO - change to absolute positioning
            // when IE6 is officially dead (June 2010?)
            $scrolls.height($outside.height() - $top.outerHeight() -
                ($scrolls.outerHeight() - $scrolls.height()) - 1);
            $scrolls.width($outside.width() -
                ($scrolls.outerWidth() - $scrolls.width()));

            // Size the inside row container
            var insideHeight = model ? rowOffset * model.rows().length : 0;
            var scrollsHeight = $scrolls[0].clientHeight;
            if ($footerScrolls.is(':visible'))
                insideHeight += $footerScrolls.outerHeight() - 1;
            if (insideHeight < scrollsHeight)
                insideHeight = scrollsHeight;
            inside.height(insideHeight);
            $locked.height(insideHeight);

            renderRows();
            configureWidths();

            // Move footer up to bottom, or just above the scrollbar
            var lockedBottom = parseFloat($scrolls.css('border-bottom-width')) + 1;
            var footerBottom = parseFloat($scrolls.css('border-bottom-width')) +
                $footerScrolls.outerHeight();
            if ($scrolls[0].scrollWidth > $scrolls[0].clientWidth)
            {
                lockedBottom += scrollbarWidth;
                footerBottom += scrollbarWidth;
            }
            $lockedScrolls.css('bottom', lockedBottom);
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
            var scrollHoriz = $scrolls[0].scrollLeft;
            if (scrollHoriz != headerScrolledTo)
            {
                $header[0].style.left = -scrollHoriz + 'px';
                $footer[0].style.left = -scrollHoriz + 'px';
                headerScrolledTo = scrollHoriz;
            }

            var scrollVert = $scrolls[0].scrollTop;
            if (scrollVert != rowsScrolledTo)
            {
                $locked.css('top', $header.outerHeight() - scrollVert);
                rowsScrolledTo = scrollVert;
            }
        };


        /*** CSS STYLE MANIPULATION ***/

        var css;
        var rowStyle;
        var unlockedRowStyle;
        var ghostStyle;
        var openerStyle;
        var cellStyle;
        var groupHeaderStyle;
        var ghostClass;
        var openerClass;

        // Add a CSS rule.  This creates an empty rule and returns it.  We then
        // dynamically update the rule values as needed.
        var addRule = function(selector)
        {
            // Add the rule
            var rules = css.cssRules || css.rules;
            css.insertRule ? css.insertRule(selector + " {}", rules.length)
                : css.addRule(selector, null, rules.length);
            rules = css.cssRules || css.rules;

            // Find the new rule
            selector = selector.toLowerCase();
            for (var i = 0; i < rules.length; i++)
            {
                if (rules[i].selectorText.toLowerCase() == selector)
                {
                    return rules[i];
                }
            }

            // Shouldn't get here
            return null;
        };

        // Obtain a CSS class for a column
        var getColumnClass = function(column) {
            return id + '-c' + column.uid;
        };

        // Obtain a CSS style for a column
        var colStyles = [];
        var getColumnStyle = function(column) {
            return colStyles[column.uid] || (colStyles[column.uid] = addRule('.' + getColumnClass(column)).style);
        };

        // Initialize my stylesheet
        (function() {
            var rulesNode = $('head')
                .append('<style type="text/css" id="' + id + '-styles"></style>')
                .children('#' + id + '-styles')[0];
            for (var i = 0; i < document.styleSheets.length; i++) {
                css = document.styleSheets[i];
                if ((css.ownerNode || css.owningElement) == rulesNode)
                    break;
            }
            ghostClass = id + "-ghost";
            openerClass = id + "-opener";

            // Dynamic style applied to the ghost column
            ghostStyle = addRule("." + ghostClass).style;

            // Dynamic style applied to nested table openers
            openerStyle = addRule("." + openerClass).style;

            // Dynamic style applied to rows
            rowStyle = addRule("#" + id + " .blist-tr").style;
            unlockedRowStyle =
                addRule("#" + id + " .blist-table-inside .blist-tr").style;

            // Dynamic style available to cell renderers to fill height properly
            cellStyle = addRule("#" + id + " .blist-cell").style;

            // Dynamic style applied to "special" row cells
            groupHeaderStyle = addRule("#" + id + " .blist-td-header").style;
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
        var varMinWidth = [];
        var varDenom = [];
        var insideWidth;

        // Special columns
        var rowNumberColumn;
        var rowHandleColumn;

        /**
         * Create rendering code for a series of columns.
         */
        var createColumnRendering = function(mcols, lcols, contextVariables, prefix) {
            var colParts = [];
            var generatedCode = '';
            if (prefix)
                colParts.push(prefix);

            // Utility function that writes a push for all column parts
            var completeStatement = function() {
                if (colParts.length) {
                    generatedCode += 'html.push(' + colParts.join(',') + ');';
                    colParts = [];
                }
            }

            for (var j = 0; j < mcols.length; j++)
            {
                var mcol = mcols[j];

                if (mcol.body) {
                    // Nested table header -- render headers for child columns
                    completeStatement();

                    generatedCode +=
                        "if (row" + mcol.dataLookupExpr + " && row" + mcol.dataLookupExpr + ".length)";
                    colParts.push("\"<div class='blist-td blist-tdh blist-opener " + openerClass + "'></div>\"");
                    var children = mcol.body.children;
                    lcols.push({
                        type: 'opener',
                        skippable: true,
                        skipCount: children.length,
                        mcol: mcol,
                        logical: mcol.uid
                    });
                    for (var k = 0; k < children.length; k++) {
                        var child = children[k];
                        colParts.push(
                            "\"<div class='blist-td blist-tdh " +
                            getColumnClass(child) +
                            "' uid='" +
                            child.uid +
                            "'>&nbsp;" +
                            htmlEscape(child.name) +
                            "</div>\""
                        );
                        lcols.push({
                            type: 'header',
                            canFocus: false,
                            mcol: child,
                            logical: mcol.uid
                        });
                    }
                    completeStatement();

                    generatedCode += "else ";
                    colParts.push("\"<div class='blist-td blist-tdh blist-opener blist-opener-inactive " + openerClass + "'></div>\"");
                    for (k = 0; k < children.length; k++) {
                        child = children[k];
                        colParts.push(
                            "\"<div class='blist-td blist-tdh " +
                            getColumnClass(child) +
                            "' uid='" +
                            child.uid +
                            "'></div>\""
                        );
                    }
                    completeStatement();
                } else if (mcol.children) {
                    // Nested table row -- render cells if the row is present or filler if not
                    completeStatement();

                    // Add the code.  If no record is present we add a filler row; otherwise we add the rows
                    children = mcol.children;
                    lcols.push({
                        type: 'nest-header',
                        canFocus: false,
                        skippable: true,
                        skipCount: mcol.children.length,
                        mcol: mcol,
                        logical: mcol.uid
                    });
                    generatedCode +=
                        "if (row" + mcol.header.dataLookupExpr + ") " +
                            createColumnRendering(children, lcols, contextVariables, "'<div class=\"blist-td blist-opener-space blist-tdfill " + openerClass + "\"></div>'") +
                        "else ";
                        colParts.push("'<div class=\"blist-td blist-opener-space blist-tdfill " + openerClass + "\"></div>'");
                        for (var i = 0; i < children.length; i++)
                        colParts.push("\"<div class='blist-td blist-tdfill blist-td-first "
                            + getColumnClass(children[i])
                            + "'></div>\"");
                    completeStatement();
                } else if (mcol.type && mcol.type == 'fill') {
                    // Fill column -- covers background for a range of columns that aren't present in this row
                    colParts.push("\"<div class='blist-td blist-tdfill " + getColumnClass(mcol) + "'>&nbsp;</div>\"");
                    lcols.push({
                        type: 'fill',
                        canFocus: false
                    });
                } else {
                    // Standard cell
                    var type = blist.data.types[mcol.type] || blist.data.types.text;
                    var renderer = mcol.renderer || type.renderGen;
                    var cls = mcol.cls || type.cls;
                    cls = cls ? ' blist-td-' + cls : '';

                    renderer = renderer("row" + mcol.dataLookupExpr, mcol,
                        contextVariables);

                    colParts.push(
                        "\"<div class='blist-td " + getColumnClass(mcol) + cls + "'>\", " +
                            renderer + ", \"</div>\""
                    );

                    lcols.push({
                        mcol: mcol,
                        logical: mcol.uid
                    });
                }

                // Initialize column heights (TODO - we don't support variable heights; can we do this on a single
                // style rather than for each column style individually?)
                if (options.generateHeights)
                {
                    getColumnStyle(mcol).height = rowHeight + 'px';
                }
            }

            completeStatement();
            
            return generatedCode;
        }

        /**
         * Initialize based on current model metadata.
         */
        var initMeta = function(newModel)
        {
            model = newModel;

            // Convert the model columns to table columns
            columns = [];
            variableColumns = [];
            varMinWidth = [];
            varDenom = [];

            // Set up variable columns at each level
            for (var j = 0; j < model.meta().columns.length; j++)
            {
                variableColumns[j] = [];
                varMinWidth[j] = 0;
                varDenom[j] = 0.0;
                var mcols = model.meta().columns[j];
                for (var i = 0; i < mcols.length; i++)
                {
                    var mcol = mcols[i];
                    var col = $.extend(false, { index: i }, mcol);
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
                    else if (!col.hasOwnProperty('width'))
                    {
                        col.width = 100;
                    }
                    if (j == 0)
                    {
                        columns.push(col);
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
                lockedColumns.push(rowNumberColumn = {uid: 'rowNumberCol',
                    dataIndex: 'rowNumber',
                    cls: 'blist-table-row-numbers',
                    measureText: Math.max(model.rows().length, 100),
                    renderer: '(index + 1)',
                    footerText: 'Totals'});
            }
            if (options.showRowHandle)
            {
                lockedColumns.push(rowHandleColumn = {uid: 'rowHandleCol',
                    dataIndex: 'rowHandle',
                    cls: 'blist-table-row-handle',
                    width: 1,
                    renderer: '""'});
            }

            handleDigits = calculateHandleDigits(model);

            // Measure width of a default cell and height and width of the cell
            measureUtilDOM.innerHTML = '<div class="blist-td">x</div>';
            var $measureDiv = $(measureUtilDOM.firstChild);
            var measuredInnerDims = { width: $measureDiv.width(),
                height: $measureDiv.height() };
            var measuredOuterDims = { width: $measureDiv.outerWidth(),
                height: $measureDiv.outerHeight() };

            // Record the amount of padding and border in a table cell
            paddingX = measuredOuterDims.width - measuredInnerDims.width;

            // Row positioning information
            rowHeight = measuredInnerDims.height;
            rowOffset = measuredOuterDims.height;
            rowStyle.height = rowOffset + 'px';

            // Set row heights
            if (options.generateHeights && options.showGhostColumn)
            {
                ghostStyle.height = rowHeight + 'px';
            }
            if (options.generateHeights)
            {
                cellStyle.height = rowHeight + 'px';
            }

            // Update the locked column styles with proper dimensions
            lockedWidth = 0;
            $.each(lockedColumns, function (i, c)
            {
                measureUtilDOM.innerHTML =
                    '<div class="' + (c.cls || '') + ' ' + getColumnClass(c) +
                    ' blist-td">' + (c.measureText || '') + '</div>';
                var $measureCol = $(measureUtilDOM.firstChild);
                var colStyle = getColumnStyle(c);
                if (c.width)
                {
                    colStyle.width = c.width + 'px';
                }
                else
                {
                    colStyle.width = $measureCol.width() + 'px';
                }
                lockedWidth += $measureCol.outerWidth();
                if (options.generateHeights)
                {
                    colStyle.height = rowHeight + 'px';
                }
            });

            // Record the width of the opener for nested tables
            openerWidth = measuredInnerDims.width * 1.5;
            openerStyle.width = openerWidth + 'px';
            if (options.generateHeights)
                openerStyle.height = rowHeight + 'px';

            // These variables are available to the rendering function
            var contextVariables = {
                renderSpecial: function(specialRow) {
                    return "<div class='blist-td blist-td-header'>" +
                        specialRow.title + "</div>";
                }
            };

            // Create default column rendering
            var levelRender = [];
            for (i = 0; i < model.meta().columns.length; i++)
            {
                mcols = model.meta().columns[i];
                var lcols = layout[i] = [];
                levelRender[i] = createColumnRendering(mcols, lcols, contextVariables);
            }

            var rowDivContents =
                'class=\'blist-tr", \
                (index % 2 ? " blist-tr-even" : ""), \
                (row.level != undefined ? " blist-tr-level" + row.level : ""), \
                (row.expanded ? " blist-tr-open" : ""), \
                (row.groupLast ? " last" : ""), \
                "\' style=\'top: ", \
                (index * ' + rowOffset + '), "px\'';

            // Create the rendering function.  We precompile this for speed so
            // we can avoid tight loops, function calls, etc.
            var renderFnSource =
                '(function(html, index, row) {\
                    html.push(\
                        "<div id=\'' + id + '-r", \
                        (row.id || row[0]), \
                        "\' ' + rowDivContents + '>"\
                        );\
                    switch (row.level || 0) {\
                      case -1:\
                        html.push(renderSpecial(row));\
                        break;';
            for (i = 0; i < levelRender.length; i++) {
                renderFnSource += 'case ' + i + ':' +
                    levelRender[i] +
                    'break;';
            }
            renderFnSource += '}';
            if (options.showGhostColumn)
            {
                renderFnSource += 'html.push("<div class=\'blist-td ' +
                    ghostClass + ' blist-table-ghost\'></div>");';
            }
            renderFnSource += 'html.push("</div>");' +
                '})';
            rowRenderFn = blist.data.types.compile(
                renderFnSource, contextVariables);

            var renderLockedFnSource =
                    '(function(html, index, row) {';
            renderLockedFnSource += 'html.push(\
                "<div id=\'' + id + '-l", \
                (row.id || row[0]), \
                "\' ' + rowDivContents + '>");';

            $.each(lockedColumns, function (i, c)
            {
                renderLockedFnSource += 'html.push(\
                    "<div class=\'' + (c.cls || '') + ' blist-td ' +
                        getColumnClass(c) + '\'>", ' +
                        c.renderer + ', \
                        "</div>");';
            });
            renderLockedFnSource += 'html.push("</div>");';
            renderLockedFnSource += '})';
            rowLockedRenderFn = blist.data.types.compile(
                    renderLockedFnSource, contextVariables);

            // Configure the left position of grid rows
            groupHeaderStyle.left = lockedWidth + 'px';
            unlockedRowStyle.left = lockedWidth + 'px';

            $headerScrolls.css('margin-left', lockedWidth);
            $footerScrolls.css('margin-left', lockedWidth);

            // Set the title of the table
            if ($nameLabel)
            {
                $nameLabel.html(model.title());
            }

            // Set up data for existing sort
            if (model.meta().sort)
            {
                var s = model.meta().sort;
                sortDescending = !s.ascending;
                $.each(columns, function (i, c)
                {
                    if (s.column.dataIndex == c.dataIndex)
                    {
                        sortBy = i;
                        return false;
                    }
                });
            }

            configureWidths();
        }

        /**
         * Configure column widths.
         */
        var configureWidths = function()
        {
            // Compute the actual width for all columns with static widths
            insideWidth = 0;
            var mcols = model.meta().columns;
            for (var i = 0; i < mcols.length; i++)
                configureLevelWidths(mcols[i], i);

            // Configure grouping header column widths
            groupHeaderStyle.width = Math.max(0,
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
        }

        var configureLevelWidths = function(mcols, level)
        {
            var hpos = lockedWidth;
            if (level == 0 && options.showGhostColumn)
                hpos += paddingX;

            for (var j = 0; j < mcols.length; j++)
            {
                var mcol = mcols[j];
                var colWidth;

                if (mcol.body)
                {
                    // Nested table header -- set width based on child widths
                    colWidth = openerWidth + paddingX;
                    var children = mcol.body.children;
                    for (var k = 0; k < children.length; k++)
                        colWidth += children[k].width + paddingX;
                }
                else if (mcol.children)
                {
                    // Nested table row -- column width is irrelevant because
                    // the only nested columns are actually rendered into the
                    // DOM, so only compute width for nested children
                    colWidth = null;
                    configureLevelWidths(mcol.children, level);
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
                //columnLayout[mcol.uid] = { left: hpos, width: colWidth };

                // Initialize the column's style
                if (colWidth)
                {
                    hpos += colWidth;
                    var style = getColumnStyle(mcol);
                    style.width = (colWidth - paddingX) + 'px';
                }
            }

            hpos += varMinWidth[level];

            configureVariableWidths(level, hpos);

            // Expand the inside width if the level is wider
            if (hpos > insideWidth)
                insideWidth = hpos;
        }

        var configureVariableWidths = function(level, levelWidth)
        {
            if (variableColumns[level].length > 0)
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
                        ghostStyle.width = (c.minWidth + varSize)  + "px";
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
        }

        /**
         * Create column header elements for the current row configuration and
         * install event handlers.
         */
        var renderHeader = function()
        {
            var html = [];
            for (var i = 0; i < columns.length; i++)
            {
                var col = columns[i];
                var cls = col.cls ? ' blist-th-' + col.cls : '';
                var colName = col.name == null ? '' : htmlEscape(col.name);
                html.push(
                    '<div class="blist-th ',
                    !i ? 'blist-th-first ' : '',
                    col.type,
                    ' ',
                    getColumnClass(col),
                    cls,
                    '" title="',
                    colName,
                    '" uid="',
                    col.uid,
                    '"><div class="th-inner-container">');
                if (options.columnDrag)
                {
                    html.push(
                            '<div class="dragHandle"',
                            options.generateHeights ? ' style="height: ' +
                            rowOffset + 'px"' : '',
                            '></div>');
                }
                html.push(
                    '<span class="blist-th-icon"></span>',
                    '<span class="blist-th-name">',
                    colName,
                    '</span>',
                    '<div class="filter"',
                    options.generateHeights ? ' style="height: ' +
                    rowOffset + 'px"' : '',
                    '></div>',
                    '<div class="sort sort-desc" title="Sort ascending"',
                    options.generateHeights ? ' style="height: ' +
                        rowOffset + 'px"' : '',
                    '></div>',
                    '</div></div>');
            }
            if (options.showGhostColumn)
            {
                html.push('<div class="blist-th blist-table-ghost ',
                    columns.length < 1 ? 'blist-th-first ' : '',
                    ghostClass, '"></div>');
            }
            $header.html(html.join(''));

            $(".blist-th", $header).each(function(index)
            {
                if (index >= columns.length)
                {
                    // Skip the ghost column
                    return;
                }
                columns[index].dom = this;

                $(this)
                    .data('column', columns[index])
                    .bind('table_click', function()
                    {
                        $(this).removeClass('hover');
                        if ((blist.data.types[columns[index].type] != undefined &&
                                blist.data.types[columns[index].type].sortable) ||
                            columns[index].sortable)
                        {
                            sort(index);
                        }
                    })
                    .hover(function ()
                        { if (hotHeaderMode != 4) { $(this).addClass('hover'); } },
                        function () { $(this).removeClass('hover') });
                if (options.columnDrag)
                {
                    $(this)
                        .draggable({
                            appendTo: '.blist-table', axis: 'x',
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
                                model.moveColumn(col.index, curDropPos);
                                curDropPos = null;
                            }});
                }

                if (options.headerMods != null)
                {
                    options.headerMods(columns[index]);
                }

            });

            var lockedHtml = '';
            $.each(lockedColumns, function (i, c)
            {
                lockedHtml += '<div class="blist-th ' + (c.cls || '') +
                    ' ' + getColumnClass(c) + '"></div>';
            });
            $lockedHeader.html(lockedHtml);

            // Render sort & filter headers
            configureSortHeader();
            configureFilterHeaders();
        };

        var curDropPos = null;
        var $dropIndicator;
        var findHeaderDragPosition = function(event)
        {
            var x = event.pageX;
            var $headers = $('.blist-th:not' +
                '(.ui-draggable-dragging, .blist-table-ghost)', $header);
            if (x < $headers.eq(0).offset().left) { return 0; }
            var $lastHeader = $headers.eq($headers.length - 1);
            if (x > $lastHeader.offset().left + $lastHeader.outerWidth())
            { return $headers.length }

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
            // Set up data for existing sort
            if (model.meta().sort)
            {
                var s = model.meta().sort;
                sortDescending = !s.ascending;
                $.each(columns, function (i, c)
                {
                    if (s.column.dataIndex == c.dataIndex)
                    {
                        sortBy = i;
                        return false;
                    }
                });
            }
            configureSortHeader();
            configureFilterHeaders();
        };

        /**
         * Create column footer elements for the current row configuration
         */
        var renderFooter = function()
        {
            var html = [];
            var showAgg = false;
            var renderColFooter = function (col)
            {
                var cls = col.cls ? ' blist-tf-' + col.cls : '';
                showAgg = showAgg || col.aggregate != undefined;
                // Convert string to float, then clip to desired number of digits;
                //  then convert back to float to strip extra zeros
                var val = col.aggregate ?
                    parseFloat(parseFloat(col.aggregate.value || 0)
                        .toFixed(col.decimalPlaces || 3)) :
                    '';
                html.push(
                    '<div class="blist-tf ',
                    !i ? 'blist-tf-first ' : '',
                    getColumnClass(col),
                    cls,
                    '" title="',
                    col.aggregate ? $.capitalize(col.aggregate.type) : '',
                    '" uid="',
                    col.uid,
                    '">',
                    '<span class="blist-tf-value">',
                    val,
                    '</span></div>');
            };
            for (var i = 0; i < columns.length; i++)
            {
                var col = columns[i];
                if (col.body)
                {
                    // This assumes that columns with children in the body
                    //  fit inside the width of this column, and override any
                    //  parent aggregate
                    html.push(
                        '<div class="blist-tf blist-opener ',
                        id,
                        '-opener"></div>');
                    $.each(col.body.children,
                        function(i, cc) {renderColFooter(cc);});
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
            $.each(lockedColumns, function (i, c)
            {
                lockedHtml += '<div class="blist-tf ' + (c.cls || '') +
                    ' ' + getColumnClass(c) + '">' + (c.footerText || '') +
                    '</div>';
            });
            $lockedFooter.html(lockedHtml);
        };


        /*** ROWS ***/

        var renderedRows = {}; // All rows that are rendered, by ID
        var dirtyRows = {}; // Rows that are rendered but need to re-render
        var rowIndices = {}; // Position of rendered rows (triggers re-rendering if a row moves)
        var rowLoadTimer = null;
        var rowLoadRows = null;

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
                        renderedRows[rowID] = {};
                    renderedRows[rowID].row = row;
                    if (dirtyRows[rowID]) {
                        insideDOM.replaceChild(row, dirtyRows[rowID].row);
                        delete dirtyRows[rowID];
                    } else
                        insideDOM.appendChild(row);
                }
            };

            // Call the append functions
            appendRows_render();
            appendRows_append();
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
                    if (!renderedRows[rowID])
                        renderedRows[rowID] = {};
                    renderedRows[rowID].locked = row;
                    if (dirtyRows[rowID])
                        $locked[0].replaceChild(row, dirtyRows[rowID].locked);
                    else
                        $locked[0].appendChild(row);
                }
            };

            // Call the append functions
            appendRows_render();
            appendRows_append();
        };


        /**
         * Render all rows that should be visible but are not yet rendered.  Removes invisible rows.
         */
        var renderRows = function() {
            if (!model)
                return;
            
            var top = $scrolls.scrollTop();

            // Compute the first row to render
            var first = Math.floor(top / rowOffset);

            // Compute the number of (possibly partially) visible rows
            var count = Math.ceil((top - first * rowOffset + $scrolls.height()) / rowOffset) + 1;
            
            // Count the scrolling page size
            pageSize = Math.floor((top - first * rowOffset + $scrolls.height()) / rowOffset) || 1;

            // Determine the range of rows we need to render, with safety checks to be sure we don't attempt the
            // impossible
            var start = first;
            var stop = start + count * 1.5;
            var rows = model.rows();
            if (start < 0)
                start = 0;
            if (rows) {
                if (stop > rows.length)
                    stop = rows.length;
            } else if (stop > 0)
                stop = 0;

            // Render the rows that are newly visible
            var unusedRows = $.extend({}, renderedRows);
            var html = [];
            var lockedHtml = [];
            var rowsToLoad = [];
            for (var i = start; i < stop; i++)
            {
                var row = rows[i];
                if (typeof row == 'object')
                {
                    // Loaded row -- render immediately
                    var rowID = row.id || row[0];
                    if (unusedRows[rowID] && rowIndices[rowID] == i)
                    {
                        // Keep the existing row
                        delete unusedRows[rowID];
                    }
                    else
                    {
                        // Add a new row
                        rowRenderFn(html, i, row);
                        if (rowLockedRenderFn != null)
                            rowLockedRenderFn(lockedHtml, i, row);
                        rowIndices[rowID] = i;
                    }
                }
                else
                {
                    // Unloaded row -- record for load request
                    rowsToLoad.push(row);
                }
            }

            // Destroy the rows that are no longer visible
            for (var unusedID in unusedRows)
            {
                row = unusedRows[unusedID].row;
                row.parentNode.removeChild(row);
                row = unusedRows[unusedID].locked;
                if (row)
                    row.parentNode.removeChild(row);
                delete renderedRows[unusedID];
            }

            // Now add new/moved rows
            // appendLockedRows must be called first; it should probably
            //  be consolidated with appendRows
            appendLockedRows(lockedHtml.join(''));
            appendRows(html.join(''));

            // Load rows that aren't currently present
            if (rowsToLoad.length) {
                if (rowLoadTimer)
                    clearTimeout(rowLoadTimer);
                rowLoadTimer = setTimeout(loadMissingRows, MISSING_ROW_LOAD_DELAY);
                rowLoadRows = rowsToLoad;
            }

            if (cellNav)
            {
                // Cell selection and navigation
                updateCellNavCues();
                expandActiveCell();
            }
            // Row selection
            updateSelection();
        };

        var updateSelection = function()
        {
            inside.find('.blist-select-row').removeClass('blist-select-row');
            $locked.find('.blist-select-row').removeClass('blist-select-row');
            $.each(model.selectedRows, function (k, v)
            {
                inside.find('#' + id + '-r' + k).addClass('blist-select-row');
                $locked.find('#' + id + '-l' + k).addClass('blist-select-row');
            });
        };

        var loadMissingRows = function() {
            if (!rowLoadTimer)
                return;
            rowLoadTimer = null;
            if (!rowLoadRows)
                return;
            model.loadRows(rowLoadRows);
            rowLoadRows = null;
        }

        /**
         * Initialize the row container for the current row set.
         */
        var initRows = function(model)
        {
            clearCellNav();

            if (handleDigits != calculateHandleDigits(model)) {
                // The handle changed.  Reinitialize columns.
                initMeta(model);
                renderHeader();
                renderFooter();
            }

            $locked.empty();
            inside.empty();
            renderedRows = {};

            updateLayout();
        };

        /**
         * Re-render a set of rows (if visible).
         */
        var updateRows = function(rows) {
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                var rowID = row.id || row[0];
                var rendered = renderedRows[rowID];
                if (rendered) {
                    delete renderedRows[rowID];
                    dirtyRows[rowID] = rendered;
                }
            }
            updateLayout();
        }


        /*** MODEL ***/

        // Monitor model events
        $this.bind('meta_change', function(event, model) {
            initMeta(model);
            renderHeader();
            renderFooter();
            initRows(model);
        });
        $this.bind('header_change', function(event, model)
        {
            updateHeader(model);
        });
        $this.bind('before_load', function() {
            $outside.addClass('blist-loading');
        });
        $this.bind('load', function(event, model) {
            initRows(model);
        });
        $this.bind('after_load', function() {
            $outside.removeClass('blist-loading');
        });
        $this.bind('row_change', function(event, rows) {
            updateRows(rows);
        });
        $this.bind('selection_change', function(event, rows) {
            updateSelection(rows);
        });
        $this.bind('row_add', updateLayout);
        $this.bind('row_remove', updateLayout);
        $this.bind('col_width_change', configureWidths);

        // Install the model
        $this.blistModel(options.model);


        /*** STARTUP ***/

        updateLayout();
    }

    var blistTableDefaults = {
        cellExpandEnabled: true,
        columnDrag: false,
        disableLastColumnResize: false,
        editEnabled: false,
        generateHeights: true,
        ghostMinWidth: 20,
        headerMods: function (col) {},
        manualResize: false,
        resizeHandleAdjust: 3,
        selectionEnabled: true,
        showGhostColumn: false,
        showName: true,
        showRowNumbers: true,
        showRowHandle: false,
        showTitle: true
    };

    $.fn.extend({
        /**
         * Make an element into a Blist Table.
         */
        blistTable: function(options) {
            // Create the table
            return this.each(function() {
                makeTable.apply(this,
                    [ $.extend({}, blistTableDefaults, options) ]);
            });
        }
    });
})(jQuery);
