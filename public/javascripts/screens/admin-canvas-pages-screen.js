$(function()
{
    $('#canvasPagesContent .adminTable').combinationList({
        headerContainerSelector: '.gridListWrapper',
        initialSort: [[0, 0]],
        scrollableBody: false,
        selectable: false,
        sortGrouping: false,
        sortHeaders: { 2: { sorter: false } },
        sortTextExtraction: function(node) {
            return $(node).find('.cellInner').text();
        }
    });

    $('#createCanvasPageContent form').validate({errorElement: 'span',
        errorPlacement: function($error, $element)
            { $error.appendTo($element.closest('.line')); }});
});
