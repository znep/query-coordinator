$(function ()
{
    $('a:not([href^=#]):not(.noInterstitial)').live('click', function (e)
    {
        e.preventDefault();
        var $link = $(e.originalTarget);
        var href = $link.attr('href');
        if (href[0] == '/')
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
            .css('left', ($(document).width() - $inter.width())/2)
            .css('top', ($(document).height() - $inter.height())/2);
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
