/**
 * This file implements the Blist data model.  The data model is a flexible container for dynamic data that is
 * decoupled from any specific presentation mechanism.
 */

blist.namespace.fetch('blist.data');

(function($) {
    /**
     * This class provides functionality for managing a table of data.
     */
    blist.data.Model = function(meta, rows) {
        var self = this;

        // The active dataset (rows or a filtered version of rows)
        var data = [];

        // Row lookup-by-ID
        var lookup = {};

        // Event listeners
        var listeners = [];

        // Sorting configuration
        var orderFn = null;
        var orderDesc = false;

        // Filtering configuration
        var filterFn = null;
        var filterText = "";
        var filterTimer = null;

        var columnType = function(index) {
            if (meta.columns) {
                var column = meta.columns[index];
                if (column) {
                    var type = blist.data.types[column.columnType];
                    if (type)
                        return type;
                }
            }
            return blist.data.types.text;
        }

        var installIDs = function(rows, from) {
            for (var row in rows)
                lookup[row[0]] = from++;
        }

        var dataChange = function() {
            $(listeners).trigger('postload', [ self ]);
        }

        /**
         * Access the dataset title.
         */
        this.title = function() {
            return meta.title || "Blist Data";
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
         * Load the metadata and rows for the model via an AJAX request.
         */
        this.ajax = function(ajaxOptions) {
            if (typeof ajaxOptions != 'object')
                ajaxOptions = {
                    url: ajaxOptions
                }
            if (!ajaxOptions.success) {
                if (!ajaxOptions.dataType)
                    ajaxOptions.dataType = 'json';
                var me = this;
                ajaxOptions.success = function(config) {
                    me.load(config);
                }
            }
            if (!$(listeners).trigger('preload', [ ajaxOptions ]))
                return;
            $.ajax(ajaxOptions);
        }

        /**
         * Get and/or set the metadata for the model.
         */
        this.meta = function(newMeta) {
            if (newMeta) {
                meta = newMeta;
                if (!meta.columns)
                    meta.columns = [];
                $(listeners).trigger('meta_change', [ this ]);
            }
            return meta;
        }

        /**
         * Get and/or set the rows for the model.
         */
        this.rows = function(newRows) {
            if (newRows) {
                installIDs(newRows, 0);
                data = rows = newRows;
                dataChange();
            }
            return data;
        }

        /**
         * Add rows to the model.
         */
        this.add = function(rows) {
            installIDs(rows, data.length);
            data = data.concat(rows);
            $(listeners).trigger('row_add', [ rows ]);
        }

        /**
         * Remove rows from the model.
         */
        this.remove = function(rows) {
            for (var row in rows) {
                var index = delete lookup[row[0]];
                if (index != undefined)
                    data.splice(index, 1);
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
            return data[index];
        }

        /**
         * Retrieve a single row by ID.
         */
        this.getByID = function(id) {
            var index = lookup[id];
            return index == undefined ? undefined : data[index];
        }

        /**
         * Retrieve the total number of rows.
         */
        this.length = function(id) {
            return data.length;
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
                var r1 = "a[" + order + "]";
                var r2 = "b[" + order + "]";

                // Swap expressions for descending sort
                if (descending) {
                    var temp = r1;
                    r1 = r2;
                    r2 = temp;
                }

                // Compile an ordering function specific to the column positions
                orderFn = columnType(order).sortGen(r1, r2);
            }
            orderDesc = descending;
            
            // Sort and notify listeners
            doSort();
            dataChange();
        }

        // Run sorting based on current filter configuration.  Does not fire events
        var doSort = function() {
            if (orderFn)
                data.sort(orderFn, orderFn, orderDesc);
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

                // Clear the filter if it contains less than three characters
                if (filter.length < 3) {
                    filterFn = null;
                    filterText = "";
                    data = rows;
                    dataChange();
                    return null;
                }

                // Generate a filter function (TODO - support non-textual values)
                var regexp = createRegExp(filter);
                var filterParts = [ "(function(r) { return false" ];
                for (var i = 0; i < meta.columns.length; i++)
                    if (columnType(i).filterText)
                        filterParts.push(' || (r[', i, '] + "").match(regexp)');
                filterParts.push("; });");
                filterFn = eval(filterParts.join(''));

                // Filter the current filter set if the filter is a subset of the current filter
                if (filter.substring(0, filterText.length) == filterText)
                    toFilter = data;
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
            if (filterTimer) {
                window.clearTimeout(filterTimer);
                filterTimer = null;
            }
            data = $.grep(toFilter || rows, filterFn);
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
                this.trigger('row_change', [ model ]);
                return model;
            }
            var currentModel = this.data('blistModel');
            if (currentModel)
                return currentModel;
            return this.blistModel(new blist.data.Model());
        }
    });
})(jQuery);
