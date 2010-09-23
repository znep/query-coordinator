blist.namespace.fetch('blist.util');
blist.namespace.fetch('blist.util.patterns');

// Prototype defs
String.prototype.startsWith = function(str)
{ return this.indexOf(str) == 0; };

String.prototype.endsWith = function(str)
{
    return this.length >= str.length &&
        this.lastIndexOf(str) == (this.length - str.length);
};

String.prototype.format = function()
{
    var txt = this,

    i = arguments.length;
    while (i--) {
        txt = txt.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }
    return txt;
};

/* Adapted from http://blog.mastykarz.nl/measuring-the-length-of-a-string-in-pixels-using-javascript/ */
String.prototype.visualLength = function(fontSize)
{
    var $ruler = $('#ruler');
    if ($ruler.length < 1)
    {
        $('body').append('<span id="ruler"></span>');
        $ruler = $('#ruler');
    }
    if (!fontSize) { fontSize = ''; }
    $ruler.css('font-size', fontSize);
    $ruler.text(this + '');
    return $ruler.width();
};

String.prototype.capitalize = function()
{
    return this.charAt(0).toUpperCase() + this.substring(1);
};

String.prototype.displayable = function()
{
    return $.map(this.replace(/_/g, ' ').split(' '), $.capitalize).join(' ');
};

String.prototype.trim = function()
{
    return this.replace(/^\s+/, '').replace(/\s+$/, '');
};

String.prototype.clean = function()
{
    // Sometimes strings have &nbsp;, so replace them all with normal spaces
    return this.replace(/\xa0/g, ' ');
};


// jQuery defs

