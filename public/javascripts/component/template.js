(function($) {
    var cache = {};

    $.template = function(template, resolver)
    {
        if (_.isString(template))
        { return templateString(template, resolver); }
        else if (_.isArray(template))
        { return _.map(template, function(t) { return $.template(t, resolver); }); }
        else if ($.isPlainObject(template))
        {
            var o = {};
            _.each(template, function(v, k) { o[k] = $.template(v, resolver); });
            return o;
        }
        else { return template; }
    };

    var templateString = function(template, resolver) {
        if (template == undefined)
            template = '';
        var compiled = cache[template];
        if (!compiled) {
            var fn = function() { return ''; };
            var pieces = template.match(/({|}|[^{}]+)/mg);
            if (pieces) {
                var props = [];
                for (var i = 0; i < pieces.length; i++) {
                    var p = {};
                    if (pieces[i] == '{' && pieces[i + 2] == '}') {
                        p.orig = pieces[i + 1];
                        p.prop = p.orig;
                        var m = p.prop.match(/(.*)\s+\/(\S*)\/(\S*)\/$/);
                        if (!_.isEmpty(m))
                        {
                            p.prop = m[1];
                            p.regex = m[2];
                            p.repl = m[3];
                        }
                        i += 2;
                    } else
                        p.orig = pieces[i];
                    props.push(p);
                }
                fn = resBuilder(props);
            }
            compiled = cache[template] = fn;
        }
        if (resolver)
            return compiled(resolver);
        return compiled;
    };

    var resBuilder = function(props)
    {
        return function(resolver)
        {
            if (!_.isFunction(resolver))
            {
                var obj = resolver;
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
                if (_.isUndefined(temp)) { temp = '{' + p.orig + '}'; }
                else
                {
                    temp = !$.isBlank(temp) && (!temp.indexOf || temp.indexOf('{') == -1) ?
                        temp : $.template(temp, resolver);
                    if (!$.isBlank(p.regex))
                    { temp = temp.replace(new RegExp(p.regex), p.repl); }
                }
                a.push(temp);
            }
            return a.join('');
        };
    };
})(jQuery);
