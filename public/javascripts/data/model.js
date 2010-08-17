/**
 * This file implements the Blist data model.  The data model is a flexible container for dynamic data that is
 * decoupled from any specific presentation mechanism.
 *
 * The model holds two types of information, metadata and data.  Internally metadata is stored in a private variable
 * called "meta", data is stored in a private variable called "rows".  Additionally, the model supports filtering,
 * grouping and sorting.  Sorting is applied against the full dataset.  Grouping and filtering is applied to a subset
 * of the dataset stored in a private variable called "active".
 *
 * <h2>Metadata</h2>
 *
 * Metadata is an object with any of the following optional fields:
 *
 * <ul>
 *   <li>columns - a hierarchical list of column configuration objects.  This is an array of arrays.  Each sub-array
 *     describes the columns such as they might appear in the corresponding level of a tree.  For example, columns[0]
 *     is the root column set.  Columns[1] contains the columns that display if a root row is expanded.  Etc.</li>
 *   <li>view - a Blist view object, used to configure options that aren't otherwise set</li>
 *   <li>title - the name displayed as the title of the grid</li>
 * </ul>
 *
 * Columns are described using an object with the following fields:
 *
 * <ul>
 *   <li>name - the display name of the column<li>
 *   <li>description - the user defined description of the column<li>
 *   <li>dataIndex - the index of the value within rows (a string for object rows, a number for array rows)</li>
 *   <li>type - the type of data in the column (standard Blist type; defaults to "text").  See types.js for
 *     more information on supported types</li>
 *   <li>width - the width of the column</li>
 *   <li>option - an array of possible picklist values of the form { id: { text: 'My Label', icon: 'icon_url' }
 *     }</li>
 *   <li>format - a type specific parameter that describes the display format for the data</li>
 *   <li>group - a function that generates a "group" object for a given value.  If this value is present a
 *     table displays group headers when ordered by this column.  Set to "true" to use the default grouping
 *     function for the type</li>
 *   <li>children - if a column has associated "sub-columns", these columns are referenced here</li>
 * </ul>
 *
 *
 * <h2>Rows</h2>
 *
 * Row data is stored as an array of records.  Records may be arrays or objects.  Once installed, changes to row data
 * must occur via public model methods.  Model backed objects can register for events to check data (as well as
 * metadata) changes.
 *
 * Row data may be stored "sparsely".  In sparse mode, one or more elements in the row array are represented by a
 * primitive value rather than actual row data in an object or array.  These primitive value represent row IDs.  To
 * retrieve actual row data clients may pass an array of such rows to loadRows().  loadRows() is an asynchronous
 * operation.  When loadRows() succeeds, the row_change is fired with the list of freshly populated rows.
 *
 * In addition to actual data, rows may have the following properties:
 *
 * <ul>
 *   <li>level - the level of the row, or -1 if the row is "special" (that is, uses a custom renderer)
 *   <li>expanded - true iff the row is in an "open" state
 *   <li>children - columns that are nested within this column, if applicable
 * </ul>
 *
 * Each row is identified by an ID.  IDs must be unique across rows.  If column data is stored in an object then the
 * ID is the field "id".  If column data is stored in a row then the first column is used as the ID.
 *
 *
 * <h2>Events</h2>
 *
 * The model fires the following events:
 *
 * <ul>
 *   <li>meta_change - when metadata (column, data name, etc.) changes</li>
 *   <li>before_load - called prior to intiating an AJAX load of data.  Return false to cancel the load</li>
 *   <li>load - called when the entire set of rows is replaced</li>
 *   <li>after_load - called after an AJAX load of data</li>
 *   <li>row_change - called with an array of rows that have had their contents change</li>
 *   <li>selection_change - called with an array of rows that have had their selection change</li>
 *   <li>row_add - called with an array of rows that have been newly added to the model</li>
 *   <li>row_remove - called with an array of rows that are no longer present in the model</li>
 *   <li>col_width_change - called when there is a metadata change that only affects column widths</li>
 *   <li>client_filter - called when a filter is run on the client, not the server</li>
 * </ul>
 */

