$(function()
{
    var $active;
    $('#siteHeader .scrippsNav > ul > li > a').hover(
        function hoverIn() {
            var $li = $(this).closest('li');
            if ($active && $active[0] != $li[0])
                $active.removeClass('active');
            $li.addClass('active');
            $active = $li;
        }
    );
});
