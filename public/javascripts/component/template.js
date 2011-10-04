(function($) {
    var cache = {};

    function escape(text) {
        return text.replace(/([\\"])/g, "\\$1").replace(/\n/g, "\\n");
    }

    $.template = function(template, resolver) {
        var compiled = cache[template];
        if (!compiled) {
            var pieces = template.match(/({|}|[^{}]+)/mg);
            var fn = [
                'if (!_.isFunction(resolver)) { var obj = resolver; resolver = function(name) { return obj[name] } };',
                'return ['
            ];
            for (var i = 0; i < pieces.length; i++) {
                if (i)
                    fn.push(',');
                if (pieces[i] == '{' && pieces[i + 2] == '}') {
                    var prop = escape(pieces[i + 1]);
                    fn.push('(resolver("' + prop + '") || "{' + prop + '}")');
                    i += 2;
                } else
                    fn.push('"' + escape(pieces[i]) + '"');
            }
            fn.push('].join("")');
            compiled = cache[template] = new Function('resolver', fn.join(''));
        }
        if (resolver)
            return compiled(resolver);
        return compiled;
    }
})(jQuery);
