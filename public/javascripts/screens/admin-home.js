;(function($)
{


$(function()
{
    $('.deleteStoryButton').adminButton({
        confirmationText: 'Are you sure? This action cannot be undone.',
        callback: function(response, $row)
        {
            $row.slideUp().remove();
        }
    });

    $('.storiesList.gridList').combinationList({
        headerContainerSelector: '.gridListWrapper',
        initialSort: [[2, 1]],
        scrollableBody: false,
        selectable: false,
        sortGrouping: false,
        sortHeaders: {1: {sorter: 'text'}, 2: {sorter: 'numeric'}},
        sortTextExtraction: function(node) {
            return $(node).find('.cellInner').text();
        }
    });
});


})(jQuery);