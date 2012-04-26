(function()
{
    var rest = require('restler');

    var env = require(__dirname + '/environment'),
        _u = require('underscore');

    // util things
    var util = {};

    util.isBlank = function(obj)
    {
        return (obj === null) || (obj === undefined) || (obj === '');
    };

    util.makeArray = function(obj)
    {
        if (Array.isArray(obj))
            return obj;

        return util.isBlank(obj) ? [] : [obj];
    };

    util.param = function(obj)
    {
        var result = [];
        for (var key in obj)
        {
            if (obj[key] && obj[key] instanceof Array && obj[key].length > 0)
            {
                for (var i = 0; i < obj[key].length; i++)
                { result.push(encodeURIComponent(key) + '[]=' + encodeURIComponent(obj[key][i])); }
            }
            else
            { result.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key])); }
        }
        return result.join('&');
    };

    util.urlSafe = function(text)
    {
        if (!text)
            return '';

        var output = text
            .replace(/\s+/g, '-')
            .replace(/[^a-zA-Z0-9_\-]/g, '-')
            .replace(/\-+/g, '-');
        if (output.length < 1)
        {
          output = '-';
        }
        return output.slice(0, 50);
    };

    // look, if you're trying to render html you're doing it wrong anyway. but...
    util.htmlEscape = function(str)
    {
        if (!str)
            return '';

        return value.replace(/"/g, '&quot;')
                    .replace(/&(?!(?:[a-z0-9]{1,6}|#[a-f0-9]{4});)/ig, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
    };
    util.htmlStrip = function(str)
    {
        if (!str)
            return '';

        return value.replace(/<[^>]*>/g, '');
    };

    util.keyValueToObject = function(key, value)
    {
        var result = {};
        result[key] = value;
        return result;
    };

    util.isPlainObject = function(obj)
    {
        if (!obj || typeof obj !== 'object')
            return false;

        // Not own constructor property must be Object (catches Array)
        if (obj.constructor &&
                !hasOwnProperty.call(obj, "constructor") &&
                !hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf"))
            return false;

        var key;
        for (key in obj) {}

        return key === undefined || hasOwnProperty.call(obj, key);
    };

    // goes to a deep location in an object. pass in true
    // as the first arg to force creation of undefined
    // objects on the way to your destination.
    util.deepGet = function(/* [create], obj, keys* */)
    {
        var idx = 0;
        var create = false;

        if (arguments[0] === true)
        {
            idx++;
            create = true;
        }

        var obj = arguments[idx++];

        for (; idx < arguments.length; idx++)
        {
            var key = arguments[idx];
            if (obj[key] === undefined)
                if (!create)
                    return undefined;
                else
                    obj[key] = {};

            obj = obj[key];
        }

        return obj;
    };

    util.subKeyDefined = function(obj, keys)
    {
        return util.deepGet.apply(this, [obj].concat(keys.split('.'))) !== undefined;
    };

    util.extend = function()
    {
        var options, name, src, copy, copyIsArray, clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false;

        if (typeof target === 'boolean')
        {
            deep = target;
            target = arguments[1] || {};
            i = 2;
        }

        if (typeof target !== 'object' && toString.call(target) != '[object Function]')
        {
            target = {};
        }

        for (; i < length; i++)
        {
            if ((options = arguments[i]) != null)
            {
                for (name in options)
                {
                    src = target[name];
                    copy = options[name];

                    if (target === copy) continue;

                    if (deep && copy && (util.isPlainObject(copy) || (copyIsArray = Array.isArray(copy))))
                    {
                        if (copyIsArray)
                        {
                            copyIsArray = false;
                            clone = src && Array.isArray(src) ? src : [];
                        }
                        else
                        {
                            clone = src && util.isPlainObject(src) ? src : {};
                        }

                        target[name] = util.extend(deep, clone, copy);
                    }
                    else if (copy !== undefined)
                    {
                        target[name] = copy;
                    }
                }
            }
        }

        return target;
    };

    // Used to remove items from an object that is acting like a sparse array
    util.removeItemsFromObject = function(obj, index, numItems)
    {
        // Remove specified number of items
        for (var i = 0; i < numItems; i++)
        { delete obj[index + i]; }

        // Use a temporary object to hold new indices, so we don't overwrite old
        // as we iterate
        var tmp = {};

        // Move each item down one
        _u.each(obj, function(r, i)
        {
            i = parseInt(i);
            if (i > index)
            {
                if (!util.isBlank(r.index))
                { r.index = i - numItems; }
                tmp[i - numItems] = r;
                delete obj[i];
            }
        });

        // Merge moved values into original
        util.extend(obj, tmp);
    };

    // prototype things
    String.prototype.endsWith = function(str)
    {
        return this.length >= str.length &&
            this.lastIndexOf(str) == (this.length - str.length);
    };

    String.prototype.capitalize = function(str)
    {
        return this.charAt(0).toUpperCase() + this.substring(1);
    };

    String.prototype.startsWith = function(str)
    {
        return this.indexOf(str) == 0;
    };

    String.prototype.trim = function()
    {
        return this.replace(/^\s+/, '').replace(/\s+$/, '');
    };

    // network things
    util.makeRequest = function(options)
    {
        var opts = util.extend(true, {}, options, env.includes);

        var success = function(response)
        {
            try
            {
                response = JSON.parse(response);
            }
            catch(ex)
            {
                console.log('ERR: could not parse:\n' + response + '\nReason: ' + ex);
            }

            if (opts.success)
                opts.success(response);
        };
        var complete = opts.complete || function(){};
        var url = opts.url;
        if (env.name == 'production' || env.name == 'staging')
        { url = url.replace(/^\/api/, ''); }
        var path = env.base.url + url;

        if (opts.type && !opts.method)
            opts.method = opts.type;

        if (env.debugRequests)
            console.log('Request: ' + path + '; ' + opts.method + '; ' + require('sys').inspect(opts.data));

        rest.request(path, opts)
            .on('success', success)
            .on('complete', complete)
            .on('error', function(xhr, error)
                {
                    console.error('Error: ' + error.message, xhr);
                });
    };

    // network compat
    util.Tache = {
        Get: util.makeRequest
    };
    util.ajax = util.makeRequest;

    util.t = function() { };

    module.exports = util;

})();

