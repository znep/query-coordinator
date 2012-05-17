(function($) {
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

    var resolveString = function(string, resolver) {
        if (string == undefined)
            string = '';
        var compiled = cache[string];
        if (!compiled) {
            var fn = function() { return ''; };
            var pieces = string.match(/({|}|[^{}]+)/mg);
            if (pieces) {
                var props = [];
                for (var i = 0; i < pieces.length; i++) {
                    var p = {};
                    if (pieces[i] == '{' && pieces[i + 2] == '}') {
                        p.orig = pieces[i + 1];
                        p.prop = p.orig;
                        var m = p.prop.match(/(.*)\s+\|\|\s*(.*)$/);
                        if (!_.isEmpty(m))
                        {
                            p.prop = m[1];
                            p.fallback = m[2];
                        }
                        m = p.prop.match(/(.*)\s+\/(\S*)\/(.*)\/([gim]*)$/);
                        if (!_.isEmpty(m))
                        {
                            p.prop = m[1];
                            p.regex = m[2];
                            p.repl = m[3];
                            p.modifiers = m[4];
                        }
                        i += 2;
                    } else
                        p.orig = pieces[i];
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
                    if (!$.isBlank(temp) && !$.isBlank(p.regex))
                    {
                        var r = p.regex;
                        // Make multiline mode actually useful...
                        if (p.modifiers.indexOf('m') > -1)
                        { r = r.replace(/(^|[^\\])\./, '$1[\\s\\S]'); }
                        temp = temp.replace(new RegExp(r, p.modifiers), p.repl);
                    }
                }
                a.push(temp);
            }
            return a.join('');
        };
    };
})(jQuery);
