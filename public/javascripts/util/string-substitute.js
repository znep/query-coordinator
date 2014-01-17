(function($) {
    var DEFAULT_NUMBER_PRECISION = 2;

    $.stringSubstitute = function(obj, resolver, helpers)
    {
        if ($.isBlank(obj))
        { return ''; }
        if (_.isString(obj))
        { return resolveString(obj, resolver, helpers); }
        else if (_.isArray(obj))
        { return _.map(obj, function(t) { return $.stringSubstitute(t, resolver, helpers); }); }
        else if ($.isPlainObject(obj))
        {
            var o;
            if (obj.substituteType == 'array')
            {
                o = $.stringSubstitute(obj.value, resolver, helpers);
                if (obj.isJson)
                {
                    try
                    { o = JSON.parse(o || '[]'); }
                    catch (e)
                    {}
                }
                else
                { o = (o || '').split(obj.split || ','); }
                if (obj.compact && _.isArray(o)) { o = _.compact(o); }
            }
            else if ($.subKeyDefined(obj, blist.locale))
            {
                // Assume it is a localization object
                o = $.stringSubstitute($.localize(obj), resolver, helpers);
            }
            else
            {
                o = {};
                _.each(obj, function(v, k) { o[k] = $.stringSubstitute(v, resolver, helpers); });
            }
            return o;
        }
        else { return obj; }
    };

    var resolveCache = {};

    var resolveString = function(string, resolver, helpers)
    {
        if (string == undefined)
        { string = ''; }
        // Assumes locale doesn't change in the middle of a session
        if ($.subKeyDefined(resolveCache, string))
        { return doResolve(resolveCache[string], resolver, helpers); }

        var props = [];
        var pieces = string.match(/({|}|[^{}]+)/mg) || [];
        for (var i = 0; i < pieces.length; i++)
        {
            var p = {};
            if (pieces[i] == '{' && pieces[i + 2] == '}')
            {
                p.orig = pieces[i + 1];
                p.prop = p.orig;

                $.extend(p, parseTransforms(p.prop));
                i += 2;
            }
            else
            { p.orig = pieces[i]; }
            props.push(p);
        }
        resolveCache[string] = props;
        return doResolve(props, resolver, helpers);
    };

    var doResolve = function(props, resolver, helpers)
    {
        var phrases = (helpers || {}).phrases || {};
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
            var temp;
            var m = p.prop.match(/^#(\w+)$/);
            if (!_.isEmpty(m) && $.subKeyDefined(phrases, m[1]))
            { temp = resolveString($.localize(phrases[m[1]]), resolver, helpers); }
            else
            { temp = resolver(p.prop); }

            if ($.isBlank(temp))
            { temp = ''; }

            if ($.isPlainObject(temp))
            { temp = _.map(temp, function(v, k) { return k + ': ' + v; }) }
            if (_.isArray(temp)) { temp = temp.join(', '); }
            temp = !temp.indexOf || temp.indexOf('{') == -1 ? temp :
                $.stringSubstitute(temp, resolver, helpers);

            var transResult = processTransforms(temp, p.transforms, helpers);
            temp = transResult.value;
            if ($.isBlank(temp) && !transResult.fallbackResult)
            { temp = '{' + p.orig + '}'; }

            a.push(temp);
        }
        return a.join('');
    };

    var transformsCache = {};

    var parseTransforms = function(str)
    {
        if ($.subKeyDefined(transformsCache, str))
        { return transformsCache[str]; }

        var p = { prop: str, transforms: [] };
        var m;

        m = p.prop.match(/(^|(.*)\s+)\|\|\s*(.*)$/);
        if (!_.isEmpty(m))
        {
            p.prop = m[2] || '';
            p.transforms.push({
                type: 'fallback',
                fallback: m[3]
            });
        }

        var checkExpr = function()
        {
            while (!_.isEmpty(m = p.prop.match(/(^|(.*)\s+)\!(\w+)$/)))
            {
                p.prop = m[2] || '';
                p.transforms.push({
                    type: 'subExpr',
                    key: m[3]
                });
            }
        };

        checkExpr();
        while (!_.isEmpty(m = p.prop.match(
                    /(^|(.*)\s+)\/(([^\s\/]*|(\\\/)*)*)\/(([^\/]|(\\\/)*)*)\/([gim]*)$/)))
        {
            p.prop = m[2] || '';
            p.transforms.push({
                type: 'regex',
                regex: m[3].replace(/\\\//, '/'),
                repl: m[6].replace(/\\\//, '/'),
                modifiers: m[9]
            });
        }

        checkExpr();
        while (!_.isEmpty(m = p.prop.match(/(^|(.*)\s+)([%@$])\[([^\]]*)\]$/)))
        {
            p.prop = m[2] || '';
            var t;
            switch (m[3])
            {
                case '%':
                    t = 'numberFormat';
                    break;
                case '@':
                    t = 'dateFormat';
                    break;
                case '$':
                    t = 'stringFormat';
                    break;
            }
            p.transforms.push({
                type: t,
                format: m[4]
            });
        }

        checkExpr();
        if (!_.isEmpty(m = p.prop.match(/(^|(.*)\s+)=\[([^\]]*)\]$/)))
        {
            p.prop = m[2] || '';
            p.transforms.push({
                type: 'mathExpr',
                expr: m[3]
            });
        }

        checkExpr();

        transformsCache[str] = p;
        return p;
    };

    var processTransforms = function(v, transforms, helpers)
    {
        var fallbackResult = false;
        var r;
        _.each(transforms.reverse(), function(pt)
        {
            if (_.isFunction(applyExpr[pt.type]))
            {
                r = applyExpr[pt.type](v, pt, helpers);
                if (!$.isPlainObject(r))
                { v = r; }
                else
                {
                    v = r.value;
                    fallbackResult = fallbackResult || r.fallbackResult;
                }
            }
        });
        return { value: v, fallbackResult: fallbackResult };
    };

    var applyExpr =
    {
        regex: function(v, transf)
        {
            var r = transf.regex;
            // Make multiline mode actually useful...
            if (transf.modifiers.indexOf('m') > -1)
            { r = r.replace(/(^|[^\\])\./, '$1[\\s\\S]'); }
            return v.toString().replace(new RegExp(r, transf.modifiers), transf.repl);
        },

        numberFormat: function(v, transf)
        {
            if (_.isNaN(parseFloat(v))) { return v; }
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
            if ($.isBlank(d) || _.isNaN(d.valueOf())) { return v; }

            // Make format conform to what DateJS can handle from standard Unix strftime(3)
            var fmt = transf.format.replace('%z', 'O').replace('%s', 'U');
            return d.format(fmt);
        },

        stringFormat: function(v, transf)
        {
            if ($.isBlank(v)) { return v; }

            if (transf.format.indexOf('t') > -1)
            { v = v.trim(); }

            // Apply lower case first, because it might matter for capitalization
            if (transf.format.indexOf('l') > -1)
            { v = v.toLowerCase(); }

            if (transf.format.indexOf('U') > -1)
            { v = v.toUpperCase(); }
            else if (transf.format.indexOf('u') > -1)
            { v = _.map(v.split(' '), function(t) { return t.capitalize(); }).join(' '); }
            else if (transf.format.indexOf('c') > -1)
            { v = v.capitalize(); }

            if (transf.format.indexOf('?') > -1)
            { v = encodeURIComponent(v); }
            else if (transf.format.indexOf('!') > -1 || transf.format.indexOf('¿') > -1)
            { v = decodeURIComponent(v); }

            return v;
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
            if ($.isBlank(m) || $.isBlank(v)) { return v; }

            var vl = computeValue(m[1], v);
            var vr = computeValue(m[3], v);

            if (!_.isNumber(vl) || _.isNaN(vl) || !_.isNumber(vr) || _.isNan(vr)) { return v; }

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
        },

        subExpr: function(v, transf, helpers)
        {
            return processTransforms(v, parseTransforms($.localize(((helpers || {}).expressions ||
                                {})[transf.key])).transforms, helpers);
        },

        fallback: function(v, transf)
        {
            var isFallback = $.isBlank(v);
            return { value: isFallback ? transf.fallback : v, fallbackResult: isFallback };
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
