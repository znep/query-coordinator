var inputTypeValidations = {
  google_analytics: /ua-\d+-\d+/i
};

var validationRules = {
  general: {
    'content[general][google_analytics_token]': { pattern: inputTypeValidations.google_analytics },
    'content[general][window_icon]': { url: true }
  },
  header: {
    'content[header][logo][src]': { url: true }
  },
  footer: {
    'content[footer][logo][src]': { url: true }
  }
};

// Note: This needs to be a function rather than an object because $.t is not defined on load.
var validationMessages = function(tab) {
  return {
    general: {
      'content[general][google_analytics_token]':
        $.t('screens.admin.site_chrome.tabs.general.fields.google_analytics_token.error')
    },
    header: {},
    footer: {},
    social: {},
    homepage: {}
  }[tab];
};

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
    var $formToSubmit = getActiveFormId();
    if ($formToSubmit.length) {
      if ($formToSubmit.valid()) {
        $formToSubmit.submit();
      }
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
    return $('ul.tabs li').first().data().tabId || 'general';
  }
}

function getFormIdForTabId(tabId) {
  return $('form#tab_form_{0}'.format(tabId));
}

function getActiveFormId() {
  return getFormIdForTabId(getActiveTabId());
}

function showTab(tabId) {
  $('ul.tabs li, .tab-content').removeClass('current');
  $('.tab-content[data-tab-id="{0}"], .tab-link[data-tab-id="{0}"]'.
    format(tabId)).addClass('current');
  inputValidation(tabId);
}

// Displays a notification to the user if they type invalid input.
// Uses jQuery Validate plugin: public/javascripts/plugins/jquery.validate.js
function inputValidation(tabId) {
  var $currentForm = getFormIdForTabId(tabId);
  $currentForm.validate({
    rules: validationRules[tabId],
    messages: validationMessages(tabId),
    onkeyup: false,
    focusInvalid: false,
    errorPlacement: function($error, $element) {
      $error.appendTo($element.parent());
    }
  });

  toggleSaveButton($currentForm);

  $currentForm.find('input').on('blur', function() {
    toggleSaveButton($currentForm);
  });
}

// Toggle "save" button if form is valid/invalid
function toggleSaveButton(form) {
  if (form.valid()) {
    $('#site_chrome_save').removeClass('error');
  } else {
    $('#site_chrome_save').addClass('error');
  }
}

function confirmReload() {
  var href = window.location.href; // store href with the hash of the current tab
  var confirmation = confirm('Cancelling will reload the page and erase any current changes.');
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
