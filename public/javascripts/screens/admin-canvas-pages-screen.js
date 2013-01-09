$(function()
{
    $('#canvasPagesContent .adminTable').combinationList({
        headerContainerSelector: '.gridListWrapper',
        initialSort: [[0, 0]],
        scrollableBody: false,
        selectable: false,
        sortGrouping: false,
        sortTextExtraction: function(node) {
            return $(node).find('.cellInner').text();
        }
    });
});
