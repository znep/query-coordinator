(function($) {

$.urlParam = function(name, url)
{
    var results = new RegExp('[\\?#&]' + name + '=([^&#]*)').exec(url);
    if (results)
    {
        return results[1] || 0;
    }
    else
    {
        return 0;
    }
};

$.htmlEscape = function(text)
{
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
};

$.htmlUnescape = function(text)
{
    return text
        .replace(/&quot;/g, '"')
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&');
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

})(jQuery);

String.prototype.startsWith = function(str)
{ return this.indexOf(str) == 0; };

String.prototype.endsWith = function(str)
{ return this.lastIndexOf(str) == (this.length - str.length); };

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

/* Get all the keys for an object as an array */
$.keys = function(obj)
{
    if (typeof obj !== 'object') { return []; }

    var keys = [];
    $.each(obj, function(k, v) { keys.push(k); });
    return keys;
};
