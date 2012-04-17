blist.namespace.fetch('blist.filter');

(function($) {

    // Filtering
    // NOTE: New filter types also need an analogue template in
    // controls/maps/external-esri-map.js#transformFilterToLayerDefinition
    // -- michael.chui@socrata.com
    var filterOperators = {
        'EQUALS': { text: $.t('core.filters.informal.equals'), editorCount: 1,
            opMatches: function(v, cv) { return _.isEqual(v, cv); } },
        'NOT_EQUALS': { text: $.t('core.filters.informal.not_equals'), editorCount: 1,
            opMatches: function(v, cv) { return !_.isEqual(v, cv); } },

        'STARTS_WITH': { text: $.t('core.filters.informal.starts_with'), editorCount: 1,
            opMatches: function(v, cv) { return (v || '').startsWith(cv); } },
        'CONTAINS': { text: $.t('core.filters.informal.contains'), editorCount: 1,
            opMatches: function(v, cv) { return (v || '').indexOf(cv) > -1; } },
        'NOT_CONTAINS': { text: $.t('core.filters.informal.not_contains'), editorCount: 1,
            opMatches: function(v, cv) { return (v || '').indexOf(cv) < 0; } },

        'LESS_THAN': { text: $.t('core.filters.informal.less_than'), editorCount: 1,
            opMatches: function(v, cv) { return v < cv; } },
        'LESS_THAN_OR_EQUALS': { text: $.t('core.filters.informal.less_than_or_equals'), editorCount: 1,
            opMatches: function(v, cv) { return v <= cv; } },
        'GREATER_THAN': { text: $.t('core.filters.informal.greater_than'), editorCount: 1,
            opMatches: function(v, cv) { return v > cv; } },
        'GREATER_THAN_OR_EQUALS': { text: $.t('core.filters.informal.greater_than_or_equals'),
            editorCount: 1, opMatches: function(v, cv) { return v >= cv; } },
        'BETWEEN': { text: $.t('core.filters.informal.between'), editorCount: 2,
            opMatches: function(v, cv, cv2)
            {
                var cva = _.flatten(_.compact([cv, cv2]));
                if (!_.isArray(cva) || cva.length != 2) { return false; }
                return cva[0] <= v && v <= cva[1];
            } },

        'IS_BLANK': { text: $.t('core.filters.informal.is_blank'), editorCount: 0,
            opMatches: function(v) { return $.isBlank(v); } },
        'IS_NOT_BLANK': { text: $.t('core.filters.informal.is_not_blank'), editorCount: 0,
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
                'IS_BLANK': { text: 'is not checked' },
                'IS_NOT_BLANK': { text: 'is checked' }
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
            if ($.subKeyDefined(type, 'subColumns.' + expr.subColumn))
            { type = type.subColumns[expr.subColumn]; }

            return cacheAndReturn(function(row)
            {
                var rowVal = row[col.lookup];
                if ($.isPlainObject(rowVal) && !$.isBlank(expr.subColumn))
                { rowVal = rowVal[expr.subColumn]; }

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
            var childKeys = _.map(fc.children, function(c) { return blist.filter.getFilterKey(c); });
            return childKeys.length < 2 ? (childKeys[0] || '') : '(' + childKeys.join('|' + op + '|') + ')';
        }
        return '(' + (fc.columnFieldName || fc.tableColumnId) +
            (!$.isBlank(fc.subColumn) ? '[' + fc.subColumn + ']' : '') +
            '|' + op + '|' + fc.value + ')';
    };

})(jQuery);
