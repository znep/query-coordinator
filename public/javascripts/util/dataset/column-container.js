(function(){

this.ColumnContainer = function(colName, selfUrl, urlBase)
{
    var _columnIDLookup;
    var _columnTCIDLookup;

    var capName = colName.capitalize();
    var colSet = colName + 's';
    var capSet = colSet.capitalize();

    // Convenience methods
    var forID = function(item, id) { return item[colName + 'ForID'](id); };
    var update = function(item, nc, ff, uo)
    { return item['update' + capSet](nc, ff, uo); };
    var realSet = function(item) { return item['real' + capSet]; };
    var visibleSet = function(item) { return item['visible' + capSet]; };

    var props = {};

    props[colName + 'ForID'] = function(id)
    {
        return _columnIDLookup[parseInt(id) || id];
    };

    props[colName + 'ForTCID'] = function(tcId)
    {
        return _columnTCIDLookup[parseInt(tcId)];
    };

    // Removes a column from the model without doing anything on the server;
    // use removeColumns or Column.remove for that
    props['clear' + capName] = function(col)
    {
        if (!$.isBlank(this._super)) { this._super(col); }

        this[colSet] = _.without(this[colSet], col);
        delete _columnIDLookup[col.id];
        delete _columnIDLookup[col.lookup];
        delete _columnTCIDLookup[col.tableColumnId];
        update(this);
    };

    props[colSet + 'ForType'] = function(type, includeHidden)
    {
        var cols = includeHidden ? realSet(this) : visibleSet(this);
        if (!$.isBlank(type))
        {
            cols = _.select(cols, function(c)
                { return _.include($.makeArray(type), c.renderTypeName); });
        }
        return cols;
    };

    props['add' + capName] = function(column, successCallback, errorCallback,
        customParams)
    {
        if (!$.isBlank(this._super) && this._super(arguments))
        { return true; } // true means abort

        var cont = this;
        var columnAdded = function(newCol)
        {
            cont[colSet].push(newCol);
            update(cont);
            if (_.isFunction(successCallback))
            { successCallback(forID(cont, newCol.id)); }
        };

        var req = {url: urlBase + '.json', type: 'POST',
                success: columnAdded, error: errorCallback};

        if (!$.isBlank(column))
        { req.data = JSON.stringify(new Column(column, cont).cleanCopy()); }

        if (!$.isBlank(customParams))
        { req.params = customParams; }

        this._makeRequest(req);
    };

    props['remove' + capSet] = function(columnIds, successCallback, errorCallback)
    {
        var cont = this;
        _.each($.makeArray(columnIds), function(cId)
        {
            var c = forID(cont, cId);
            c.remove(null, errorCallback, true);
        });

        var columnsRemoved = function()
        {
            update(cont);
            if (_.isFunction(successCallback)) { successCallback(); }
        };

        cont._sendBatch(columnsRemoved);
    };

    props['setVisible' + capSet] = function(visColIds, callback, skipRequest)
    {
        var cont = this;

        // First figure out if we need to update positions.  If the newly-visible
        // columns are in the same order as their existing position says, then
        // we just need to hide/show each column
        var prevPos = -1;
        var needsReorder = false;
        _.each(visColIds, function(colId)
        {
            var col = forID(cont, colId);
            if (col.position <= prevPos)
            {
                needsReorder = true;
                _.breakLoop();
            }
            prevPos = col.position;
        });

        var vizCols = [];
        _.each(visColIds, function(colId, i)
        {
            var col = forID(cont, colId);
            if (!$.isBlank(col))
            {
                col.show(null, null, true);
                if (needsReorder) { col.update({position: i + 1}); }
                var cc = col.cleanCopy();
                if (!$.isBlank(cc.childColumns))
                {
                    cc.childColumns = _.reject(cc.childColumns, function(ccc)
                        { return _.include(ccc.flags || [], 'hidden'); });
                }
                vizCols.push(cc);
            }
        });

        _.each(realSet(cont), function(c)
        {
            if ($.isBlank(_.detect(vizCols, function(vc)
                { return vc.id == c.id; })))
            { c.hide(null, null, true); }
        });

        update(cont, vizCols);

        if ((cont.view || cont).hasRight('update_view') && !skipRequest)
        {
            if (needsReorder)
            {
                var item = {};
                item[colSet] = vizCols;
                this._makeRequest({url: selfUrl, type: 'PUT',
                    data: JSON.stringify(item), batch: true});
            }

            cont._sendBatch(function()
            {
                (cont.view || cont).reload();
                if (_.isFunction(callback)) { callback(); }
            });
        }
    };

    props.cleanCopy = function()
    {
        var item = this._super();

        if (!_.isUndefined(item[colSet]))
        {
            item[colSet] = _.reject(item[colSet],
                function(c) { return c.id == -1; });
        }
        return item;
    };

    props['update' + capSet] = function(newCols, forceFull, updateOrder)
    {
        if ($.isBlank(this[colSet]) && $.isBlank(newCols)) { return; }

        var cont = this;

        if (!$.isBlank(newCols))
        {
            // if we have no columns to begin with just set them
            if ($.isBlank(cont[colSet]))
            {
                cont[colSet] = newCols;
            }
            else
            {
                _.each(newCols, function(nc, i)
                {
                    // Columns may or may not be in the list already; they may
                    // also be at the wrong spot.  So find the column and index
                    // if it already exists
                    var c = nc.dataTypeName != 'meta_data' ?
                        forID(cont, nc.id) :
                        _.detect(cont[colSet], function(mc)
                            { return mc.dataTypeName == 'meta_data' &&
                                mc.name == nc.name; });
                    var ci = _.indexOf(cont[colSet], c);

                    // If it is new, just splice it in
                    if ($.isBlank(c))
                    {
                        if (updateOrder) { cont[colSet].splice(i, 0, nc); }
                        else { cont[colSet].push(nc); }
                    }
                    else
                    {
                        // If the column existed but not at this index, remove
                        // it from the old spot and put it in the new one
                        if (updateOrder && ci != i)
                        {
                            cont[colSet].splice(ci, 1);
                            cont[colSet].splice(i, 0, c);
                        }
                        // Update the column object in-place
                        c.update(nc, forceFull);
                    }
                });
            }
        }

        _columnIDLookup = {};
        _columnTCIDLookup = {};
        this[colSet] = _.map(this[colSet], function(c, i)
            {
                if (!(c instanceof Column))
                { c = new Column(c, cont); }
                _columnIDLookup[c.id] = c;
                if (c.lookup != c.id)
                { _columnIDLookup[c.lookup] = c; }
                _columnTCIDLookup[c.tableColumnId] = c;
                return c;
            });
        this['real' + capSet] = _.reject(this[colSet], function(c)
            { return c.isMeta; });
        this['visible' + capSet] = _(realSet(this)).chain()
            .reject(function(c) { return c.hidden; })
            .sortBy(function(c) { return c.position; })
            .value();

        _.defer(function() { (cont.view || cont).trigger('columns_changed'); });
    };

    return props;
};

})();
