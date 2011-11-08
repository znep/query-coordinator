$(function() {
    var $countrySelect = $('#country-list');
    $('.unCountrySelector').click(function(event) {
        event.preventDefault();
        $countrySelect.show();
    });
    $countrySelect.find('.close').click(function(event){
        event.preventDefault();
        $countrySelect.hide();
    });

    var patterns = {
        '/': 'overview',
        '/page/projects': 'country_unit'
    };
    var match = 'overview';
    for (var pattern in patterns)
        if (window.location.pathname.indexOf(pattern) == 0)
            match = patterns[pattern];

    $('.leftNav li[data-page=' + match + ']').addClass('active');

    var generateBreadcrumb = function(text, url)
    {
        return $.tag({
            tagName: 'li',
            contents: (url ? {
                tagName: 'a',
                href: url,
                contents: text
            } : text)
        });
    };

    if (blist.sidebarHidden)
    {
        $('.breadcrumbs li:last-child')
            .replaceWith(generateBreadcrumb('Open Data', '/'));

        // we're probably on a grid page
        if ($.subKeyDefined(blist.dataset, 'metadata.custom_fields.Scope.Country'))
        {
            // we're probably on a country page
            $('.breadcrumbs li:last-child')
                .after(generateBreadcrumb($.htmlEscape(blist.dataset.name)))
                .after(generateBreadcrumb('Data By Country/Unit', '/page/projects'));
        }
        else
        {
            // we're on some other dataset
            $('.breadcrumbs li:last-child')
                .after(generateBreadcrumb($.htmlEscape(blist.dataset.name)));
        }
    }
    else if (match == 'country_unit')
    {
        // we're on the projects page
        $('.breadcrumbs li:last-child')
            .replaceWith(generateBreadcrumb('Open Data', '/'));
        $('.breadcrumbs li:last-child')
            .after(generateBreadcrumb('Data By Country/Unit'));
    }
});
