$(document).ready(function() {
  // Show appropriate tab given the url hash. Ex: /site_chrome#tab=general
  showTab(getActiveTabId());

  // Change active tab and tab-content on click
  $('ul.tabs li').click(function() {
    var clickedTabId = $(this).data('tab-id');
    showTab(clickedTabId);
  });

  // Submit the form from the active tab when save button is clicked
  $('button.primary#site_chrome_save').click(function() {
    var formToSubmit = $('form#tab_form_' + getActiveTabId());
    if (formToSubmit.length) {
      formToSubmit.submit();
    } else {
      alert('Could not find form to submit! Try submitting by pressing return in an input field instead.');
    }
  });
});

// Figure out which tab is active (current) and get its id
function getActiveTabId() {
  var urlHash = document.location.hash.substring(1);
  var activeTabId = urlHash.substr(urlHash.indexOf('tab=')).split('&')[0].split('=')[1];
  if (activeTabId) {
    return activeTabId;
  } else {
    // No tab specified, show first tab
    var firstTabId = $('ul.tabs li').first().data().tabId || 'general';
    return firstTabId;
  }
}

function showTab(tabId) {
  $('ul.tabs li, .tab-content').removeClass('current');
  $('.tab-content[data-tab-id="{0}"], .tab-link[data-tab-id="{0}"]'.
    format(tabId)).addClass('current');
}

function confirmReload() {
  var href = window.location.href; // store href with the hash of the current tab
  var confirmation = confirm("Cancelling will reload the page and erase any current changes.");
  if (confirmation) {
    // `confirm` wipes away the hash after we set the new location. We need to use _.defer which
    // lets the location.href run a frame after `confirm` wipes the hash out of the URL.
    _.defer(function() {
      window.location.href = href;
      location.reload();
    });
  } else {
    // If the user clicks "Cancel" in the `confirm`, it still wipes away the hash. Replace it.
    _.defer(function() {
      window.location.href = href;
    });
  }
}
