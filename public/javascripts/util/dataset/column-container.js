(function(){

this.ColumnContainer = function(colName, urlBase)
{
    var _columnIDLookup;
    var _columnTCIDLookup;

    var capName = colName.capitalize();
    var colSet = colName + 's';
    var capSet = colSet.capitalize();

    // Convenience methods
    var forID = function(item, id) { return item[colName + 'ForID'](id); };
    var update = function(item, nc, ff, uo)
    { return item['_update' + capSet](nc, ff, uo); };
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
    props['clear' + capName] = function(colId)
    {
        this._super(colId);

        var col = forID(this, colId);

        this[colSet] = _.without(this[colSet], col);
        delete _columnIDLookup[col.id];
        delete _columnIDLookup[col.lookup];
        delete _columnTCIDLookup[col.tableColumnId];
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
        if (this._super(arguments)) { return true; } // true means abort

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
        { req.data = JSON.stringify(new Column(column).cleanCopy()); }

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

    props.cleanCopy = function()
    {
        var item = this._super();
        item[colSet] = _.reject(item[colSet] || [],
            function(c) { return c.id == -1; });
        return item;
    };

    props['_update' + capSet] = function(newCols, forceFull, updateOrder)
    {
        if ($.isBlank(this[colSet]) && $.isBlank(newCols)) { return; }

        var cont = this;

        if (!$.isBlank(newCols))
        {
            var newColIds = {};
            cont[colSet] = cont[colSet] || [];
            _.each(newCols, function(nc, i)
            {
                newColIds[nc.id] = true;
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
                    // If the column existed but not at this index, remove it from
                    // the old spot and put it in the new one
                    if (updateOrder && ci != i)
                    {
                        cont[colSet].splice(ci, 1);
                        cont[colSet].splice(i, 0, c);
                    }
                    // Update the column object in-place
                    c.update(nc, forceFull);
                }
            });

            if (forceFull)
            {
                this[colSet] = _.reject(this[colSet], function(c)
                        { return !newColIds[c.id]; });
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
