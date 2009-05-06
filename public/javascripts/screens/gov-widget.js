$(function ()
{
    $('a:not([href^=#]):not(.noInterstitial)').live('click', function (e)
    {
        var $link = $(this);
        var href = $link.attr('href');
        // IE sticks the full URL in the href, so we didn't filter out local URLs
        if (href.indexOf(location) == 0)
        {
            return;
        }

        e.preventDefault();
        if (href.slice(0, 1) == '/')
        {
            href = location.host + href;
        }
        if (!href.match(/^(f|ht)tps?:\/\//))
        {
            href = "http://" + href;
        }
        $('.interstitial .exitBox .externalLink')
            .attr('href', href)
            .text(href)
            .attr('target', $link.attr('target'));
        var $inter = $('.interstitial');
        $inter
            .show()
            .css('left', ($(window).width() - $inter.width())/2)
            .css('top', ($(window).height() - $inter.height())/2);
    });

    $('.interstitial a.closeLink').click(function (e)
    {
        e.preventDefault();
        $('.interstitial').hide();
    });

    $(document).keyup(function (e)
    {
        // 27 is ESC
        if (e.keyCode == 27 && $('.interstitial:visible').length > 0)
        {
            $('.interstitial').hide();
        }
    });
});
