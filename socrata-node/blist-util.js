(function()
{
    var env = require('environment');
    var rest = require('restler');

    // util things
    var util = {};

    util.isBlank = function(obj)
    {
        return (obj === null) || (obj === undefined);
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
            result.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
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

    // network things
    util.makeRequest = function(options)
    {
        var opts = util.extend(true, {}, options, env.includes);

        var success = function(response)
        {
            response = JSON.parse(response);

            if (opts.success)
                opts.success(response);
        };
        var complete = opts.complete || function(){};
        var path = env.base.url + opts.url;

        rest.request(path, opts)
            .on('success', success)
            .on('complete', complete)
            .on('error', function(xhr, error)
                {
                    console.error(error.message);
                });
    };

    // network compat
    util.Tache = {
        Get: util.makeRequest
    };
    util.ajax = util.makeRequest;

    module.exports = util;

})();

