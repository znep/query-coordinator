;(function($) {$(function() {

$('body').on('click', '.listLayout .goalList .mainSection', function(event)
{
    var $c = $(event.target).closest('.singleItem').find('.expandedSection');
    var c = $.component($c.attr('id'));
    // Items are initially set to hidden so DataSlate intelligently handles when
    // to render visualizations. Turn that off the first time it is shown, and
    // control with slideToggle afterwards.
    if (c.properties().hidden)
    { c.properties({ hidden: false }); }
    $c.slideToggle();
    _.defer(function() { $(window).resize() }); // kick charts into the right shape
});

$('body').on('click', '.listLayout .goalList .expandedSection .close a', function(event)
{
    event.preventDefault();
    $(event.target).closest('.expandedSection').slideToggle();
});

}) })(jQuery);

