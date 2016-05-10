$(document).ready(function() {
  $('ul.tabs li').click(function() {
    var tabId = $(this).data('tab-id');

    $('ul.tabs li').removeClass('current');
    // $('.tab-content').removeClass('current');

    $(this).addClass('current');
    $('#' + tabId).addClass('current');
  })
});
