jQuery.analytics = {
    trackEvent: function(category, action, label, value)
    {
        // validate params
        if ((category === undefined) || (action === undefined))
            return false;

        // bail if we didn't load GA
        if (window._gaq === undefined)
            return false;

        _gaq.push(['_trackEvent', category, action, label, value]);
    }
};