blist.namespace.fetch('blist.data');

(function($) {
    /**
     * This class provides functionality for managing a table of data.
     */
    blist.data.Model = function(meta)
    {
        var self = this;

        var curOptions = {
            blankRow: false,
            filterMinChars: 3,
            initialResponse: null,
            pageSize: 50,
            view: null
        };

        // Count of special rows added to main set
        var specialCount = 0;

        // The special rows to interweave into rows
        var specialRows = {};
        var specialLookup = {};

        // Event listeners
        var listeners = [];

        // Undo/redo buffer
        var undoBuffer = [];
        var redoBuffer = [];

        // TODO: gone?
        var dataChange = function()
        {
            self.unselectAllRows(true);
            $(listeners).trigger('load', [ self ]);
        };

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
                            { configureActive(); });
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

        // TODO: listeners gone?
        /**
         * Add a model listener.  A model listener receives events fired by the model.
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


        this.loadRows = function(start, stop, callback)
        {
            if ($.isBlank(this.view)) { return false; }

            // Adjust max & min account for special rows, so we get real
            // offsets to the server
            var specToStop = countSpecialTo(stop);
            var adjStop = stop - specToStop;
            var specToStart = countSpecialTo(start);
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
                if (_.isFunction(callback)) { callback(modelRows); }
            };

            this.view.getRows(adjStart, adjStop - adjStart, gotRows);

            return true;
        };

        this.getAggregates = function(callback)
        {
            if ($.isBlank(this.view)) { return false; }

            this.view.getAggregates(callback);

            return true;
        };

        // TODO: gone?
//        var getColumnLevel = function(columns, id) {
//            var level = columns[id];
//            if (!level) {
//                level = columns[id] = [];
//                level.id = id;
//            }
//            return level;
//        };

        // TODO: gone?
//        var translateViewColumns = function(view, viewCols, columns, allColumns,
//            nestDepth, nestedIn)
//        {
//            var levelCols = getColumnLevel(columns, nestDepth);
//
//            var filledTo = 0;
//            var addNestFiller = function()
//            {
//                if (filledTo < levelCols.length)
//                {
//                    var fillFor = [];
//                    for (var i = filledTo; i < levelCols.length; i++)
//                    { fillFor.push(levelCols[i]); }
//                    filledTo = levelCols.length + 1;
//                    getColumnLevel(columns, nestDepth + 1).push({
//                        type: 'fill',
//                        fillFor: fillFor
//                    });
//                }
//                else { filledTo++; }
//            };
//
//            for (i = 0; i < viewCols.length; i++)
//            {
//                if (nestedIn) {
//                    col.nestedIn = nestedIn;
//                    col.dataLookupExpr = nestedIn.header.dataLookupExpr +
//                        _.isString(col._lookup) ? ('.' + col._lookup ) :
//                            ('[' + col._lookup + ']');
//                }
//
//                switch (col.type)
//                {
//                    case 'nested_table':
//                        // Create the "body" column that appears in the next level
//                        var children = [];
//                        col.body = {
//                            type: 'nested',
//                            children: children,
//                            header: col
//                        };
//                        col.metaChildren = [];
//                        col.dataMungeChildren = [];
//                        translateViewColumns(view, vcol.childColumns, columns,
//                            allColumns, nestDepth + 1, col.body);
//
//                        if (!vcol.flags || $.inArray("hidden", vcol.flags) < 0)
//                        {
//                            // Add the body column to the next nesting level
//                            addNestFiller();
//                            if (columns[nestDepth + 1])
//                            { columns[nestDepth + 1].push(col.body); }
//                        }
//
//                        break;
//                }
//
//                if (!vcol.flags || $.inArray("hidden", vcol.flags) < 0)
//                {
//                    if (nestedIn) { nestedIn.children.push(col); }
//                    else { levelCols.push(col); }
//                }
//            }
//
//            // Add filler for trailing unnested columns to the next nesting
//            // depth if applicable
//            if (columns[nestDepth + 1]) { addNestFiller(); }
//        };

        // TODO: gone?
        /**
         * Get and/or set the metadata for the model.
         */
        this.meta = function(newMeta)
        {
            if (newMeta)
            {
                // Columns may be different, so our undo/redo is no longer valid
                resetUndo();

                meta = newMeta;
            }
            return meta;
        };

        var addItemsToObject = function(obj, values, index)
        {
            var numInserts = values.length;
            // Get all larger indexes
            var adjustIndexes = [];
            _.each(obj, function(r, i)
                { if (i >= index) { adjustIndexes.push(parseInt(i)); } });
            // Sort descending so we don't collide while moving
            adjustIndexes.sort(function(a, b) { return b - a; });
            // Move each index up one
            _.each(adjustIndexes, function(i)
            {
                obj[i + numInserts] = obj[i];
                delete obj[i];
            });
            // Add all the new values
            _.each(values, function(v, i) { obj[index + parseInt(i)] = v; });
        };

        var removeItemsFromObject = function(obj, index, numItems)
        {
            // Remove specified number of items
            for (var i = 0; i < numItems; i++)
            { delete obj[index + i]; }

            // Get all larger indexes
            var adjustIndexes = [];
            _.each(obj, function(r, i)
                { if (i > index) { adjustIndexes.push(parseInt(i)); } });
            // Sort ascending so we don't collide while moving
            adjustIndexes.sort(function(a, b) { return a - b; });
            // Move each item down one
            _.each(adjustIndexes, function(i)
            {
                obj[i - numItems] = obj[i];
                delete obj[i];
            });
        };

        /**
         * Remove rows from the model.
         */
        this.removeRows = function(delRowIds, skipUndo)
        {
            delRowIds = $.makeArray(delRowIds);

            if (!skipUndo)
            { this.addUndoItem({type: 'delete', rows: delRowIds}); }

            // TODO: Deal with expanded rows, selected rows
            this.view.removeRows(delRowIds);

//            for (var i = 0; i < delRows.length; i++)
//            {
//                if (row.expanded) { this.expand(row, false); }
//                this.unselectRow(row);
        };

        // TODO: proxy
        this.removeChildRows = function(fakeRows, parCol, serverDelete, skipUndo)
        {
            if (!(fakeRows instanceof Array) || fakeRows.id)
            { fakeRows = [fakeRows]; }

            var removedRows = [];
            $.each(fakeRows, function(i, fr)
            {
                var parRow = fr.parent;
                var subRow = self.getRowValue(fr, parCol);
                var subRowSet = self.getRowValue(parRow, parCol);
                for (var j = 0; j < subRowSet.length; j++)
                {
                    if (subRow.id == subRowSet[j].id)
                    {
                        subRowSet.splice(j, 1);
                        subRow.origPosition = j;
                        removedRows.push({row: subRow, parentRow: parRow});
                        break;
                    }
                }
                resetChildRows(parRow);

                if (serverDelete)
                {
                    //startRowChange();
                    if (pendingRowEdits[fr.id])
                    {
                        pendingRowDeletes[fr.id] = {subRow: subRow,
                            parRow: parRow, parCol: parCol};
                    }
                    else
                    {
                        serverDeleteRow(subRow.uuid, parCol.id, parRow.uuid);
                    }
                }
            });

            if (!skipUndo && serverDelete)
            {
                this.addUndoItem({type: 'childDelete', rows: removedRows,
                    parentColumn: parCol});
            }

        };

        // Get the value in a row for a column
        this.getRowValue = function(row, column)
        {
            if ($.isBlank(row)) { return undefined; }

            if (row.invalid[column.id]) { return null; }

            return row[column._lookup];
        };

        // Get the invalid value in a row for a column
        this.getInvalidValue = function(row, column)
        {
            if ($.isBlank(row)) { return undefined; }

            if (!row.invalid[column.id]) { return null; }

            return row[column._lookup];
        };

        this.isCellError = function(row, column)
        {
            return row.error[column.id];
        };

        var resetChildRows = function(row)
        {
            if (row.expanded)
            {
                self.expand(row, false, true);
                delete row.childRows;
                self.expand(row, true, true);
                configureActive();
            }
            else
            { delete row.childRows; }
        };

        var saveUID = 0;
        var pendingRowEdits = {};
        var pendingRowDeletes = {};

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
//                if (!skipUndo) { this.addUndoItem({type: 'create', rows: [row]}); }
            }

            // Fetch prev value for undo
//            if (!skipUndo && !isCreate)
//            {
//                this.addUndoItem({type: 'edit', column: column,
//                        row: row, value: prevValue, invalid: prevValueInvalid});
//            }

            this.view.setRowValue(value, row.id, column.id, !isValid);
            this.view.saveRow(row.id);

//            var prevValue;
//            var prevValueInvalid = false;
//            if (column)
//            {
//                prevValue = this.getRowValue(row, column);
//                if (prevValue === null || prevValue === undefined)
//                {
//                    prevValue = this.getInvalidValue(row, column);
//                    prevValueInvalid = prevValue !== null;
//                }
//            }

            // TODO: nt
//            if (column && column.nestedIn)
//            {
//                var parCol = column.nestedIn.header;
//
//                var childRow = self.getRowValue(row, parCol);
//                isCreate = childRow.type == 'blank';
//                if (isCreate)
//                {
//                    delete childRow.type;
//                    var parRow = row.parent;
//
//                    // Since child rows get re-created, save the index and pull
//                    // out the new one
//                    var curRowI = this.index(row);
//
//                    // If we're in a blank row, create that row first
//                    if (parRow.type == 'blank')
//                    {
//                        this.saveRowValue(null, parRow, null, true);
//                        skipUndo = true;
//                    }
//
//                    // Add the new row to the parent
//                    if (!parRow[parCol.dataIndex])
//                    { parRow[parCol.dataIndex] = []; }
//                    parRow[parCol.dataIndex].push(childRow);
//
//                    // Now force refresh by collapsing, clearing
//                    // child rows, and then re-expanding.
//                    resetChildRows(parRow);
//                    row = this.get(curRowI);
//                    if (!row.saving) { row.saving = []; }
//
//                    if (!skipUndo) { this.addUndoItem({type: 'childCreate',
//                        rows: [row], parentColumn: parCol}); }
//                }
//
//                setRowMetadata([row], parCol.metaChildren,
//                    parCol.dataMungeChildren);
//
//                if (!row.saving[parCol.dataIndex])
//                { row.saving[parCol.dataIndex] = []; }
//                row.saving[parCol.dataIndex][column.dataIndex] = true;
//                if (row.error && row.error[parCol.dataIndex])
//                { delete row.error[parCol.dataIndex][column.dataIndex]; }
//            }

        };

        // TODO: Wow this is messy
        var undeleteRow = function(row, parentRow, parentColumn, childCascade)
        {
            // First set up the data we're sending, and include the original
            //  position
            var data = {};
            data.position = row.position;

            // We need to set up the columns & array to record saving info
            //  in, based on whether or not we are a child row
            var columns = parentColumn === undefined ?
                meta.view.columns : parentColumn.body === undefined ?
                    parentColumn.childColumns : parentColumn.body.children;
            var fakeRow;
            var savingArray;
            if (parentRow !== undefined && parentRow.childRows !== undefined)
            {
                fakeRow = parentRow.childRows[row.origPosition];
                if (fakeRow)
                {
                    if (!fakeRow.saving) { fakeRow.saving = []; }
                    fakeRow.saving[parentColumn.dataIndex] = [];
                    savingArray = fakeRow.saving[parentColumn.dataIndex];
                }
            }
            else { savingArray = row.saving = []; }

            var undeleteChildren = [];
            // Now set up all the data to be saved
            $.each(columns, function(i, c)
            {
                if (c.dataTypeName == 'tag')
                {
                    data['_tags'] = row[c.dataIndex];
                    savingArray[c.dataIndex] = true;
                }
                else if (c.dataTypeName == 'nested_table')
                {
                    if (row[c.dataIndex] instanceof Array)
                    {
                        // keep track of nested rows so we can re-post them along
                        // with the parent row
                        $.each(row[c.dataIndex], function(j, cr)
                        {
                            cr.origPosition = j;
                            undeleteChildren.push({parentRow: row, row: cr,
                                parentColumn: meta.allColumns[c.id]});
                        });
                    }
                }
                else if (c.id > -1)
                {
                    data[c.id] = row[c.dataIndex];
                    savingArray[c.dataIndex] = true;
                }
            });
            if (row.meta) { data.meta = JSON.stringify(row.meta); }

            // Set it up like a new row
            row.isNew = true;
            var oldID = row.id;
            row.id = 'saving' + saveUID++;
            delete row.uuid;

            pendingRowEdits[row.id] = pendingRowEdits[oldID];
            delete pendingRowEdits[oldID];
            pendingRowDeletes[row.id] = pendingRowDeletes[oldID];
            delete pendingRowDeletes[oldID];

            if (parentRow !== undefined)
            {
                // If we are a child row, then stick the row back into the
                //  parent, and update rows
                if (!childCascade)
                {
                    var subRowSet = self.getRowValue(parentRow, parentColumn);
                    subRowSet.splice(row.origPosition, 0, row);
                }
                resetChildRows(parentRow);

                if (parentRow.childRows !== undefined)
                {
                    fakeRow = parentRow.childRows[row.origPosition];
                    // Copy over the saving info for the UI
                    fakeRow.saving[parentColumn.dataIndex] = savingArray;
//                    self.change([fakeRow]);
                }

                registerRowSave(fakeRow, 'all', data, true, row, parentRow,
                    parentColumn);
            }
            else
            {
                // Stick the row back in and update things
//                addItemsToObject(rows, [row], row.origPosition);
                totalRows++;
                //if (active != rows)
                //{ addItemsToObject(active, [row], row.origActivePosition); }
                configureActive();
                $(listeners).trigger('row_add', [ [row] ]);

                registerRowSave(row, 'all', data, true);

                $.each(undeleteChildren, function(i, cr)
                {
                    undeleteRow(cr.row, cr.parentRow, cr.parentColumn, true);
                });
            }
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
                    if (curValue === null || curValue === undefined)
                    {
                        curValue = self.getInvalidValue(item.row, item.column);
                        isInvalid = curValue !== null;
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
                        rows: $.map(item.rows, function(r, i)
                            { return {parentRow: r.parent,
                                row: fakeRowToChild(r, item.parentColumn)}; }),
                        parentColumn: item.parentColumn};

                    self.removeChildRows(item.rows, item.parentColumn,
                        true, true);
                    break;
                case 'delete':
                    oppItem = {type: 'create', rows: item.rows.slice()};

                    item.rows.reverse();
                    $.each(item.rows, function(i, r) { undeleteRow(r); });
                    break;
                case 'childDelete':
                    var reversedRows = item.rows.slice();
                    reversedRows.reverse();
                    $.each(reversedRows, function(i, r)
                        { undeleteRow(r.row, r.parentRow,
                            item.parentColumn); });

                    oppItem = {type: 'childCreate',
                        rows: $.map(item.rows, function(r, i)
                                { return [childRowToFake(r.parentRow,
                                    r.row.origPosition)]; }),
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
            if (parentRow.childRows === undefined || parentRow.childRows === null)
            { getChildRows(parentRow); }
            return parentRow.childRows[childRowPos];
        };

        var fakeRowToChild = function(fakeRow, parentColumn)
        {
            return fakeRow[parentColumn.dataIndex];
        };

        // TODO: proxy
        this.moveColumn = function(oldPosOrCol, newPos)// now takes column
        {
            // First update widths on view columns, since they may have been
            // updated on the model columns
            $.each(meta.columns, function(i, colList)
            {
                $.each(colList, function(j, c)
                {
                    if (c.dataIndex)
                    {
                        meta.view.columns[c.dataIndex].width = c.width;
                    }
                });
            });

            var column = null;
            var oldPos = -1;
            if (typeof oldPosOrCol == 'object')
            {
                column = oldPosOrCol;
                if (column.flags !== undefined &&
                    _.include(column.flags, 'hidden'))
                { column.flags = _.without(column.flags, 'hidden'); }
            }
            else
            { oldPos = oldPosOrCol; }

            // Filter view columns down to just the visible, and sort them
            var viewCols = $.grep(meta.view.columns, function(c)
                { return c.dataTypeName != 'meta_data' &&
                    (!c.flags || $.inArray('hidden', c.flags) < 0); });
            viewCols.sort(function(col1, col2)
                { return col1.position - col2.position; });

            if (column !== null)
            { oldPos = _.indexOf(viewCols, column); }

            // Stick the column in the new spot, then remove it from the old
            viewCols.splice(newPos, 0, viewCols[oldPos]);
            viewCols.splice((newPos < oldPos ? oldPos + 1 : oldPos), 1);

            // Update the adjusted positions
            $.each(viewCols, function(i, c) { c.position = i + 1; });

            // Null out the meta columns, and then force a reset
            meta.columns = null;
            this.meta(meta);
            $(listeners).trigger('columns_rearranged', [ this ]);
        };

        /**
         * Notify listeners of row selectionchanges.
         */
        this.selectionChange = function(rows)
        {
            $(listeners).trigger('selection_change', [ rows ]);
        };

        /**
         * Notify the model of column width changes.  This function allows clients to perform optimized rendering vs.
         * completely replacing all metadata.
         */
        this.colWidthChange = function(col, isFinished) {
            $(listeners).trigger('col_width_change', [ col, isFinished ]);
        };

        this.undoRedoChange = function()
        {
            $(listeners).trigger('undo_redo_change');
        };

        /**
         * Retrieve a single row by index.
         */
        this.get = function(index)
        {
            if ($.isBlank(this.view)) { return undefined; }
            return specialRows[index] ||
                this.view.rowForIndex(index - countSpecialTo(index));
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
            return (this.view || {}).visibleColumns || [];
        };

        this.columnForID = function(id)
        {
            return !$.isBlank(this.view) ?
                this.view.columnForID(id) : null;
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
            return (this.view || {}).totalRows || -1;
        };

        /**
         * Retrieve the columns for a level.
         */
        this.level = function(id) {
            return meta.columns[id];
        };

        /**
         * Scan to find the next or previous row in the same level.
         */
        this.nextInLevel = function(from, backward) {
            var pos = from;
            var level = 0;
//            if (active[pos] !== undefined) { level = active[pos].level || 0; }
//            if (backward)
//            {
//                while (--pos >= 0)
//                {
//                    if ((active[pos] !== undefined ?
//                        (active[pos].level || 0) : 0) == level)
//                    { return pos; }
//                }
//            }
//            else
//            {
//                // TODO: special
//                var end = 0;//activeCount;
//                while (++pos < end)
//                {
//                    if (active[pos] === undefined ||
//                        (active[pos].level || 0) == level)
//                    { return pos; }
//                }
//            }
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

            this.selectedRows[row.id] = row.index + countSpecialTo(row.index);
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

            var curIndex = row.index + countSpecialTo(row.index);
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

            var cols = meta.columns[row.level || 0];
            var childRows = row.childRows = [];
            var childLevel = (row.level || 0) + 1;

            for (var i = 0; i < cols.length; i++)
            {
                var col = cols[i];
                if (!col.body) { continue; }

                var cell = row[col.dataIndex];
                if (!cell && !self.useBlankRows()) { continue; }
                if (!cell) { cell = []; }

                var numCells = (cell.length || 0) + (self.useBlankRows() ? 1 : 0);
                for (var j = 0; j < numCells; j++) {
                    var childRow = childRows[j];
                    if (!childRow)
                    {
                        childRow = childRows[j] = [];
                        childRow.id = "t" + nextTempID++;
                        childRow.level = childLevel;
                        childRow.parent = row;
                    }

                    // Set up saving & error arrays so we don't need to do
                    // two level checks in the row renderer
                    if (!childRow.saving) { childRow.saving = []; }
                    childRow.saving[col.dataIndex] = [];
                    if (!childRow.error) { childRow.error = []; }
                    childRow.error[col.dataIndex] = [];
                    childRow[col.dataIndex] = cell[j];
                    if (!childRow[col.dataIndex])
                    {
                        childRow[col.dataIndex] = [];
                        childRow[col.dataIndex].type = 'blank';
                    }
//                    setRowMetadata([childRow[col.dataIndex]], col.metaChildren,
//                        col.dataMungeChildren);
                }
            }

            if (childRows.length)
            { childRows[childRows.length - 1].groupLast = true; }
            return childRows;
        };

        /**
         * Open or close a row (open rows display nested records).
         */
        var nextTempID = 0;
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

                // Install child rows into the active set if the row is open
//                if (active == rows)
//                { active = _.clone(rows); }
//                var i = parseInt(activeLookup[row.id]);
//                addItemsToObject(active, childRows, i + 1);
                // TODO: special
                //activeCount += childRows.length;
            }
            else
            {
                // Remove the child rows
//                if (row.childRows && row.childRows.length)
//                {
//                    var i = parseInt(activeLookup[row.id]);
//                    removeItemsFromObject(active, i + 1,
//                        row.childRows.length);
                // TODO: special
                    //activeCount -= row.childRows.length;
                    //if (active == rows) { totalRows = activeCount; }
                //}
            }

            // Record the new row state
            row.expanded = open;

            // Update IDs for the rows that moved

            // Fire events
