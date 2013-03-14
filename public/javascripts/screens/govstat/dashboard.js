;(function($) {$(function() {

$('body').on('click', '.listLayout .goalList .mainSection', function(event)
{
    $(event.target).closest('.singleItem').find('.expandedSection').slideToggle();
    _.defer(function() { $(window).resize() }); // kick charts into the right shape
});

$('body').on('click', '.listLayout .goalList .expandedSection .close a', function(event)
{
    event.preventDefault();
    $(event.target).closest('.expandedSection').slideToggle();
});

}) })(jQuery);

