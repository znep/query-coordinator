if (!blist)
{
    var blist = {};
}

blist.common = {};
blist.common.adjustSize = function()
{
    $("#mainContent, #sidebar").height($(window).height() -
            $("#header").outerHeight({margin: true}) -
            $("#footer").outerHeight({margin: true}));
}

$(window).resize(blist.common.adjustSize);

$(function()
{
    blist.common.adjustSize();
});
