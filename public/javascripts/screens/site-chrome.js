$(document).ready(function() {
  // Show appropriate tab given the url hash. Ex: /site_chrome#tab=general
  var urlHash = document.location.hash.substring(1);
  var activeTabId = urlHash.substr(urlHash.indexOf('tab=')).split('&')[0].split('=')[1];
  if (activeTabId) {
    showTab(activeTabId);
  } else {
    // No tab specified, show first tab
    var firstTabId = $('ul.tabs li').first().data()['tabId'] || 'general';
    showTab(firstTabId);
  }

  // Change active tab and tab-content on click
  $('ul.tabs li').click(function() {
    var clickedTabId = $(this).data('tab-id');
    showTab(clickedTabId);
  });
});

function showTab(tabId) {
  $('ul.tabs li, .tab-content').removeClass('current');
  $('.tab-content[data-tab-id="{0}"], .tab-link[data-tab-id="{0}"]'.
    format(tabId)).addClass('current');
};
