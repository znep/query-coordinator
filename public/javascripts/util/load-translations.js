;(function($)
{
    var $translations = $('#translations');
    blist.translations = JSON.parse($translations.html());
    blist.locale = $translations.attr('data-locale');
})(jQuery);
