blist.namespace.fetch('blist.util');
blist.namespace.fetch('blist.util.patterns');

// expose Sizzle globally
window.Sizzle = jQuery.find;

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
String.prototype.visualSize = function(fontSize)
{
    var $ruler = $('#ruler');
    if ($ruler.length < 1)
    {
        $('body').append('<span class="ruler" id="ruler"></span>');
        $ruler = $('#ruler');
    }
    if (!fontSize) { fontSize = ''; }
    $ruler.css('font-size', fontSize);
    $ruler.text(this + '');
    return {width: $ruler.width(), height: $ruler.height()};
};

String.prototype.visualHeight = function(fontSize)
{
    return this.visualSize(fontSize).height;
};

String.prototype.visualLength = function(fontSize)
{
    return this.visualSize(fontSize).width;
};

String.prototype.capitalize = function()
{
    return this.charAt(0).toUpperCase() + this.substring(1);
};

String.prototype.displayable = function()
{
    return $.map(this.replace(/(\S)([A-Z])/g, '$1 $2').replace(/_/g, ' ').split(' '), $.capitalize).join(' ');
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

String.prototype.camelize = function()
{
    return _.map(this.split(/[\W_]/), function(item)
            { return item.substring(0, 1).toUpperCase() + item.substring(1); }).join('');
};

String.prototype.plainTextToHtml = function()
{
    return ('<p>' + this.replace(/\n/g, '</p><p>') + '</p>').replace(/<p><\/p>/g, '<p>&nbsp;</p>');
};

/* from wikibooks: http://en.wikibooks.org/wiki/Algorithm_Implementation/Strings/Levenshtein_distance#JavaScript */
String.prototype.levenshtein = function(other)
{
    var l1 = this.length, l2 = other.length;
    if (Math.min(l1, l2) === 0)
    {
        return Math.max(l1, l2);
    }

    var i = 0, j = 0, d = [];
    for (i = 0 ; i <= l1 ; i++)
    {
        d[i] = [];
        d[i][0] = i;
    }
    for (j = 0 ; j <= l2 ; j++)
    {
        d[0][j] = j;
    }
    for (i = 1 ; i <= l1 ; i++)
    {
        for (j = 1 ; j <= l2 ; j++)
        {
            d[i][j] = Math.min(
                d[i - 1][j] + 1,
                d[i][j - 1] + 1,
                d[i - 1][j - 1] + (this.charAt(i - 1) === other.charAt(j - 1) ? 0 : 1)
            );
        }
    }
    return d[l1][l2];
};

String.prototype.heuristicDistance = function(other)
{
    if ($.isBlank(other))
    {
        return NaN;
    }

    return this.replace(/^[a-z0-9]/ig, '').toLowerCase()
               .levenshtein(other.replace(/^[a-z0-9]/ig, '').toLowerCase());
};

Function.prototype.curry = function()
{
    var f = this;
    var appliedArgs = Array.prototype.slice.call(arguments);
    return function()
    {
        return f.apply(this, appliedArgs.concat(Array.prototype.slice.call(arguments)));
    };
};

String.prototype.linkify = function(extra)
{
    if ($.isBlank(this)) { return ''; }
    if ($.isBlank(extra)) { extra = ''; }
    var replacedText, replacePattern1, replacePattern2, replacePattern3;

    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = this.replace(replacePattern1, '<a href="$1" '+extra+'>$1</a>');

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" '+extra+'>$2</a>');

    //Change email addresses to mailto:: links.
    replacePattern3 = /(\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,6})/gim;
    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

    return replacedText;
};

// jQuery defs

