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
 *   <li>columns - a list of column configuration objects</li>
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
 *
 * <h2>Events</h2>
 * 
 * The model fires the following events:
 *
 * <li>
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
            filterMinChars: 3
        };

        // The active dataset (rows or a filtered version of rows)
        var active = [];

        // Row lookup-by-ID
        var lookup = {};

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
        var supplementalAjaxOptions = null;

        var columnType = function(index) {
            if (meta.columns) {
                var column = meta.columns[index];
                if (column) {
                    var type = blist.data.types[column.type];
                    if (type)
                        return type;
                }
            }
            return blist.data.types.text;
        }

        var installIDs = function(newRows, from) {
            if (!newRows)
                newRows = rows;
            if (from == null)
                from = 0;
            for (var i = 0; i < newRows.length; i++) {
                var row = newRows[i];
                if (typeof row == 'object')
                    var id = row.id || row[0];
                else
                    id= row;
                lookup[id] = from++;
            }
        }

        var dataChange = function() {
            $(listeners).trigger('load', [ self ]);
        }

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
         * Access the dataset title.
         */
        this.title = function() {
            return meta.title || (meta.view && meta.view.name) || "";
        }

        /**
         * Add a model listener.  A model listener receives events fired by the model.
         */
        this.addListener = function(listener) {
            var pos = $.inArray(listener, listeners);
            if (pos == -1)
                listeners.push(listener);
        }

        /**
         * Remove a model listener.
         */
        this.removeListener = function(listener) {
            var pos = $.inArray(listener, listeners);
            if (pos == -1)
                listeners = listeners.splice(pos, 1);
        }

        /**
         * Set the metadata and rows for the model.
         */
        this.load = function(config) {
            if (config.meta)
                this.meta(config.meta);
            if (config.rows || config.data)
                this.rows(config.rows || config.data);
        }

        /**
         * Configure a function for translating server requests to client requests.
         */
        this.translate = function(newTranslateFn) {
            translateFn = newTranslateFn;
        }

        /**
         * Load the metadata and rows for the model via an AJAX request.
         */
        this.ajax = function(ajaxOptions) {
            if (typeof ajaxOptions != 'object')
                ajaxOptions = {
                    url: ajaxOptions
                }
            supplementalAjaxOptions = $.extend({}, ajaxOptions);
            doLoad(this, this.load, ajaxOptions);
        }

        var doLoad = function(model, onLoad, ajaxOptions) {
            if (!ajaxOptions.success) {
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
            $.ajax(ajaxOptions);
        }

        /**
         * Load a set of rows.  The table must have been populated via AJAX for this to succeed.  Supplementary
         * requests will be requested of the original URL using ids[] query parameters in the POST body.
         *
         * @param rows an array of row IDs
         */
        this.loadRows = function(rows) {
            if (!supplementalAjaxOptions)
                return;
            var ajaxOptions = $.extend({
                data: {
                    ids: rows
                }
            }, supplementalAjaxOptions);
            doLoad(this, onSupplementalLoad, ajaxOptions);
        }

        var onSupplementalLoad = function(response) {
            // Install the rows
            var supplement = response.data;
            for (var i = 0; i < supplement.length; i++) {
                var row = supplement[i];
                var id = row.id || row[0];
                var index = lookup[id];
                if (index != null)
                    rows[index] = row;
            }

            // Notify listeners of row load via the "change" event
            this.change(supplement);
        }

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

        var translateColumnsFromView = function(view) {
            var intermediateCols = [];
            var viewCols = view.columns;
            if (viewCols) {
                for (var i = 0; i < viewCols.length; i++) {
                    var col = viewCols[i];
                    if (col.position && (!col.flags ||
                        $.inArray("hidden", col.flags) == -1)) {
                        var icol = intermediateCols[col.position] = {
                            name: col.name,
                            width: col.width || 100,
                            type: col.dataType && col.dataType.type ? col.dataType.type : "text",
                            dataIndex: i
                        }
                        if (icol.type == "text" && col.format && col.format.formatting_option == "Rich")
                            icol.type = "richtext";
                        if (icol.type == "picklist")
                            icol.options = translatePicklistFromView(col);
                        if (col.format && col.format.view)
                            icol.format = col.format.view;
                    }
                }
                var columns = [];
                for (i = 0; i < intermediateCols.length; i++) {
                    col = intermediateCols[i];
                    if (!col)
                        continue;
                    // TODO -- handle nested columns
                    columns.push(col);
                }
            }
            return columns;
        }

        /**
         * Get and/or set the metadata for the model.
         */
        this.meta = function(newMeta) {
            if (newMeta) {
                // Ensure the meta has a columns object, even if it is empty
                meta = newMeta;
                if (!meta.columns) {
                    if (meta.view)
                        meta.columns = translateColumnsFromView(meta.view);
                    else
                        meta.columns = [];
                }

                // For each column, ensure that dataIndex is present, and create a "dataIndexExpr" which is used with
                // metaprogramming to reference a column value
                for (var i = 0; i < meta.columns.length; i++) {
                    var col = meta.columns[i];
                    var dataIndex = col.dataIndex;
                    if (!dataIndex)
                        dataIndex = col.dataIndex = i;
                    if (typeof dataIndex == "string")
                        col.dataIndexExpr = "'" + dataIndex + "'";
                    else
                        col.dataIndexExpr = dataIndex + '';
                }

                // Notify listeners of the metadata change
                $(listeners).trigger('meta_change', [ this ]);
            }
            return meta;
        }

        /**
         * Get and/or set the rows for the model.  Returns only "active" rows, that is, those that are visible.
         */
        this.rows = function(newRows) {
            if (newRows) {
                installIDs(newRows, 0);
                active = rows = newRows;

                // Apply sorting if so configured
                if (sortConfigured)
                    doSort();

                // Apply filtering and grouping (filtering calls grouping so we never need to call both)
                if (filterFn)
                    doFilter(rows);
                else if (groupFn)
                    doGroup();
                
                dataChange();
            }

            return active;
        }

        /**
         * Add rows to the model.
         */
        this.add = function(rows) {
            installIDs(rows, active.length);
            active = active.concat(rows);
            $(listeners).trigger('row_add', [ rows ]);
        }

        /**
         * Remove rows from the model.
         */
        this.remove = function(rows) {
            for (var row in rows) {
                var id = row.id || row[0];
                var index = lookup[id];
                if (index) {
                    delete lookup[id];
                    if (index != undefined)
                        active.splice(index, 1);
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
        this.getByID = function(id) {
            var index = lookup[id];
            return index == undefined ? undefined : rows[index];
        }

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
        this.sort = function(order, descending) {
            // Load the types
            if (typeof order == 'function')
                orderFn = order;
            else {
                // Column reference expressions
                if (typeof order == 'object')
                    orderCol = order;
                else
                    orderCol = meta.columns[order];

                var r1 = "a[" + orderCol.dataIndexExpr + "]";
                var r2 = "b[" + orderCol.dataIndexExpr + "]";

                // Swap expressions for descending sort
                if (descending) {
                    var temp = r1;
                    r1 = r2;
                    r2 = temp;
                }

                // Compile an ordering function specific to the column positions
                var sortGen = columnType(order).sortGen;
                if (sortGen)
                    orderFn = sortGen(r1, r2);
                else
                    orderFn = null;

                // Record preprocessing function for when we actually perform the sort
                orderPrepro = columnType(order).sortPreprocessor;
                if (orderPrepro && !orderFn)
                    if (descending)
                        orderFn = function(a, b) {
                            return a[0] > b[0] ? -1 : a[0] < b[0] ? 1 : 0;
                        }
                    else
                        orderFn = function(a, b) {
                            return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
                        }

                // Install the grouping function, if applicable
                if (orderCol.group === true)
                    groupFn = columnType(order).group;
                else
                    groupFn = orderCol.group;

                sortConfigured = true;
            }

            // Sort
            doSort();

            // If there's an active filter, or grouping function, re-apply now that we're sorted
            if (filterFn)
                doFilter(rows);
            else if (groupFn)
                doGroup(rows);

            // Notify listeners
            dataChange();
        }

        // Run sorting based on the current filter configuration.  Does not fire events
        var doSort = function() {
            // TODO - load from server if we're in progressive rendering mode

            removeSpecialRows();

            if (!sortConfigured)
                return;

            // Apply preprocessing function if necessary.  We then sort a new array that contains a
            // [ 'value', originalRecord ] pair for each item.  This allows us to avoid complex ordering functions.
            if (orderPrepro) {
                var toSort = new Array(active.length);
                for (var i = 0; i < active.length; i++) {
                    var rec = active[i];
                    toSort[i] = [ orderPrepro(rec[orderCol.dataIndex], orderCol), rec ];
                }
            } else
                toSort = active;

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
            installIDs();
        }

        /**
         * Filter the data.
         *
         * @param filter either filter text or a filtering function
         * @param timeout an optional async delay value (in milliseconds)
         */
        this.filter = function(filter, timeout) {
            if (filterTimer)
                clearTimeout(filterTimer);
            // Configure for filtering.  toFilter is an optimized set that may be a subset of all rows if a previous
            // filter is in place.
            var toFilter = configureFilter(filter);

            // If there's nothing to filter, return now
            if (!toFilter)
                return;

            // Filter
            if (timeout) {
                // Filter, but only after a short timeout
                filterTimer = setTimeout(function() {
                    window.clearTimeout(filterTimer);
                    doFilter(toFilter || rows);
                    dataChange();
                }, 250);
            } else {
                doFilter(toFilter);
                dataChange();
            }
        }

        var configureFilter = function(filter) {
            var toFilter;
            if (typeof filter == "function")
                filterFn = filter;
            else {
                if (filter == null)
                    filter = "";
                if (filter == filterText)
                    return null;

                // Clear the filter if it contains less than the minimum characters
                if (filter.length < curOptions.filterMinChars) {
                    filterFn = null;
                    filterText = "";
                    active = rows;
                    dataChange();
                    return null;
                }

                // Generate a filter function (TODO - support non-textual values)
                var regexp = createRegExp(filter);
                var filterParts = [ "(function(r) { return false" ];
                for (var i = 0; i < meta.columns.length; i++) {
                    if (columnType(i).filterText)
                        // Textual column -- apply the regular expression to each instance
                        filterParts.push(' || (r[', meta.columns[i].dataIndexExpr, '] + "").match(regexp)');
                    else if (meta.columns[i] == "picklist") {
                        // Picklist column -- prefilter and then search by ID
                        var options = meta.columns[i].options;
                        if (options) {
                            var matches = [];
                            for (var key in options)
                                if (options[key].text.match(regexp))
                                    matches.push(key);
                            for (var j = 0; j < matches.length; j++)
                                filterParts.push(' || (r[' + meta.columns[j].dataIndexExpr + '] == "' + matches[j] + '")');
                        }
                    }
                }
                filterParts.push("; });");
                filterFn = eval(filterParts.join(''));

                // Filter the current filter set if the filter is a subset of the current filter
                if (filter.substring(0, filterText.length) == filterText)
                    toFilter = active;
                filterText = filter;
            }

            return toFilter || rows;
        }

        // Create a regular expression to match user entered text
        var createRegExp = function(text) {
            // Collapse whitespace
            text = $.trim(text).replace(/\s+/, ' ');

            // Detect case and perform case sensitive match if capital letters are present
            if (text.match(/[A-Z]/))
                var modifiers = "";
            else
                modifiers = "i";

            // Escape special characters and create the regexp
            return new RegExp(text.replace(/(\/|\.|\*|\+|\?|\||\(|\)|\[|\]|\{|\})/g, "\\$1"), modifiers);
        }

        // Run filtering based on current filter configuration.  Does not fire events
        var doFilter = function(toFilter) {
            // TODO - load from server in progressive rendering mode

            // Remove the filter timer, if any
            if (filterTimer) {
                window.clearTimeout(filterTimer);
                filterTimer = null;
            }
            
            // Remove any header records (e.g. group titles) from the filter set
            if (toFilter == active)
                removeSpecialRows();

            // Perform the actual filter
            active = $.grep(toFilter || rows, filterFn);

            // Generate group headers if grouping is enabled
            if (groupFn)
                doGroup();
        }

        // Remove "special" (non-data) rows
        var removeSpecialRows = function() {
            var i = 0;
            while (i < active.length) {
                if (active[i]._special)
                    active.splice(i, 1);
                else
                    i++;
            }
        }

        // Generate group headers based on the current grouping configuration.  Does not fire events.  Note that
        // grouping is not currently supported in progressive rendering mode.
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
                        _special: true,
                        type: 'group',
                        title: group
                    })
                    i++;
                    currentGroup = group;
                }
                i++;
            }
        }

        if (meta)
            this.meta(meta);
        else
            this.meta({});

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
