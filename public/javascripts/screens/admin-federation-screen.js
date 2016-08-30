$(function() {
  $('.federationList').combinationList({
    headerContainerSelector: '.gridListWrapper',
    initialSort: [
      [0, 0]
    ],
    scrollableBody: false,
    selectable: false,
    sortGrouping: false,
    sortHeaders: {
      5: {
        sorter: false
      }
    },
    sortTextExtraction: function(node) {
      return $(node).find('.cellInner').text();
    }
  });

  $('.federationList .status .button').adminButton({
    callback: function(response, $row) {
      $row.find('.status .cellInner').text(response.message).end().find('.status .button').toggleClass('disabled');
    },
    workingSelector: '.status, .delete'
  });

  $('.federationList .delete .button').adminButton({
    callback: function(response, $row) {
      $row.slideUp().remove();
    },
    workingSelector: '.status, .delete'
  });
});
