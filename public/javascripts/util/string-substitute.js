(function($) {
    var DEFAULT_NUMBER_PRECISION = 2;

    var cache = {};

    $.stringSubstitute = function(obj, resolver)
    {
        if ($.isBlank(obj))
        { return ''; }
        if (_.isString(obj))
        { return resolveString(obj, resolver); }
        else if (_.isArray(obj))
        { return _.map(obj, function(t) { return $.stringSubstitute(t, resolver); }); }
        else if ($.isPlainObject(obj))
        {
            var o = {};
            _.each(obj, function(v, k) { o[k] = $.stringSubstitute(v, resolver); });
            return o;
        }
        else { return obj; }
    };

    var resolveString = function(string, resolver)
    {
        if (string == undefined)
        { string = ''; }
        var compiled = cache[string];
        if (!compiled)
        {
            var fn = function() { return ''; };
            var pieces = string.match(/({|}|[^{}]+)/mg);
            if (pieces)
            {
                var props = [];
                for (var i = 0; i < pieces.length; i++)
                {
                    var p = {};
                    if (pieces[i] == '{' && pieces[i + 2] == '}')
                    {
                        p.orig = pieces[i + 1];
                        p.prop = p.orig;

                        var m = p.prop.match(/(.*)\s+\|\|\s*(.*)$/);
                        if (!_.isEmpty(m))
                        {
                            p.prop = m[1];
                            p.fallback = m[2];
                        }

                        p.transforms = [];
                        if (!_.isEmpty(m = p.prop.match(/(.*)\s+\/(\S*)\/(.*)\/([gim]*)$/)))
                        {
                            p.prop = m[1];
                            p.transforms.push({
                                type: 'regex',
                                regex: m[2],
                                repl: m[3],
                                modifiers: m[4]
                            });
                        }

                        if (!_.isEmpty(m = p.prop.match(/(.*)\s+([%@])\[([^\]]*)\]$/)))
                        {
                            p.prop = m[1];
                            var t;
                            switch (m[2])
                            {
                                case '%':
                                    t = 'numberFormat';
                                    break;
                                case '@':
                                    t = 'dateFormat';
                                    break;
                            }
                            p.transforms.push({
                                type: t,
                                format: m[3]
                            });
                        }

                        if (!_.isEmpty(m = p.prop.match(/(.*)\s+=\[([^\]]*)\]$/)))
                        {
                            p.prop = m[1];
                            var t;
                            p.transforms.push({
                                type: 'mathExpr',
                                expr: m[2]
                            });
                        }

                        i += 2;
                    }
                    else
                    { p.orig = pieces[i]; }
                    props.push(p);
                }
                fn = resBuilder(props);
            }
            compiled = cache[string] = fn;
        }
        return compiled(resolver);
    };

    var resBuilder = function(props)
    {
        return function(resolver)
        {
            if (!_.isFunction(resolver))
            {
                var obj = resolver || {};
                resolver = function(name) { return $.deepGetStringField(obj, name); };
            }
            var a = [];
            for (var i = 0; i < props.length; i++)
            {
                var p = props[i];
                if ($.isBlank(p.prop))
                {
                    a.push(p.orig);
                    continue;
                }
                var temp = resolver(p.prop);
                if ($.isBlank(temp))
                {
                    if (!_.isUndefined(p.fallback))
                    { temp = p.fallback; }
                    else { temp = '{' + p.orig + '}'; }
                }
                else
                {
                    if ($.isPlainObject(temp))
                    { temp = _.map(temp, function(v, k) { return k + ': ' + v; }) }
                    if (_.isArray(temp)) { temp = temp.join(', '); }
                    temp = !temp.indexOf || temp.indexOf('{') == -1 ?
                        temp : $.stringSubstitute(temp, resolver);
                    _.each(p.transforms.reverse(), function(pt)
                    {
                        if (!$.isBlank(temp) && _.isFunction(applyExpr[pt.type]))
                        { temp = applyExpr[pt.type](temp, pt); }
                    });
                }
                a.push(temp);
            }
            return a.join('');
        };
    };

    var applyExpr =
    {
        regex: function(v, transf)
        {
            var r = transf.regex;
            // Make multiline mode actually useful...
            if (transf.modifiers.indexOf('m') > -1)
            { r = r.replace(/(^|[^\\])\./, '$1[\\s\\S]'); }
            return v.replace(new RegExp(r, transf.modifiers), transf.repl);
        },

        numberFormat: function(v, transf)
        {
            if (!_.isNumber(parseFloat(v))) { return v; }
            v = parseFloat(v);

            var prec = transf.format.match(/\d+/);
            if (!$.isBlank(prec))
            { prec = parseInt(_.first(prec)); }

            // Humane, scientific, or normal & precision
            var didFmt = false;
            if (transf.format.indexOf('h') > -1)
            {
                v = blist.util.toHumaneNumber(v, $.isBlank(prec) ? DEFAULT_NUMBER_PRECISION : prec);
                didFmt = true;
            }
            else if (transf.format.indexOf('e') > -1)
            {
                v = v.toExponential(prec);
                didFmt = true;
            }
            else if (!$.isBlank(prec) || transf.format.indexOf('f') > -1)
            {
                v = v.toFixed($.isBlank(prec) ? DEFAULT_NUMBER_PRECISION : prec);
                didFmt = true;
            }

            // Convert to string now
            v = v.toString();

            // Strip padding if formatted, unless desired
            if (didFmt && transf.format.indexOf('p') < 0)
            { v = v.replace(/((\.[1-9]+)|\.)0+($|\D)/, '$2$3'); }

            // Comma-ify
            if (transf.format.indexOf(',') > -1)
            { v = v.replace(/\d+/, $.commaify); }

            return v;
        },

        dateFormat: function(v, transf)
        {
            var d = parseDate(v);
            if ($.isBlank(d)) { return v; }

            // Make format conform to what DateJS can handle from standard Unix strftime(3)
            var fmt = transf.format.replace('%z', 'O');
            return d.format(fmt);
        },

        mathExpr: function(v, transf)
        {
            // For now all we handle is a single binary operator, where either
            // side can be the variable 'x' for a numeric value, the variable 't'
            // for a date value, or a number
            var varOpts = ['-?x', 't', '-?[0-9]*\\\.?[0-9]*'];
            var opOpts = ['+', '\\\-', '*', '\\\/', '%'];
            var m = transf.expr.match('^(' + varOpts.join('|') + ')\\\s*([' + opOpts.join('') +
                        '])\\\s*(' + varOpts.join('|') + ')$');
            if ($.isBlank(m)) { return v; }

            var vl = computeValue(m[1], v);
            var vr = computeValue(m[3], v);

            if (!_.isNumber(vl) || !_.isNumber(vr)) { return v; }

            switch (m[2])
            {
                case '+':
                    return vl + vr;
                    break;
                case '-':
                    return vl - vr;
                    break;
                case '*':
                    return vl * vr;
                    break;
                case '/':
                    return vl / vr;
                    break;
                case '%':
                    return vl % vr;
                    break;
            }
        }
    };

    var computeValue = function(str, v)
    {
        if (str == 'x') { return parseFloat(v); }
        else if (str == '-x') { return -parseFloat(v); }
        else if (str == 't')
        {
            var d = parseDate(v);
            return $.isBlank(d) ? null : Math.floor(d.getTime() / 1000);
        }
        else { return parseFloat(str); }
    };

    var parseDate = function(v)
    {
        if (_.isNumber(v))
        { return new Date(v * 1000); }
        else if (_.isString(v))
        { return Date.parse(v); }
    };

})(jQuery);
