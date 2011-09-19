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
});
