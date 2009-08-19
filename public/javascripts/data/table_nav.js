blist.namespace.fetch('blist.data');

/**
 * This class encapsulates table navigation and cell selection logic.  It deals navigation through the virtual, not
 * physical, row and column space.
 * 
 * You should consider this part of the private implementation of the table.  If you do not enable cell navigation you
 * do not need to include this file (theoretically -- this has not been fully debugged yet).
 *
 * @param model the table data model
 * @param layout physical row layout information for each row in the table (provided by the table)
 */
blist.data.TableNavigation = function(_model, _layout, _$textarea) {
    var model = _model;
    this.updateModel = function(_newModel) { model = _newModel; }
    var layout = _layout;
    this.updateLayout = function(_newLayout) { layout = _newLayout; }
    var $textarea = _$textarea;

    // Active cell information
    var activeCellOn = false;
    var activeCellXStart;  // Index of the first physical column that is active
    var activeCellXCount;  // Number of X cells to select
    var activeCellY;       // Row index in the active set

    // Cell selection information.  The cell selection consists of one or more rectangular areas each including
    // one or more cells.  The selections are stored in an array with the following values:
    //   x1, the first selected column index
    //   y1, the first selected row index
    //   x2, the last selected column index (inclusive)
    //   y2, the last selected row index (inclusive)
    var selectionLevel = -1;
    var selectionBoxes = [];

    // Column selection.  Contains "true" for each selected column ID
    var selectedColumns = {};

    // Is there a selection?
    var hasSelection = function() {
        if (selectionBoxes.length) {
            return true;
        }
        for (var col in selectedColumns) {
            return true;
        }
        if (model.selectedRows && model.selectedRows.length)
            return true;
        return false;
    };

    // Convert selection into a sorted array of arrays for quickly identifying selected cells
    var convertCellSelection = function() {
        var converted = [];

        for (var i = 0; i < selectionBoxes.length; i++) {
            var sel = selectionBoxes[i];
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
            if (diff) {
                return diff;
            }
            // Or by last row
            return a[3] - b[3];
        });
        return converted;
    };

    var createSelectionMap = function(selectionComponents, selectionComponentCount, template) {
        var selectionMap = template.slice(0, template.length);

        // Mark all selected positions in the selection map
        for (var selectionComponentID = 0; selectionComponentID < selectionComponentCount; selectionComponentID++) {
            var selectionComponent = selectionComponents[selectionComponentID];
            for (var columnID = selectionComponent[0]; columnID <= selectionComponent[2]; columnID++) {
                selectionMap[columnID] = true;
            }

            // For the last position, mark any following positions that are associated with the same logical column
            var layoutLevel = layout[selectionLevel];
            columnID = selectionComponent[2];
            var uid = layoutLevel[columnID].logical;
            for (columnID++; columnID < layoutLevel.length && layoutLevel[columnID].logical == uid; columnID++) {
                selectionMap[columnID] = true;
            }
        }

        return selectionMap;
    };

    this.goTo = function(x, y, event, selecting, wrap)
    {
        // Decide what affect this navigation has on the selection
        var selectionMode;
        if (selecting || event.shiftKey)
        {
            // Shift key -- selection continuation (continues the last
            // selection box or starts a new box)
            if (selectionBoxes.length) {
                selectionMode = 'continue';
            } else {
                selectionMode = 'start';
            }
        }
        else if (event.metaKey)
        {
            // Control or command key -- starts a new box
            selectionMode = 'start-new';
        }
        else if (hasSelection())
        {
            // No modifier keys -- remove the selection
            selectionBoxes = [];
            selectedColumns = {};
        }

        var row = model.get(y);
        var rowLevel = row.level || 0;

        // Selection must occur in the same level -- otherwise, ignore
        if (hasSelection() && selectionLevel != rowLevel)
        { return false; }

        var layoutLevel = layout[rowLevel];
        var xNum = 1;
        var col = layoutLevel[x];
        var uid = col.logical;

        // If we are wrapping into a non-expanded header, expand it
        // if it has children
        if (wrap && !row.expanded &&
                (col.type == 'opener' || col.type == 'header'))
        {
            var subT = model.getRowValue(row, col.mcol);
            if (model.useBlankRows() ||
                subT && subT.length > 0) { model.expand(row); }
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
            y = model.index(row.childRows[0]);
            row = model.get(y);
            layoutLevel = layout[rowLevel];
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
            if (!selectionBoxes.length) {
                selectionLevel = model.get(y).level || 0;
            }
            var startX = selectionMode == 'start' && activeCellOn ?
                activeCellXStart : x;
            var startY = selectionMode == 'start' &&
                activeCellOn ? activeCellY : y;
            selectionBoxes.push(selection = [ startX, startY ]);
        }
        else if (selectionMode == 'continue')
        {
            // Add to final selection box
            selection = selectionBoxes[selectionBoxes.length - 1];
        }

        // Update the selection box, if any
        if (selection)
        {
            selection[2] = x < selection[0] ?
                x : x + xNum - 1;
            selection[3] = y;
        }

        // Update the active cell
        activeCellOn = true;
        activeCellXStart = x;
        activeCellXCount = xNum;
        activeCellY = y;

        // Enable copy & paste
        /*
        var doc;
        try {
            doc = this.getSelectionDoc();
        } catch (e) {
            // Ignore errors generating the selection and clear
            doc = '';
        }
        $textarea.text(doc);
        $textarea[0].select();
        */

        return true;
    };

    /**
     * Walk the selection for a sequence of rows.
     */
    this.processSelection = function(rows, setRowSelectionFn, clearRowSelectionFn)
    {
        // Convert the selection into canonical and sorted form to optimize
        // processing
        var selection = convertCellSelection();

        // This "selmap" is an array of booleans indicating whether each column
        // in a row is selected.  This is computed from the set of selections
        // and cached between rows unless the set of selections that applies
        // change.
        var selmap;
        var selmapSelectionCount;

        // The selection map template is a selection map that only includes
        // column selection information
        var selmapTemplate = [];
        var hasColumnSelection;
        if (selectionLevel == 0) {
            var layoutLevel = layout[selectionLevel];
            for (var i = 0; i < layoutLevel.length; i++) {
                var selected = selmapTemplate[i] =
                    selectedColumns[layoutLevel[i].mcol.id];
                if (selected) {
                    hasColumnSelection = true;
                }
            }
        }

        var len = rows.length;
        for (i = 0; i < len; i++) {
            var row = rows[i];
            
            // Determine the index into the rows set and the actual model row
            var index = row.index;
            var modelRow;
            if (index === undefined) {
                index = i;
                modelRow = row;
            } else
                modelRow = model.get(index);

            // Skip the blank row
            if (modelRow.id == "blank")
                continue;

            // Update the selection map, and clear the selection if there's no selection in the row
            if (model.selectedRows[modelRow.id] !== undefined)
            {
                selmap = [];
                $.each(layout[modelRow.level || 0], function(i, c)
                    { selmap[i] = true; });
            }
            else
            {
                // Clear the selection if the row isn't in the selection level
                if (!modelRow || (modelRow.level || 0) != selectionLevel)
                {
                    clearRowSelectionFn(row);
                    continue;
                }

                // Drop selection boxes that appear before this row
                while (selection.length && selection[0][3] < index) {
                    selection.shift();
                    selmap = undefined;
                }

                // Count the number of selection boxes that apply to this row
                for (var selCount = 0; selCount < selection.length; selCount++) {
                    if (selection[selCount][1] > index) {
                        break;
                    }
                }

                // Update the row
                if (selCount == 0 && !hasColumnSelection) {
                    clearRowSelectionFn(row);
                    continue;
                }

                // Build the selection map if a cached version isn't available
                if (!selmap || selmapSelectionCount != selCount) {
                    selmapSelectionCount = selCount;
                    selmap = createSelectionMap(selection, selCount,
                        selmapTemplate);
                }
            }

            // Update the selection
            setRowSelectionFn(row, selmap);
        }
    };

    /**
     * Is there currently an active cell?
     */
    this.isActive = function() {
        return activeCellOn;
    };

    /**
     * Obtain the leftmost active X coordinate.
     *
     * @return the physical column index
     */
    this.getActiveX = function() {
        return activeCellXStart;
    };

    /**
     * Obtain the rightmost active columns.
     */
    this.getActiveXEnd = function() {
        return activeCellXStart + activeCellXCount;
    };

    /**
     * Obtain the number of active columns.
     */
    this.getActiveWidth = function() {
        return activeCellXCount;
    };

    /**
     * Obtain the active Y coordinate.
     *
     * @return the model row ID
     */
    this.getActiveY = function() {
        return activeCellY;
    };

    /**
     * Deactivate the active cell.
     */
    this.deactivate = function() {
        activeCellOn = false;
    };

    /**
     * Clear all navigation information.
     *
     * @return true iff navigation information changed as a result of this call
     */
    this.clearAll = function()
    {
        var needRefresh = false;

        if (activeCellOn)
        {
            activeCellOn = false;
            needRefresh = true;
        }

        if (hasSelection())
        {
            selectionBoxes = [];
            selectedColumns = {};
            needRefresh = true;
        }

        $textarea.text('');

        return needRefresh;
    };

    /**
     * Given a position and delta, adjust and return a new row.
     *
     * @param deltaY the row delta
     * @param event related browser event object
     * @param baseX the starting column
     * @param baseY the starting row
     * @param wrap if the adjusted row should wrap when it hits the edge of the table
     *
     * @return the new (x, y) pair
     */
    var getAdjustedY = function(deltaY, event, baseX, baseY, wrap)
    {
        // Locate our current position
        var y = baseY;
        if (y == undefined) { return null; }

        // Update the y position
        y += deltaY;

        var x = baseX;

        var oldRow = model.get(baseY);
        var oldLevel = oldRow.level || 0;
        var oldCol = layout[oldLevel][baseX];

        // If we're wrapping and we go off the top or bottom, wrap to
        // the next/previous column
        if (wrap && (y < 0 || y >= model.length()))
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
                y += (deltaY < 0 ? 1 : -1) * oldRow.parent.childRows.length;
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

                var newY = y < 0 ? model.length() - 1 : 0;
                var adjX = getAdjustedX(y < 0 ? -1 : 1, event, x, newY);
                if (adjX && adjX.x != x)
                {
                    x = adjX.x;
                    y = adjX.y;
                }
            }
        }

        // Bounds checking
        if (y < 0) { y = 0; }
        if (y >= model.length()) { y = model.length() - 1; }

        // No need to update if we didn't make changes
        if (y == baseY && x == baseX) { return null; }

        var newRow = model.get(y);
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
                var ntY = model.index(deltaY < 0 ?
                    childRows[childRows.length - 1] : childRows[0]);
                var adjXNT = getAdjustedX(deltaY < 0 ? -1 : 1, event, x, ntY);
                if (adjXNT)
                {
                    x = adjXNT.x;
                    y = adjXNT.y;
                    newRow = model.get(y);
                    newLevel = newRow.level || 0;
                    newCol = layout[newLevel][x];
                }
            }
        }

        // If we hit a header, then there is special behavior
        // Make sure the column exists, since when switching levels our
        // column index may not correspond at all with what we had in the
        // original level
        if (newCol && (newCol.type == 'opener' || newCol.type == 'header'))
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
                    var wrapY = deltaY < 0 ? model.length() - 1 : 0;
                    var wrapXY = getAdjustedX(deltaY < 0 ? -1 : 1,
                            event, x, wrapY);
                    if (wrapXY && wrapXY.x != x)
                    {
                        return wrapXY;
                    }
                    return null;
                }
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
        if (newCol && newCol.mcol && (newCol.mcol.nestedIn ||
            newCol.type == 'nest-header'))
        {
            var subRow = model.getRowValue(newRow, (newCol.type == 'nest-header' ?
                        newCol.mcol.header :
                        newCol.mcol.nestedIn.header) );
            if (!subRow)
            {
                var adjDelta = deltaY < 0 ? -1 : 1;
                if (!wrap && y + adjDelta >= model.length())
                { return null; }
                return getAdjustedY(adjDelta, event, x, y, wrap);
            }
        }

        return {x: x, y: y};
    };

    /**
     * Given a position and delta, adjust and return a new column.
     *
     * @param deltaX the column delta
     * @param event related browser event object
     * @param baseX the starting column
     * @param baseY the starting row
     * @param wrap if the adjusted row should wrap when it hits the edge of the table
     *
     * @return the new (x, y) pair
     */
    var getAdjustedX = function(deltaX, event, baseX, baseY, wrap)
    {
        // Scan for the next focusable cell
        var y = baseY;
        var origLevel = model.get(y).level || 0;
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
                        origLevel == (model.get(adjP.y).level || 0) &&
                        model.get(y).parent == model.get(adjP.y).parent)
                    {
                        y = adjP.y;
                        newX = adjP.x;
                        layoutLevel = layout[model.get(y).level || 0];
                        break;
                    }
                }

                // Always skip over nest headers and headers
                if (curCol.type == 'nest-header' ||
                    curCol.type == 'header') { continue; }

                // If going into an empty nested table, skip it
                if (curCol.mcol && curCol.mcol.type == 'nested_table')
                {
                    var curRow = model.get(y);
                    if (curRow.expanded)
                    {
                        var subTable = model.getRowValue(curRow, curCol.mcol);
                        if (!model.useBlankRows() &&
                            (!subTable || subTable.length < 1)) { continue; }
                    }
                }

                // If we hit a fill or switched nested tables, go up to the
                // parent
                if (curCol.type == 'fill' ||
                    (prevCol && prevCol.mcol && prevCol.mcol.nestedIn &&
                     curCol.mcol && curCol.mcol.nestedIn &&
                     curCol.mcol.nestedIn != prevCol.mcol.nestedIn))
                {
                    var newRow = model.get(y).parent;
                    // If we switched to an expanded & empty nt, skip it
                    if (curCol.mcol && curCol.mcol.nestedIn &&
                        newRow.expanded)
                    {
                        var subT = model.getRowValue(newRow,
                            curCol.mcol.nestedIn.header);
                        if (!model.useBlankRows() &&
                            (!subT || subT.length < 1)) { continue; }
                    }

                    y = model.index(newRow);
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
                    dY = delta < 0 ? -1 : 1;
                    adjX = newX + (delta < 0 ? 1 : -1) *
                        prevCol.mcol.nestedIn.children.length;
                    adjP = getAdjustedY(dY, event, adjX, y);

                    // Make sure this wouldn't make us change levels or
                    // parent rows; if it does, then skip setting this data
                    // and let the normal flow happen
                    if (adjP &&
                        origLevel == (model.get(adjP.y).level || 0) &&
                        model.get(y).parent == model.get(adjP.y).parent)
                    {
                        y = adjP.y;
                        x = adjP.x;
                        layoutLevel = layout[model.get(y).level || 0];
                        prevCol = layoutLevel[newX];
                        continue;
                    }
                }

                // We're wrapping a whole row, so find the next/prev
                // parent row
                curRow = model.get(y);
                if (curRow.parent) { curRow = curRow.parent; }
                y = model.nextInLevel(model.index(curRow), delta < 0);
                if (y == null) { return null; }

                newX = newX < 0 ? layoutLevel.length : -1;
                layoutLevel = layout[model.get(y).level || 0];
                i--;
            }
            x = newX;
            prevCol = layoutLevel[x];
        }

        return {x: x, y: y};
    };

    var preNav = function() {
        if (!activeCellOn && model.length() && model.column(0)) {
            // First keyboard nav without cell nav on -- move to position 0, 0
            return { x: 0, y: 0 };
        }
        return null;
    };

    /**
     * Compute a new position for a vertical move.
     *
     * @param deltaY the row delta (either positive or negative)
     * @param event related browser event object (used to test for meta keys)
     * @param wrap whether the position should wrap when it hits the top or bottom of the table
     *
     * @return the new (x, y) pair
     */
    this.navigateY = function(deltaY, event, wrap)
    {
        var xy = preNav();
        if (!xy) {
            xy = getAdjustedY(deltaY, event, activeCellXStart, activeCellY, wrap);
        }
        return xy;
    };

    /**
     * Compute a new position for a horizontal move.
     *
     * @param deltaX the column delta (either positive or negative)
     * @param event related browser event object (used to test for meta keys)
     * @param wrap whether the position should wrap when it hits the left or right edge of the table
     *
     * @return the new (x, y) pair
     */
    this.navigateX = function(deltaX, event, wrap)
    {
        var xy = preNav();
        if (!xy) {
            xy = getAdjustedX(deltaX, event, activeCellXStart, activeCellY, wrap);
        }

        // Ignore if we made no changes
        if (!xy || xy.x == activeCellXStart && xy.y == activeCellY) {
            xy = null;
        }

        return xy;
    };

    /**
     * Select or unselect a column.
     */
    this.setColumnSelection = function(column, value) {
        if (hasSelection()) {
            if (selectionLevel != 0) {
                // Can only select columns in the root level
                return;
            }
        } else {
            selectionLevel = 0;
        }
        selectedColumns[column.id] = value;
    };

    /**
     * Determine whether a column is selected.
     */
    this.isColumnSelected = function(column) {
        return selectedColumns[column.id];
    };

    /**
     * Obtain a lookup for selected columns.  You may modify this set.
     */
    this.getSelectedColumns = function() {
        var rv = {};
        $.each(selectedColumns, function(colId, val)
                { if (val) { rv[colId] = val; } });
        return rv;
    };

    /**
     * Convert the selection to a tab-delimited text blob.
     */
    this.getSelectionDoc = function() {
        // Standard rendering context variables
        var rawDoc = [];
        var renderContextVars = {
            rawDoc: rawDoc
        };

        // If we don't have a selection, return just the contents of the active cell
        if (!hasSelection()) {
            if (activeCellOn) {
                var row = model.get(activeCellY);
                var col = model.column(activeCellXStart);
                if (row && col && col.dataLookupExpr) {
                    var type = blist.data.types[col.type] || blist.data.types.text;
                    renderContextVars.row = row;
                    var fn = type.renderGen("row" + model.column(activeCellXStart).dataLookupExpr, true, col);
                    var value = blist.data.types.compile(fn, renderContextVars);
                    if (value != undefined)
                        return value;
                }
            }
            return '';
        }

        // Locate all columns that will be present in the selection
        var usedCols;
        var layoutLevel = layout[selectionLevel];
        if (model.selectedRows && model.selectedRows.length) {
            usedCols = [];
            for (var i = 0; i < layoutLevel.length; i++)
                usedCols[i] = layoutLevel[i].mcol;
        } else {
            usedCols = [];
            var selectedCols = this.getSelectedColumns();
            for (var id in selectedCols)
                usedCols[id] = layoutLevel[id].mcol;
            var selBoxes = convertCellSelection();
            for (i = 0; i < selBoxes.length; i++) {
                var box = selBoxes[i];
                for (id = box[0]; id <= box[2]; id++) {
                    usedCols[id] = layoutLevel[id].mcol;
                }
            }
        }

        // Create a mapping from an output column to the source column
        var mapFnSrc = '(function(row, selmap) {';
        var didOne = false;
        for (i = 0; i < usedCols.length; i++)
            if (usedCols[i]) {
                col = usedCols[i];
                if (col.type == 'nested_table' || col.type == 'fill' || col.level.id != selectionLevel)
                    // TODO -- include body of nested tables?
                    continue;
                if (didOne)
                    mapFnSrc += 'rawDoc.push("\\t");';
                else
                    didOne = true;
                type = blist.data.types[col.type] || blist.data.types.text;
                mapFnSrc += 'if (selmap[' + i + ']) rawDoc.push(' + type.renderGen("row" + col.dataLookupExpr, true, col, renderContextVars) + ');';
            }
        mapFnSrc += 'rawDoc.push("\\n");})';

        // Compile the function
        var mapFn = blist.data.types.compile(mapFnSrc, renderContextVars);

        // Walk selected rows, building the selection document
        this.processSelection(model.rows(), mapFn, function() {});
        rawDoc.pop(); // Remove final carriage return
        if (rawDoc.length == 1)
            // Only a single cell selected
            return rawDoc[0];
        return rawDoc.join('');
    }

    return this;
};
