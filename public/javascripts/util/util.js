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

})(jQuery);
