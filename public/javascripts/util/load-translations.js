;(function($)
{
    var $translations = $('div.translations');
    blist.translations = {};
    $translations.each(function()
    { $.extend(true, blist.translations, JSON.parse($(this).html())); });
    blist.locale = $translations.attr('data-locale');
})(jQuery);
