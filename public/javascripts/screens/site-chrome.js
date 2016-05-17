$(document).ready(function() {
  $('ul.tabs li').click(function() {
    var clickedTabId = $(this).data('tab-id');

    $('ul.tabs li, .tab-content').removeClass('current');
    $(this).addClass('current');

    $('.tab-content[data-tab-id="{0}"]'.format(clickedTabId)).addClass('current');
  });
});