(function($) {


$.mixpanelMeta = function()
{
    var userId = 'Not Logged In',
        isSocrata = 'Not Logged In',
        userRoleName = 'n/a',
        datasetOwner = 'n/a',
        viewType = 'n/a',
        viewId = 'n/a',
        userOwnsDataset = 'n/a';

    //things that can be undefined if user is not logged in
    if(!_.isUndefined(blist.currentUser)){
        userId = blist.currentUserId;
        isSocrata = _.any(blist.currentUser.flags, function(flag){return flag == 'admin'});
        if(!_.isUndefined(blist.currentUser.roleName))
        {
            userRoleName = blist.currentUser.roleName;
        }
    }

    //things that can be undefined if we're loging things outside of a dataset
    if(!_.isUndefined(blist.dataset)){
        viewType = blist.dataset.displayName;
        viewId = blist.dataset.id;
        datasetOwner = blist.dataset.owner.id;
        if(!_.isUndefined(blist.currentUser)){
            userOwnsDataset = blist.dataset.owner.id == blist.currentUserId;
        }
    }

    var domain = window.location.hostname;
    var pathName = window.location.pathname;
    var time = Math.round(new Date().getTime() / 1000) - blist.pageOpened;

    mixpanel.register({
        'User Id': userId,
        'Socrata Employee': isSocrata,
        'User Role Name': userRoleName,
        'Dataset Owner': datasetOwner,
        'User Owns Dataset': userOwnsDataset,
        'View Id': viewId,
        'View Type': viewType,
        'Domain': domain,
        'On Page': pathName,
        'Time Since Page Opened (sec)': time
    });

    //set user ID to mixpanels user ID if not logged in
    userId = _.isUndefined(blist.currentUser) ? mixpanel.get_distinct_id() : userId;
    mixpanel.identify(userId);
    mixpanel.people.set_once(
        {   $name: userId,
            "Socrata Employee": isSocrata
        });
}

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

$.toParam = function(hash)
{
    return _.map(hash, function(v, k) { return escape(k) + '=' + escape(v); }).join('&');
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
        .replace(/&apos;/g, "'")
        .replace(/&#x27;/g, "'");
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
    { return text.replace(/<[^>]*>/g, ''); }
    catch (ex)
    { return ''; }
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

// TODO: not integrated with component locale stuffing
$.t = function(key, data)
{
    return $.tNull(key, data) || '(no translation available)';
};
$.tNull = function(key, data)
{
    if (blist.locale == 'nyan') { return 'nyan'; }

    if (!$.subKeyDefined(blist.translations, key))
    {
        return null;
    }
    var result = $.deepGetStringField(blist.translations, key)
                      .replace(/%{[^}]+}/g, function(dataKey) { return (data || {})[dataKey.slice(2, -1)] || ''; });
    return key.endsWith('_html') ? result : $.htmlStrip(result);
};

$.rootPath = function()
{
    return (blist.locale == blist.defaultLocale) ? '' : ('/' + blist.locale);
};

$.path = function(path)
{
    return $.rootPath() + (path || '');
};

$.localize = function(obj)
{
    if (!$.isPlainObject(obj))
    { return obj; }
    return $.subKeyDefined(obj, blist.locale) ? obj[blist.locale] : '';
};

/* Do a deep compact on any object.  For any array, run a normal compact on
 * the array; then deep compact all sub-values.  For an object, leave out blank
 * values; and deep compact all the non-blank ones */
$.deepCompact = function(obj)
{
    if (_.isArray(obj))
    {
        return _(obj).chain().map(function(o) { return $.deepCompact(o); })
            .reject(function(o) { return $.isBlank(o); }).value();
    }

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

$.flattenChildren = function(array, key)
{
    var key = key || 'children';

    var recurse = function(array)
    {
        return _.map(array, function(elem)
        {
            if (_.isUndefined(elem[key]))
                return elem;
            else
                return [elem, recurse(elem[key])];
        });
    };
    return _.flatten(recurse(array));
}

$.unwrapHtml = function(html)
{
    return html.replace(/^\s*<[^<>]+>/i, '').replace(/<\/[^<>]+>\s*$/i, '');
};

$.renderTemplate = function(template, data, directive, keepText)
{
    var $template = $('#templates > .' + template);

    if ($template.length < 1) { throw 'No template found: ' + template; }

    if (_.isUndefined(data))
    {
        return !!keepText ? $template.html() : $template.clone().children();
    }
    else
    {
        // IE10 doesn't properly copy the checked state on radio buttons with jQuery clone
        // cloneNode handles it correctly, though
        var $templateCopy = $($template[0].cloneNode(true));

        // pure needs a wrapping element
        $templateCopy.appendTo($('<div/>'));
        // I think this is the cause of the 'ep is null' error in pure; but can't
        // figure out why it would happen...
        if ($.isBlank($templateCopy[0].parentNode))
        { throw 'templateCopy has no parent!'; }

        var rendered = $templateCopy.render(data, directive);
        return !!keepText ? rendered.innerHTML : $(rendered).children();
    }
};

$.compileTemplate = function(template, directive)
{
    var $templateCopy = $('#templates > .' + template).clone();

    if ($templateCopy.length < 1) { throw 'No template found: ' + template; }

    // pure needs a wrapping element
    $templateCopy.appendTo($('<div/>'));

    var compiledDirective = $templateCopy.compile(directive);

    return function(data)
    {
        // strip off opening and closing tags of toplevel element
        // to match behavior of $.renderTemplate
        return $.unwrapHtml(compiledDirective(data));
    };
};

$.isBlank = function(obj)
{ return _.isUndefined(obj) || _.isNull(obj) || obj === ''; };

$.isPresent = function(obj) { return !$.isBlank(obj) };

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

$.numericalSanitize = function(str)
{ return (str || '').replace(/[^0-9\.\+\-]/, ''); };

$.arrayToObjKeys = function(arr, v)
{
    var obj = {};
    _.each($.makeArray(arr), function(k) { obj[k] = v; });
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

$.keyValueToObject = function(key, value)
{
    var temp = {};
    temp[key] = value;
    return temp;
};

// goes to a deep location in an object. pass in true
// as the first arg to force creation of undefined
// objects on the way to your destination.
// From https://github.com/clint-tseng/kor.events/blob/master/kor.events.js#L217
$.deepGet = function(/* [create], obj, keys* */)
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
        if (_.isArray(obj))
        {
            var m = key.match(/^\[(\w*)=?(\w*)\]$/);
            if (!$.isBlank(m))
            {
                var arrayKey = m[1];
                var arrayVal = m[2];
                var checkVals = !$.isBlank(arrayKey) && !$.isBlank(arrayVal);

                var result;
                var remArgs = $.makeArray(arguments).slice(idx + 1);
                for (var i = 0; i < obj.length; i++)
                {
                    var arrayItem = obj[i];
                    if (checkVals && arrayItem[arrayKey] != arrayVal) { continue; }
                    result = $.deepGet.apply($, _.compact([create ? true : null, arrayItem])
                            .concat(remArgs));
                    if (!create && !$.isBlank(result)) { break; }
                }
                return result;
            }
        }

        if (_.isString(obj))
        {
            try { obj = JSON.parse(obj); }
            catch (e) {}
        }

        if (obj[key] == null) // null or undefined
            if (!create)
                return undefined;
            else
                obj[key] = {};

        if (_.isFunction(obj[key]))
        { obj = obj[key].apply(obj); }
        else
        { obj = obj[key]; }
    }

    return obj;
};

$.deepSet = function(/* obj, value, keys* */)
{
    var obj = arguments[0];
    var value = arguments[1];
    for (var i = 2; i < arguments.length - 1; i++)
    {
        var key = arguments[i];
        if (_.isUndefined(obj[key]))
            obj[key] = {};

        obj = obj[key];
    }
    obj[_.last(arguments)] = value;
};

$.deepGetStringField = function(obj, field)
{ return $.deepGet.apply($, [obj].concat(field.split("."))); };

$.deepPluck = function(obj, field)
{ return _.map(obj, function(x) { return $.deepGetStringField(x, field); }); };

$.subKeyDefined = function(obj, keystring)
{
    if ($.isBlank(obj) || !_.isString(keystring))
    {
        return false;
    }

    var objIter = obj;
    var keys = keystring.split('.');
    while (keys.length > 0)
    {
        objIter = objIter[keys[0]];
        if ($.isBlank(objIter))
        {
            return false;
        }
        keys.shift();
    }
    return true;
};

$.isSubKeyEqual = function(obj1, obj2, keystring)
{
    if ($.isBlank(obj1) || $.isBlank(obj2) || !_.isString(keystring))
    {
        return _.isEqual(obj1, obj2);
    }

    var objIter1 = obj1, objIter2 = obj2;
    var keys = keystring.split('.');
    while (keys.length > 0)
    {
        objIter1 = objIter1[keys[0]];
        objIter2 = objIter2[keys[0]];
        if ($.isBlank(objIter1) || $.isBlank(objIter2))
        {
            return _.isEqual(objIter1, objIter2);
        }
        keys.shift();
    }
    return _.isEqual(objIter1, objIter2);
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
    var t = function(str) { return $.t('core.numbers.' + str); };
    var numWords = {'0' : t('num_zero'), '1': t('num_one'), '2': t('num_two'), '3': t('three'),
        '4': t('four'), '5': t('five'), '6': t('six'), '7': t('seven'), '8': t('eight'),
        '9': t('nine')};
    return numWords[num.toString()] || num;
};

$.commaify = function(value)
{
    value = value + '';
    var pos = value.indexOf('.');
    if (pos == -1) { pos = value.length; }
    pos -= 3;
    while (pos > 0 && value.charAt(pos - 1) >= "0" && value.charAt(pos - 1) <= "9")
    {
        value = value.substring(0, pos) + "," + value.substring(pos);
        pos -= 3;
    }
    return value;
};

$.humanify = function(humaneDecimals, fixedDecimals, value)
{
    var abs = Math.abs(value);
    return abs >= 1000 ? blist.util.toHumaneNumber(value, humaneDecimals)
                       : (abs - Math.floor(abs) > 0 ? value.toFixed(fixedDecimals) : value);
};

// it's kind of dumb. if you need anything it doesn't do, just explicitly tell it.
$.pluralize = function(number, word, pluralized)
{
    if (_.isUndefined(pluralized))
    {
        var pluralized;
        if (word.match(/[oiu]$/i))
            pluralized = word + 'es';
        else if (word.match(/y$/i))
            pluralized = word.substring(0, word.length - 1) + 'ies';
        else
            pluralized = word + 's';
    }

    return number + ' ' + ((number === 1) ? word : pluralized);
};

$.addAppToken = function(url)
{
    return url + ((url.indexOf('?') == -1) ? '?' : '&') +
        'app_token=' + blist.configuration.appToken;
};

// force an integer to appear as a double through the json transport
$.jsonIntToFloat = function(integer)
{
    if (integer.toString().indexOf('.') < 0)
    { return parseFloat(integer.toString() + '.000001'); }
    return integer;
};

$.clamp = function(number, bounds)
{
    // use ternary for perf
    return number < bounds[0] ? bounds[0] :
                number > bounds[1] ? bounds[1] :
                number;
};

// Underscore's _.union uses _.uniq, which uses === rather than _.isEqual.
$.union = function()
{
    return _.reduce(_.flatten(arguments), function(memo, item)
    {
        if (_.all(memo, function(val) { return !_.isEqual(item, val); })) { memo.push(item); }
        return memo;
    }, []);
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

// Calculate widths/heights without scrollbars to give actual renderable area
// clientWidth to account for scrollbar, minus padding
$.fn.renderWidth = function()
{
    return this[0].clientWidth - (this.innerWidth() - this.width());
};

$.fn.renderHeight = function()
{
    return this[0].clientHeight - (this.innerHeight() - this.height());
};

$.fn.lockScroll = function(lock)
{
    var self = this;
    if (lock === true)
    {
        this.on('mousewheel.lockScroll DOMMouseScroll.lockScroll', function(event)
        {
            var scrollTo = null;

            if (event.type == 'mousewheel')
            {
                scrollTo = (event.originalEvent.wheelDelta * -0.5);
            }
            else if (event.type == 'DOMMouseScroll')
            {
                scrollTo = 20 * event.originalEvent.detail;
            }

            if (scrollTo)
            {
                $(this).scrollTop(scrollTo + $(this).scrollTop());
                event.preventDefault();
            }
        });
    }
    else
    {
        this.off('mousewheel.lockScroll DOMMouseScroll.lockScroll');
    }
};

// hooray, fake green-threading!
$.batchProcess = function(array, batchSize, eachItem, eachBatch, onComplete)
{
    if (!_.isArray(array))
        return;

    array = _.clone(array);

    var thisBatch = array.splice(0, batchSize);
    var batchResult = _.map(thisBatch, eachItem);

    if (_.isFunction(eachBatch))
        eachBatch(batchResult);

    if (array.length === 0)
    {
        if (_.isFunction(onComplete))
            onComplete();
    }
    else
    {
        // 10 ms is long enough a break so that the browser doesn't think we're hung
        setTimeout(function() { $.batchProcess(array, batchSize, eachItem, eachBatch, onComplete); }, 10);
    }
};

$.extract = function(obj, prop)
{
    var result = {};
    _.each(obj, function(value, key)
    { result[key] = value[prop]; });
    return result;
};

$.assertThrowOnFail = true;
$.assert = function(condition, message)
{
    if (!condition)
    {
        console.error("Assertion failed: " + message);
        //debugger;
        if ($.assertThrowOnFail) { throw message; };
    }
};

// gives you a faster jquery this on each iter
jQuery.fn.quickEach = (function() {
    var jq = jQuery([1]);
    return function(c) {
        var i = -1,
        el,
        len = this.length;
        try {
            while (++i < len && (el = jq[0] = this[i]) && c.call(jq, i, el) !== false);
        } catch(e) {
            delete jq[0];
            throw e;
        }
        delete jq[0];
        return this;
    };
}());

$.fn.hasChildren = function()
{
    var elem = this.get(0);
    return (elem != null) && (elem.firstChild != null);
};

$.fn.exists = function()
{
    return this.length !== 0;
};

$.thunk = function(val) { return function() { return val; } };

// Wrapper around inlineLogin.verifyUser; simply does nothing
// if auth fails
blist.util.doAuthedAction = function(actionText, callback)
{
    if (!$.isBlank(blist.util.inlineLogin))
    {
        blist.util.inlineLogin.verifyUser(
            function(isSuccess, successCallback)
            {
                if (isSuccess)
                    callback(successCallback);
            }, $.t('controls.common.auth_required', { action_phrase: actionText }));
    }
    else if (!blist.currentUserId)
    {
        window.location = $.path('/login');
    }
    else
    {
        callback();
    }
};

blist.util.railsFlash = function(text, level)
{
    var existingFlash = $.cookies.get('js_flash');
    var flashObj = existingFlash ? JSON.parse(existingFlash) : {};
    flashObj[(level || 'notice')] = text;

    $.cookies.set('js_flash', JSON.stringify(flashObj));
}

blist.util.patterns.UID = /^\w{4}-\w{4}$/;
blist.util.patterns.mobileBrowser = /iPhone|iPod|Android/i;

blist.util.isMobile
    = function() { return blist.util.patterns.mobileBrowser.test(navigator.userAgent); };
blist.isMobile = blist.util.isMobile();

blist.util.loadCaptcha = function(id)
{
    if ($('#' + id).hasClass('placeholder'))
    {
        blist.util.assetLoading.loadAssets({ javascripts:
            ['https://www.google.com/recaptcha/api/js/recaptcha_ajax.js'] }, function()
            {
                // Clean out any other ReCaptcha, because it conflicts
                $('#recaptcha_area').parent().addClass('placeholder').empty();
                $('#' + id).removeClass('placeholder');
                Recaptcha.create(blist.configuration.reCAPTCHA_PUK, id, { theme: 'white', lang: blist.locale });
            });
    }
};

})(jQuery);
