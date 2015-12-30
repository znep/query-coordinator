(function()
{
    blist.translations = {};
    if (!_.isUndefined(window.blistTranslations))
    {
        _.each(blistTranslations, function(translation)
        {
            $.extend(true, blist.translations, translation());
        });
    }

    blist.locale = $('body').data('locale');
    blist.defaultLocale = $('body').data('defaultlocale');
})();
