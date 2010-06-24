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
            masterView: null,
            pageSize: 50,
            progressiveLoading: false
        };

        // Total number of rows, loaded and unloaded
        var totalRows = 0;
        // Count of rows in active set
        var activeCount = 0;
        // Count number of loaded rows, so we know when to disable progressive
        // loading
        var rowsLoaded = 0;

        // All the rows
        var rows = {};
        // The active dataset (rows or a filtered version of rows)
        var active = rows;

        // Row lookup-by-ID
        var lookup = {};
        var activeLookup = {};

        // Column lookup by UID
        var columnLookup = [];

        // Column lookup by ID
        var columnIDLookup = {};

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

        // Grouping configuration
        var groupFn;

        // Data translation
        var translateFn = null;

        // Data load configuration
        var autoBaseURL = true;
        var baseURL = null;
        var supplementalAjaxOptions = null;

        // Undo/redo buffer
        var undoBuffer = [];
        var redoBuffer = [];

        var findColumnIndex = function(id)
        {
            var index;
            $.each(meta.columns[0], function(i, col)
            {
                if (col.id == id)
                {
                    index = i;
                    return false;
                }
            });
            return index;
        };

        var columnType = function(index)
        {
            if (meta.columns)
            {
                var column = meta.columns[0][index];
                if (column) {
                    var type = blist.data.types[column.type];
                    if (type) { return type; }
                }
            }
            return blist.data.types.text;
        };

        /**
         * Create a mapping of ids to positions for both rows & active
         *  (since these arrays may be different)
         */
        var installIDs = function(activeOnly)
        {
            if (!activeOnly || rows == active)
            {
                lookup = {};
                // Count the total number of rows we have actual data for
                rowsLoaded = 0;
                _.each(rows, function(row, i)
                {
                    var id = row.id || (row.id = row[0]);
                    rowsLoaded++;

                    lookup[id] = i;
                    if (rows == active)
                    { activeLookup[id] = i; }
                });
            }
            if (rows != active)
            {
                activeLookup = {};
                _.each(active, function(row, i)
                {
                    var id = row.id || (row.id = row[0]);
                    activeLookup[id] = i;
                });
            }
        };

        var setRowMetadata = function(newRows, metaCols, dataMungeCols)
        {
            _.each(newRows, function(r, i)
            {
                if (metaCols)
                {
                    for (var j = 0; j < metaCols.length; j++)
                    {
                        var c = metaCols[j];
                        if (c.name == 'meta')
                        {
                            var md = r[c.index];
                            if (md !== null && md !== undefined)
                            { r[c.name] = JSON.parse(md); }
                        }
                        else if (r[c.index] !== undefined)
                        { r[c.name] = r[c.index]; }
                    }
                }
                if (dataMungeCols)
                {
                    for (var j = 0; j < dataMungeCols.length; j++)
                    {
                        var c = dataMungeCols[j];
                        if (c.type == 'nullifyArrays' &&
                            r[c.index] && r[c.index] instanceof Array)
                        {
                            var isEmpty = true;
                            $.each(r[c.index], function(k, v)
                                {
                                    // Booleans don't count because location
                                    // type has a flag that may be set even if
                                    // there is no data.  If some type actually
                                    // cares about only having a boolean,
                                    // this will need to be made more specific
                                    if (v !== null && v !== undefined &&
                                        typeof v != 'boolean')
                                    { isEmpty = false; return false; }
                                });
                            if (isEmpty) { r[c.index] = null; }
                        }

                        if (c.type == 'arrayToObject' &&
                            r[c.index] && r[c.index] instanceof Array)
                        {
                            var o = {};
                            $.each(r[c.index], function(k, v)
                                {
                                    o[c.types[k]] = v === '' ? null : v;
                                });
                            r[c.index] = o;
                        }

                        if (c.type == 'arrayToFirstValue' &&
                            r[c.index] && r[c.index] instanceof Array)
                        { r[c.index] = r[c.index][0]; }

                        if (c.type == 'falseToNull' && r[c.index] === false)
                        { r[c.index] = null; }
                        if (c.type == 'zeroToNull' && r[c.index] === 0)
                        { r[c.index] = null; }
                    }
                }
            });
        };

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
            if (!curOptions.progressiveLoading) { return false; }

            if (rowsLoaded < totalRows || meta.view.searchString !== null)
            { return true; }

            var isProg = false;
            // If there are any column filters, do progressive loading
            if (meta.columnFilters != null)
            {
                $.each(meta.columnFilters, function (i, v)
                    { if (v != null) { isProg = true; return false; } });
            }

            // If there are multiple sort bys, then do prog loading
            if (meta.view !== undefined && meta.view.query !== undefined &&
                meta.view.query.orderBys !== undefined &&
                meta.view.query.orderBys.length > 1)
            {
               isProg = true;
            }
            return isProg;
        };

        /**
         * Access the dataset title.
         */
        this.title = function()
        {
            return meta.title || (meta.view && meta.view.name) || "";
        };

        this.isGrouped = function()
        {
            return meta.view !== undefined && meta.view.query !== undefined &&
                meta.view.query.groupBys !== undefined &&
                meta.view.query.groupBys.length > 0;
        };

        this.shouldSendColumns = function()
        {
            return this.willSendColumns;
        };

        this.forceSendColumns = function(value)
        {
            this.willSendColumns = value;
        };

        /**
         * Get rights for this view
         */
        this.canRead = function()
        {
            return meta.view && meta.view.rights &&
                $.inArray('read', meta.view.rights) >= 0;
        };

        this.canWrite = function()
        {
            return meta.view && !this.isGrouped() && meta.view.rights &&
                $.inArray('write', meta.view.rights) >= 0;
        };

        this.canAdd = function()
        {
            return meta.view && !this.isGrouped() && meta.view.rights &&
                $.inArray('add', meta.view.rights) >= 0;
        };

        this.canDelete = function()
        {
            return meta.view && !this.isGrouped() && meta.view.rights &&
                $.inArray('delete', meta.view.rights) >= 0;
        };

        this.useBlankRows = function()
        {
            return curOptions.blankRow && self.canAdd() && self.canWrite();
        };

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

        /**
         * Set the metadata and rows for the model.
         */
        this.load = function(config)
        {
            var newRows = config.rows || (config.data !== undefined ?
                config.data.data : null) || config.data;

            if (config.meta)
            {
                //console.profile();
                this.meta(config.meta);
                self.reloadAggregates();

                if (config.meta.totalRows !== undefined)
                { totalRows = config.meta.totalRows; }

                // Reset all config to defaults
                filterFn = null;
                filterText = "";
                orderCol = null;
                orderFn = null;
                sortConfigured = false;

                //console.profileEnd();
            }

            if (newRows)
            {
                //console.profile();
                this.rows(newRows);
                //console.profileEnd();
            }
            $(listeners).trigger('full_load');
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
            if (typeof ajaxOptions == 'string')
            {
                ajaxOptions = { url: ajaxOptions };
            }
            supplementalAjaxOptions = $.extend({}, ajaxOptions);
            if (curOptions.progressiveLoading)
            {
                ajaxOptions.data = $.extend({}, ajaxOptions.data,
                        {method: 'getByIds', meta: true,
                        start: 0, length: curOptions.pageSize});
            }
            doLoad(this, this.load, ajaxOptions);
        };

        var doLoad = function(model, onLoad, ajaxOptions)
        {
            if (!ajaxOptions.success)
            {
                if (!ajaxOptions.dataType) { ajaxOptions.dataType = 'json'; }
                ajaxOptions.success = function(config) {
                    if (config.id !== undefined)
                    { config = {meta: {view: config}}; }
                    if (translateFn)
                    { config = translateFn.apply(this, [ config ]); }
                    onLoad.apply(model, [ config ]);
                };
                ajaxOptions.complete = function() {
                    $(listeners).trigger('after_load');
                };
            }
            if (!$(listeners).trigger('before_load', [ ajaxOptions ])) { return; }

            if (autoBaseURL)
            {
                var url = ajaxOptions.url;
                var endOfProt = url.indexOf('://');
                if (endOfProt != -1)
                {
                    endOfProt += 3;
                    var endOfHost = url.indexOf('/', endOfProt);
                    if (endOfHost == -1) { baseURL = url; }
                    else { baseURL = url.substring(0, endOfHost); }
                }
                else { baseURL = ''; }
            }

            if (curOptions.initialResponse !== null)
            {
                // Make sure things calling this have a chance to finish their
                // init, just like they would for an async ajax call
                setTimeout(function()
                {
                    ajaxOptions.success(curOptions.initialResponse);
                    ajaxOptions.complete();
                    curOptions.initialResponse = null;
                }, 0);
            }
            else { $.ajax(ajaxOptions); }
        };

        var batchRequests = [];
        var addBatchRequest = function(req)
        { batchRequests.push(req); };

        var runBatch = function()
        {
            if (batchRequests.length < 1) { return; }

            if (batchRequests.length == 1)
            {
                $.ajax($.extend(batchRequests.shift(),
                    { dataType: 'json', contentType: 'application/json' }));
                return;
            }

            var serverReqs = [];
            var br = batchRequests;
            batchRequests = [];
            $.each(br, function(i, r)
                { serverReqs.push({url: r.url,
                    requestType: r.type, body: r.data}); });

            $.ajax({url: '/batches',
                    dataType: 'json', contentType: 'application/json',
                    type: 'POST',
                    data: JSON.stringify({requests: serverReqs}),
                    success: function(resp)
                    {
                        $.each(resp, function(i, r)
                        {
                            if (r.error)
                            {
                                if (typeof br[i].error == 'function')
                                { br[i].error(r.errorMessage); }
                            }
                            else if (typeof br[i].success == 'function')
                            {
                                br[i].success(JSON.parse(r.response));
                            }
                        });
                    },
                    complete: function()
                    {
                        $.each(br, function(i, r)
                        {
                            if (typeof r.complete == 'function') { r.complete(); }
                        });
                    },
                    error: function(xhr)
                    {
                        var errBody = JSON.parse(xhr.responseText);
                        $.each(br, function(i, r)
                        {
                            if (typeof r.error == 'function')
                            { r.error(errBody.message); }
                        });
                    }});
        };

        /**
         * Load a set of rows.  The table must have been populated via AJAX for
         * this to succeed.  Supplementary requests will be requested of the
         * original URL using ids[] query parameters in the POST body.
         *
         * @param rows an array of row IDs
         */
        this.loadRows = function(rowsToLoad)
        {
            if (!supplementalAjaxOptions) { return; }

            var min = this.length() + 1;
            var max = -1;
            _.each(rowsToLoad, function(n)
            {
                min = Math.min(n, min);
                max = Math.max(n, max);
            });
            // Adjust max & min account for special rows, so we get real
            // offsets to the server
            max -= countSpecialTo(max);
            min -= countSpecialTo(min);
            var len = Math.min(max - min + 1, curOptions.pageSize);

            var tempView = this.cleanViewForPost(this.getViewCopy(),
                this.isGrouped() || this.shouldSendColumns());
            var ajaxOptions = $.extend({},
                    supplementalAjaxOptions,
                    { url: '/views/INLINE/rows.json?' + $.param(
                        $.extend({}, supplementalAjaxOptions.data,
                        { method: 'getByIds', start: min, length: len })),
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(tempView) });
            doLoad(this, function(d) { onSupplementalLoad(d, min); },
                ajaxOptions);
        };

        var onSupplementalLoad = function(response, start)
        {
            // Install the rows
            var supplement = response.data;
            setRowMetadata(supplement, meta.metaColumns, meta.dataMungeColumns);
            for (var i = 0; i < supplement.length; i++, start++)
            {
                // Figure out the real position in active
                var adjStart = start + countSpecialTo(start);
                var row = supplement[i];
                if (active == rows && active[adjStart] === undefined)
                { rowsLoaded++; }
                active[adjStart] = row;

                var id = row.id || (row.id = row[0]);
                activeLookup[id] = adjStart;
                if (rows == active) { lookup[id] = adjStart; }
            }

            // Do not call installIDs here as it is expensive on tall datasets!
            // Above installation must take care of everything that installIDs
            // does.


            // Notify listeners of row load via the "change" event
            self.change(supplement);
        };

        this.reloadView = function()
        {
            var ajaxOptions = $.extend({}, supplementalAjaxOptions);
            if (curOptions.progressiveLoading)
            {
                ajaxOptions.data = $.extend({}, ajaxOptions.data,
                        { method: 'getByIds', start: 0, length: 1, meta: true });
            }
            doLoad(self, viewReloaded, ajaxOptions);
        };

        var viewReloaded = function(config)
        {
            if (config.meta)
            {
                self.meta(config.meta);
                self.reloadAggregates();

                var newRows = config.rows || (config.data !== undefined ?
                        config.data.data : null) || config.data;

                if (newRows)
                {
                    if (config.meta.totalRows !== undefined)
                    { totalRows = config.meta.totalRows; }
                    this.rows(newRows, true);
                }
                else { configureActive(null, true); }
                $(listeners).trigger('columns_updated', [self]);
                $(listeners).trigger('full_load');
            }
        };

        var translatePicklistFromView = function(col) {
            var values = col.dropDown && col.dropDown.values;
            if (values) {
                var options = col.options = {};
                for (var j = 0; j < values.length; j++) {
                    var value = values[j];
                    options[value.id] = { text: value.description || '',
                        icon: value.icon, deleted: value.deleted || false };
                }
            }
            return options;
        };

        var getColumnLevel = function(columns, id) {
            var level = columns[id];
            if (!level) {
                level = columns[id] = [];
                level.id = id;
            }
            return level;
        };

        this.reloadAggregates = function(tempView)
        {
            if (!_.isUndefined(meta.view.message)) { return; }

            tempView = this.cleanViewForPost(tempView || this.getViewCopy(),
                this.isGrouped() || this.shouldSendColumns());
            $.ajax({url: '/views/INLINE/rows.json?' +
                    $.param({method: 'getAggregates'}),
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(tempView),
                    success: function(resp)
                    {
                        updateAggregateHash(resp);
                        self.footerChange();
                    }});
        }

        var updateAggregateHash = function(newAggs)
        {
            meta.aggregates = newAggs;
            if (!meta.aggregateHash)
            {
                meta.aggregateHash = {};
            }
            if (newAggs)
            {
                _.each(newAggs, function (a)
                {
                    if (meta.aggregateHash[a.columnId] === undefined)
                    {
                        meta.aggregateHash[a.columnId] = {};
                    }
                    meta.aggregateHash[a.columnId].type = a.name;
                    meta.aggregateHash[a.columnId].value = a.value;
                });
            }
            _.each(meta.allColumns, function(c)
                { c.aggregate = meta.aggregateHash[c.id]; });
        };

        var translateMetaColumns = function(viewCols, metaCols, dataMungeCols)
        {
            if (!viewCols) { return; }

            for (var i = 0; i < viewCols.length; i++)
            {
                var v = viewCols[i];
                if (v.dataTypeName == 'meta_data' ||
                    v.dataTypeName == 'tag')
                {
                    var adjName = v.name;
                    if (v.dataTypeName == 'tag') { adjName = 'tags'; }
                    else if (v.name == 'sid') { adjName = 'id'; }
                    else if (v.name == 'id') { adjName = 'uuid'; }
                    metaCols.push({name: adjName, index: i});
                }

                var type = blist.data.types[v.renderTypeName];
                if (type && type.isObject)
                {
                    dataMungeCols.push({index: i, type: 'nullifyArrays'});
                    dataMungeCols.push({index: i, type: 'arrayToObject',
                        types: v.subColumnTypes});
                }


                if (v.renderTypeName == 'checkbox')
                { dataMungeCols.push({index: i, type: 'falseToNull'}); }

                if (v.renderTypeName == 'stars')
                { dataMungeCols.push({index: i, type: 'zeroToNull'}); }
            }
        };

        var translateViewColumns = function(view, viewCols, columns, allColumns,
            nestDepth, nestedIn)
        {
            if (!viewCols) { return; }

            viewCols = viewCols.slice();
            for (var i = 0; i < viewCols.length; i++)
            { viewCols[i].dataIndex = i; }
            viewCols.sort(function(col1, col2)
                { return col1.position - col2.position; });

            var levelCols = getColumnLevel(columns, nestDepth);

            var filledTo = 0;
            var addNestFiller = function()
            {
                if (filledTo < levelCols.length)
                {
                    var fillFor = [];
                    for (var i = filledTo; i < levelCols.length; i++)
                    { fillFor.push(levelCols[i]); }
                    filledTo = levelCols.length + 1;
                    getColumnLevel(columns, nestDepth + 1).push({
                        type: 'fill',
                        fillFor: fillFor
                    });
                }
                else { filledTo++; }
            };

            for (i = 0; i < viewCols.length; i++)
            {
                var vcol = viewCols[i];
                if (vcol.dataTypeName == 'meta_data')
                { continue; }

                var col = {
                    name: vcol.name,
                    description: vcol.description,
                    width: Math.max(50, vcol.width || 100),
                    minWidth: 50,
                    type: vcol.renderTypeName || "text",
                    originalType: vcol.dataTypeName,
                    id: vcol.id,
                    tableColumnId: vcol.tableColumnId,
                    aggregate: meta.aggregateHash !== undefined ?
                        meta.aggregateHash[vcol.id] : undefined,
                    subTypes: vcol.subColumnTypes
                };

                col.dataIndex = vcol.dataIndex;
                if (nestedIn) {
                    col.nestedIn = nestedIn;
                    col.dataLookupExpr = nestedIn.header.dataLookupExpr +
                        "[" + col.dataIndex + "]";
                } else {
                    col.dataLookupExpr = "[" + col.dataIndex + "]";
                }

                switch (col.type)
                {
                    case 'picklist':
                    case 'drop_down_list':
                        col.options = translatePicklistFromView(vcol);
                        break;

                    case 'photo_obsolete':
                    case 'document_obsolete':
                        col.base = baseURL + "/views/" + view.id + "/obsolete_files/";
                        break;
                    case 'photo':
                    case 'document':
                        col.base = baseURL + "/views/" + view.id + "/files/";
                        break;

                    case 'nested_table':
                        // Create the "body" column that appears in the next level
                        var children = [];
                        col.body = {
                            type: 'nested',
                            children: children,
                            header: col
                        };
                        col.metaChildren = [];
                        col.dataMungeChildren = [];
                        translateMetaColumns(vcol.childColumns, col.metaChildren,
                            col.dataMungeChildren);
                        translateViewColumns(view, vcol.childColumns, columns,
                            allColumns, nestDepth + 1, col.body);

                        if (!vcol.flags || $.inArray("hidden", vcol.flags) < 0)
                        {
                            // Add the body column to the next nesting level
                            addNestFiller();
                            if (columns[nestDepth + 1])
                            { columns[nestDepth + 1].push(col.body); }
                        }

                        break;
                }

                var format = vcol.format;
                if (format)
                {
                    if (col.type == "stars" &&
                        format.view == "stars_number")
                    {
                        col.type = "number";
                    }
                    if (col.originalType == "stars" &&
                        format.view == "stars_number")
                    {
                        col.originalType = "number";
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
                    if (format.precisionStyle)
                    {
                        // Standard or scientific notation
                        col.precisionStyle = format.precisionStyle;
                    }
                    if (format.currency)
                    { col.currency = format.currency; }
                    if (format.humane)
                    {
                        col.humane = format.humane;
                    }
                    if (format.align)
                    {
                        col.alignment = format.align;
                    }
                    if (format.grouping_aggregate)
                    { col.grouping_aggregate = format.grouping_aggregate; }
                    if (format.drill_down &&
                        !format.grouping_aggregate && 
                        vcol.renderTypeName != 'url')
                    {
                        col.drillDown = (format.drill_down === 'true' ||
                            format.drill_down === true);
                    }
                }

                if (!vcol.flags || $.inArray("hidden", vcol.flags) < 0)
                {
                    if (nestedIn) { nestedIn.children.push(col); }
                    else { levelCols.push(col); }
                }
                allColumns[col.id] = col;
            }

            // Add filler for trailing unnested columns to the next nesting
            // depth if applicable
            if (columns[nestDepth + 1]) { addNestFiller(); }
        };

        /**
         * Get and/or set the metadata for the model.
         */
        this.meta = function(newMeta)
        {
            if (newMeta)
            {
                // Columns may be different, so our undo/redo is no longer valid
                resetUndo();

                // Ensure the meta has a columns object, even if it is empty
                meta = newMeta;

                if (!$.isBlank(curOptions.masterView))
                { $.syncObjects(curOptions.masterView, this.getViewCopy()); }

                meta.sort = {};

                // Assign a unique numeric ID (UID) and level ID to each column
                columnLookup = [];
                var nextID = 0;
                var assignIDs = function(cols, level)
                {
                    for (var i = 0; i < cols.length; i++)
                    {
                        var col = cols[i];
                        col.uid = nextID++;
                        col.level = level;
                        col.indexInLevel = i;
                        columnLookup[col.uid] = col;
                        if (col.children) { assignIDs(col.children, level); }
                    }
                };

                if (!meta.columns)
                {
                    meta.columns = [[]];
                    meta.allColumns = {};
                    meta.metaColumns = [];
                    meta.dataMungeColumns = [];
                    columnIDLookup = {};
                    if (meta.view)
                    {
                        if (meta.view.columns)
                        {
                            translateMetaColumns(meta.view.columns,
                                meta.metaColumns, meta.dataMungeColumns);
                            translateViewColumns(meta.view, meta.view.columns,
                                meta.columns, meta.allColumns, 0);
                            $.each(meta.view.columns, function(i, col)
                            {
                                if (col.id != -1)
                                { columnIDLookup[col.id] = col; }
                                if (col.childColumns)
                                {
                                    $.each(col.childColumns, function(j, cc)
                                    {
                                        if (cc.id != -1)
                                        { columnIDLookup[cc.id] = cc; }
                                    });
                                }
                            });
                        }
                    }

                    for (var i = 0; i < meta.columns.length; i++)
                    { assignIDs(meta.columns[i], meta.columns[i]); }

                    // If there are rows, reset all child rows since there may
                    // be new nested columns
                    _.each(rows, function(r, i)
                    {
                        // We're in the process of resetting things,
                        // so catch an un-init style error and ignore it
                        try { resetChildRows(r); }
                        catch (e) { /*ignore*/ }
                    });
                }
                else
                {
                    for (var i = 0; i < meta.columns.length; i++)
                    { assignIDs(meta.columns[i], meta.columns[i]); }
                }

                var rootColumns = meta.columns[0];

                // Configure root column sorting based on view configuration if
                // a view is present
                var sorts = {};

                if (meta.view !== undefined && meta.view.query !== undefined &&
                        meta.view.query.orderBys !== undefined &&
                        meta.view.query.orderBys.length > 0)
                {
                    $.each(meta.view.query.orderBys, function(i, order) {
                        sorts[order.expression.columnId] = order;
                    });

                    $.each(meta.view.columns, function (i, c)
                    {
                        if (sorts[c.id] != undefined)
                        {
                            meta.sort[c.id] = {
                                ascending: sorts[c.id].ascending,
                                column: c
                              };
                        }
                    });
                }

                // For each column at the root nesting level, ensure that
                // dataIndex is present, and that a "dataLookupExpr" is
                // present.  Other levels must configure these explicitly.
                for (i = 0; i < rootColumns.length; i++)
                {
                    var col = rootColumns[i];
                    var dataIndex = col.dataIndex;
                    if (!dataIndex == undefined)
                    {
                        dataIndex = col.dataIndex = i;
                    }
                    if (!col.dataLookupExpr)
                    {
                        if (typeof dataIndex == "string")
                        {
                            col.dataLookupExpr = "['" + dataIndex + "']";
                        }
                        else
                        {
                            col.dataLookupExpr = '[' + dataIndex + ']';
                        }
                    }
                }

                // Notify listeners of the metadata change
                this.metaChange();
            }
            return meta;
        };

        /**
         * Get and/or set the rows for the model.  Returns only "active" rows,
         * that is, those that are visible.
         */
        this.rows = function(newRows, loadedTempView)
        {
            if (newRows !== null && newRows !== undefined)
            {
                if (totalRows === 0) { totalRows = _.size(newRows); }
                rows = {};
                // Convert array of rows into object
                _.each(newRows, function(r, i) { rows[i] = r; });
                active = rows;
                activeCount = totalRows;
                setRowMetadata(rows, meta.metaColumns, meta.dataMungeColumns);
                installIDs();

                // Apply sorting if so configured
                if (sortConfigured && !this.isProgressiveLoading())
                {
                    doSort();
                }

                // Apply filtering and grouping
                configureActive(active, loadedTempView);
            }

            return active;
        };

        /**
         * Given a row or a row ID, retrieve the ordinal index of the row in the active set.
         */
        this.index = function(rowOrRowID)
        {
            if (typeof rowOrRowID == 'object')
            { return parseInt(activeLookup[rowOrRowID.id]); }
            return parseInt(activeLookup[rowOrRowID]);
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
        this.remove = function(delRows, serverDelete, skipUndo)
        {
            if (!(delRows instanceof Array) || delRows.id)
            { delRows = [delRows]; }

            if (!skipUndo && serverDelete)
            { this.addUndoItem({type: 'delete', rows: delRows}); }

            for (var i = 0; i < delRows.length; i++)
            {
                var row = delRows[i];
                if (row.expanded) { this.expand(row, false); }
                var id = row.id;
                var index = parseInt(lookup[id]);
                row.origPosition = index;
                if (index !== undefined)
                {
                    delete lookup[id];
                    removeItemsFromObject(rows, index, 1);
                    rowsLoaded--;
                    totalRows--;
                }
                if (rows != active)
                {
                    index = parseInt(activeLookup[id]);
                    row.origActivePosition = index;
                    if (index !== undefined)
                    {
                        delete activeLookup[id];
                        removeItemsFromObject(active, index, 1);
                        activeCount--;
                    }
                }
                else { activeCount = totalRows; }
                this.unselectRow(row);

                if (serverDelete)
                {
                    startRowChange();
                    if (pendingRowEdits[id])
                    {
                        pendingRowDeletes[id] = true;
                    }
                    else
                    {
                        serverDeleteRow(id);
                    }
                }
                // Update IDs after each loop, since positions have adjusted
                installIDs();
            }
            $(listeners).trigger('row_remove', [ delRows ]);
        };

        var serverDeleteRow = function(rowId, parColId, parRowId)
        {
            var url = '/views/' + meta.view.id + '/rows/';
            if (parRowId)
            { url += parRowId + '/columns/' + parColId + '/subrows/'; }
            url += rowId + '.json';
            $.ajax({url: url, contentType: 'application/json', type: 'DELETE',
                    complete: function() { finishRowChange(); }});
        };

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
                    startRowChange();
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
            if (row === undefined) { return undefined; }

            var value;
            eval('value = row' + (column.dataLookupExpr ||
                ('[' + column.dataIndex + ']')) + ';');
            return value;
        };

        // Get the invalid value in a row for a column
        this.getInvalidValue = function(row, column)
        {
            var parCol = column.nestedIn ? column.nestedIn.header : column;
            var childLookup = column.nestedIn ? parCol.dataLookupExpr : '';
            var realRow;
            eval("realRow = row" + childLookup + ";");
            return realRow.meta && realRow.meta.invalidCells &&
                realRow.meta.invalidCells[column.tableColumnId] || null;
        };

        // Set the value in a row for a column
        this.setRowValue = function(value, row, column)
        {
            eval('row' + column.dataLookupExpr + ' = value;');
        };

        this.setInvalidValue = function(value, row, column)
        {
            var parCol = column.nestedIn ? column.nestedIn.header : column;
            var childLookup = column.nestedIn ? parCol.dataLookupExpr : '';
            var realRow;
            eval("realRow = row" + childLookup + ";");
            if (!realRow.meta) { realRow.meta = {'invalidCells': {}}; }
            if (!realRow.meta.invalidCells) { realRow.meta.invalidCells = {}; }
            realRow.meta.invalidCells[column.tableColumnId] = value;
            var metaCols = column.nestedIn ? parCol.metaChildren :
                meta.metaColumns;
            $.each(metaCols, function(i, c)
                {
                    if (c.name == 'meta')
                    {
                        realRow[c.index] = JSON.stringify(realRow.meta);
                        return false;
                    }
                });
        };

        this.isCellError = function(row, column)
        {
            if (!row.error) { return false; }
            var v;
            eval('v = row.error' + column.dataLookupExpr + ';');
            return v;
        };

        var resetChildRows = function(row)
        {
            if (row.expanded)
            {
                self.expand(row, false, true);
                delete row.childRows;
                self.expand(row, true, true);
                installIDs();
                configureActive();
            }
            else
            { delete row.childRows; }
        };

        var saveUID = 0;
        var isRowCreate = false;
        var pendingRowCreates = [];
        var pendingRowEdits = {};
        var pendingRowDeletes = {};
        var rowChangesPending = 0;
        var startRowChange = function()
        {
            rowChangesPending++;
        };

        var finishRowChange = function()
        {
            rowChangesPending--;
            if (rowChangesPending == 0)
            {
                $(listeners).trigger('server_row_change');
            }
        };

        // Set the value for a row, save it to the server, and notify listeners
        this.saveRowValue = function(value, row, column, isValid, skipUndo)
        {
            var validValue = isValid ? value : null;
            var invalidValue = isValid ? null : value;

            var isCreate = false;
            if (row.type == 'blank')
            {
                row = $.extend(row, {id: 'saving' + saveUID++, isNew: true,
                    type: null});
                var lastRow = rows[totalRows - 1];
                if (totalRows < 1 || lastRow === undefined || !lastRow.isNew)
                {
                    rows[totalRows] = row;
                    totalRows++;
                    if (active == rows) { activeCount = totalRows; }
                }
                installIDs();
                // Our view should be in the correct configuration, so we don't
                // need to reload a temp view on this call
                configureActive(null, true);
                isCreate = true;
                if (!skipUndo) { this.addUndoItem({type: 'create', rows: [row]}); }
            }

            var prevValue;
            var prevValueInvalid = false;
            if (column)
            {
                prevValue = this.getRowValue(row, column);
                if (prevValue === null || prevValue === undefined)
                {
                    prevValue = this.getInvalidValue(row, column);
                    prevValueInvalid = prevValue !== null;
                }
                this.setRowValue(validValue, row, column);
                this.setInvalidValue(invalidValue, row, column);
            }

            if (!row.saving) { row.saving = []; }
            var data = {};
            if (column)
            {
                if (column.type == 'tag')
                { data['_tags'] = validValue; }
                else { data[column.id] = validValue; }
            }
            if (row.meta) { data.meta = JSON.stringify(row.meta); }

            if (column && column.nestedIn)
            {
                var parCol = column.nestedIn.header;

                var childRow = self.getRowValue(row, parCol);
                isCreate = childRow.type == 'blank';
                if (isCreate)
                {
                    delete childRow.type;
                    var parRow = row.parent;

                    // Since child rows get re-created, save the index and pull
                    // out the new one
                    var curRowI = this.index(row);

                    // If we're in a blank row, create that row first
                    if (parRow.type == 'blank')
                    {
                        this.saveRowValue(null, parRow, null, true);
                        skipUndo = true;
                    }

                    // Add the new row to the parent
                    if (!parRow[parCol.dataIndex])
                    { parRow[parCol.dataIndex] = []; }
                    parRow[parCol.dataIndex].push(childRow);

                    // Now force refresh by collapsing, clearing
                    // child rows, and then re-expanding.
                    resetChildRows(parRow);
                    row = this.get(curRowI);
                    if (!row.saving) { row.saving = []; }

                    if (!skipUndo) { this.addUndoItem({type: 'childCreate',
                        rows: [row], parentColumn: parCol}); }
                }

                setRowMetadata([row], parCol.metaChildren,
                    parCol.dataMungeChildren);

                if (!row.saving[parCol.dataIndex])
                { row.saving[parCol.dataIndex] = []; }
                row.saving[parCol.dataIndex][column.dataIndex] = true;
                if (row.error && row.error[parCol.dataIndex])
                { delete row.error[parCol.dataIndex][column.dataIndex]; }
            }
            else if (column)
            {
                setRowMetadata([row], meta.metaColumns, meta.dataMungeColumns);

                row.saving[column.dataIndex] = true;
                if (row.error) { delete row.error[column.dataIndex]; }
            }

            if (!skipUndo && !isCreate)
            {
                this.addUndoItem({type: 'edit', column: column,
                        row: row, value: prevValue, invalid: prevValueInvalid});
            }

            this.change([row]);

            registerRowSave(row, column, data, isCreate);
        };

        var registerRowSave = function(row, column, data, isCreate, childRow,
            parentRow, parentColumn)
        {
            startRowChange();
            if (!isCreate && row && pendingRowEdits[row.id])
            {
                pendingRowEdits[row.id].push({column: column,
                    parentColumn: parentColumn, data: data});
                return;
            }
            else if (isCreate && parentRow && pendingRowEdits[parentRow.id])
            {
                pendingRowEdits[parentRow.id].push({row: row, column: column,
                        childRow: childRow, parentRow: parentRow,
                        parentColumn: parentColumn, data: data, isCreate: true});
                return;
            }

            if (row && !pendingRowEdits[row.id]) { pendingRowEdits[row.id] = []; }

            if (isCreate)
            {
                if (isRowCreate)
                {
                    pendingRowCreates.push({row: row, column: column,
                        childRow: childRow, parentRow: parentRow,
                        parentColumn: parentColumn, data: data});
                    return;
                }
                isRowCreate = true;
            }

            serverSaveRow(row, column, data, isCreate, childRow, parentRow,
                parentColumn);
        };

        var getSaveURL = function(row, column, isCreate, childRow, parentRow,
            parentColumn)
        {
            if (parentColumn || column && column.nestedIn)
            {
                parentColumn = parentColumn || column.nestedIn.header;
                return getChildSaveURL(childRow ||
                        self.getRowValue(row, parentColumn),
                    parentRow || row.parent, parentColumn, isCreate);
            }

            var url = '/views/' + self.meta().view.id + '/rows';
            if (isCreate) { url += '.json'; }
            else { url += '/' + row.uuid + '.json'; }
            return url;
        };

        var getChildSaveURL = function(childRow, parentRow, parentColumn, isCreate)
        {
            var url = '/views/' + self.meta().view.id + '/rows/' +
                parentRow.uuid + '/columns/' + parentColumn.id + '/subrows';
                if (!isCreate) { url += '/' + childRow.uuid; }
                url += '.json';
            return url;
        };

        var serverSaveRow = function(row, column, data, isCreate, childRow,
            parentRow, parentColumn, skipBatchRequest)
        {
            var url = getSaveURL(row, column, isCreate, childRow, parentRow,
                parentColumn);
            var newRow = isCreate ? row : null;
            if (parentColumn || column && column.nestedIn)
            {
                parentColumn = parentColumn || column.nestedIn.header;
                if (childRow === undefined || childRow === null)
                { childRow = self.getRowValue(row, parentColumn); }
                newRow = isCreate ? childRow : null;
            }

            var model = self;
            addBatchRequest(
                    { url: url,
                    type: isCreate ? 'POST' : 'PUT',
                    data: JSON.stringify(data),
                    complete: function()
                    {
                        if (row === null || row === undefined)
                        {
                            finishRowChange();
                            return;
                        }

                        if (row.saving !== undefined)
                        {
                            if (parentColumn && column == 'all')
                            { row.saving[parentColumn.dataIndex] = []; }
                            else if (parentColumn)
                            { delete row.saving[parentColumn.dataIndex]
                                [column.dataIndex]; }
                            else if (column == 'all')
                            { delete row.saving; }
                            else if (column && row.saving)
                            { delete row.saving[column.dataIndex]; }
                        }

                        // Are there any pending edits to this row?
                        // If so, save the next one
                        if (pendingRowEdits[row.id] &&
                            pendingRowEdits[row.id].length > 0)
                        {
                            while (pendingRowEdits[row.id].length > 0)
                            {
                                var u = pendingRowEdits[row.id].shift();
                                serverSaveRow(row, u.column, u.data, u.isCreate,
                                    u.childRow, u.parentRow, u.parentColumn, true);
                            }
                            runBatch();
                        }
                        else
                        {
                            delete pendingRowEdits[row.id];
                            if (pendingRowDeletes[row.id])
                            {
                                var pd = pendingRowDeletes[row.id];
                                if (pd === true) { serverDeleteRow(row.id); }
                                else
                                {
                                    serverDeleteRow(pd.subRow.uuid,
                                        pd.parCol.id, pd.parRow.uuid);
                                }
                                delete pendingRowDeletes[row.id];
                            }
                        }

                        finishRowChange();
                        model.change([row]);
                    },
                    error: function()
                    {
                        if (!row.error) { row.error = []; }
                        if (column == 'all')
                        {
                            var errorArray = parentColumn === undefined ?
                                row.error : row.error[parentColumn.dataIndex];
                            var columns = parentColumn === undefined ?
                                meta.view.columns : parentColumn.body.children;
                            $.each(columns, function(i, c)
                            { if ((c.dataTypeName == 'tag') ||
                                c.id > -1) { errorArray[c.dataIndex] = true; } });
                        }
                        else if (parentColumn)
                        { row.error[parentColumn.dataIndex]
                            [column.dataIndex] = true; }
                        else if (column)
                        { row.error[column.dataIndex] = true; }
                        model.change([row]);
                    },
                    success: function(resp)
                    {
                        if (newRow)
                        {
                            var oldID = newRow.id;
                            // Add metadata to new row
                            // FIXME: The server response for this should be
                            // changing; we can run into problems if there is
                            // a user column named something like '_id'
                            var metaCols = parentColumn ?
                                parentColumn.metaChildren : meta.metaColumns;
                            $.each(metaCols, function(i, c)
                            {
                                var n = '_' + c.name;
                                if (resp[n] !== undefined)
                                { newRow[c.name] = newRow[c.index] = resp[n]; }
                            });

                            installIDs();
                            delete newRow.isNew;
                            delete newRow.type;

                            setRowMetadata([newRow], metaCols,
                                    parentColumn ?
                                        parentColumn.dataMungeChildren :
                                        meta.dataMungeColumns);

                            pendingRowEdits[newRow.id] = pendingRowEdits[oldID];
                            delete pendingRowEdits[oldID];
                            if (pendingRowDeletes[oldID])
                            {
                                pendingRowDeletes[newRow.id] =
                                    pendingRowDeletes[oldID];
                                delete pendingRowDeletes[oldID];
                            }

                            if (pendingRowCreates.length > 0)
                            {
                                var c = pendingRowCreates.shift();
                                serverSaveRow(c.row, c.column, c.data, true,
                                    c.childRow, c.parentRow, c.parentColumn);
                            }
                            else
                            {
                                isRowCreate = false;
                            }

                            model.change([newRow]);
                        }
                    }
                });

            if (!skipBatchRequest) { runBatch(); }
        };

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
                    self.change([fakeRow]);
                }

                registerRowSave(fakeRow, 'all', data, true, row, parentRow,
                    parentColumn);
            }
            else
            {
                // Stick the row back in and update things
                addItemsToObject(rows, [row], row.origPosition);
                totalRows++;
                activeCount++;
                if (active != rows)
                { addItemsToObject(active, [row], row.origActivePosition); }
                installIDs();
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

                    self.remove(item.rows, true, true);
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

        this.invalidateRows = function()
        {
            removeSpecialRows();
            active = rows = {};
            activeCount = totalRows;
            rowsLoaded = 0;
            lookup = {};
            activeLookup = {};
        };

        this.updateColumn = function(column)
        {
            var isColumnPresent = false;

            $.each(meta.view.columns, function(i, c)
            {
                if (c.id == column.id)
                {
                    // If the column has children, they must be copied over:
                    // children can't be updated via a parent, and if a column
                    // is updated, it may not come back with all the original
                    // meta children.
                    column.childColumns = meta.view.columns[i].childColumns;
                    meta.view.columns[i] = column;
                    isColumnPresent = true;
                    return false;
                }
                else if (c.childColumns instanceof Array)
                {
                    var found = false;
                    $.each(c.childColumns, function(j, cc)
                    {
                        if (cc.id == column.id)
                        {
                            c.childColumns[j] = column;
                            isColumnPresent = true;
                            found = true;
                            return false;
                        }
                    });
                    if (found) { return false; }
                }
            });


            if (meta.aggregates === null || meta.aggregates === undefined)
            { meta.aggregates = []; }
            if (column.updatedAggregate !== null &&
                column.updatedAggregate !== undefined)
            {
                var found = false;

                $.each(meta.aggregates, function(i, a) {
                    if (a.columnId == column.id)
                    {
                        meta.aggregates[i] = column.updatedAggregate;
                        found = true;
                    }
                });

                if (!found)
                {
                    meta.aggregates.push(column.updatedAggregate);
                }
            }
            else
            {
                for (var i=0; i < meta.aggregates.length; i++)
                {
                    if (meta.aggregates[i].columnId == column.id)
                    {
                        meta.aggregates.splice(i, 1);
                        meta.aggregateHash = {};
                        break;
                    }
                }
            }

            if (!isColumnPresent)
            {
                // Reload columns from server
                this.reloadView();
            }
            else
            {
                // Refresh the meta data and redraw the grid.
                meta.columns = null;
                this.meta(meta);
                updateAggregateHash(meta.aggregates);
                self.footerChange();
                $(listeners).trigger('columns_updated', [this]);
            }
        };

        this.convertColumn = function(oldId, newViewColumn)
        {
            this.invalidateRows();
            if (meta.view != null)
            {
                $.each(meta.view.columns, function(i, c)
                {
                    if (c.id == oldId)
                    {
                        meta.view.columns[i] = newViewColumn;
                        return false;
                    }
                    else if (c.childColumns instanceof Array)
                    {
                        var found = false;
                        $.each(c.childColumns, function(j, cc)
                        {
                            if (cc.id == oldId)
                            {
                                c.childColumns[j] = newViewColumn;
                                found = true;
                                return false;
                            }
                        });
                        if (found) { return false; }
                    }
                });
            }

            var isSorted = meta.sort[oldId] !== undefined;

            if (newViewColumn.format && newViewColumn.format.aggregate)
            {
                $.each(meta.aggregates, function(i, a) {
                    if (a.columnId == oldId)
                    {
                        a.columnId = newViewColumn.id;
                        return false;
                    }
                });
            }

            meta.columns = null;
            this.meta(meta);

            if (isSorted)
            {
                $.each(meta.view.query.orderBys, function(i, o)
                {
                    if (o.expression.columnId == oldId)
                    { o.expression.columnId = newViewColumn.id; }
                });
                this.multiSort(meta.view.query.orderBys);
            }

            configureActive();
            $(listeners).trigger('columns_updated', [this]);
        };

        this.deleteColumns = function(cols)
        {
            if (meta.view != null)
            {
                var removedData = [];
                var subRemovedData = {};
                $.each(cols, function(j, cId)
                {
                    $.each(meta.view.columns, function(i, c)
                    {
                        if (c.id == cId)
                        {
                            removedData.push(meta.view.columns[i].dataIndex);
                            meta.view.columns.splice(i, 1);
                            return false;
                        }
                        else if (c.childColumns instanceof Array)
                        {
                            var found = false;
                            $.each(c.childColumns, function(j, cc)
                            {
                                if (cc.id == cId)
                                {
                                    if (subRemovedData[c.dataIndex] === undefined)
                                    { subRemovedData[c.dataIndex] = []; }
                                    subRemovedData[c.dataIndex].push(cc.dataIndex);
                                    c.childColumns.splice(j, 1);
                                    found = true;
                                    return false;
                                }
                            });
                            if (found) { return false; }
                        }
                    });

                    if (meta.aggregates !== null && meta.aggregates !== undefined)
                    {
                        $.each(meta.aggregates, function(i, a)
                        {
                            if (a.columnId == cId)
                            {
                                meta.aggregates.splice(i, 1);
                                meta.aggregateHash = {};
                                return false;
                            }
                        });
                    }
                });

                // Sort reverse numerical so we can properly splice out data
                removedData.sort(function(a, b) { return b - a; });
                _.each(rows, function(r)
                {
                    _.each(removedData, function(dataI)
                        { r.splice(dataI, 1); });
                });
                _.each(subRemovedData, function(subIndexes, index)
                {
                    subIndexes.sort(function(a, b) { return b - a; });
                    _.each(rows, function(r)
                    {
                        if (r[index] instanceof Object)
                        {
                            _.each(r[index], function(subRow)
                            {
                                _.each(subIndexes, function(dataI)
                                {
                                    subRow.splice(dataI, 1);
                                });
                            });
                        }
                    });
                });
            }

            // Refresh the meta data and redraw the grid.
            meta.columns = null;
            this.meta(meta);
            $(listeners).trigger('columns_updated', [this]);
        };

        this.moveColumn = function(oldPosOrCol, newPos)
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

        this.updateVisibleColumns = function(visCols)
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

            var visHash = {};
            $.each(visCols, function(i, cId) { visHash[cId] = i; });

            $.each(meta.view.columns, function(i, c)
            {
                if (!c.flags) { c.flags = []; }
                if (visHash[c.id] !== undefined)
                {
                    c.position = visHash[c.id];
                    var ind = $.inArray('hidden', c.flags);
                    if (ind > -1) { c.flags.splice(ind, 1); }
                }
                else { c.flags.push('hidden'); }
            });

            // Null out the meta columns, and then force a reset
            meta.columns = null;
            this.meta(meta);
            $(listeners).trigger('columns_rearranged', [ this ]);
        };

        /**
         * Notify the model of row changes.
         */
        this.change = function(rows) {
            $(listeners).trigger('row_change', [ rows ]);
        };

        /**
         * Notify the model of metadata model changes.
         */
        this.metaChange = function() {
            $(listeners).trigger('meta_change', [ this ]);
        };

        /**
         * Notify the model of footer data changes.
         */
        this.footerChange = function() {
            $(listeners).trigger('footer_change', [ this ]);
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

        /**
         * Notify listeners of column sort changes
         */
        this.columnSortChange = function(skipReq)
        {
            $(listeners).trigger('sort_change', [skipReq]);
        };

        /**
         * Notify listeners of column filter changes
         */
        this.columnFilterChange = function(col, setFilter)
        {
            $(listeners).trigger('column_filter_change', [ col, setFilter ]);
        };

        this.undoRedoChange = function()
        {
            $(listeners).trigger('undo_redo_change');
        };

        /**
         * Retrieve a single row by index.
         */
        this.get = function(index) {
            return active[index];
        };

        /**
         * Retrieve a single row by ID.
         */
        this.getByID = function(id)
        {
            var row = undefined;
            if (lookup[id] != undefined)
            {
                row = rows[lookup[id]];
            }
            else if (activeLookup[id] != undefined)
            {
                row = active[activeLookup[id]];
            }
            return row;
        };

        /**
         * Retrieve a column object by UID.
         */
        this.column = function(uid) {
            return columnLookup[uid];
        };

        /**
         * Retrieve all columns in visual order.
         */
        this.columns = function() {
            return columnLookup;
        }

        this.getColumnByID = function(id) { return columnIDLookup[id]; };

        this.columnIdToTableId = function(id)
        { return this.getColumnByID(parseInt(id)).tableColumnId; };

        /**
         * Retrieve the total number of rows.
         */
        this.length = function()
        {
            return activeCount;
        };

        /**
         * Retrieve the columns for a level.
         */
        this.level = function(id) {
            return meta.columns[id];
        };

        /**
         * Retrieve the total number of rows, excluding group headers or other
         *  special rows, but including all children of rows
         */
        this.dataLength = function()
        {
            var total = activeCount;
            _.each(active, function(row, i)
            {
                // Don't count rows with level not equal to 0 or blank rows
                if (row.level !== 0 && row.level !== undefined ||
                    row.type == 'blank') { total--; }
                // Count child rows, expanded or not
                if (row.childRows !== undefined) { total += row.childRows.length; }
            });
            return total;
        };

        /**
         * Scan to find the next or previous row in the same level.
         */
        this.nextInLevel = function(from, backward) {
            var pos = from;
            var level = 0;
            if (active[pos] !== undefined) { level = active[pos].level || 0; }
            if (backward)
            {
                while (--pos >= 0)
                {
                    if ((active[pos] !== undefined ?
                        (active[pos].level || 0) : 0) == level)
                    { return pos; }
                }
            }
            else
            {
                var end = activeCount;
                while (++pos < end)
                {
                    if (active[pos] === undefined ||
                        (active[pos].level || 0) == level)
                    { return pos; }
                }
            }
            return null;
        };

        this.selectedRows = {};

        this.hasSelectedRows = function() {
            for (var i in this.selectedRows)
            {
                return true;
            }
        }

        this.toggleSelectRow = function(row)
        {
            if (this.selectedRows[row.id] === undefined ||
                this.selectedRows[row.id] === null)
            {
                return this.selectRow(row);
            }
            else
            {
                return this.unselectRow(row);
            }
        };

        this.selectRow = function(row, suppressChange)
        {
            if (row.level < 0 || row.type == 'blank')
            {
                return;
            }

            var rowId = row.id;
            this.selectedRows[rowId] = activeLookup[rowId];
            if (!suppressChange)
            {
                this.selectionChange([row]);
            }
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
            $.each(this.selectedRows, function (id, v)
            {
                unselectedRows.push(self.getByID(id));
            });
            this.selectedRows = {};
            if (!suppressChange)
            {
                this.selectionChange(unselectedRows);
            }
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
            $.each(this.selectedRows, function (id, index)
            {
                if (minIndex == null || minIndex > index)
                {
                    minIndex = index;
                }
            });

            if (minIndex == null)
            {
                return this.selectRow(row);
            }
            var curIndex = activeLookup[row.id];
            var maxIndex = curIndex;
            if (curIndex < minIndex)
            {
                maxIndex = minIndex;
                minIndex = curIndex;
            }

            var changedRows = this.unselectAllRows(true);
            for (var i = minIndex; i <= maxIndex; i++)
            {
                var curRow = active[i];
                if (curRow !== undefined &&
                    (curRow.level >= 0 || curRow.level === undefined) &&
                    curRow.type != 'blank')
                {
                    this.selectedRows[curRow.id] = i;
                    changedRows.push(curRow);
                }
            }
            this.selectionChange(changedRows);
            return changedRows;
        };

        this.multiSort = function(orderBys, skipRequest)
        {
            if ($.isBlank(orderBys) || orderBys.length === 0)
            {
                this.clearSort(null, skipRequest);
                return;
            }
            else if (orderBys.length == 1)
            {
                var sort = orderBys[0];
                var colIndex = findColumnIndex(
                    parseInt(sort.expression.columnId, 10));
                this.sort(colIndex, !sort.ascending, skipRequest);
                return;
            }

            meta.view.query.orderBys = orderBys;
            if (!$.isBlank(curOptions.masterView))
            { curOptions.masterView.query.orderBys = orderBys; }
            meta.sort = {};
            $.each(meta.view.query.orderBys, function(i, sort) {
                var col = self.getColumnByID(sort.expression.columnId);
                meta.sort[sort.expression.columnId] = {
                    ascending: sort.ascending,
                    column: col
                    };
            });
            sortConfigured = true;

            this.columnSortChange(true);

            if (skipRequest) { return; }

            // Sort
            doSort();

            // If there's an active filter, or grouping function, re-apply now
            // that we're sorted
            configureActive(active);
        };

        /**
         * Sort the data by a single column.
         *
         * @param order either a column index or a sort function
         * @param descending true to sort descending if order is a column index
         */
        this.sort = function(order, descending, skipRequest)
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

                meta.sort = {};
                meta.sort[orderCol.id] = {column: orderCol, ascending: !descending};

                // Update the view in-memory, so we can always serialize it to
                //  the server and get the correct sort options
                if (meta.view.query !== undefined)
                {
                    meta.view.query.orderBys = [{
                        expression: {columnId: orderCol.id, type: 'column'},
                        ascending: !descending
                    }];
                    if (!$.isBlank(curOptions.masterView))
                    {
                        curOptions.masterView.query.orderBys =
                            meta.view.query.orderBys;
                    }
                }

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
                        };
                    }
                    else
                    {
                        orderFn = function(a, b) {
                            return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
                        };
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

            this.columnSortChange(skipRequest);

            if (skipRequest) { return; }

            // Sort
            doSort();

            // If there's an active filter, or grouping function, re-apply now
            // that we're sorted
            configureActive(active);
        };

        this.clearSort = function(order, skipRequest)
        {
            if (typeof order == 'function') { order = null; }

            if (order && typeof order != 'object')
            {
                order = meta.columns[0][order];
            }

            if ($.isPlainObject(order))
            {
                delete meta.sort[order.id];

                if (meta.view.query.orderBys !== undefined)
                {
                    for (var i = 0; i < meta.view.query.orderBys.length; i++)
                    {
                        if (meta.view.query.orderBys[i]
                            .expression.columnId == order.id)
                        {
                            meta.view.query.orderBys.splice(i, 1);
                            break;
                        }
                    }

                    if (!$.isBlank(curOptions.masterView))
                    {
                        curOptions.masterView.query.orderBys =
                            meta.view.query.orderBys;
                    }

                    if (meta.view.query.orderBys.length == 1)
                    {
                        var newSort = meta.view.query.orderBys[0];
                        var colIndex =
                            findColumnIndex(newSort.expression.columnId);
                        if (colIndex !== undefined)
                        {
                            this.sort(colIndex, !newSort.ascending, skipRequest);
                            return;
                        }
                    }
                }
            }
            else
            {
                meta.sort = {};
                delete meta.view.query.orderBys;
                if (!$.isBlank(curOptions.masterView))
                { delete curOptions.masterView.query.orderBys; }
            }
            sortConfigured = true;
            orderCol = null;
            orderFn = null;
            orderPrepro = null;

            this.columnSortChange(skipRequest);

            if (skipRequest) { return; }

            var hasSort = false;
            $.each(meta.sort, function() { hasSort = true; return false; });
            if (hasSort) { doSort(); }
            // The only way to guarantee a correct ordering of rows (right now)
            //  when clearing all sorts is to go to the server
            else { this.getTempView(); }

            // If there's an active filter, or grouping function, re-apply now
            // that we're sorted
            configureActive();
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
                    setRowMetadata([childRow[col.dataIndex]], col.metaChildren,
                        col.dataMungeChildren);
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
                if (active == rows)
                { active = _.clone(rows); }
                var i = parseInt(activeLookup[row.id]);
                addItemsToObject(active, childRows, i + 1);
                activeCount += childRows.length;
            }
            else
            {
                // Remove the child rows
                if (row.childRows && row.childRows.length)
                {
                    var i = parseInt(activeLookup[row.id]);
                    removeItemsFromObject(active, i + 1,
                        row.childRows.length);
                    activeCount -= row.childRows.length;
                    if (active == rows) { totalRows = activeCount; }
                }
            }

            // Record the new row state
            row.expanded = open;

            // Update IDs for the rows that moved
            installIDs(true);

            // Fire events
            if (!skipEvent) { this.change([ row ]); }
        };

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
        };

        // Run sorting based on the current filter configuration.  Does not
        // fire events
        var doSort = function()
        {
            if (!sortConfigured) { return; }

            removeSpecialRows();

            if (self.isProgressiveLoading())
            {
                self.getTempView();
                // Bail out early, since the server does the sorting
                return;
            }

            // Apply preprocessing function if necessary.  We then sort a new
            // array that contains a [ 'value', originalRecord ] pair for each
            // item.  This allows us to avoid complex ordering functions.
            var toSort = new Array(activeCount);
            _.each(active, function(rec, i)
            {
                toSort[i] = orderPrepro !== undefined ?
                    [orderPrepro(rec[orderCol.dataIndex], orderCol), rec] : rec;
            });

            // Perform the actual sort
            if (orderFn) { toSort.sort(orderFn); }
            else { toSort.sort(); }

            var activeIsRows = active == rows;
            // Update the original object
            active = {};
            if (activeIsRows) { rows = active; }
            for (i = 0; i < toSort.length; i++)
            { active[i] = orderPrepro !== undefined ? toSort[i][1] : toSort[i]; }

            // Update ID lookup
            installIDs(true);
        };

        this.getViewCopy = function()
        {
            var view = meta.view;
            // Update all the widths from the meta columns
            $.each((meta.columns || [])[0] || [], function(i, c)
            {
                self.getColumnByID(c.id).width = c.width;
                if (c.body && c.body.children)
                {
                    $.each(c.body.children, function(j, cc)
                    {
                        self.getColumnByID(cc.id).width = cc.width;
                    });
                }
            });

            view = $.extend(true, {}, view);
            delete view.sortBys;
            delete view.viewFilters;

            // Filter out all metadata columns
            view.columns = $.grep(view.columns, function(c, i)
                { return c.id != -1; });

            // Sort by position, because the attribute is ignored when
            // saving columns
            view.columns.sort(function(a, b)
                { return a.position - b.position; });

            var cleanColumn = function(col)
            { delete col.dataIndex; };

            // Clean out dataIndexes, and clean out child metadata columns
            $.each(view.columns, function(i, c)
            {
                cleanColumn(c);
                if (c.childColumns)
                {
                    c.childColumns = $.grep(c.childColumns, function(cc, j)
                        { return cc.id != -1; });
                    $.each(c.childColumns, function(j, cc)
                        { cleanColumn(cc); });
                }
            });

            view.originalViewId = view.id;
            return view;
        };


        this.cleanViewForPost = function(view, includeColumns)
        {
            if (includeColumns)
            {
                var cleanColumn = function(col)
                {
                    delete col.options;
                    delete col.dropDown;
                    delete col.renderTypeName;
                    delete col.dataTypeName;
                };

                // Clean out dataIndexes, and clean out child metadata columns
                $.each(view.columns, function(i, c)
                {
                    cleanColumn(c);
                    if (c.childColumns)
                    {
                        $.each(c.childColumns, function(j, cc)
                            { cleanColumn(cc); });
                    }
                });
            }
            else
            { delete view.columns; }

            delete view.grants;
            return view;
        };


        this.getTempView = function(tempView, includeColumns)
        {
            // If we're doing progressive loading, set up a temporary
            //  view, then construct a query with a special URL and
            //  appropriate params to get rows back for the specified view
            // Only include columns if this view is grouped; otherwise, don't
            // include columns since we want them all back, and we don't need
            // to send all that extra data over or modify columns accidentally
            tempView = this.cleanViewForPost(tempView || this.getViewCopy(),
                includeColumns || this.isGrouped());
            var ajaxOptions = $.extend({},
                    supplementalAjaxOptions,
                    { url: '/views/INLINE/rows.json?' + $.param(
                        $.extend({}, supplementalAjaxOptions.data,
                        {   method: 'getByIds', start: 0,
                            length: curOptions.pageSize,
                            meta: true
                        })),
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify(tempView)
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
            var newRows = config.rows || (config.data !== undefined ?
                config.data.data : null) || config.data;
            if (config.meta)
            {
                meta.columns = null;
                config.meta.columnFilters = meta.columnFilters;
                config.meta.view.id = meta.view.id;
                config.meta.view.owner = meta.view.owner;
                // Copy flags over so we know if this is the default view
                config.meta.view.flags = meta.view.flags;
                this.meta(config.meta);
                if (config.meta.totalRows !== undefined)
                { activeCount = config.meta.totalRows; }

                self.reloadAggregates();
            }

            // active is now the new set of rows from the server, and not
            //  linked-to or based-on rows
            active = {};
            // Convert array of rows into object
            _.each(newRows, function(r, i) { active[i] = r; });
            setRowMetadata(active, meta.metaColumns, meta.dataMungeColumns);
            _.each(active, function(curRow, i)
            {
                // Copy over loaded rows in case they are updated
                var rowPos = lookup[curRow.id];
                if (rowPos !== undefined) { rows[rowPos] = curRow; }
            });
            installIDs(true);
            configureActive(null, true);
        };

        /**
         * Group columns
         */

        this.group = function(grouping)
        {
            meta.view.query.groupBys = grouping;
            if (!$.isBlank(curOptions.masterView))
            { curOptions.masterView.query.groupBys = grouping; }
        };

        /**
         * Filter the data.
         *
         * @param filter either filter text or a filtering function
         * @param timeout an optional async delay value (in milliseconds)
         */
        this.filter = function(filter, timeout)
        {
            if (filterTimer) { clearTimeout(filterTimer); }
            // Configure for filtering.  toFilter is an optimized set that may
            // be a subset of all rows if a previous filter is in place.
            var toFilter = configureFilter(filter);

            // If there's nothing to filter, return now
            if (!toFilter || !filterFn) { return; }

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
            {
                filterFn = filter;
                filterText = null;
            }
            else
            {
                if (filter === null) { filter = ""; }
                if (filter === filterText) { return null; }

                // Clear the filter if it contains less than the minimum characters
                if (filter.length < curOptions.filterMinChars || filter.length == 0)
                {
                    filterFn = null;
                    filterText = "";
                    meta.view.searchString = null;
                    if (self.isProgressiveLoading())
                    {
                        self.getTempView();
                    }
                    else if (active != rows)
                    {
                        active = rows;
                        activeCount = totalRows;
                        $(listeners).trigger('client_filter');
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
                    var type = rootColumns[i].type || 'text';
                    if (blist.data.types[type].filterText)
                    {
                        // Textual column -- apply the regular expression to
                        // each instance
                        filterParts.push(' || ',
                            type == 'html' ? '$.htmlStrip' : '', '(r',
                            rootColumns[i].dataLookupExpr, ' + "").match(regexp)');
                    }
                    else if (type == "picklist" || type == 'drop_down_list')
                    {
                        // Picklist column -- prefilter and then search by ID
                        var options = rootColumns[i].options;
                        if (options) {
                            var matches = [];
                            for (var key in options)
                            {
                                if (options[key].text.match(regexp))
                                { matches.push(key); }
                            }
                            for (var j = 0; j < matches.length; j++)
                            {
                                filterParts.push(' || (r' +
                                    rootColumns[i].dataLookupExpr + ' == "' +
                                    matches[j] + '")');
                            }
                        }
                    }
                }
                filterParts.push("; });");
                filterFn = new Function('regexp',
                    'return ' + filterParts.join(''))(regexp);

                // Filter the current filter set if the filter is a subset of
                // the current filter
                if (filterText !== null &&
                    filter.substring(0, filterText.length) == filterText)
                { toFilter = active; }
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
            if (text.match(/[A-Z]/)) { var modifiers = ""; }
            else { modifiers = "i"; }

            // Escape special characters and create the regexp
            return new RegExp(
                text.replace(/(\/|\.|\*|\+|\?|\||\(|\)|\[|\]|\{|\})/g, "\\$1"),
                modifiers);
        };

        /* Clear out the filter for a particular column.  Takes a column obj
         *  or a column index.
         * This clears both the short version stored on the meta obj, and
         * updates the meta.view.query.filterCondition that is sent to the
         * server. */
        var clearColumnFilterData = function(filterCol)
        {
            // Turn index into obj
            if (typeof filterCol != 'object')
            {
                filterCol = meta.columns[0][filterCol];
            }

            if (meta.columnFilters != null)
            {
                var cf = meta.columnFilters[filterCol.id];
                // First check if this is the only viewFilter; if so, clear it
                if (meta.view.query.filterCondition == cf.viewFilter)
                {
                    meta.view.query.filterCondition = null;
                }
                else
                {
                    // Else it is a child of the top-level filter; splice it out
                    meta.view.query.filterCondition.children.splice(
                            $.inArray(cf.viewFilter,
                                meta.view.query.filterCondition.children), 1);
                    // If the top-level filter is empty, get rid of it
                    if (meta.view.query.filterCondition.children.length < 1)
                    {
                        meta.view.query.filterCondition = null;
                    }
                }
                meta.columnFilters[filterCol.id] = null;
            }
        };

        /* Filter a single column (column obj or index) on a value.
         *  These filters are additive (all ANDed at the top level).
         *  Currently it only supports one filter per column.
         */
        this.filterColumn = function(filterCol, filterVal, subColumnType)
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
            if (meta.columnFilters[filterCol.id])
            {
                clearColumnFilterData(filterCol);
            }

            // Update the view in-memory, so we can always serialize it to
            //  the server and get the correct filter
            var filterItem = { type: 'operator', value: 'EQUALS', children: [
                { type: 'column', columnId: filterCol.id, value: subColumnType },
                { type: 'literal', value: filterVal } ] };
            if (meta.view.query.filterCondition == null)
            {
                // Make it the top-level filter
                meta.view.query.filterCondition = filterItem;
            }
            else if (meta.view.query.filterCondition.type == 'operator' &&
                meta.view.query.filterCondition.value == 'AND')
            {
                // Add it to the top-level filter
                if (!meta.view.query.filterCondition.children)
                {
                    meta.view.query.filterCondition.children = [];
                }
                meta.view.query.filterCondition.children.push(filterItem);
            }
            else
            {
                // Else push the top-level filter down one level, and
                //  add this to the new top-level filter
                var topF = { type: 'operator', value: 'AND', children: [
                    meta.view.query.filterCondition, filterItem
                ] };
                meta.view.query.filterCondition = topF;
            }

            // Store the filter in an easier format to deal with elsewhere;
            //  also keep a pointer back to the viewFilter
            meta.columnFilters[filterCol.id] =
                {column: filterCol, value: filterVal, viewFilter: filterItem};

            this.columnFilterChange(filterCol, true);

            // Reload the view from the server; eventually we should do this
            //  locally if not in progressiveLoading mode
            this.getTempView();
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

            if (meta.columnFilters[filterCol.id])
            {
                clearColumnFilterData(filterCol);
            }

            this.columnFilterChange(filterCol, false);

            this.getTempView();
        };

        /**
         * Find a column based on a user configuration value.  If the value is not present, an optional list of names
         * is used to locate the column in the dataset.
         */
        this.findConfiguredColumn = function(idOrName, autoNames) {
            // Look for column using the
            var col;

            if (idOrName != undefined) {
                // Search for the configured value as an ID
                col = this.getColumnByID(idOrName);
                if (col != undefined)
                    return col;

                // Search for the configured value as a name
                idOrName = ("" + idOrName).toLowerCase().replace(/[\s\-]/g, '_');
                var columns = this.columns();
                for (var i = 0; i < columns.length; i++) {
                    var column = columns[i];
                    if (column.name.toLowerCase().replace(/\s\-/g, '_') == idOrName)
                        return column;
                }
            }

            // Search for the column in the given set of names
            if (autoNames)
                columns = this.columns();
                for (i = 0; i < columns.length; i++) {
                    column = columns[i];
                    var name = column.name.toLowerCase().replace(/\s\-/g, '_');
                    if ($.inArray(name, autoNames) != -1)
                        return column;
                }

            // Found no suitable column
            return undefined;
        }

        // Apply filtering, grouping, and sub-row expansion to the active set.
        // This applies current settings to the active set and then notifies
        // listeners of the data change.
        var configureActive = function(filterSource, loadedTempView)
        {
            var idChange = removeSpecialRows();
            // If we just loaded a temp view, the set is already filtered
            if (!loadedTempView && filterFn)
            {
                doFilter(filterSource);
                idChange = true;
            }
            if (groupFn)
            {
                doGroup();
                idChange = true;
            }

            if (doExpansion()) { idChange = true; }

            // Add in blank row at the end
            if (self.useBlankRows())
            {
                var blankRow = [];
                blankRow.level = 0;
                blankRow.type = 'blank';
                blankRow.id = 'blank';
                active[activeCount] = blankRow;
                activeCount++;
                if (active == rows) { totalRows = activeCount; }
                idChange = true;
            }

            if (idChange) { installIDs(); }
            dataChange();
        };

        var countSpecialTo = function(max)
        {
            var count = 0;
            if (max === undefined) { max = activeCount; }
            _.each(active, function(r, i)
            {
                if (parseInt(i) < max &&
                    (r.level !== 0 && r.level !== undefined || r.type == 'blank'))
                { count++; }
            });
            return count;
        };

        // Remove "special" (non-top-level) rows
        var removeSpecialRows = function()
        {
            var removed = false;
            var toRemove = [];
            _.each(active, function(r, i)
            {
                if (r.level !== 0 && r.level !== undefined || r.type == 'blank')
                {
                    toRemove.push(parseInt(i));
                    removed = true;
                }
            });
            toRemove.sort(function(a,b) { return b - a; });
            _.each(toRemove, function(i)
            {
                removeItemsFromObject(active, i, 1);
                activeCount--;
            });
            if (rows != active)
            {
                toRemove = [];
                _.each(rows, function(r, i)
                {
                    if (r.level !== 0 && r.level !== undefined ||
                        r.type == 'blank')
                    {
                        toRemove.push(parseInt(i));
                        removed = true;
                    }
                });
                toRemove.sort(function(a,b) { return b - a; });
                _.each(toRemove, function(i)
                {
                    removeItemsFromObject(rows, i, 1);
                    totalRows--;
                });
            }
            else { totalRows = activeCount; }
            return removed;
        };

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
                self.getTempView();
                // Bail out early, since the server does the sorting
                return;
            }

            // Perform the actual filter
            var filteredArray = _.sortBy($.objSelect(toFilter || rows, filterFn),
                function(v, k) { return k; });
            activeCount = filteredArray.length;
            active = {};
            _.each(filteredArray, function(r, i) { active[i] = r; });
            $(listeners).trigger('client_filter');
        };

        // Generate group headers based on the current grouping configuration.
        // Does not fire events.  Note that grouping is not currently supported
        // in progressive rendering mode.
        var doGroup = function()
        {
            if (!groupFn || !orderCol) { return; }
            var i = 0;
            var currentGroup;
            var groupOn = orderCol.dataIndex;
            // We need to traverse this in order, even though things are stored in
            // an object
            while (i < activeCount)
            {
                // This isn't supported in progressive loading mode, so active[i]
                // shouldn't ever be undefined here
                var group = groupFn(active[i][groupOn]);
                if (group != currentGroup)
                {
                    addItemsToObject(active,
                            [{
                                level: -1,
                                type: 'group',
                                title: group,
                                id: 'special-' + i
                            }], i);
                    activeCount++;
                    i++;
                    currentGroup = group;
                }
                i++;
            }
            if (rows == active) { totalRows = activeCount; }
            // Update ID lookup
            installIDs(true);
        };

        // Expand rows that the user has opened
        var doExpansion = function()
        {
            var toExpand = [];
            _.each(active, function(r, i)
            {
                if (r.expanded) { toExpand.push(parseInt(i)); }
            });

            toExpand.sort(function(a,b) { return b - a; });
            _.each(toExpand, function(i)
            {
                var childRows = getChildRows(active[i]);
                addItemsToObject(active, childRows, i + 1);
                activeCount += childRows.length;
            });
            if (active == rows) { totalRows = activeCount; }

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
                this.trigger('meta_change', [ model ]);
                this.trigger('load', [ model ]);
                return model;
            }
            var currentModel = this.data('blistModel');
            if (currentModel) { return currentModel; }
            return this.blistModel(new blist.data.Model());
        }
    });
})(jQuery);
