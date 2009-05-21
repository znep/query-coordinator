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
 *   <li>name - the name displayed as the title of the grid</li>
 * </ul>
 *
 * Columns are described using an object with the following fields:
 *
 * <ul>
 *   <li>name - the display name of the column<li>
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
 *   <li>expanded - true iff the row is in a selected state
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
 *   <li>row_add - called with an array of rows that have been newly added to the model</li>
 *   <li>row_remove - called with an array of rows that are no longer present in the model</li>
 * </ul>
 */

blist.namespace.fetch('blist.data');

(function($) {
    /**
     * This class provides functionality for managing a table of data.
     */
    blist.data.Model = function(meta, rows) {
        var self = this;

        var curOptions = {
            filterMinChars: 3,
            pageSize: 50,
            progressiveLoading: false
        };

        // Count number of loaded rows, so we know when to disable progressive
        // loading
        var rowsLoaded = 0;

        // The active dataset (rows or a filtered version of rows)
        var active = [];

        // Row lookup-by-ID
        var lookup = {};
        var activeLookup = {};

        // Event listeners
        var listeners = [];

        // Sorting configuration
        var sortConfigured;
        var orderFn;
        var orderPrepro;
        var orderCol;

        // Filtering configuration
        var filterFn;
        var filterText = "";
        var filterTimer;

        // Expanded row configuration
        var expanded;

        // Grouping configuration
        var groupFn;

        // Data translation
        var translateFn = null;

        // Data load configuration
        var autoBaseURL = true;
        var baseURL = null;
        var supplementalAjaxOptions = null;

        var columnType = function(index) {
            if (meta.columns) {
                var column = meta.columns[0][index];
                if (column) {
                    var type = blist.data.types[column.type];
                    if (type)
                        return type;
                }
            }
            return blist.data.types.text;
        }

        /**
         * Create a mapping of ids to positions for both rows & active
         *  (since these arrays may be different)
         */
        var installIDs = function(activeOnly)
        {
            if (!activeOnly || rows == active)
            {
                // Count the total number of rows we have actual data for
                rowsLoaded = 0;
                for (var i = 0; i < rows.length; i++)
                {
                    var row = rows[i];
                    if (typeof row == 'object')
                    {
                        var id = row.id || row[0];
                        rowsLoaded++;
                    }
                    else
                    {
                        id = row;
                    }
                    lookup[id] = i;
                    if (rows == active)
                    {
                        activeLookup[id] = i;
                    }
                }
            }
            if (rows != active)
            {
                for (i = 0; i < active.length; i++)
                {
                    row = active[i];
                    if (typeof row == 'object')
                    {
                        id = row.id || row[0];
                    }
                    else
                    {
                        id = row;
                    }
                    activeLookup[id] = i;
                }
            }
        };

        var dataChange = function()
        {
            $(listeners).trigger('load', [ self ]);
        };

        /**
         * Set options
         */

        this.options = function (newOpt)
        {
            if (newOpt)
            {
                $.extend(curOptions, newOpt);
            }
            return this;
        };

        /**
         * Whether or not to do progressive loading from the server,
         * i.e., whether or not to do sorting & filtering locally
         */
        this.isProgressiveLoading = function()
        {
            return curOptions.progressiveLoading && rowsLoaded < rows.length;
        };

        /**
         * Access the dataset title.
         */
        this.title = function()
        {
            return meta.title || (meta.view && meta.view.name) || "";
        };

        /**
         * Add a model listener.  A model listener receives events fired by the model.
         */
        this.addListener = function(listener)
        {
            var pos = $.inArray(listener, listeners);
            if (pos == -1)
                listeners.push(listener);
        };

        /**
         * Remove a model listener.
         */
        this.removeListener = function(listener)
        {
            var pos = $.inArray(listener, listeners);
            if (pos == -1)
                listeners = listeners.splice(pos, 1);
        };

        /**
         * Set the metadata and rows for the model.
         */
        this.load = function(config)
        {
            if (config.meta)
                this.meta(config.meta);
            if (config.rows || config.data)
                this.rows(config.rows || config.data);
        };

        /**
         * Configure a function for translating server requests to client requests.
         */
        this.translate = function(newTranslateFn)
        {
            translateFn = newTranslateFn;
        };

        /**
         * Load the metadata and rows for the model via an AJAX request.
         */
        this.ajax = function(ajaxOptions)
        {
            if (typeof ajaxOptions != 'object')
                ajaxOptions = {
                    url: ajaxOptions
                }
            supplementalAjaxOptions = $.extend({}, ajaxOptions);
            if (curOptions.progressiveLoading)
            {
                ajaxOptions.data = $.extend({}, ajaxOptions.data,
                    {include_ids_after: curOptions.pageSize});
            }
            doLoad(this, this.load, ajaxOptions);
        };

        var doLoad = function(model, onLoad, ajaxOptions)
        {
            if (!ajaxOptions.success)
            {
                if (!ajaxOptions.dataType)
                    ajaxOptions.dataType = 'json';
                ajaxOptions.success = function(config) {
                    if (translateFn)
                        config = translateFn.apply(this, [ config ]);
                    onLoad.apply(model, [ config ]);
                }
                ajaxOptions.complete = function() {
                    $(listeners).trigger('after_load');
                }
            }
            if (!$(listeners).trigger('before_load', [ ajaxOptions ]))
                return;

            if (autoBaseURL) {
                var url = ajaxOptions.url;
                var endOfProt = url.indexOf('://');
                if (endOfProt != -1) {
                    endOfProt += 3;
                    var endOfHost = url.indexOf('/', endOfProt);
                    if (endOfHost == -1)
                        baseURL = url;
                    else
                        baseURL = url.substring(0, endOfHost);

                } else
                    baseURL = '';
            }
            $.ajax(ajaxOptions);
        };

        /**
         * Load a set of rows.  The table must have been populated via AJAX for this to succeed.  Supplementary
         * requests will be requested of the original URL using ids[] query parameters in the POST body.
         *
         * @param rows an array of row IDs
         */
        this.loadRows = function(rowsToLoad)
        {
            if (!supplementalAjaxOptions)
            {
                return;
            }

            var ajaxOptions = $.extend({},
                    supplementalAjaxOptions,
                    { data: $.extend({}, supplementalAjaxOptions.data,
                        { ids: rowsToLoad }) });
            doLoad(this, onSupplementalLoad, ajaxOptions);
        };

        var onSupplementalLoad = function(response)
        {
            // Install the rows
            var supplement = response.data;
            for (var i = 0; i < supplement.length; i++)
            {
                var row = supplement[i];
                var id = row.id || row[0];
                var index = lookup[id];
                if (index != null)
                {
                    rows[index] = row;
                    rowsLoaded++;
                }
                if (rows != active)
                {
                    index = activeLookup[id];
                    if (index != null)
                    {
                        active[index] = row;
                    }
                }
            }

            // Notify listeners of row load via the "change" event
            this.change(supplement);
        };

        var translatePicklistFromView = function(col) {
            var values = col.dataType && col.dataType.picklist && col.dataType.picklist.values;
            if (values) {
                var options = col.options = {};
                for (var j = 0; j < values.length; j++) {
                    var value = values[j];
                    options[typeof value.id == "string" ? value.id.toLowerCase() : value.id] = { text: value.description, icon: value.icon };
                }
            }
            return options;
        }

        var translateViewColumns = function(view, viewCols, columns, nestDepth, nestedIn) {
            if (!viewCols)
                return;

            viewCols = viewCols.slice();
            for (var i = 0; i < viewCols.length; i++)
                viewCols[i].dataIndex = i;
            viewCols.sort(function(col1, col2) { return col1.position - col2.position; });

            var levelCols = columns[nestDepth] || (columns[nestDepth] = []);
            
            var filledTo = 0;
            var addNestFiller = function() {
                if (filledTo < levelCols.length) {
                    var fillFor = [];
                    for (var i = filledTo; i < levelCols.length; i++)
                        fillFor.push(levelCols[i]);
                    filledTo = levelCols.length + 1;
                    (columns[nestDepth + 1] || (columns[nestDepth + 1] = [])).push({
                        type: 'fill',
                        fillFor: fillFor
                    });
                }
            }

            for (i = 0; i < viewCols.length; i++) {
                var vcol = viewCols[i];
                if (!vcol.position || (vcol.flags && $.inArray("hidden", vcol.flags) != -1))
                    continue;
                var col = {
                    name: vcol.name,
                    width: vcol.width || 100,
                    type: vcol.dataType && vcol.dataType.type ? vcol.dataType.type : "text",
                    id: vcol.id
                };

                var dataIndex = vcol.dataIndex;
                if (nestedIn)
                    col.dataLookupExpr = nestedIn.header.dataLookupExpr + "[" + dataIndex + "]";
                else {
                    col.dataIndex = dataIndex;
                    col.dataLookupExpr = "[" + dataIndex + "]";
                }

                switch (col.type)
                {
                    case 'picklist':
                        col.options = translatePicklistFromView(vcol);
                        break;

                    case 'photo':
                    case 'document':
                        col.base = baseURL + "/views/" + view.id + "/files/";
                        break;

                    case 'blist_in_blist':
                    case 'table':
                        // Create the "body" column that appears in the next level
                        var children = [];
                        col.body = {
                            type: 'nested',
                            children: children,
                            header: col
                        };
                        translateViewColumns(view, vcol.childColumns, columns, nestDepth + 1, col.body);

                        // Add the body column to the next nesting level
                        addNestFiller();
                        columns[nestDepth + 1].push(col.body);

                        break;
                }
                
                var format = vcol.format;
                if (format)
                {
                    if (col.type == "text" && format.formatting_option == "Rich")
                    {
                        col.type = "richtext";
                    }
                    if (col.type == "stars" &&
                        format.view == "stars_number")
                    {
                        col.type = "number";
                    }
                    else if (format.view)
                    {
                        col.format = vcol.format.view;
                    }
                    if (format.range)
                    {
                        col.range = format.range;
                    }
                    if (format.precision)
                    {
                        // This isn't actual precision, it's decimal places
                        col.decimalPlaces = format.precision;
                    }
                }

                if (nestedIn)
                    nestedIn.children.push(col);
                else
                    levelCols.push(col);
            }

            // Add filler for trailing unnested columns to the next nesting depth if applicable
            if (columns[nestDepth + 1])
                addNestFiller();
        }

        /**
         * Get and/or set the metadata for the model.
         */
        this.meta = function(newMeta)
        {
            if (newMeta)
            {
                // Ensure the meta has a columns object, even if it is empty
                meta = newMeta;
                if (!meta.columns)
                {
                    meta.columns = [[]];
                    if (meta.view)
                    {
                        translateViewColumns(meta.view, meta.view.columns, meta.columns, 0);
                    }
                }

                // Assign a unique numeric to each column
                var nextID = 0;
                var assignUIDs = function(cols) {
                    for (var i = 0; i < cols.length; i++) {
                        cols[i].uid = nextID++;
                        if (cols[i].children)
                            assignUIDs(cols[i].children);
                    }
                }
                for (var i = 0; i < meta.columns.length; i++) {
                    var levelCols = meta.columns[i];
                    assignUIDs(levelCols);
                }

                // Configure root column sorting based on view configuration if a view is present
                var rootColumns = meta.columns[0];
                if (meta.view && meta.view.sortBys && meta.view.sortBys.length > 0)
                {
                    var s = meta.view.sortBys[0];
                    meta.sort = {ascending: s.flags != null &&
                        $.inArray('asc', s.flags) >= 0};
                    $.each(rootColumns, function (i, c)
                    {
                        if (rootColumns[c.dataIndex].id == s.viewColumnId)
                        {
                            meta.sort.column = c;
                            return false;
                        }
                    });
                }

                // For each column at the root nesting level, ensure that dataIndex is present, and that a
                // "dataLookupExpr" is present.  Other levels must configure these explicitly.
                for (i = 0; i < rootColumns.length; i++)
                {
                    var col = rootColumns[i];
                    var dataIndex = col.dataIndex;
                    if (!dataIndex == undefined)
                    {
                        dataIndex = col.dataIndex = i;
                    }
                    if (!col.dataLookupExpr)
                        if (typeof dataIndex == "string")
                        {
                            col.dataLookupExpr = "['" + dataIndex + "']";
                        }
                        else
                        {
                            col.dataLookupExpr = '[' + dataIndex + ']';
                        }
                }

                // Notify listeners of the metadata change
                $(listeners).trigger('meta_change', [ this ]);
            }
            return meta;
        };

        /**
         * Get and/or set the rows for the model.  Returns only "active" rows,
         * that is, those that are visible.
         */
        this.rows = function(newRows)
        {
            if (newRows)
            {
                expanded = {};
                active = rows = newRows;
                installIDs();

                // Apply sorting if so configured
                if (sortConfigured)
                {
                    doSort();
                }

                // Apply filtering and grouping
                configureActive(active);
            }

            return active;
        };

        /**
         * Add rows to the model.
         */
        this.add = function(addedRows)
        {
            rows = rows.concat(addedRows);
            if (active != rows)
            {
                active = active.concat(addedRows);
            }
            installIDs();
            $(listeners).trigger('row_add', [ addedRows ]);
        };

        /**
         * Remove rows from the model.
         */
        this.remove = function(rows) {
            for (var row in rows) {
                var id = row.id || row[0];
                var index = lookup[id];
                if (index)
                {
                    delete lookup[id];
                    if (index != undefined)
                    {
                        rows.splice(index, 1);
                        rowsLoaded--;
                    }
                }
                if (rows != active)
                {
                    index = activeLookup[id];
                    if (index)
                    {
                        delete activeLookup[id];
                        if (index != undefined)
                        {
                            active.splice(index, 1);
                        }
                    }
                }
            }
            $(listeners).trigger('row_remove', [ rows ]);
        }

        /**
         * Notify the model of row changes.
         */
        this.change = function(rows) {
            $(listeners).trigger('row_change', [ rows ]);
        }

        /**
         * Retrieve a single row by index.
         */
        this.get = function(index) {
            return active[index];
        }

        /**
         * Retrieve a single row by ID.
         */
        this.getByID = function(id)
        {
            var index = lookup[id];
            return index == undefined ? undefined : rows[index];
        };

        /**
         * Retrieve the total number of rows.
         */
        this.length = function(id) {
            return active.length;
        }

        /**
         * Sort the data.
         *
         * @param order either a column index or a sort function
         * @param descending true to sort descending if order is a column index
         */
        this.sort = function(order, descending)
        {
            // Load the types
            if (typeof order == 'function')
            {
                orderFn = order;
            }
            else
            {
                // Column reference expressions
                if (typeof order == 'object')
                {
                    orderCol = order;
                }
                else
                {
                    orderCol = meta.columns[0][order];
                }

                meta.sort = {column: orderCol, ascending: !descending};

                // Update the view in-memory, so we can always serialize it to
                //  the server and get the correct sort options
                meta.view.sortBys = [{
                    viewColumnId: orderCol.id,
                    asc: !descending
                }];

                var r1 = "a" + orderCol.dataLookupExpr;
                var r2 = "b" + orderCol.dataLookupExpr;

                // Swap expressions for descending sort
                if (descending)
                {
                    var temp = r1;
                    r1 = r2;
                    r2 = temp;
                }

                // Compile an ordering function specific to the column positions
                var sortGen = columnType(order).sortGen;
                if (sortGen)
                {
                    orderFn = sortGen(r1, r2);
                }
                else
                {
                    orderFn = null;
                }

                // Record preprocessing function for when we actually perform
                // the sort
                orderPrepro = columnType(order).sortPreprocessor;
                if (orderPrepro && !orderFn)
                {
                    if (descending)
                    {
                        orderFn = function(a, b) {
                            return a[0] > b[0] ? -1 : a[0] < b[0] ? 1 : 0;
                        }
                    }
                    else
                    {
                        orderFn = function(a, b) {
                            return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
                        }
                    }
                }

                // Install the grouping function, if applicable
                if (orderCol.group === true)
                {
                    groupFn = columnType(order).group;
                }
                else
                {
                    groupFn = orderCol.group;
                }

                sortConfigured = true;
            }

            // Sort
            doSort();

            // If there's an active filter, or grouping function, re-apply now
            // that we're sorted
            configureActive(active);
        };

        var getChildRows = function(row) {
            if (row.childRows)
                return row.childRows;

            var cols = meta.columns[row.level || 0];
            var childRows = row.childRows = [];

            for (var i = 0; i < cols.length; i++) {
                var col = cols[i];
                if (!col.body)
                    continue;
                var cell = row[col.dataIndex];
                if (!cell || !cell.length)
                    continue;
                for (var j = 0; j < cell.length; j++) {
                    var childRow = childRows[j] || (childRows[j] = []);
                    childRow.id = "t" + nextTempID++;
                    childRow.level = (row.level || 0) + 1;
                    childRow[col.dataIndex] = cell[j];
                }
            }
            
            if (childRows.length)
                childRows[childRows.length - 1].groupLast = true;
            return childRows;
        }

        /**
         * Open or close a row (open rows display nested records).
         */
        var nextTempID = 0;
        this.expand = function(row, open) {
            // Determine whether to expand/open or unexpand/close the row
            if (open == undefined)
                open = !row.expanded;
            if (open == row.expanded)
                return;

            // Create child rows
            if (open) {
                // Create the child rows
                var childRows = getChildRows(row);

                // Install child rows into the active set if the row is open
                if (active == rows)
                    active = active.slice();
                for (var i = 0; i < active.length; i++)
                    if (active[i] == row) {
                        var after = active.splice(i + 1, active.length - i + 1);
                        active = active.concat(childRows).concat(after);
                        break;
                    }
            } else {
                // Remove the child rows
                if (row.childRows && row.childRows.length)
                    for (i = 0; i < active.length; i++)
                        if (active[i] == row) {
                            active.splice(i + 1, row.childRows.length);
                            break;
                        }
            }

            // Record the new row state
            row.expanded = open;
            if (open) {
                if (!expanded)
                    expanded = {};
                expanded[row.id || row[0]] = true;
            } else if (expanded)
                delete expanded[row.id || row[0]];

            // Fire events
            dataChange([ row ]);
        }

        /**
         * Get or set the base URL for retrieving child documents.  This is set automatically when you use the ajax
         * calls.
         */
        this.baseURL = function(newBaseURL) {
            if (newBaseURL) {
                baseURL = newBaseURL;
                autoBaseURL = !baseURL;
            }
            return baseURL;
        }

        // Run sorting based on the current filter configuration.  Does not
        // fire events
        var doSort = function()
        {
            removeSpecialRows();

            if (!sortConfigured)
                return;

            if (self.isProgressiveLoading())
            {
                getTempView();
                // Bail out early, since the server does the sorting
                return;
            }

            // Apply preprocessing function if necessary.  We then sort a new
            // array that contains a [ 'value', originalRecord ] pair for each
            // item.  This allows us to avoid complex ordering functions.
            if (orderPrepro) {
                var toSort = new Array(active.length);
                for (var i = 0; i < active.length; i++) {
                    var rec = active[i];
                    toSort[i] = [ orderPrepro(rec[orderCol.dataIndex], orderCol),
                        rec ];
                }
            }
            else
            {
                toSort = active;
            }

            // Perform the actual sort
            if (orderFn)
                toSort.sort(orderFn);
            else
                toSort.sort();

            // If we sorted a preprocessed set, update the original set
            if (orderPrepro)
                for (i = 0; i < toSort.length; i++)
                    active[i] = toSort[i][1];

            // Update ID lookup
            installIDs(true);
        };

        var getTempView = function()
        {
            // If we're doing progressive loading, set up a temporary
            //  view, then construct a query with a special URL and
            //  appropriate params to get rows back for the specified view
            // Don't include columns since we want them all back, and we
            //  don't need to send all that extra data over or modify columns
            //  accidentally
            var tempView = $.extend({}, meta.view,
                    {originalViewId: meta.view.id, columns: null});
            var ajaxOptions = $.extend({},
                    supplementalAjaxOptions,
                    { url: '/views/INLINE/rows.json?' + $.param(
                        $.extend({}, supplementalAjaxOptions.data,
                        {   method: 'index',
                            include_ids_after: curOptions.pageSize
                        })),
                    type: 'POST',
                    contentType: 'application/json',
                    data: $.json.serialize(tempView)
            });
            doLoad(self, loadTempView, ajaxOptions);
        };

        /**
         * When we load the sorted data from the server, we may have
         *  a different set of full rows than was previously loaded, updated
         *  data, or possibly new rows.  We may also have rows that were already
         *  loaded, but did not come back with the sort.  So do some work to
         *  get active & rows in-sync
         */
        var loadTempView = function(config)
        {
            var installActiveOnly = true;
            // active is now the new set of rows from the server, and not
            //  linked-to or based-on rows
            active = config.rows || config.data;
            for (var i = 0; i < active.length; i++)
            {
                // If it is not an object, just an id, try to look it up from rows
                if (typeof active[i] != 'object')
                {
                    var curRow = self.getByID(active[i]);
                    if (curRow == undefined)
                    {
                        rows.push(active[i]);
                        installActiveOnly = false;
                    }
                    else
                    {
                        active[i] = curRow;
                    }
                }
                else
                {
                    // If it is a full row, then update rows with it (even if
                    //  this row was already loaded, since it may have updated data)
                    curRow = active[i];
                    var rowPos = lookup[curRow.id || curRow[0]];
                    if (rowPos == undefined)
                    {
                        rows.push(curRow);
                        installActiveOnly = false;
                        rowsLoaded++;
                    }
                    else
                    {
                        if (typeof rows[rowPos] != 'object')
                        {
                            rowsLoaded++;
                        }
                        rows[rowPos] = curRow;
                    }
                }
            }
            installIDs(installActiveOnly);
            configureActive();
        };

        /**
         * Filter the data.
         *
         * @param filter either filter text or a filtering function
         * @param timeout an optional async delay value (in milliseconds)
         */
        this.filter = function(filter, timeout)
        {
            if (filterTimer)
                clearTimeout(filterTimer);
            // Configure for filtering.  toFilter is an optimized set that may
            // be a subset of all rows if a previous filter is in place.
            var toFilter = configureFilter(filter);

            // If there's nothing to filter, return now
            if (!toFilter || !filterFn)
                return;

            // Filter
            if (timeout)
            {
                // Filter, but only after a short timeout
                filterTimer = setTimeout(function() {
                    window.clearTimeout(filterTimer);
                    configureActive(toFilter || active);
                }, 250);
            }
            else
            {
                configureActive(toFilter);
            }
        };

        var configureFilter = function(filter)
        {
            var toFilter;
            if (typeof filter == "function")
                filterFn = filter;
            else
            {
                if (filter == null)
                    filter = "";
                if (filter == filterText)
                    return null;

                // Clear the filter if it contains less than the minimum characters
                if (filter.length < curOptions.filterMinChars || filter.length == 0)
                {
                    filterFn = null;
                    filterText = "";
                    meta.view.searchString = null;
                    if (self.isProgressiveLoading())
                    {
                        getTempView();
                    }
                    else if (active != rows)
                    {
                        active = rows;
                        configureActive();
                    }
                    return null;
                }

                // Generate a filter function
                var regexp = createRegExp(filter);
                var filterParts = [ "(function(r) { return false" ];
                var rootColumns = meta.columns[0];
                for (var i = 0; i < rootColumns.length; i++)
                {
                    if (columnType(i).filterText)
                    {
                        // Textual column -- apply the regular expression to
                        // each instance
                        filterParts.push(' || (r', rootColumns[i].dataLookupExpr, ' + "").match(regexp)');
                    }
                    else if (rootColumns[i] == "picklist")
                    {
                        // Picklist column -- prefilter and then search by ID
                        var options = rootColumns[i].options;
                        if (options) {
                            var matches = [];
                            for (var key in options)
                                if (options[key].text.match(regexp))
                                    matches.push(key);
                            for (var j = 0; j < matches.length; j++)
                                filterParts.push(' || (r'
                                    + rootColumns[j].dataLookupExpr + ' == "'
                                    + matches[j] + '")');
                        }
                    }
                }
                filterParts.push("; });");
                filterFn = new Function('regexp',
                    'return ' + filterParts.join(''))(regexp);

                // Filter the current filter set if the filter is a subset of
                // the current filter
                if (filter.substring(0, filterText.length) == filterText)
                    toFilter = active;
                filterText = filter;
                meta.view.searchString = filterText;
            }

            return toFilter || rows;
        };

        // Create a regular expression to match user entered text
        var createRegExp = function(text)
        {
            // Collapse whitespace
            text = $.trim(text).replace(/\s+/, ' ');

            // Detect case and perform case sensitive match if capital letters
            // are present
            if (text.match(/[A-Z]/))
                var modifiers = "";
            else
                modifiers = "i";

            // Escape special characters and create the regexp
            return new RegExp(
                text.replace(/(\/|\.|\*|\+|\?|\||\(|\)|\[|\]|\{|\})/g, "\\$1"),
                modifiers);
        };

        /* Clear out the filter for a particular column.  Takes a column obj
         *  or a column index.
         * This clears both the short version stored on the meta obj, and
         * updates the meta.view.viewFilters that is sent to the server. */
        var clearColumnFilterData = function(filterCol)
        {
            // Turn index into obj
            if (typeof filterCol != 'object')
            {
                filterCol = meta.columns[0][filterCol];
            }

            if (meta.columnFilters != null)
            {
                var cf = meta.columnFilters[filterCol.dataIndex];
                // First check if this is the only viewFilter; if so, clear it
                if (meta.view.viewFilters == cf.viewFilter)
                {
                    meta.view.viewFilters = null;
                }
                else
                {
                    // Else it is a child of the top-level filter; splice it out
                    meta.view.viewFilters.children.splice(
                            $.inArray(cf.viewFilter,
                                meta.view.viewFilters.children), 1);
                    // If the top-level filter is empty, get rid of it
                    if (meta.view.viewFilters.children.length < 1)
                    {
                        meta.view.viewFilters = null;
                    }
                }
                meta.columnFilters[filterCol.dataIndex] = null;
            }
        };

        /* Filter a single column (column obj or index) on a value.
         *  These filters are additive (all ANDed at the top level).
         *  Currently it only supports one filter per column.
         */
        this.filterColumn = function(filterCol, filterVal)
        {
            // Turn index into obj
            if (typeof filterCol != 'object')
            {
                filterCol = meta.columns[0][filterCol];
            }

            if (meta.columnFilters == null)
            {
                meta.columnFilters = {};
            }

            // If there is already a filter for this column, clear it out
            if (meta.columnFilters[filterCol.dataIndex])
            {
                clearColumnFilterData(filterCol);
            }

            // Update the view in-memory, so we can always serialize it to
            //  the server and get the correct filter
            var filterItem = { type: 'operator', value: 'EQUALS', children: [
                { type: 'column', columnId: filterCol.id  },
                { type: 'literal', value: filterVal } ] };
                //{ type: 'subColumnType', value: },
            if (meta.view.viewFilters == null)
            {
                // Make it the top-level filter
                meta.view.viewFilters = filterItem;
            }
            else if (meta.view.viewFilters.type == 'operator' &&
                meta.view.viewFilters.value == 'AND')
            {
                // Add it to the top-level filter
                if (!meta.view.viewFilters.children)
                {
                    meta.view.viewFilters.children = [];
                }
                meta.view.viewFilters.children.push(filterItem);
            }
            else
            {
                // Else push the top-level filter down one level, and
                //  add this to the new top-level filter
                var topF = { type: 'operator', value: 'AND', children: [
                    meta.view.viewFilters, filterItem
                ] };
                meta.view.viewFilters = topF;
            }

            // Store the filter in an easier format to deal with elsewhere;
            //  also keep a pointer back to the viewFilter
            meta.columnFilters[filterCol.dataIndex] =
                {column: filterCol, value: filterVal, viewFilter: filterItem};

            // Reload the view from the server; eventually we should do this
            //  locally if not in progressiveLoading mode
            getTempView();
        };

        /* Clear out the filtr for a particular column */
        this.clearColumnFilter = function(filterCol)
        {
            // Turn index into obj
            if (typeof filterCol != 'object')
            {
                filterCol = meta.columns[0][filterCol];
            }

            if (meta.columnFilters == null)
            {
                meta.columnFilters = {};
            }

            if (meta.columnFilters[filterCol.dataIndex])
            {
                clearColumnFilterData(filterCol);
            }

            getTempView();
        };

        // Apply filtering, grouping, and sub-row expansion to the active set.  This applies current settings to the
        // active set and then notifies listeners of the data change.
        var configureActive = function(filterSource) {
            removeSpecialRows();
            if (filterFn)
                doFilter(filterSource);
            var idChange;
            if (groupFn) {
                doGroup();
                idChange = true;
            }
            if (expanded) {
                doExpansion();
                idChange = true;
            }
            if (idChange)
                installIDs(true);
            dataChange();
        }

        // Remove "special" (non-data or nested) rows
        var removeSpecialRows = function() {
            var i = 0;
            while (i < active.length) {
                if (active[i].level)
                    active.splice(i, 1);
                else
                    i++;
            }
        }

        // Run filtering based on current filter configuration
        var doFilter = function(toFilter)
        {
            // Remove the filter timer, if any
            if (filterTimer)
            {
                window.clearTimeout(filterTimer);
                filterTimer = null;
            }

            if (self.isProgressiveLoading())
            {
                getTempView();
                // Bail out early, since the server does the sorting
                return;
            }

            // Perform the actual filter
            active = $.grep(toFilter || rows, filterFn);
        }

        // Generate group headers based on the current grouping configuration.
        // Does not fire events.  Note that grouping is not currently supported
        // in progressive rendering mode.
        var doGroup = function() {
            removeSpecialRows();
            if (!groupFn || !orderCol)
                return;
            var i = 0;
            var currentGroup;
            var groupOn = orderCol.dataIndex;
            while (i < active.length) {
                var group = groupFn(active[i][groupOn]);
                if (group != currentGroup) {
                    active.splice(i, 0, {
                        level: -1,
                        type: 'group',
                        title: group
                    })
                    i++;
                    currentGroup = group;
                }
                i++;
            }
        }

        // Expand rows that the user has opened
        var doExpansion = function() {
            var newActive;
            var lastCopied = 0;

            for (var i = 0; i < active.length; i++)
                if (expanded[active[i].id || active[i][0]]) {
                    if (!newActive)
                        newActive = [];
                    newActive.push.apply(newActive, active.slice(lastCopied, lastCopied = i + 1));
                    var childRows = getChildRows(active[i]);
                    newActive.push.apply(newActive, childRows);
                }

            if (newActive) {
                newActive.push.apply(newActive, active.slice(lastCopied, active.length));
                active = newActive;
            }
        }

        // Install initial metadata
        if (meta)
            this.meta(meta);
        else
            this.meta({});

        // Install initial rows
        if (rows)
            this.rows(rows);
        else
            rows = [];
    };

    $.fn.extend({
        /**
         * Returns and (optionally) sets the Blist model for the element.  If the element has no model associated with it
         * one is created.
         */
        blistModel: function(model) {
            if (model) {
                this.each(function() {
                    var currentModel = $(this).data('blistModel');
                    if (currentModel)
                        currentModel.removeListener(this);
                })
                this.data('blistModel', model);
                this.each(function() {
                    model.addListener(this);
                })
                this.trigger('meta_change', [ model ]);
                this.trigger('load', [ model ]);
                return model;
            }
            var currentModel = this.data('blistModel');
            if (currentModel)
                return currentModel;
            return this.blistModel(new blist.data.Model());
        }
    });
})(jQuery);
