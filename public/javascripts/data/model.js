/**
 * This is mostly deprecated now; it provides some basic ties between the new
 * Dataset model, datasetGrid and blistTable.  It proxies a few things, and adds
 * a bit of new functionality:
 *  + Provide appropriate rows to render in the table.  This includes
 *    adding blank rows for entering new data, and expanded nested table rows
 *  + Handling row selection for batch operations
 *  + Handling undo/redo for row edit/create/delete events
 *
 * This does not store or load data by itself anymore
 *
 * In addition to actual data and server metadata,
 * this may add the following properties to rows:
 *
 *  + level - the level of the row, or -1 if the row is "special" (that is, uses a custom renderer)
 *  + expanded - true iff the row is in an "open" state
 *  + children - columns that are nested within this column, if applicable
 *
 *
 * Events
 *
 * The model fires the following events:
 *
 *  + rows_changed - called when the entire set of rows is replaced
 *  + selection_change - called with an array of rows that have had their
 *     selection change
 *  + dataset_ready - once it has an actual Dataset hooked up
 *  + undo_redo_change - whenever the undo/redo buffers add/remove items
 */

blist.namespace.fetch('blist.data');

(function($) {
    /**
     * This class provides functionality for managing a table of data.
     */
    blist.data.Model = function()
    {
        var self = this;

        var curOptions = {
            blankRow: false,
            filterMinChars: 3,
            pageSize: 50,
            view: null
        };

        // Count of special rows added to main set
        var specialCount = 0;

        // The special rows to interweave into rows
        var specialRows = {};
        var specialLookup = {};

        // Keep track of what is expanded
        var expandedRows = {};

        // Event listeners
        var listeners = [];

        // Undo/redo buffer
        var undoBuffer = [];
        var redoBuffer = [];

        // Translated columns with levels for table
        var trCols;

        /**
         * Set options
         */

        this.options = function (newOpt)
        {
            if (newOpt)
            {
                var wasDS = !$.isBlank(this.view);
                $.extend(curOptions, newOpt);
                if (!$.isBlank(curOptions.view))
                {
                    this.view = curOptions.view;
                    this.view.bind('row_count_change', function()
                            { configureActive(); })
                        .bind('query_change', function()
                            {
                                resetUndo();
                                collapseAll();
                                configureActive();
                            })
                        .bind('columns_changed', function()
                            {
                                resetUndo();
                                trCols = null;
                                $(listeners).trigger('columns_changed');
                            })
                        // Dataset doesn't know about weird constructed
                        // child rows, so whenever a parent changes, fire
                        // all the fake children
                        .bind('row_change', function(rows, fullReset)
                            {
                                _.each($.makeArray(rows), function(r)
                                {
                                    if (fullReset) { resetChildRows(r); }
                                    else if (r.expanded)
                                    {
                                        self.view.trigger('row_change',
                                            [r.childRows]);
                                    }
                                });
                            });
                    if (!wasDS)
                    { $(listeners).trigger('dataset_ready', [self]); }
                }
            }
            return this;
        };

        /**
         * Get rights for this view
         */
        this.canRead = function()
        {
            return this.view && this.view.hasRight('read');
        };

        this.canWrite = function()
        {
            return this.view && this.view.hasRight('write') &&
                !this.view.isGrouped();
        };

        this.canAdd = function()
        {
            return this.view && this.view.hasRight('add') &&
                !this.view.isGrouped();
        };

        this.canDelete = function()
        {
            return this.view && this.view.hasRight('delete') &&
                !this.view.isGrouped();
        };

        this.useBlankRows = function()
        {
            return curOptions.blankRow && self.canAdd() && self.canWrite();
        };

        /**
         * Add a model listener.  A model listener receives events fired by the
         * model.
         */
        this.addListener = function(listener)
        {
            var pos = $.inArray(listener, listeners);
            if (pos == -1) { listeners.push(listener); }
        };

        /**
         * Remove a model listener.
         */
        this.removeListener = function(listener)
        {
            var pos = $.inArray(listener, listeners);
            if (pos == -1) { listeners = listeners.splice(pos, 1); }
        };


        this.loadRows = function(start, stop, successCallback, errorCallback)
        {
            if ($.isBlank(this.view)) { return false; }

            // Adjust max & min account for special rows, so we get real
            // offsets to the server
            var specToStop = countSpecialTo(stop, true);
            var adjStop = stop - specToStop;
            var specToStart = countSpecialTo(start, true);
            var adjStart = start - specToStart;

            var gotRows = function(modelRows)
            {
                if (specToStart != specToStop)
                {
                    for (var i = start; i < stop; i++)
                    {
                        if (!$.isBlank(specialRows[i]))
                        { modelRows.splice(i - start, 0, specialRows[i]); }
                    }
                }
                if (_.isFunction(successCallback)) { successCallback(modelRows); }
            };

            if (adjStop == adjStart)
            { gotRows([]); }
            else
            { this.view.getRows(adjStart, adjStop - adjStart, gotRows, errorCallback); }

            return true;
        };

        this.getAggregates = function(callback)
        {
            if ($.isBlank(this.view)) { return false; }

            this.view.getAggregates(callback);

            return true;
        };

        var setUpColumns = function()
        {
            trCols = [[], []];
            var fillFor = [];
            var addFill = function()
            {
                if (fillFor.length > 0)
                {
                    trCols[1].push({renderTypeName: 'fill',
                            fillFor: fillFor, id: 'fill' + _.uniqueId()});
                }
                fillFor = [];
            };

            _.each(self.view.visibleColumns, function(c)
            {
                trCols[0].push(c);
                if (c.dataTypeName == 'nested_table')
                {
                    addFill();
                    trCols[1].push(c);
                }
                else
                { fillFor.push(c); }
            });
            addFill();
        };

        /**
         * Remove rows from the model.
         */
        this.removeRows = function(delRowIds, skipUndo)
        {
            delRowIds = $.makeArray(delRowIds);

            var rows = _.map(delRowIds, function(rId)
                { return self.getByID(rId); });

            if (!skipUndo)
            { this.addUndoItem({type: 'delete', rows: rows}); }

            _.each(rows, function(r)
            {
                self.unselectRow(r);
                if (r.expanded) { self.expand(r, false); }
            });

            this.view.removeRows(delRowIds);

        };

        this.removeChildRows = function(fakeRows, parCol, skipUndo)
        {
            var removedRows = [];
            var removedByPar = {};
            _.each($.makeArray(fakeRows), function(fr)
            {
                var parRow = fr.parent;
                var subRow = self.getRowValue(fr, parCol);
                var subRowSet = self.getRowValue(parRow, parCol);
                for (var j = 0; j < subRowSet.length; j++)
                {
                    if (subRow.id == subRowSet[j].id)
                    {
                        subRow.origPosition = j;
                        removedRows.push({row: subRow, parentRow: parRow});
                        removedByPar[parRow.id] = removedByPar[parRow.id] || [];
                        removedByPar[parRow.id].push(subRow.id);
                        break;
                    }
                }
            });

            if (!skipUndo)
            {
                this.addUndoItem({type: 'childDelete', rows: removedRows,
                    parentColumn: parCol});
            }

            _.each(removedByPar, function(cr, parId)
            { self.view.removeRows(cr, parId, parCol.id); });
        };

        var isInvalid = function(row, column)
        {
            if (!$.isBlank(column.parentColumn))
            { row = row[column.parentColumn.lookup]; }
            return (row.invalid || {})[column.lookup];
        };

        var getRawValue = function(row, column)
        {
            if (!$.isBlank(column.parentColumn))
            { row = row[column.parentColumn.lookup]; }
            return row[column.lookup];
        };

        // Get the value in a row for a column
        this.getRowValue = function(row, column)
        {
            if ($.isBlank(row)) { return undefined; }

            if (isInvalid(row, column)) { return null; }

            return getRawValue(row, column);
        };

        // Get the invalid value in a row for a column
        this.getInvalidValue = function(row, column)
        {
            if ($.isBlank(row)) { return undefined; }

            if (!isInvalid(row, column)) { return null; }

            return getRawValue(row, column);
        };

        this.isCellError = function(row, column)
        {
            if (!$.isBlank(column.parentColumn))
            { row = row[column.parentColumn.lookup]; }
            return row.error[column.lookup];
        };

        var resetChildRows = function(row)
        {
            if (row.expanded)
            {
                self.expand(row, false, true);
                var allRows = row.childRows;
                delete row.childRows;
                self.expand(row, true, true);
                allRows = allRows.concat(row);
                self.view.trigger('row_change', [allRows]);
            }
            else
            { delete row.childRows; }
        };

        // Set the value for a row, save it to the server, and notify listeners
        this.saveRowValue = function(value, row, column, isValid, skipUndo)
        {
            if ($.isBlank(this.view)) { return; }

            var isCreate = false;
            if (row.type == 'blank')
            {
                delete row.type;
                row.id = this.view.createRow();
                isCreate = true;
                row = this.getByID(row.id);
                if (!skipUndo)
                { this.addUndoItem({type: 'create', rows: [row]}); }
            }

            var parRow;
            var childRow;
            var parCol;
            if (!$.isBlank((column || {}).parentColumn))
            {
                parCol = column.parentColumn;

                childRow = self.getRowValue(row, parCol);
                parRow = row.parent;
                isCreate = childRow.type == 'blank';
                if (isCreate)
                {
                    delete childRow.type;

                    // Since child rows get re-created, save the index and pull
                    // out the new one
                    var curRowI = this.index(row);

                    // If we're in a blank row, create that row first
                    if (parRow.type == 'blank')
                    {
                        parRow = this.saveRowValue(null, parRow, null, true);
                        skipUndo = true;
                    }

                    // Add the new row to the parent
                    childRow.id = this.view.createRow(null, parRow.id, parCol.id);
                    childRow = self.getRowValue(row, parCol);

                    row = this.get(curRowI);

                    if (!skipUndo) { this.addUndoItem({type: 'childCreate',
                        rows: [row], parentColumn: parCol}); }
                }
            }

            if (!skipUndo && !isCreate)
            {
                // Fetch prev value for undo
                var prevValue;
                var prevValueInvalid = false;
                if (!$.isBlank(column))
                {
                    prevValue = this.getRowValue(row, column);
                    if ($.isBlank(prevValue))
                    {
                        prevValue = this.getInvalidValue(row, column);
                        prevValueInvalid = !$.isBlank(prevValue);
                    }
                }

                this.addUndoItem({type: 'edit', column: column,
                        row: row, value: prevValue, invalid: prevValueInvalid});
            }

            // If column is blank, we're probably just creating a new row
            if (!$.isBlank(column))
            {
                if ($.isBlank(childRow))
                {
                    this.view.setRowValue(value, row.id, column.id, !isValid);
                    this.view.saveRow(row.id);
                }
                else
                {
                    this.view.setRowValue(value, childRow.id, column.id,
                        !isValid, parRow.id, parCol.id);
                    this.view.saveRow(childRow.id, parRow.id, parCol.id);
                }
            }
            return row;
        };

        var undeleteRow = function(row)
        {
            // Children can't be created with the parent, so pull them out
            // and add them separately
            var undeleteChildren = [];
            _.each(self.view.columnsForType('nested_table', true), function(c)
            {
                if (row[c.lookup] instanceof Array)
                {
                    // keep track of nested rows so we can re-post them along
                    // with the parent row
                    _.each(row[c.lookup], function(cr, i)
                    {
                        cr.origPosition = i;
                        undeleteChildren.push({row: cr, parentColumn: c});
                    });
                    delete row[c.lookup];
                }
            });

            var newId = self.view.createRow(row);
            row = self.view.rowForID(newId);

            // After restoring main row:
            _.each(undeleteChildren, function(cr)
            {
                undeleteChildRow(cr.row, row, cr.parentColumn);
            });

            return row;
        };

        var undeleteChildRow = function(row, parentRow, parentColumn)
        {
            row.index = row.origPosition;
            self.view.createRow(row, parentRow.id, parentColumn.id);
        };

        var doUndoRedo = function(buffer)
        {
            if (buffer.length < 1) { return null; }

            var item = buffer.pop();
            var oppItem = null;
            switch (item.type)
            {
                case 'edit':
                    var curValue = self.getRowValue(item.row, item.column);
                    var isInvalid = false;
                    if ($.isBlank(curValue))
                    {
                        curValue = self.getInvalidValue(item.row, item.column);
                        isInvalid = !$.isBlank(curValue);
                    }
                    oppItem = {type: 'edit', value: curValue, invalid: isInvalid,
                        row: item.row, column: item.column};

                    self.saveRowValue(item.value, item.row,
                            item.column, !item.invalid, true);
                    break;

                case 'create':
                    oppItem = {type: 'delete', rows: item.rows};

                    self.removeRows(_.pluck(item.rows, 'id'), true);
                    break;

                case 'childCreate':
                    oppItem = {type: 'childDelete',
                        rows: _.map(item.rows, function(r)
                            { return {parentRow: r.parent,
                                row: fakeRowToChild(r, item.parentColumn)}; }),
                        parentColumn: item.parentColumn};

                    self.removeChildRows(item.rows, item.parentColumn, true);
                    break;

                case 'delete':
                    oppItem = {type: 'create', rows: []};

                    item.rows.reverse();
                    _.each(item.rows, function(r)
                        { oppItem.rows.push(undeleteRow(r)); });
                    break;

                case 'childDelete':
                    var reversedRows = item.rows.slice();
                    reversedRows.reverse();
                    _.each(reversedRows, function(r)
                        { undeleteChildRow(r.row, r.parentRow,
                            item.parentColumn); });

                    oppItem = {type: 'childCreate',
                        rows: _.map(item.rows, function(r)
                                { return childRowToFake(r.parentRow,
                                    r.row.origPosition); }),
                        parentColumn: item.parentColumn};
                    break;
            }

            return oppItem;
        };

        this.addUndoItem = function(itemHash)
        {
            redoBuffer.length = 0;
            undoBuffer.push(itemHash);
            this.undoRedoChange();
        };

        this.undo = function()
        {
            var oppItem = doUndoRedo(undoBuffer);
            if (oppItem !== null)
            {
                redoBuffer.push(oppItem);
                this.undoRedoChange();
            }
        };

        this.redo = function()
        {
            var oppItem = doUndoRedo(redoBuffer);
            if (oppItem !== null)
            {
                undoBuffer.push(oppItem);
                this.undoRedoChange();
            }
        };

        this.canUndo = function() { return undoBuffer.length > 0; }
        this.canRedo = function() { return redoBuffer.length > 0; }

        var resetUndo = function()
        {
            redoBuffer.length = 0;
            undoBuffer.length = 0;
            self.undoRedoChange();
        };

        var childRowToFake = function(parentRow, childRowPos)
        {
            if ($.isBlank(parentRow.childRows)) { getChildRows(parentRow); }
            return parentRow.childRows[childRowPos];
        };

        var fakeRowToChild = function(fakeRow, parentColumn)
        {
            return fakeRow[parentColumn.lookup];
        };

        /**
         * Notify listeners of row selectionchanges.
         */
        this.selectionChange = function(rows)
        {
            $(listeners).trigger('selection_change', [ rows ]);
        };

        this.undoRedoChange = function()
        {
            $(listeners).trigger('undo_redo_change');
        };

        // Retrieve the index for a row, adjusted for specials
        this.index = function(row)
        {
            if ($.isBlank(this.view)) { return undefined; }
            if (!$.isBlank(specialLookup[row.id])) { return row.index; }
            return row.index + countSpecialTo(row.index + 1);
        };

        /**
         * Retrieve a single row by index.
         */
        this.get = function(index)
        {
            if ($.isBlank(this.view)) { return undefined; }
            return specialRows[index] ||
                this.view.rowForIndex(index - countSpecialTo(index, true));
        };

        /**
         * Retrieve a single row by ID.
         */
        this.getByID = function(id)
        {
            if ($.isBlank(this.view)) { return undefined; }
            return specialLookup[id] || this.view.rowForID(id);
        };

        /**
         * Retrieve all columns in visual order.
         */
        this.columns = function()
        {
            if ($.isBlank(this.view)) { return null; }

            if ($.isBlank(trCols))
            { setUpColumns(); }

            return trCols;
        };

        this.columnForID = function(id)
        {
            if ($.isBlank(this.view)) { return null; }
            var col = this.view.columnForID(id);
            if ($.isBlank(col))
            {
                _.each(this.view.columnsForType('nested_table'), function(c)
                { col = col || c.childColumnForID(id); });
            }
            return col;
        };

        /**
         * Retrieve the total number of rows.
         */
        this.length = function()
        {
            return this.dataLength() + specialCount;
        };

        /**
         * Real rows from the Dataset
         */
        this.dataLength = function()
        {
            return $.isBlank((this.view || {}).totalRows) ? -1 :
                this.view.totalRows;
        };

        /**
         * Retrieve the columns for a level.
         */
        this.level = function(level)
        {
            if ($.isBlank(this.view) || $.isBlank(trCols))
            { return null; }

            return trCols[level];
        };

        /**
         * Scan to find the next or previous row in the same level.
         */
        this.nextInLevel = function(from, backward)
        {
            var pos = from;
            var level = 0;
            // Everything not in specialRows is level 0
            if (!$.isBlank(specialRows[pos]))
            { level = specialRows[pos].level || 0; }

            if (backward)
            {
                while (--pos >= 0)
                {
                    if (((this.get(pos) || {}).level || 0) == level)
                    { return pos; }
                }
            }
            else
            {
                var end = this.length();
                while (++pos < end)
                {
                    var r = this.get(pos);
                    if ($.isBlank(r) || (r.level || 0) == level)
                    { return pos; }
                }
            }
            return null;
        };

        this.selectedRows = {};

        this.hasSelectedRows = function()
        {
            return !_.isEmpty(this.selectedRows);
        }

        this.toggleSelectRow = function(row)
        {
            if ($.isBlank(this.selectedRows[row.id]))
            { return this.selectRow(row); }

            else
            { return this.unselectRow(row); }
        };

        this.selectRow = function(row, suppressChange)
        {
            if (row.level < 0 || row.type == 'blank') { return; }

            this.selectedRows[row.id] = this.index(row);
            if (!suppressChange) { this.selectionChange([row]); }
            return [row];
        };

        this.unselectRow = function(row)
        {
            delete this.selectedRows[row.id];
            this.selectionChange([row]);
            return [row];
        };

        this.unselectAllRows = function(suppressChange)
        {
            var unselectedRows = [];
            _.each(this.selectedRows, function (v, id)
            { unselectedRows.push(self.getByID(id)); });

            this.selectedRows = {};
            if (!suppressChange) { this.selectionChange(unselectedRows); }
            return unselectedRows;
        };

        this.selectSingleRow = function(row)
        {
            var changedRows = this.unselectAllRows(true)
                .concat(this.selectRow(row, true));
            this.selectionChange(changedRows);
            return changedRows;
        };

        this.selectRowsTo = function(row)
        {
            var minIndex;
            _.each(this.selectedRows, function (index)
            {
                if (minIndex == null || minIndex > index) { minIndex = index; }
            });

            if (minIndex == null) { return this.selectRow(row); }

            var curIndex = this.index(row);
            var maxIndex = curIndex;
            if (curIndex < minIndex)
            {
                maxIndex = minIndex;
                minIndex = curIndex;
            }

            var changedRows = this.unselectAllRows(true);
            for (var i = minIndex; i <= maxIndex; i++)
            {
                var curRow = this.get(i);
                if (!$.isBlank(curRow) && (curRow.level || 0) >= 0 &&
                    curRow.type != 'blank')
                {
                    this.selectedRows[curRow.id] = i;
                    changedRows.push(curRow);
                }
            }
            this.selectionChange(changedRows);
            return changedRows;
        };

        var getChildRows = function(row)
        {
            if (row.childRows) { return row.childRows; }

            var cols = self.columns()[row.level || 0];
            var childRows = row.childRows = [];
            var childLevel = (row.level || 0) + 1;

            for (var i = 0; i < cols.length; i++)
            {
                var col = cols[i];
                if ($.isBlank(col.visibleChildColumns)) { continue; }

                var cell = row[col.lookup];
                if ($.isBlank(cell) && !self.useBlankRows()) { continue; }
                cell = cell || [];

                var numCells = (cell.length || 0) + (self.useBlankRows() ? 1 : 0);
                for (var j = 0; j < numCells; j++)
                {
                    var childRow = childRows[j];
                    if (!childRow)
                    {
                        childRow = childRows[j] = {};
                        childRow.id = "t" + _.uniqueId();
                        childRow.level = childLevel;
                        childRow.parent = row;
                        // Index will be set for real when inserted into special
                        childRow.index = -1;
                    }

                    childRow[col.lookup] = cell[j];
                    if (!childRow[col.lookup])
                    {
                        childRow[col.lookup] =
                            {invalid: {}, changed: {}, error: {}};
                        childRow[col.lookup].type = 'blank';
                    }
                }
            }

            if (childRows.length)
            { childRows[childRows.length - 1].groupLast = true; }
            return childRows;
        };

        /**
         * Open or close a row (open rows display nested records).
         */
        this.expand = function(row, open, skipEvent)
        {
            if (row === undefined) { return; }

            // Determine whether to expand/open or unexpand/close the row
            if (open === undefined)
            { open = !row.expanded; }
            if (open === row.expanded)
            { return; }

            // Create child rows
            if (open)
            {
                // Create the child rows
                var childRows = getChildRows(row);

                // Install child rows into the special set if the row is open
                $.addItemsToObject(specialRows, childRows, this.index(row) + 1);
                _.each(childRows, function(cr) { specialLookup[cr.id] = cr; });
                specialCount += childRows.length;
                expandedRows[row.id] = true;
            }
            else
            {
                // Remove the child rows
                if (row.childRows && row.childRows.length)
                {
                    $.removeItemsFromObject(specialRows, this.index(row) + 1,
                        row.childRows.length);
                    specialCount -= row.childRows.length;
                    _.each(row.childRows, function(cr)
                        { delete specialLookup[cr.id]; });
                }
                delete expandedRows[row.id];
            }

            // Record the new row state
            row.expanded = open;

            // Fire events
            if (!skipEvent)
            {
                var rows = [row];
                if (!row.expanded && !$.isBlank(row.childRows))
                { rows = rows.concat(row.childRows); }
                this.view.trigger('row_change', [rows]);
            }
        };


        // Apply filtering, grouping, and sub-row expansion to the active set.
        // This applies current settings to the active set and then notifies
        // listeners of the data change.
        var configureActive = function()
        {
            removeSpecialRows();
            doExpansion();

            // Add in blank row at the end
            if (self.useBlankRows())
            {
                var blankRow = {invalid: {}, changed: {}, error: {}};
                blankRow.type = 'blank';
                blankRow.id = 'blank';
                blankRow.index = self.length();
                specialRows[self.length()] = blankRow;
                specialLookup[blankRow.id] = blankRow;
                specialCount++;
            }

            self.unselectAllRows(true);
            $(listeners).trigger('rows_changed');
        };

        var countSpecialTo = function(max, isAbsolute)
        {
            var count = 0;
            if ($.isBlank(max)) { max = self.dataLength(); }
            var i = 0;

            // For large datasets, this sequential scanning is painfully slow.
            // Special rows should normally be relativly small, so use that for
            // the first pass.  Then we can adjust max up by how many we found;
            // then do a sequential scan for that (hopefully small) last adjustment
            if (max > specialCount)
            {
                _.each(specialRows, function(r, i) { if (i < max) { count++; } });
                i = max;
                if (!isAbsolute) { max += count; }
            }

            while (i < max)
            {
                if (!$.isBlank(specialRows[i]))
                {
                    count++;
                    if (!isAbsolute) { max++; }
                }
                i++;
            }
            return count;
        };

        // Remove "special" (non-top-level) rows
        var removeSpecialRows = function()
        {
            var removed = specialCount > 0;
            specialRows = {};
            specialLookup = {};
            specialCount = 0;
            return removed;
        };

        // Collapse all rows
        var collapseAll = function()
        {
            _.each(_.keys(expandedRows), function(rId)
            { self.expand(self.getByID(rId), false, true); });
        };

        // Expand rows that the user has opened
        var doExpansion = function()
        {
            var missingRows = [];
            _.each(expandedRows, function(v, rId)
            {
                var r = self.getByID(rId);
                if ($.isBlank(r))
                {
                    missingRows.push(rId);
                    return;
                }

                var childRows = getChildRows(r);
                $.addItemsToObject(specialRows, childRows, self.index(r) + 1);
                _.each(childRows, function(cr) { specialLookup[cr.id] = cr; });
                specialCount += childRows.length;
                r.expanded = true;
            });

            _.each(missingRows, function(rId) { delete expandedRows[rId]; });

            return !_.isEmpty(expandedRows);
        };

        // Call intially
        resetUndo();
    };

    $.fn.extend({
        /**
         * Returns and (optionally) sets the Blist model for the element.  If
         * the element has no model associated with it one is created.
         */
        blistModel: function(model) {
            if (model) {
                this.each(function() {
                    var currentModel = $(this).data('blistModel');
                    if (currentModel) { currentModel.removeListener(this); }
                });
                this.data('blistModel', model);
                this.each(function() {
                    model.addListener(this);
                });
                return model;
            }
            var currentModel = this.data('blistModel');
            if (currentModel) { return currentModel; }
            return this.blistModel(new blist.data.Model());
        }
    });
})(jQuery);
