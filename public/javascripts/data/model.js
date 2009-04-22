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
        var listeners = [];
        var data = [];
        var lookup = {};

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
        this.rows = function(rows) {
            if (rows) {
                installIDs(rows, 0);
                data = rows;
                $(listeners).trigger('postload', [ this ]);
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
            if (typeof order != 'function') {
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
                order = columnType(order).sortGen(r1, r2);
            }

            // Sort and notify listeners
            data.sort(order);
            $(listeners).trigger('postload', [ this ]);
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
