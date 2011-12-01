;(function($){$(function() {
    // social bits
    var safeUrl = escape(window.location.href);
    $('.socialBits .fb').attr('href', $('.socialBits .fb').attr('href') + safeUrl);
    $('.socialBits .twitter').attr('href', $('.socialBits .twitter').attr('href') + safeUrl);

    // tab containers
    $('.tabContainer .tabs li a').click(function(event)
    {
        event.preventDefault();
        var $this = $(this);

        var target = $this.attr('data-tab');
        $this.closest('.tabContainer')
            .find('.tabContent')
            .children('[data-tab=' + target + ']')
                .show()
                .siblings()
                    .hide();

        $this.closest('li')
            .addClass('active')
            .siblings()
                .removeClass('active');

        $(window).resize();
    });
    $('.tabContainer .tabs li:first-child a').click();

    // featured datasets height
    var $boxes = $('.featureBox');
    var $gqwl2 = $('.featuredViews .featuredView:first');
    var resizeBoxes = function()
    {
        $boxes.height($gqwl2.height());
    };
    _.defer(function()
    {
        resizeBoxes();
        $(window).resize(function() { _.defer(resizeBoxes); });
    });

})})(jQuery);
