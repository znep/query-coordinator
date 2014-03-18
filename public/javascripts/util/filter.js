blist.namespace.fetch('blist.filter');

(function($) {

    var soqlInfix = function(c, op, v) { return c + op + v; };
    var soqlFunc = function(c, op, v) { return op + '(' + c + (v === undefined ? '' : (',' + v)) + ')'; };

    // Filtering
    // NOTE: New filter types also need an analogue template in
    // controls/maps/external-esri-map.js#transformFilterToLayerDefinition
    // -- michael.chui@socrata.com
    var filterOperators = {
        'EQUALS': { text: $.t('core.filters.informal.equals'), editorCount: 1,
            soql: function(c, v) { return soqlInfix(c, '=', v); },
            opMatches: function(v, cv) { return _.isEqual(v, cv); } },
        'NOT_EQUALS': { text: $.t('core.filters.informal.not_equals'), editorCount: 1,
            soql: function(c, v) { return soqlInfix(c, '!=', v); },
            opMatches: function(v, cv) { return !_.isEqual(v, cv); } },

        'STARTS_WITH': { text: $.t('core.filters.informal.starts_with'), editorCount: 1,
            soql: function(c, v) { return soqlFunc(c, 'starts_with', v); },
            opMatches: function(v, cv) { return (v || '').startsWith(cv); } },
        'CONTAINS': { text: $.t('core.filters.informal.contains'), editorCount: 1,
            soql: function(c, v) { return soqlFunc(c, 'contains', v); },
            opMatches: function(v, cv) { return (v || '').indexOf(cv) > -1; } },
        'NOT_CONTAINS': { text: $.t('core.filters.informal.not_contains'), editorCount: 1,
            soql: function(c, v) { return soqlFunc(c, 'not contains', v); },
            opMatches: function(v, cv) { return (v || '').indexOf(cv) < 0; } },

        'LESS_THAN': { text: $.t('core.filters.informal.less_than'), editorCount: 1,
            soql: function(c, v) { return soqlInfix(c, '<', v); },
            opMatches: function(v, cv) { return v < cv; } },
        'LESS_THAN_OR_EQUALS': { text: $.t('core.filters.informal.less_than_or_equals'), editorCount: 1,
            soql: function(c, v) { return soqlInfix(c, '<=', v); },
            opMatches: function(v, cv) { return v <= cv; } },
        'GREATER_THAN': { text: $.t('core.filters.informal.greater_than'), editorCount: 1,
            soql: function(c, v) { return soqlInfix(c, '>', v); },
            opMatches: function(v, cv) { return v > cv; } },
        'GREATER_THAN_OR_EQUALS': { text: $.t('core.filters.informal.greater_than_or_equals'),
            soql: function(c, v) { return soqlInfix(c, '>=', v); },
            editorCount: 1, opMatches: function(v, cv) { return v >= cv; } },
        'BETWEEN': { text: $.t('core.filters.informal.between'), editorCount: 2,
            soql: function(c, v) { return soqlInfix(c, '>', v[0]) + ' AND ' + soqlInfix(c, '<', v[1]); },
            opMatches: function(v, cv, cv2)
            {
                var cva = _.flatten(_.compact([cv, cv2]));
                if (!_.isArray(cva) || cva.length != 2) { return false; }
                return cva[0] <= v && v <= cva[1];
            } },

        'IS_BLANK': { text: $.t('core.filters.informal.is_blank'), editorCount: 0,
            soql: function(c, v) { return soqlInfix(c, ' is ', 'null'); },
            opMatches: function(v) { return $.isBlank(v); } },
        'IS_NOT_BLANK': { text: $.t('core.filters.informal.is_not_blank'), editorCount: 0,
            soql: function(c, v) { return soqlInfix(c, ' is not ', 'null'); },
            opMatches: function(v) { return !$.isBlank(v); } }
    };

    var filterGroups = blist.filter.groups = {
        textual: {
            orderedList: ['EQUALS', 'NOT_EQUALS', 'STARTS_WITH', 'CONTAINS', 'NOT_CONTAINS',
                'IS_BLANK', 'IS_NOT_BLANK']
        },
        textObject: {
            orderedList: ['EQUALS', 'NOT_EQUALS', 'CONTAINS', 'NOT_CONTAINS',
                'IS_BLANK', 'IS_NOT_BLANK']
        },
        numeric: {
            orderedList: ['EQUALS', 'NOT_EQUALS', 'LESS_THAN', 'LESS_THAN_OR_EQUALS',
                'GREATER_THAN', 'GREATER_THAN_OR_EQUALS', 'BETWEEN',
                'IS_BLANK', 'IS_NOT_BLANK']
        },
        date: {
            details: {
                'LESS_THAN': { text: 'is before' },
                'GREATER_THAN': { text: 'is after' }
            },
            orderedList: ['EQUALS', 'NOT_EQUALS', 'LESS_THAN', 'GREATER_THAN', 'BETWEEN',
                'IS_BLANK', 'IS_NOT_BLANK']
        },
        comparable: {
            orderedList: ['EQUALS', 'NOT_EQUALS', 'IS_BLANK', 'IS_NOT_BLANK']
        },
        check: {
            details: {
                'IS_BLANK': { text: 'is not checked', soql: function(c, v) { return 'not ' + c; } },
                'IS_NOT_BLANK': { text: 'is checked', soql: function(c, v) { return c; } }
            },
            orderedList: ['IS_BLANK', 'IS_NOT_BLANK']
        },
        blob: {
            details: {
                'IS_BLANK': { text: 'is empty' },
                'IS_NOT_BLANK': { text: 'exists' }
            },
            orderedList: ['IS_BLANK', 'IS_NOT_BLANK']
        }
    };

    var setUpOperator = function(op, name)
    {
        op.name = name;
        op.matches = function() // v, cv, etc
        {
            // If we want to trim strings, we should do that here
            var vals = _.flatten(arguments);

            var getResult = function(v, vals)
            { return op.opMatches.apply(op, _.flatten([v, vals])); }

            var matchVal = vals.shift();
            if ($.isPlainObject(matchVal))
            {
                var func = op.name == 'IS_NOT_BLANK' ? 'any' : 'all';
                return _[func](matchVal, function(v, k)
                    {
                        var cv = vals[0];
                        cv = $.isPlainObject(cv) ? cv[k] : cv;
                        if (!$.isBlank(cv) || op.name.endsWith('_BLANK'))
                        { return getResult(v, cv); }
                        return true;
                    });
            }

            else { return getResult(matchVal, vals); }
        };
    };

    _.each(filterOperators, function(op, name) { setUpOperator(op, name); });

    _.each(filterGroups, function(fg)
    {
        var d = {};
        _.each(fg.orderedList, function(op) { d[op] = filterOperators[op]; });
        fg.details = $.extend(true, {}, d, fg.details);
    });

    var exprCache = {};
    blist.filter.matchesExpression = function(expr, colCont)
    {
        if (expr === true || _.isEmpty(expr))
        { return function() { return true; }; }
        if (!$.subKeyDefined(expr, 'operator'))
        { return function() { return false; }; }

        if ($.isBlank(expr._key)) { expr._key = blist.filter.getFilterKey(expr); }
        var key = expr._key + '::' + (colCont || {}).id;
        if (!$.isBlank(exprCache[key])) { return exprCache[key]; }

        function cacheAndReturn(f)
        {
            exprCache[key] = f;
            return f;
        };

        // Handle custom values with no children
        if (expr._key == 'customValues' && _.isEmpty(expr.children))
        { return cacheAndReturn(function() { return true; }); }

        // Handle array of sub-conditions
        if (!$.isBlank(expr.children))
        {
            // Assume if not OR it is AND
            var func = expr.operator.toLowerCase() == 'or' ? 'any' : 'all';
            var childFuncs = _.map(expr.children, function(cExpr)
                    { return blist.filter.matchesExpression(cExpr, colCont); });
            return cacheAndReturn(function(row)
                { return _[func](childFuncs, function(cf) { return cf(row); }); });
        }

        if (!$.isBlank(colCont) && (!$.isBlank(expr.tableColumnId) ||
                    !$.isBlank(expr.columnFieldName)))
        {
            var col = colCont.columnForIdentifier(expr.tableColumnId || expr.columnFieldName);
            if ($.isBlank(col))
            { return cacheAndReturn(function() { return false; }); }

            var type = col.renderType;
            var subCol = (expr.subColumn || '').toLowerCase();
            if ($.subKeyDefined(type, 'subColumns.' + subCol))
            { type = type.subColumns[subCol]; }

            return cacheAndReturn(function(row)
            {
                var rowVal = row.data[col.lookup];
                if ($.isPlainObject(rowVal) && !$.isBlank(subCol))
                { rowVal = rowVal[subCol]; }

                return type.matches(expr.operator, col, rowVal, expr.value);
            });
        }
        else
        {
            var op = filterOperators[expr.operator.toUpperCase()];
            if ($.isBlank(op))
            { return cacheAndReturn(function() { return false; }); }
            return cacheAndReturn(function(row)
                { return op.matches(row, expr.value); });
        }
    };

    blist.filter.getFilterKey = function(fc)
    {
        if (_.isEmpty(fc)) { return ''; }
        var op = fc.operator.toUpperCase();
        if (op == 'AND' || op == 'OR')
        {
            if (blist.filter.isEmptyPlaceholderFilter(fc))
            { return 'customValues'; }
            var childKeys = _.compact(_.map(fc.children, function(c) { return blist.filter.getFilterKey(c); }));
            return childKeys.length < 2 ? (childKeys[0] || '') : '(' + childKeys.join('|' + op + '|') + ')';
        }
        return '(' + (fc.columnFieldName || fc.tableColumnId) +
            (!$.isBlank(fc.subColumn) ? '[' + fc.subColumn + ']' : '') +
            '|' + op + '|' + fc.value + ')';
    };

    blist.filter.generateSOQLWhere = function(fc, dataset)
    {
        if (_.isEmpty(fc)) { return ''; }
        var op = fc.operator.toUpperCase();
        if (op == 'AND' || op == 'OR')
        {
            var childKeys = _.map(fc.children, function(c) { return blist.filter.generateSOQLWhere(c, dataset); });
            return childKeys.length < 2 ? (childKeys[0] || '') : '(' + childKeys.join(' ' + op + ' ') + ')';
        }

        var c = dataset.columnForIdentifier(fc.columnFieldName);
        var v = fc.value;
        if ($.subKeyDefined(c, 'renderType.soqlFilterValue'))
        {
            if (_.isArray(v))
            { v = _.map(v, function(vv) { return c.renderType.soqlFilterValue(vv); }); }
            else
            { v = c.renderType.soqlFilterValue(v); }
        }
        else if (_.isArray(v))
        { v = _.map(v, function(vv) { return _.isString(vv) ? "'" + vv + "'" : vv; }); }
        else if (_.isString(v)) { v = "'" + v + "'"; }

        var fieldName = fc.columnFieldName;
        if (!$.isBlank(fc.subColumn)) { fieldName += '.' + fc.subColumn; }
        if ($.subKeyDefined(c, 'renderType.soqlFieldWrapper'))
        { fieldName = c.renderType.soqlFieldWrapper(fieldName, op); }

        var soqlFunc = filterOperators[op].soql;
        if ($.subKeyDefined(c, 'renderType.filterConditions.details.' + op + '.soql'))
        { soqlFunc = c.renderType.filterConditions.details[op].soql; }

        return '(' + soqlFunc(fieldName, v) + ')';
    };

    blist.filter.generateSODA1 = function(fc, fc2)
    {
        fc = _.compact([fc, fc2]);
        if (fc.length > 0)
        {
            if (fc.length == 1)
            { fc = fc[0]; }
            else
            { fc = { operator: 'AND', children: fc }; }
        }

        var result = {};
        if (_.isEmpty(fc)) { return result; }
        if (!$.isBlank(fc.metadata))
        { result.metadata = fc.metadata; }
        var op = fc.operator.toUpperCase();
        result.type = 'operator';
        result.value = op;
        if (op == 'AND' || op == 'OR')
        {
            result.children = _.map(fc.children, function(c) { return blist.filter.generateSODA1(c); });
        }
        else
        {
            result.children = [ { type: 'column', columnFieldName: fc.columnFieldName } ];
            // Can't have just a literal node with no value.
            // In particular, this is the case for the _BLANK operators
            if (!_.isUndefined(fc.value))
            {
                _.each($.makeArray(fc.value), function(v)
                        { result.children.push({ type: 'literal', value: v }); });
            }
            if (!$.isBlank(fc.subColumn))
            { result.children[0].value = fc.subColumn; }
        }
        return result;
    };

    blist.filter.collapseChildren = function(fc)
    {
        fc = $.extend({}, fc);
        if ($.isBlank(fc.children)) { return fc; }
        var collapseChildren = function(children)
        {
            var newChildren = [];
            _.each(children, function(cond)
            {
                if (cond.type == 'operator' && cond.value == 'AND' ||
                    !$.isBlank(cond.operator) && cond.operator.toUpperCase() == 'AND')
                { newChildren = newChildren.concat(cond.children); }
                else
                { newChildren.push(cond); }
            });
            newChildren = _.compact(newChildren);
            return _.isEqual(children, newChildren) ? false : newChildren;
        };
        var t;
        var newC = fc.children;
        while (t = collapseChildren(newC))
        { newC = t; }
        fc.children = newC;
        return fc;
    };

    var isFCEqual = function(a, b)
    {
        if ($.isBlank(a))
        { return $.isBlank(b); }
        else if ($.isBlank(b))
        { return false; }

        if ($.isBlank(a.children))
        {
            return $.isBlank(b.children) && a.columnFieldName == b.columnFieldName &&
                a.operator == b.operator && a.value == b.value && a.subColumn == b.subColumn;
        }
        else if ($.isBlank(b.children) || a.operator != b.operator ||
                a.children.length != b.children.length)
        { return false; }

        return _.all(a.children, function(ac)
                { return _.any(b.children, function(bc) { return isFCEqual(ac, bc); }); });
    };

    blist.filter.subtractQueries = function(fc, baseFC)
    {
        fc = blist.filter.collapseChildren(fc);
        baseFC = blist.filter.collapseChildren(baseFC);
        if (!$.isBlank(fc.children) && fc.operator.toUpperCase() == 'AND')
        {
            if ($.isBlank(baseFC.children))
            { fc.children = _.reject(fc.children, function(c) { return isFCEqual(c, baseFC); }); }
            else if (baseFC.operator.toUpperCase() == 'AND')
            {
                fc.children = _.reject(fc.children, function(c)
                        { return _.any(baseFC.children, function(bc) { return isFCEqual(c, bc); }); });
            }
            return fc;
        }
        // They are the same; full subtraction!
        else if (isFCEqual(fc, baseFC))
        { return null; }
        // Nothing to subtract
        else
        { return fc; }
    };

    blist.filter.isEmptyPlaceholderFilter = function(fc)
    {
        return _.isEmpty(fc.children) && (fc.metadata.includeAuto || fc.metadata.customValues);
    };

})(jQuery);