(function($) {

$.hashHref = function(href)
{
    // IE sticks the entire page URL on, so we can't just strip off the hash;
    // instead we need to index into it and take everything after
    return href.slice(href.indexOf('#') + 1);
};

$.urlParam = function(url, name, value)
{
    var regex = new RegExp('([\\?#&]' + name + '=)([^&#]*)');
    if (value !== undefined && value !== null)
    { return url.replace(regex, "$1" + value); }

    var results = regex.exec(url);
    if (results)
    {
        return results[2] || 0;
    }
    else
    {
        return 0;
    }
};

$.escapeQuotes = function(text)
{
    if (typeof text !== 'string') { return text; }
    return $.htmlEscape(text)
        .replace(/'/, '&apos;');
}

$.unescapeQuotes = function(text)
{
    if (typeof text !== 'string') { return text; }
    return $.htmlUnescape(text)
        .replace(/&apos;/, "'");
}

$.htmlEscape = function(text)
{
    if (typeof text !== 'string') { return text; }
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
};

$.htmlUnescape = function(text)
{
    if (typeof text !== 'string') { return text; }
    return text
        .replace(/&quot;/g, '"')
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&');
};

$.unescapeObject = function(obj)
{
    if (obj === null || obj === undefined) { return obj; }

    else if (typeof obj == 'string') { return $.htmlUnescape(obj); }

    else if (typeof obj == 'object')
    {
        var newObj = obj instanceof Array ? [] : {};
        $.each(obj, function(k, v) { newObj[k] = $.unescapeObject(v); })
        return newObj;
    }

    else { return obj; }
};

$.htmlStrip = function(text)
{
  try
  {
    return text.replace(/<[^>]*>/g, '');
  }
  catch (ex)
  {
    return '';
  }
};

$.urlSafe = function(text)
{
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

$.capitalize = function(text)
{
    text += '';
    return text.charAt(0).toUpperCase() + text.substring(1);
};

$.live = function(selector, type, fn)
{
    var $obj = $([]);
    $obj.context = document;
    $obj.selector = selector;
    $obj.live(type, fn);
    return $obj;
};

$.compact = function(a)
{
    for (var i = a.length - 1; i >= 0; i--)
    {
        if (a[i] === undefined || a[i] === null) { a.splice(i, 1); }
    }
};

/* Do a deep compact on any object.  For any array, run a normal compact on
 * the array; then deep compact all sub-values.  For an object, leave out blank
 * values; and deep compact all the non-blank ones */
$.deepCompact = function(obj)
{
    if (_.isArray(obj))
    { return _.map(_.compact(obj), function(o) { return $.deepCompact(o); }); }

    if (!$.isPlainObject(obj)) { return obj; }

    var newObj = {};
    _.each(obj, function(v, k)
    {
        if (!$.isBlank(v)) { newObj[k] = $.deepCompact(v); }
    });
    return newObj;
};

/* Do a deep compare on two objects (if they are objects), or just compare
   directly if they are normal values.  For this case, null == undefined, but
   not 0, empty string or false.  Also, when comparing objects, both objects
   must have all the same keys, even if they are null.  If one object has a key
   with a null value and the other does not have the key, the objects are not
   equal. */
$.compareValues = function(obj1, obj2)
{
    // If directly equal, great
    if (obj1 === obj2) { return true; }
    // If obj1 is null/undef, then a quick check determines obj2
    if (obj1 === null || obj1 === undefined)
    {
        if (obj2 === null || obj2 === undefined) { return true; }
        return false;
    }
    // If obj1 exists, but obj2 doesn't, not equals
    if (obj2 === null || obj2 === undefined) { return false; }

    // If either is not an object, they aren't equal
    if (!(obj1 instanceof Object) || !(obj2 instanceof Object)) { return false; }

    // Now we have two real objects to check
    var compareKey = function(o1, o2, k)
    {
        if (!o1.hasOwnProperty(k) || !o2.hasOwnProperty(k)) { return false; }
        return $.compareValues(o1[k], o2[k]);
    };
    for (var v1 in obj1) { if (!compareKey(obj1, obj2, v1)) { return false; } }
    for (var v2 in obj2) { if (!compareKey(obj2, obj1, v2)) { return false; } }
    return true;
};

$.syncObjects = function(dest, src)
{
    $.extend(dest, src);
    _.each(dest, function(v, k)
    { if (_.isUndefined(src[k])) { delete dest[k]; } });
};

/* Get all the keys for an object as an array */
$.keys = function(obj)
{
    if (obj === null || typeof obj != 'object') { return []; }

    var keys = [];
    $.each(obj, function(k, v) { keys.push(k); });
    return keys;
};

$.objSelect = function(obj, filterFn)
{
    var acc = {};
    _.each(obj, function(v, k) { if (filterFn(v, k)) { acc[k] = v; } });
    return acc;
};

$.renderTemplate = function(template, data, directive)
{
    var $templateCopy = $('#templates > .' + template)
        .clone();

    if (_.isUndefined(data))
    {
        return $templateCopy.children();
    }
    else
    {
        // pure needs a wrapping element
        $templateCopy.appendTo($('<div/>'));
        // I think this is the cause of the 'ep is null' error in pure; but can't
        // figure out why it would happen...
        if ($.isBlank($templateCopy[0].parentNode))
        { throw 'templateCopy has no parent!'; }

        return $templateCopy
            .render(data, directive)
            .children();
    }
};

$.compileTemplate = function(template, directive)
{
    var $templateCopy = $('#templates > .' + template)
        .clone();

    // pure needs a wrapping element
    $templateCopy.appendTo($('<div/>'));

    var compiledDirective = $templateCopy.compile(directive);

    return function(data)
    {
        // strip off opening and closing tags of toplevel element
        // to match behavior of $.renderTemplate
        return compiledDirective(data).replace(/^\s*<[^<>]+>/i, '').replace(/<\/[^<>]+>\s*$/i, '');
    };
};

$.isBlank = function(obj)
{ return _.isUndefined(obj) || _.isNull(obj) || obj === ''; };

$.arrayify = function(obj)
{ return !_.isArray(obj) ? [obj] : obj; };

$.objectify = function(obj, key)
{
    if (!$.isPlainObject(obj))
    {
        var newObj = {};
        newObj[key] = obj;
        return newObj;
    }
    return obj;
};

// Used to insert items into an object that is acting like a sparse array
$.addItemsToObject = function(obj, values, index)
{
    values = $.makeArray(values);
    var numInserts = values.length;

    // Use a temporary object to hold new indices, so we don't overwrite old
    // as we iterate
    var tmp = {};

    // Move each index up one
    _.each(obj, function(r, i)
    {
        i = parseInt(i);
        if (i >= index)
        {
            if (!$.isBlank(r.index))
            { r.index = i + numInserts; }
            tmp[i + numInserts] = r;
            delete obj[i];
        }
    });

    // Merge moved values into original
    $.extend(obj, tmp);

    // Add all the new values
    _.each(values, function(v, i)
    {
        i = parseInt(i);
        if (!$.isBlank(v.index))
        { v.index = index + i; }
        obj[index + i] = v;
    });
};

// Used to remove items from an object that is acting like a sparse array
$.removeItemsFromObject = function(obj, index, numItems)
{
    // Remove specified number of items
    for (var i = 0; i < numItems; i++)
    { delete obj[index + i]; }

    // Use a temporary object to hold new indices, so we don't overwrite old
    // as we iterate
    var tmp = {};

    // Move each item down one
    _.each(obj, function(r, i)
    {
        i = parseInt(i);
        if (i > index)
        {
            if (!$.isBlank(r.index))
            { r.index = i - numItems; }
            tmp[i - numItems] = r;
            delete obj[i];
        }
    });

    // Merge moved values into original
    $.extend(obj, tmp);
};

$.safeId = function(id)
{ return id.replace(/(\.|\:)/g, '\\$1'); };

$.arrayToSentence = function(arr, joinWord, separator, alwaysUseSep)
{
    return arr.length < 3 ? arr.join((alwaysUseSep ? separator : '') +
            ' ' + joinWord + ' ') :
        arr.slice(0, -1).join(separator + ' ') + separator + ' ' + joinWord +
            ' ' + arr[arr.length - 1];
};

$.wordify = function(num)
{
    var numWords = {'0' : 'zero', '1': 'one', '2': 'two', '3': 'three',
        '4': 'four', '5': 'five', '6': 'six', '7': 'seven', '8': 'eight',
        '9': 'nine'};
    return numWords[num.toString()] || num;
};

$.mixin = function(obj, mixin)
{
    var clone = function()
    { return obj.apply(this, arguments); };
    for (property in obj)
    {
        if (obj.hasOwnProperty(property) && property !== 'prototype')
        { clone[property] = obj[property]; }
    }
    $.extend(clone.prototype, obj.prototype, mixin.prototype);
    return clone;
};

$.fn.tagName = function()
{
    return this.get(0).tagName.toLowerCase();
};

// fast checker for input type
$.fn.isInputType = function(inputType)
{
    return (this.tagName() == 'input') && (this.attr('type') == inputType);
};

// Wrapper around inlineLogin.verifyUser; simply does nothing
// if auth fails
blist.util.doAuthedAction = function(actionText, callback)
{
    if (!$.isBlank(blist.util.inlineLogin))
    {
        blist.util.inlineLogin.verifyUser(
            function(isSuccess)
            {
                if (isSuccess)
                    callback();
            }, 'You must be logged in to ' + actionText);
    }
    else
    {
        callback();
    }
};

blist.util.patterns.UID = /^\w{4}-\w{4}$/;

})(jQuery);
