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
});
