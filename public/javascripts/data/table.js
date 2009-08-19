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
                .closest('.blist-th').removeClass('sorted');
            if (sortBy >= 0 && columns[sortBy].dom)
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
                    .closest('.blist-th').addClass('sorted');
            }
        };

        var configureFilterHeaders = function()
        {
            $('.filter.active', $header).removeClass('active')
                .closest('.blist-th').removeClass('filtered');
            var colFilters = model.meta().columnFilters;
            if (colFilters != null)
            {
                $.each(columns, function (i, c)
                {
                    if (colFilters[c.dataIndex] != null)
                    {
                        $('.filter', c.dom).addClass('active')
                            .closest('.blist-th').addClass('filtered');
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
        };

        var clearFilter = function(e)
        {
            e.preventDefault();
            $filterBox.val('').blur();
            $filterClear.hide();
            model.filter('');
        };

        // Obtain a model column associated with a column header DOM node
        var getColumnForHeader = function(e) {
            return model.column(e.getAttribute('uid'));
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
            //  extra the part after the tableId-c, which is the uid of
            //  the column that can be looked up
            var classIndex = cell.className.indexOf(id + '-c');
            if (classIndex == -1) {
                return null;
            }
            var endOfUID = cell.className.indexOf(' ', classIndex);
            if (endOfUID == -1) {
                endOfUID = cell.className.length;
            }
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


        /*** COLUMN SELECTION ***/

        var selectColumn = function(column, state)
        {
            if (!cellNav) {
                return;
            }

            cellNav.setColumnSelection(column, state);

            if (state)
            { model.unselectAllRows(); }

            // TODO -- support column selection on nested tables?

            updateColumnSelection();
            updateCellNavCues();
        };

        var updateColumnSelection = function()
        {
            if (!cellNav) { return; }
            for (var i = 0; i < columns.length; i++)
            {
                var mcol = columns[i];
                var col = $header.find('.' + id + '-c' + mcol.index);
                var colClass = getColumnClass(mcol);
                if (cellNav.isColumnSelected(mcol))
                {
                    if (!col.is('.blist-select-col'))
                    {
                        var colLeft = col.addClass('blist-select-col')
                            .offset().left;
                        inside.append('<div class="col-select-holder ' +
                            colClass + '"/>')
                            .find('.col-select-holder.' + colClass)
                            .css('left', colLeft - $header.offset().left +
                                lockedWidth);
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
                row.index = rowIndices[id]; // Logical row position -- required by the selection processor
                rows.push(row);
            }
            return rows.sort(function(a, b) { return a.index - b.index; });
        };

        var clearRowSelection = function(row) {
            for (var cell = row.row.firstChild; cell; cell = cell.nextSibling) {
                if (cell._sel) {
                    $(cell).removeClass('blist-cell-selected');
                    cell._sel = false;
                }
            }
            delete row.selected;
        };

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
        };

        var updateCellNavCues = function()
        {
            if (!cellNav) { return; }

            // Update the active cell
            if (cellNav.isActive())
            {
                var row = model.get(cellNav.getActiveY());
                if (row)
                {
                    var physActive = renderedRows[row.id];
                    if (physActive)
                    {
                        var $newActive = $(physActive.row).children()
                            .slice(cellNav.getActiveX(),
                                    cellNav.getActiveXEnd());
                    }
                }
                else
                {
                    clearCellNav();
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
        };

        var $activeContainer;

        var hideActiveCell = function()
        {
            if ($activeContainer)
            {
                $activeContainer.css('top', -10000);
                $activeContainer.css('left', -10000);
            }
        }

        var expandActiveCell = function()
        {
            if (isEdit || !cellNav.isActive())
            {
                hideActiveCell();
                return;
            }

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

            var row = model.get(cellNav.getActiveY());
            if (row.expanded) { $activeContainer.addClass('blist-tr-open'); }
            else { $activeContainer.removeClass('blist-tr-open'); }
            if (!$activeCells)
            {
                // Display a placeholder at the appropriate location
                $activeContainer.empty();

                $activeContainer.height(rowOffset -
                    ($activeContainer.outerHeight() - $activeContainer.height()));
                var width = 0;
                for (var j = cellNav.getActiveX(), stop = cellNav.getActiveXEnd(); j < stop; j++)
                {
                    width += getColumnWidthPx(layout[0][j]);
                }
                $activeContainer.width(width -
                    ($activeContainer.outerWidth() - $activeContainer.width()));

                var rowIndex = cellNav.getActiveY();
                $activeContainer.css('top', rowIndex * rowOffset);
                var left = lockedWidth;
                for (var i = 0; i < cellNav.getActiveX(); i++)
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
            if (levelID < 0)
            {
                clearCellNav();
                return false;
            }

            // Check if we clicked in a locked section or on a nested table
            // header; ignore those for now
            // Also ignore clicking in the expander -- that means they clicked
            // on the scrollbar
            var $target = $(event.target);
            if ($target.closest('.blist-table-locked').length > 0 ||
                (!selecting && $target.closest('.blist-tdh') > 0) ||
                $target.is('.blist-table-expander'))
            {
                return false;
            }

            // Find the index of the cell in the layout level
            var rowLayout = layout[levelID];
            for (var x = 0, node = cell.parentNode.firstChild; node;
                node = node.nextSibling)
            {
                var lcol = rowLayout[x];
                if (!lcol) {
                    break;
                }
                if (node == cell) {
                    break;
                }
                if (lcol.skippable && $(node).hasClass('blist-skip')) {
                    // Children aren't rendered, so skip them
                    x += lcol.skipCount;
                }
                x++;
            }

            // If we found the column, focus now
            if (lcol)
            {
                model.unselectAllRows();
                if ($target.is('a') && !selecting)
                {
                    // Special case for anchor clicks -- do not select the cell
                    // immediately but do enter "possible drag" mode
                    clearCellNav();
                    return true;
                }

                // Standard cell -- activate the cell
                return cellNavToXY({ x: x, y: model.index(row) },
                    event, selecting);
            }

            // Not a valid navigation target; ignore
            clearCellNav();
            return false;
        };

        /**
         * Navigate to a particular location (column UID, row ID pair).
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

            // Scroll the active cell into view if it isn't visible vertically
            var scrollTop = $scrolls[0].scrollTop;
            var scrollHeight = $scrolls.height();
            if ($scrolls[0].scrollWidth > $scrolls[0].clientWidth) {
                scrollHeight -= scrollbarWidth;
            }
            if ($footerScrolls.is(':visible')) {
                scrollHeight -= $footerScrolls.outerHeight() - 1;
            }
            var scrollBottom = scrollTop + scrollHeight;
            var top = xy.y * rowOffset;
            var bottom = top + rowOffset;
            var origScrollTop = scrollTop;

            if (scrollBottom < bottom) {
                scrollTop = bottom - scrollHeight;
            }
            if (scrollTop > top) {
                scrollTop = top;
            }
            if (scrollTop != origScrollTop) {
                $scrolls.scrollTop(scrollTop);
            }

            // Scroll the active cell into view if it isn't visible horizontally
            // Set up scroll variables to use
            var scrollLeft = $scrolls.scrollLeft();
            var scrollWidth = $scrolls.width();
            if ($scrolls[0].scrollHeight > $scrolls[0].clientHeight) {
                scrollWidth -= scrollbarWidth;
            }
            var scrollRight = scrollLeft + scrollWidth;

            var layoutLevel = layout[model.get(xy.y).level || 0];
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

            // Reset standard grid state
            $navigator[0].focus();
            killHotExpander();
            updateCellNavCues();

            return true;
        };


        /*** CELL EDITING ***/
        var $editContainer;
        var isEdit = false;
        var prevEdit = false;

        var editCell = function(cell)
        {
            // Don't start another edit yet; and make sure they can edit
            if (isEdit || !model.canWrite()) { return; }

            var row = getRow(cell);
            var col = getColumn(cell);
            if (!col || !row) { return; }
            var value = model.getRowValue(row, col);

            // Obtain an expanding node in utility (off-screen) mode
            $editContainer = $('<div class="blist-table-edit-container ' +
                    'blist-table-util"></div>');
            var blistEditor = $editContainer.blistEditor(
                {row: row, column: col, value: value});
            if (!blistEditor) { return; }

            $editContainer.bind('edit_end', handleEditEnd);
            inside.append($editContainer);

            var $editor = blistEditor.$editor();

            blistEditor.adjustSize();
            $editor.width('auto').height('auto');
            $editContainer.width('auto').height('auto');

            isEdit = true;

            hideActiveCell();

            sizeCellOverlay($editContainer, $editor, $(cell));
            positionCellOverlay($editContainer, $(cell));
            $editContainer.removeClass('blist-table-util').addClass('shown');

            blistEditor.focus();
        };

        var endEdit = function(isSave)
        {
            prevEdit = isSave;
            isEdit = false;
            $navigator[0].focus();

            if (!$editContainer) { return; }

            var editor = $editContainer.blistEditor();
            editor.finishEdit();

            var origValue = editor.originalValue;
            var value = editor.currentValue();
            var row = editor.row;
            var col = editor.column;
            if (isSave && (origValue != value || model.isCellError(row, col)))
            {
                model.saveRowValue(value, row, col);
            }

            $editContainer.remove();
            $editContainer = null;
        };

        var handleEditEnd = function(event, isSave)
        {
            endEdit(isSave);
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
            var rc = sizeCellOverlay($hotExpander, $wrap, $hotCell, true);
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
            // align top-left with the cell but do our best to ensure the
            // expansion remains within the viewport
            var left = $refCell.offset().left - inside.offset().left;
            var top = $refCell.offset().top - inside.offset().top;
            var origOffset = { top: top, left: left };

            // Ensure viewport is in the window horizontally
            var contWidth = curSize ? curSize.width : $container.outerWidth();
            var viewportWidth = $scrolls.width();
            if ($scrolls[0].scrollHeight > $scrolls[0].clientHeight) {
                viewportWidth -= scrollbarWidth;
            }
            var scrollLeft = $scrolls.scrollLeft();
            if (left + contWidth > scrollLeft + viewportWidth) {
                left = scrollLeft + viewportWidth - contWidth;
            }
            if (left < scrollLeft) {
                left = scrollLeft;
            }

            // Ensure viewport is in the window vertically
            var contHeight = curSize ? curSize.height : $container.outerHeight();
            var viewportHeight = $scrolls.height();
            if ($scrolls[0].scrollWidth > $scrolls[0].clientWidth) {
                viewportHeight -= scrollbarWidth;
            }
            var scrollTop = $scrolls.scrollTop();
            if (top + contHeight > scrollTop + viewportHeight) {
                top = scrollTop + viewportHeight - contHeight;
            }
            if (top < scrollTop - 1) {
                top = scrollTop - 1;
            }

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
            var maxWidth = $scrolls.width();
            if ($scrolls[0].scrollHeight > $scrolls[0].clientHeight)
            { maxWidth -= scrollbarWidth; }
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
            var countedScroll = false;
            var numCells = $expandCells.length;
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
                ($editContainer &&
                    ($cell[0] == $editContainer[0] ||
                    $cell.parent()[0] == $editContainer[0]))))
            { return $activeCells[0]; }

            // Nested table header send focus to the opener
            if ($cell.hasClass('blist-tdh'))
            {
                while (!$cell.hasClass('blist-opener'))
                { $cell = $(cell = cell.previousSibling); }
                return cell;
            }

            // If the mouse strays over the hot expander return the hot cell
            if (cell == hotExpander || cell.parentNode == hotExpander)
            { return hotCell; }

            // Normal cell
            return cell;
        };

        var handleHeaderHover = function(event)
        {
            if (hotHeaderMode == 4 && hotHeaderDrag) { return false; }

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
                        foundRealHeader = header.is('.blist-th');
                        return false;
                    }

                    if (x >= left && x < right)
                    {
                        hh = header[0];
                        var $dragHandle = header.find('.dragHandle');
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
                        foundRealHeader = header.is('.blist-th');
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
                    {
                        $outside.css('cursor', 'col-resize');
                    }
                    else
                    {
                        $outside.css('cursor', 'default');
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
            updateColumnSelection();
        };

        var unHotRow = function(rowID)
        {
            inside.find('#' + id + '-r' + rowID)
                .removeClass('blist-hot-row');
            $locked.find('#' + id + '-l' + rowID)
                .removeClass('blist-hot-row');
        };

        var isSelectingFrom = function(cell) {
            if (!cellNav.length || !cell || !cell.parentNode) {
                return false;
            }
            var row = getRow(cell);
            var sel = cellNav[cellNav.length - 1];
            return cell.parentNode.childNodes[sel[0]] == cell && sel[1] == model.index(row);
        };

        var getHeaderUnderMouse = function(pageX)
        {
            var $headers = $('.blist-th:not' +
                '(.ui-draggable-dragging, .blist-table-ghost)', $header);
            if (pageX < $headers.eq(0).offset().left) { return null; }
            var $lastHeader = $headers.eq($headers.length - 1);
            if (pageX > $lastHeader.offset().left + $lastHeader.outerWidth())
            { return null; }

            var $curHeader;
            $headers.each(function(i)
            {
                var $col = $(this);
                var left = $col.offset().left;
                if (pageX < left) { return true; }

                var width = $col.outerWidth();
                var right = left + width;
                if (pageX > right) { return true; }

                $curHeader = $col;
                return false;
            });
            return $curHeader;
        };

        var $curHeaderSelect;
        var origColSelects = null;
        var curColSelects = {};
        var onMouseMove = function(event)
        {
            if (hotHeaderDrag)
            {
                if (hotHeaderMode == 2) {
                    handleColumnResize(event);
                    return;
                }
                else if (hotHeaderMode == 4) { return; }
                else if (hotHeaderMode == 1 && cellNav ||
                    hotHeaderMode == 5)
                {
                    if (!origColSelects)
                    {
                        origColSelects = cellNav.getSelectedColumns();
                    }

                    var $curHeader = getHeaderUnderMouse(event.pageX);
                    if ($curHeader && $curHeader.index($curHeaderSelect) < 0)
                    {
                        var curCol = $curHeader.data('column');
                        if ($curHeaderSelect && curColSelects[curCol.id])
                        {
                            var prevCol = $curHeaderSelect.data('column');
                            delete curColSelects[prevCol.id];
                            if (!origColSelects[prevCol.id])
                            {
                                selectColumn(prevCol, false);
                            }
                        }
                        else
                        {
                            curColSelects[curCol.id] = true;
                            if (!origColSelects[curCol.id])
                            {
                                selectColumn(curCol, true);
                            }
                        }
                        $curHeaderSelect = $curHeader;
                        hotHeaderMode = 5;
                    }
                }
            }

            // Handle mouse down movement
            if (mouseDownAt) {
                if (clickTarget && Math.abs(event.clientX - mouseDownAt.x) > 3 || Math.abs(event.clientY - mouseDownAt.y > 3)) {
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
                    if (!isSelectingFrom(selectFrom))
                    {
                        cellNav.deactivate();
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
                {
                    onCellOut(event);
                }
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
            var newHotID = $nhr.length > 0 && !$nhr.is('.blist-tr-sub') ?
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
                if (!row) { return; }

                var skipSelect = false;
                // If this is a row opener, invoke expand on the model
                if ($(cell).hasClass('blist-opener') &&
                    !$(cell).hasClass('blist-opener-inactive'))
                {
                    model.expand(row);
                    clearCellNav();
                    skipSelect = true;
                }

                // Retrieve the column
                var column = getColumn(cell);

                // Notify listeners
                var cellEvent = $.Event('cellclick');
                $this.trigger(cellEvent, [ row, column, origEvent ]);
                if (!skipSelect && (!cellNav || !cellNav.isActive()) &&
                    options.selectionEnabled &&
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
            // On any click, lose keyboard nav between edit cells
            prevEdit = false;

            clickTarget = event.target;
            clickCell = findCell(event);
            var $clickTarget = $(clickTarget);
            // IE & WebKit only detetct mousedown on scrollbars, not mouseup;
            // so we need to ignore clicks on the scrollbar to avoid having a
            // false drag event
            // If they clicked on the scrollbar, ignore
            if ($clickTarget.is('.blist-table-scrolls, .blist-table-expander'))
            { return; }

            if (isEdit &&
                $clickTarget.parents().andSelf().index($editContainer) >= 0)
            { return; }


            mouseDownAt = { x: event.clientX, y: event.clientY };

            if (hotHeader && hotHeaderMode != 3)
            {
                if ($clickTarget.closest('.action-item').length < 1)
                {
                    clickTarget = null;
                    clickCell = null;
                    hotHeaderDrag = true;
                    event.stopPropagation();
                    event.preventDefault();
                }
                return false;
            }

            selectFrom = null;


            if (cellNav)
            {
                var cell = findCell(event);
                // If this is a row opener or header, we don't allow normal
                // cell nav clicks on them; so skip the rest
                if ($(cell).is('.blist-opener, .blist-tdh'))
                {
                    return true;
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
                    if (isEdit) { endEdit(true); prevEdit = false; }
                    selectFrom = cell;
                }

            }
        };

        var onMouseUp = function(event)
        {
            mouseDownAt = null;

            if (isEdit) { return; }

            if (hotHeaderDrag) {
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

            var cell = findCell(event);
            var editMode = false;
            if (cellNav && options.editEnabled && cell == clickCell)
            {
                var curActiveCell = $activeCells ? $activeCells[0] : null;
                if (curActiveCell && $prevActiveCells &&
                        $prevActiveCells.index(curActiveCell) >= 0)
                {
                    // They clicked on a selected cell, go to edit mode
                    editCell(curActiveCell);
                    editMode = true;
                }
                else if (curActiveCell)
                {
                    $prevActiveCells = $activeCells;
                }
            }

            if (clickTarget && clickTarget == event.target &&
                !$(clickTarget).is('a'))
            {
                $(clickTarget).trigger('table_click', event);
                if (!editMode) { $navigator[0].focus(); }
            }

            if (cellNav && !editMode) { expandActiveCell(); }
        };

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
                if (isEdit) { endEdit(false); }
                else { clearCellNav(); }
            }
        };

        /*** KEYBOARD HANDLING ***/

        // Move the active cell an arbitrary number of columns
        var navigateX = function(deltaX, event, wrap)
        {
            var to = cellNav.navigateX(deltaX, event, wrap);
            if (to) {
                cellNavToXY(to, event, false, wrap);
            }
        };

        // Move the active cell an arbitrary number of rows.  Supports an value
        // for deltaY, including negative offsets
        var navigateY = function(deltaY, event, wrap)
        {
            var to = cellNav.navigateY(deltaY, event, wrap);
            if (to) {
                cellNavToXY(to, event, false, wrap);
            }
        };

        // Page size is configured in renderRows()
        var pageSize = 1;

        var onCopy = function(event) {
            if (cellNav) {
                $navigator.text(cellNav.getSelectionDoc());
                $navigator[0].select();
            }
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
                        direction = event.shiftKey ? -1 : 1;
                        event.shiftKey = false;
                        navigateY(direction, event, true);
                    }
                    break;

                default:
                    return true;
            }
            var curActiveCell = $activeCells ? $activeCells[0] : null;
            if (prevEdit && curActiveCell)
            {
                setTimeout(function() { editCell(curActiveCell); }, 0);
            }
            else
            {
                setTimeout(expandActiveCell, 0);
            }

            return false;
        };

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
            '<textarea class="blist-table-navigator"></textarea>' +
            '<div class="blist-table-locked-scrolls">' +
            '   <div class="blist-table-locked-header">&nbsp;</div>' +
            '   <div class="blist-table-locked">&nbsp;</div>' +
            '   <div class="blist-table-locked-footer">&nbsp;</div>' +
            '</div>' +
            '<div class="blist-table-top">';
        if (options.showTitle)
        {
            headerStr +=
                '<div class="blist-table-title-tl">' +
                ' <div class="blist-table-title-tr">' +
                '   <div class="blist-table-title">' +
                '     <div class="blist-table-filter-l">' +
                '       <div class="blist-table-filter-r">' +
                '         <input class="blist-table-filter"/>' +
                '         <a class="blist-table-clear-filter" title="Clear Search" href="#clear_filter">Clear Search</a>' +
                '     </div></div>';
            if (options.showName)
            {
                headerStr += '<div class="blist-table-name">&nbsp;</div>';
            }
            headerStr += '</div></div></div>';
        }
        headerStr +=
            '  <div class="blist-table-header-scrolls">' +
            '    <div class="blist-table-header">&nbsp;</div>' +
            '</div></div>' +
            '<div class="blist-table-scrolls">' +
            '  <div class="blist-table-inside">&nbsp;</div></div>' +
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
            .find('.blist-table-header');

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
            .keypress(onKeyPress)
            .bind('copy', onCopy);

        // Set up initial top of locked section
        $locked.css('top', $header.outerHeight());

        // Initialize cell navigation now that the navigator is rendered
        cellNav = options.cellNav ?
            new blist.data.TableNavigation(model, [], $navigator) : null;



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
            if ($footerScrolls.is(':visible')) {
                insideHeight += $footerScrolls.outerHeight() - 1;
            }
            if (insideHeight < scrollsHeight) {
                insideHeight = scrollsHeight;
            }
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
                if ((css.ownerNode || css.owningElement) == rulesNode) {
                    break;
                }
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
            if (prefix) {
                colParts.push(prefix);
            }

            // Utility function that writes a push for all column parts
            var completeStatement = function() {
                if (colParts.length) {
                    generatedCode += 'html.push(' + colParts.join(',') + ');';
                    colParts = [];
                }
            };

            for (var j = 0; j < mcols.length; j++)
            {
                var mcol = mcols[j];

                if (mcol.body) {
                    // Nested table header -- render headers for child columns
                    completeStatement();

                    generatedCode +=
                        "if (row" + mcol.dataLookupExpr +
                        " && row" + mcol.dataLookupExpr + ".length || " +
                        model.useBlankRows() + ")";
                    colParts.push(
                        "\"<div class='blist-td blist-tdh blist-opener " +
                        openerClass + "'></div>\"");
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
                            ' ' + child.type +
                            "' uid='" +
                            child.uid +
                            "'>" +
                            "<div class='blist-th-icon'></div>" +
                            "<span class='blist-th-name'>" +
                            htmlEscape(child.name) +
                            "</span></div>\""
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
                            createColumnRendering(children, lcols, contextVariables, "'<div class=\"blist-td blist-opener-space " + openerClass + "\"></div>'") +
                        "else ";
                        colParts.push("'<div class=\"blist-td blist-opener-space blist-tdfill " + openerClass + "\"></div>'");
                        for (var i = 0; i < children.length; i++) {
                            colParts.push("\"<div class='blist-td blist-tdfill blist-td-colfill " +
                                getColumnClass(children[i]) +
                                "'></div>\"");
                        }
                    completeStatement();
                } else if (mcol.type && mcol.type == 'fill') {
                    // Fill column -- covers background for a range of columns that aren't present in this row
                    colParts.push("\"<div class='blist-td blist-tdfill " + getColumnClass(mcol) + (j == 0 ? ' initial-tdfill' : '') + "'>&nbsp;</div>\"");
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
                    var align = mcol.alignment ? ' align-' + mcol.alignment : '';

                    renderer = renderer("row" + mcol.dataLookupExpr, false, mcol,
                        contextVariables);

                    colParts.push(
                        "\"<div class='blist-td " + getColumnClass(mcol) + cls +
                            align + "\"" +
                            " + (row.saving && row.saving" +
                            mcol.dataLookupExpr + " ? \" saving\" : \"\") + " +
                            "(row.error && row.error" +
                            mcol.dataLookupExpr + " ? \" error\" : \"\") + " +
                            "\"'>\", " +
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
        };

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
                    renderer: '(row.type == "blank" ? "new" : index + 1)',
                    footerText: 'Totals'});
            }
            if (options.showRowHandle)
            {
                lockedColumns.push(rowHandleColumn = {uid: 'rowHandleCol',
                    dataIndex: 'rowHandle',
                    cls: 'blist-table-row-handle',
                    width: options.rowHandleWidth,
                    renderer: options.rowHandleRenderer});
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
            if (options.generateHeights) {
                openerStyle.height = rowHeight + 'px';
            }

            // These variables are available to the rendering function
            var contextVariables = {
                renderSpecial: function(specialRow) {
                    return "<div class='blist-td blist-td-header'>" +
                        specialRow.title + "</div>";
                },
                permissions: {
                    canRead: model.canRead(),
                    canWrite: model.canWrite(),
                    canAdd: model.canAdd(),
                    canDelete: model.canDelete()
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

            var rowDivContents =
                'class=\'blist-tr", ' +
                '(index % 2 ? " blist-tr-even" : ""), ' +
                '(row.level !== undefined ? " blist-tr-level" + row.level : ""), ' +
                '(row.level > 0 ? " blist-tr-sub" : ""), ' +
                '(row.type ? " blist-tr-" + row.type : ""), ' +
                '(row.expanded ? " blist-tr-open" : ""), ' +
                '(row.groupLast ? " last" : ""), ' +
                '"\' style=\'top: ", ' +
                '(index * ' + rowOffset + '), "px\'';

            // Create the rendering function.  We precompile this for speed so
            // we can avoid tight loops, function calls, etc.
            var renderFnSource =
                '(function(html, index, row) {' +
                '   html.push(' +
                '       "<div id=\'' + id + '-r", ' +
                '       (row.id || row[0]), ' +
                '       "\' ' + rowDivContents + '>"' +
                '       );' +
                '   switch (row.level || 0) {' +
                '     case -1:' +
                '       if (row.type == "group")' +
                '       { html.push(renderSpecial(row)); }' +
                '       break;';
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
            renderLockedFnSource += 'html.push(' +
                '"<div id=\'' + id + '-l", '+
                '(row.id || row[0]), ' +
                '"\' ' + rowDivContents + '>");';

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

            sortBy = -1;
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
        };

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
        };

        var configureLevelWidths = function(mcols, level)
        {
            var hpos = lockedWidth;
            if (level == 0 && options.showGhostColumn) {
                hpos += paddingX;
            }

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
        };

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
        };

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
                    '">');
                if (col.type == 'nested_table')
                {
                    html.push('<div class="blist-tdh blist-opener ',
                        openerClass,
                        '"></div>');
                }
                html.push('<div class="th-inner-container">');
                if (options.columnDrag)
                {
                    html.push(
                            '<div class="dragHandle"',
                            options.generateHeights ? ' style="height: ' +
                            rowOffset + 'px"' : '',
                            '></div>');
                }
                html.push(
                    '<div class="info-container">',
                    '<span class="blist-th-icon"></span>',
                    '<div class="name-wrapper"><span class="blist-th-name">',
                    colName,
                    '</span></div>',
                    '</div>',
                    '<div class="filter action-item" title="Remove filter"',
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
                    .bind('click', function(event)
                    {
                        if (skipHeaderClick)
                        {
                            skipHeaderClick = false;
                            return;
                        }

                        var $target = $(event.target);
                        var col = $target.closest('.blist-th').data('column');
                        if (cellNav &&
                            $target.closest('.blist-th-icon').length > 0)
                        {
                            selectColumn(col, !cellNav.isColumnSelected(col));
                            return;
                        }

                        $(this).removeClass('hover');
                        if ($target.closest('.filter').length > 0)
                        {
                            model.clearColumnFilter(col.index);
                            return;
                        }

                        if ((blist.data.types[col.type] != undefined &&
                                blist.data.types[col.type].sortable) ||
                            col.sortable)
                        {
                            sort(col.index);
                        }
                    })
                    .hover(function ()
                        { if (!hotHeaderDrag || hotHeaderMode != 4)
                            { $(this).addClass('hover'); } },
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
                    ' ' + getColumnClass(c) +
                    '"><div class="blist-th-icon"></div></div>';
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
            sortBy = -1;
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
                    ' ' + getColumnClass(c) + '"><span class="blist-tf-value">' +
                    (c.footerText || '') + '</span></div>';
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
         * Render all rows that should be visible but are not yet rendered.
         * Removes invisible rows.
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

            // Determine the range of rows we need to render, with safety
            // checks to be sure we don't attempt the impossible
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
            updateRowSelection();
        };

        var updateRowSelection = function()
        {
            inside.find('.blist-select-row').removeClass('blist-select-row');
            $locked.find('.blist-select-row').removeClass('blist-select-row');
            $.each(model.selectedRows, function (k, v)
            {
                inside.find('#' + id + '-r' + k).addClass('blist-select-row');
                $locked.find('#' + id + '-l' + k).addClass('blist-select-row');
            });
            updateCellNavCues();
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
        var updateRows = function(rows)
        {
            for (var i = 0; i < rows.length; i++)
            {
                var row = rows[i];
                var rowID = row.id || row[0];
                var rendered = renderedRows[rowID];
                if (rendered)
                {
                    delete renderedRows[rowID];
                    dirtyRows[rowID] = rendered;
                }
            }
            updateLayout();
        };


        /*** MODEL ***/

        // Monitor model events
        $this.bind('meta_change', function(event, model) {
            initMeta(model);
            renderHeader();
            renderFooter();
            initRows(model);
        });
        $this.bind('footer_change', function(event)
        { renderFooter(); });
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
            updateRowSelection(rows);
        });
        $this.bind('row_add', updateLayout);
        $this.bind('row_remove', updateLayout);
        $this.bind('col_width_change', configureWidths);

        // Install the model
        $this.blistModel(options.model);


        /*** STARTUP ***/

        updateLayout();

        var table = this;
        var blistTableObj = function()
        {
            this.getSelectedColumns = function()
            {
                return cellNav ? cellNav.getSelectedColumns() : {};
            };
        };

        $this.data('blistTableObj', new blistTableObj());
    }

    var blistTableDefaults = {
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
        rowHandleRenderer: '""',
        rowHandleWidth: 1,
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
                if (!$(this).is('.blist-table'))
                    makeTable.apply(this, [ $.extend({}, blistTableDefaults, options) ]);
            });
        },

        blistTableAccessor: function()
        {
            return this.data('blistTableObj');
        }
    });
})(jQuery);
