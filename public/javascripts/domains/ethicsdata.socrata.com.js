;(function($){$(function()
{
    var $searchField = $('#ethicsSearch');
    if ($searchField.length === 0) return;

    var doSearch = function()
    {
        if ($.isBlank($searchField.val())) return;
 
        var $searchWidget = $('#ethicsSearchWidget');
        if ($searchWidget.length === 0)
        {
            $('.browseSection')
               .after('<div id="ethicsSearchSpinner" style="display:none"></div>' +
                      '<iframe id="ethicsSearchWidget" style="height:0"></iframe>')
               .slideUp(doSearch);
            $('#ethicsSearchWidget').load(function()
            {
                $('#ethicsSearchSpinner').stop().fadeOut();
            });
        }
        else if ($searchWidget.height() < 600)
        {
            $searchWidget.animate({ height: 600 }, doSearch);
        }
        else
        {
            $('#ethicsSearchSpinner').fadeIn();
            $searchWidget.attr('src', 'http://ethicsdata-search.socrata.com/search?q=' + escape($searchField.val()));
        }
    };

    $('.ethicsSearchSubmit').click(function(event)
    {
        event.preventDefault();
        doSearch();
    });
 
    $searchField.keydown(function(event)
    {
        if (event.which == 13) doSearch();
    });

});})(jQuery);