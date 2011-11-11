(function($) {
    var cache = {};

    function escape(text) {
        return text.replace(/([\\"])/g, "\\$1").replace(/\n/g, "\\n");
    }

    $.template = function(template, resolver) {
        if (template == undefined)
            template = '';
        var compiled = cache[template];
        if (!compiled) {
            var pieces = template.match(/({|}|[^{}]+)/mg);
            if (pieces) {
                var fn = [
                    'if (!_.isFunction(resolver)) { var obj = resolver; resolver = function(name) { return obj[name] } };',
                    'var temp; return ['
                ];
                for (var i = 0; i < pieces.length; i++) {
                    if (i)
                        fn.push(',');
                    if (pieces[i] == '{' && pieces[i + 2] == '}') {
                        var prop = escape(pieces[i + 1]);
                        fn.push('((temp = resolver("' + prop + '")) === undefined ? "{' + prop + '}" : temp)');
                        i += 2;
                    } else
                        fn.push('"' + escape(pieces[i]) + '"');
                }
                fn.push('].join("")');
                fn = new Function('resolver', fn.join(''));
            } else
                fn = function() { return ''; };
            compiled = cache[template] = fn;
        }
        if (resolver)
            return compiled(resolver);
        return compiled;
    }
})(jQuery);
