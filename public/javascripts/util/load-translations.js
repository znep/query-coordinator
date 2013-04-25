(function()
{
    blist.translations = {};
    if (blistTranslations)
    {
        _.each(blistTranslations, function(translation)
        {
            $.extend(true, blist.translations, translation());
        });
    }

    blist.locale = $('body').data('locale');
    blist.defaultLocale = $('body').data('defaultlocale');
})();