//            if (!skipEvent) { this.change([ row ]); }
        };


        // Apply filtering, grouping, and sub-row expansion to the active set.
        // This applies current settings to the active set and then notifies
        // listeners of the data change.
        var configureActive = function()
        {
            var idChange = removeSpecialRows();
            if (doExpansion()) { idChange = true; }

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
                idChange = true;
            }

            dataChange();
        };

        var countSpecialTo = function(max)
        {
            var count = 0;
            if ($.isBlank(max)) { max = self.length(); }
            _.each(specialRows, function(r, i)
            {
                if (parseInt(i) < max) { count++; }
            });
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

        // Expand rows that the user has opened
        var doExpansion = function()
        {
            var toExpand = [];
//            _.each(active, function(r, i)
//            {
//                if (r.expanded) { toExpand.push(parseInt(i)); }
//            });

            toExpand.sort(function(a,b) { return b - a; });
            // TODO: special
            _.each(toExpand, function(i)
            {
//                var childRows = getChildRows(active[i]);
//                addItemsToObject(active, childRows, i + 1);
                //activeCount += childRows.length;
            });
            //if (active == rows) { totalRows = activeCount; }

            return toExpand.length > 0;
        };

        // Install initial metadata
        if (meta) { this.meta(meta); }
        else { this.meta({}); }
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
