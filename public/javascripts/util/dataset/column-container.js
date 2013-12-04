(function(){

var ColumnContainer = function(colName, selfUrl, urlBase)
{
    var _columnIDLookup = {};
    var _columnTCIDLookup = {};
    var _columnFieldNameLookup = {};
    var _metaColumnLookup = {};

    var capName = colName.capitalize();
    var colSet = colName + 's';
    var capSet = colSet.capitalize();

    // Convenience methods
    var forID = function(item, id) { return item[colName + 'ForID'](id); };
    var forTCID = function(item, id) { return item[colName + 'ForTCID'](id); };
    var forField = function(item, id) { return item[colName + 'ForFieldName'](id); };
    var forIdentifier = function(item, id) { return item[colName + 'ForIdentifier'](id); };
    var update = function(item, nc, ff, uo)
    { return item['update' + capSet](nc, ff, uo); };
    var realSet = function(item) { return item['real' + capSet]; };
    var visibleSet = function(item) { return item['visible' + capSet]; };

    var props = {};

    // defines: columnForID, childColumnForID
    props[colName + 'ForID'] = function(id)
    {
        return _columnIDLookup[parseInt(id) || id];
    };

    // defines: columnForTCID, childColumnForTCID
    props[colName + 'ForTCID'] = function(tcId)
    {
        return _columnTCIDLookup[parseInt(tcId)];
    };

    // defines: columnForFieldName, childColumnForFieldName
    props[colName + 'ForFieldName'] = function(fName)
    {
        return _columnFieldNameLookup[fName.toString()];
    };

    // defines: columnForIdentifier, childColumnForIdentifier
    props[colName + 'ForIdentifier'] = function(ident)
    {
        if ($.isBlank(ident)) { return null; }
        return _.isNumber(ident) || (ident || '').match(/^\d+$/) ?
            (forID(this, ident) || forTCID(this, ident)) : (forField(this, ident) || forID(this, ident));
    };

    // defines: metaColumnForName, metaChildColumnForName
    props['meta' + capName + 'ForName'] = function(name)
    {
        return _metaColumnLookup[name.toString()];
    };

    // defines: clearColumn, clearChildColumn
    // Removes a column from the model without doing anything on the server;
    // use removeColumns or Column.remove for that
    props['clear' + capName] = function(col)
    {
        if (!$.isBlank(this._super)) { this._super(col); }

        this[colSet] = _.without(this[colSet], col);
        delete _columnIDLookup[col.id];
        delete _columnIDLookup[col.lookup];
        delete _columnTCIDLookup[col.tableColumnId];
        delete _columnFieldNameLookup[col.fieldName];
        if (col.isMeta) { delete _metaColumnLookup[col.name]; }
        update(this);
        this.trigger('columns_changed', ['removed']);
    };

    // defines: columnsForType, childColumnsForType
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

    // defines: addColumn, addChildColumn
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
            cont.trigger('columns_changed', ['added']);
            if (_.isFunction(successCallback))
            { successCallback(forID(cont, newCol.id)); }
        };

        var req = {url: urlBase + '.json', type: 'POST',
                success: columnAdded, error: errorCallback};

        if (!$.isBlank(column))
        { req.data = JSON.stringify(new Column(column, cont).cleanCopy()); }

        if (!$.isBlank(customParams))
        { req.params = customParams; }

        this.makeRequest(req);
    };

    // defines: removeColumns, removeChildColumns
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

        ServerModel.sendBatch(columnsRemoved);
    };

    // defines: setVisibleColumns, setVisibleChildColumns
    props['setVisible' + capSet] = function(visColIds, callback, skipRequest)
    {
        var cont = this;

        if (_.isEqual(visColIds, _.pluck(visibleSet(cont), 'id')))
        {
            if (_.isFunction(callback)) { callback(); }
            return;
        }

        // If we need a validation/pre-processing on the columns, do it here
        if (!$.isBlank(cont['_adjustVisible' + capSet]))
        { visColIds = cont['_adjustVisible' + capSet](visColIds); }

        // First figure out if we need to update positions.  If the newly-visible
        // columns are in the same order as their existing position says, then
        // we just need to hide/show each column
        var prevPos = -1;
        var needsReorder = _.any(visColIds, function(colId)
        {
            var col = forID(cont, colId);
            if (col.position <= prevPos)
            { return true; }
            prevPos = col.position;
            return false;
        });

        var didHideShow = false;
        var vizCols = [];
        _.each(visColIds, function(colId, i)
        {
            var col = forID(cont, colId);
            if (!$.isBlank(col))
            {
                didHideShow = col.show(null, null, true) || didHideShow;
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
            {
                didHideShow = c.hide(null, null, true) || didHideShow;
            }
        });

        update(cont, vizCols, false, needsReorder);
        if (!needsReorder && didHideShow)
        { _.defer(function() { (cont.view || cont).trigger('columns_changed', ['visibility']); }); }

        if ((cont.view || cont).canUpdate() && !skipRequest)
        {
            if (needsReorder)
            {
                var item = {};
                item[colSet] = vizCols;
                this.makeRequest({url: selfUrl, type: 'PUT',
                    data: JSON.stringify(item), batch: true});
            }

            ServerModel.sendBatch(function()
            {
                if (_.isFunction(callback)) { callback(); }
            });
        }
        else
        {
            (cont.view || cont)._markTemporary((cont.view || cont).isUnpublished() ||
                    (cont.view || cont).newBackend);
            if (_.isFunction(callback)) { callback(); }
        }
    };

    props.cleanCopy = function(allowedKeys)
    {
        var item = this._super(allowedKeys);

        if (!_.isUndefined(item[colSet]))
        {
            item[colSet] = _(item[colSet]).chain()
                .reject(function(c) { return c.id == -1; })
                .sortBy(function(c) { return c.position; })
                .value();
        }
        return item;
    };

    props.clone = function()
    {
        this._cloneExclude['real' + capSet] = true;
        this._cloneExclude['visible' + capSet] = true;
        return this._super.apply(this, arguments);
    };

    props.setAccessType = function(accessType)
    {
        this._super(accessType);
        _.each(this[colSet] || [], function(c)
        { c.setAccessType(accessType); });
    };

    // defines: updateColumns, updateChildColumns
    props['update' + capSet] = function(newCols, forceFull, updateOrder, masterUpdate)
    {
        if ($.isBlank(this[colSet]) && $.isBlank(newCols)) { return; }

        var cont = this;

        var changeType;
        if (!$.isBlank(newCols))
        {
            // if we have no columns to begin with just set them
            if ($.isBlank(cont[colSet]))
            {
                cont[colSet] = newCols;
                changeType = 'fullSet';
            }
            else
            {
                var colById = {};
                _.each(newCols, function(nc, i)
                {
                    // Columns may or may not be in the list already; they may
                    // also be at the wrong spot.  So find the column and index
                    // if it already exists
                    var c = nc.dataTypeName != 'meta_data' ?
                        forIdentifier(cont, nc.fieldName || nc.id) :
                        _.detect(cont[colSet], function(mc)
                            { return mc.dataTypeName == 'meta_data' &&
                                mc.name == nc.name; });
                    var ci = _.indexOf(cont[colSet], c);

                    // If it is new, just splice it in
                    if ($.isBlank(c))
                    {
                        if (updateOrder) { cont[colSet].splice(i, 0, nc); }
                        else { cont[colSet].push(nc); }
                        changeType = 'added';
                    }
                    else
                    {
                        // If the column existed but not at this index, remove
                        // it from the old spot and put it in the new one
                        if (updateOrder && ci != i)
                        {
                            cont[colSet].splice(ci, 1);
                            cont[colSet].splice(i, 0, c);
                            changeType = 'moved';
                        }
                        // Update the column object in-place
                        c.update(nc, forceFull, updateOrder);
                    }
                    colById[nc.id] = true;
                });

                // If master update, remove any cols not in set
                if (masterUpdate)
                {
                    cont[colSet] = _.reject(cont[colSet], function(c)
                    {
                        if (!colById[c.id])
                        {
                            cont['clear' + capName](c);
                            return true;
                        }
                        return false;
                    });
                }
            }
        }

        _columnIDLookup = {};
        _columnTCIDLookup = {};
        _columnFieldNameLookup = {};
        _metaColumnLookup = {};
        this[colSet] = _.map(this[colSet], function(c, i)
            {
                if (!(c instanceof Column))
                { c = new Column(c, cont); }
                else if ($.isBlank(c.view))
                { c.setParent(cont); }
                _columnIDLookup[c.id] = c;
                if (c.lookup != c.id)
                { _columnIDLookup[c.lookup] = c; }
                _columnTCIDLookup[c.tableColumnId] = c;
                _columnFieldNameLookup[c.fieldName] = c;
                if (c.isMeta)
                { _metaColumnLookup[c.name] = c; }
                if (!$.isBlank(cont.accessType))
                { c.setAccessType(cont.accessType); }
                return c;
            });
        this['real' + capSet] = _.reject(this[colSet], function(c)
            { return c.isMeta; });
        this['visible' + capSet] = _(realSet(this)).chain()
            .reject(function(c) { return c.hidden; })
            .sortBy(function(c) { return c.position; })
            .value();

        if (_.any(this[colSet], function(c) { return c.renderType.soda1Only; }))
        { (cont.view || cont)._useSODA2 = false; }

        if (!$.isBlank(changeType))
        { _.defer(function() { (cont.view || cont).trigger('columns_changed', [changeType]); }); }
    };

    return props;
};

if (blist && blist.inBrowser)
{ this.ColumnContainer = ColumnContainer; }
else
{ module.exports = ColumnContainer; }

})();
