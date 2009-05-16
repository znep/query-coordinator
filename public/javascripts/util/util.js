(function($) {

$.urlParam = function(name, url)
{
    var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(url);
    return results[1] || 0;
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

})(jQuery);
