var inputTypeValidations = {
  template: /^(rally|evergreen|default)$/i,
  google_analytics: /^ua-\d+-\d+$/i,
  color: /^(#(?=[a-z\d]*$)(?:.{3}|.{6})|transparent)$/i,
  dimensions: /^\d{1,4}px$/
};

var validationRules = {
  general: {
    'content[general][template]': { pattern: inputTypeValidations.template },
    'content[general][google_analytics_token]': { pattern: inputTypeValidations.google_analytics },
    'content[general][styles][max_width]': { pattern: inputTypeValidations.dimensions }
  },
  header: {
    'content[header][styles][logo_height]': { pattern: inputTypeValidations.dimensions },
    'content[header][styles][logo_width]': { pattern: inputTypeValidations.dimensions },
    'content[header][styles][bg_color]': { pattern: inputTypeValidations.color },
    'content[header][styles][bg_color_secondary]': { pattern: inputTypeValidations.color },
    'content[header][styles][fg_color]': { pattern: inputTypeValidations.color }
  },
  footer: {
    'content[footer][styles][logo_height]': { pattern: inputTypeValidations.dimensions },
    'content[footer][styles][logo_width]': { pattern: inputTypeValidations.dimensions },
    'content[footer][styles][bg_color]': { pattern: inputTypeValidations.color },
    'content[footer][styles][fg_color]': { pattern: inputTypeValidations.color }
  },
  social: {}
};

// Note: This needs to be a function rather than an object because $.t is not defined on load.
var validationMessages = function(tab) {
  return {
    general: {
      'content[general][template]':
        $.t('screens.admin.site_chrome.tabs.general.fields.template.error'),
      'content[general][google_analytics_token]':
        $.t('screens.admin.site_chrome.tabs.general.fields.google_analytics_token.error')
    },
    header: {
      'content[header][styles][logo_height]':
        $.t('screens.admin.site_chrome.tabs.header.fields.header_logo_height.error'),
      'content[header][styles][logo_width]':
        $.t('screens.admin.site_chrome.tabs.header.fields.header_logo_width.error')
    },
    footer: {
      'content[footer][styles][logo_height]':
        $.t('screens.admin.site_chrome.tabs.footer.fields.footer_logo_height.error'),
      'content[footer][styles][logo_width]':
        $.t('screens.admin.site_chrome.tabs.footer.fields.footer_logo_width.error')
    },
    social: {},
    homepage: {}
  }[tab];
};

$(document).ready(function() {
  var curTab = getActiveTabId();
  // Show appropriate tab given the url hash. Ex: /site_chrome#tab=general
  showTab(curTab);

  // Change active tab and tab-content on click
  $('ul.tabs li').click(function() {
    curTab = $(this).data('tab-id');
    showTab(curTab);
  });

  // EN-8454: On back button click that changes only the url fragment,
  // render the correct tab.
  window.onpopstate = function(event) {
    var curTabOnPopState = getActiveTabId();
    if (curTab !== curTabOnPopState) {
      curTab = curTabOnPopState;
      showTab(curTab);
    }
  };

  // Submit the form from the active tab when save button is clicked
  $('button#site_chrome_save').click(function() {
    var $formToSubmit = getActiveFormId();
    if ($formToSubmit.length) {
      if ($formToSubmit.valid()) {
        reorderListOfLinks($formToSubmit);
        $formToSubmit.removeAttr('target');
        $formToSubmit.find('input#stage').remove();
        $formToSubmit.submit();
      }
    } else {
      alert('Could not find form to submit! Try submitting by pressing return in an input field instead.');
    }
  });

  // Submit the form from the active tab when save button is clicked
  $('button#site_chrome_preview').click(function(e) {
    e.preventDefault();
    var $formToSubmit = getActiveFormId();
    if ($formToSubmit.length) {
      if ($formToSubmit.valid()) {
        $formToSubmit.attr('target', '_blank');
        var $stage = $formToSubmit.find('input#stage');
        if (!$stage.exists()) {
          $stage = $('<input type="hidden" id="stage" name="stage" />');
          $formToSubmit.append($stage);
        }
        $stage.val('draft');
        $formToSubmit.submit();
      }
    } else {
      alert('Could not find form to submit! Try submitting by pressing return in an input field instead.');
    }
  });

  var onLoadOrClickingSigninSignoutCheckbox = function() {
    var value = $('#content_general_show_signin_signout').attr('checked');
    var $knockonEffects = $('#content_general_show_signup, #content_general_show_profile');
    if (value) {
      $knockonEffects.removeAttr('disabled');
    } else {
      $knockonEffects.removeAttr('checked').
                      attr('disabled', 'disabled');
    }
  };
  onLoadOrClickingSigninSignoutCheckbox();
  $('#content_general_show_signin_signout').on('click change', onLoadOrClickingSigninSignoutCheckbox);
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

function addNewLinkRow(button) {
  var linkRowLimit = 15;
  var $linkRows = $(button).siblings('.link-row');
  if ($linkRows.not('.default').length < linkRowLimit) {
    var $defaultLinkRow = $linkRows.filter('.default');
    var $newLinkRow = $defaultLinkRow.clone();

    $newLinkRow.removeClass('default');
    $linkRows.not('.default').last().after($newLinkRow);

    // If we're at the linkRowLimit after adding the newLinkRow, disable the button.
    if ($(button).siblings('.link-row').not('.default').length >= linkRowLimit) {
      $('.add-new-link-row').prop('disabled', true);
    }
  }
}

function removeLinkRow(button) {
  $(button).closest('.link-row').remove();
  $('.add-new-link-row').prop('disabled', false);
}

// On save, reorder the indices of the present links to reflect what the user has changed.
function reorderListOfLinks($form) {
  var $listsOfLinks = $form.find('.list-of-links');
  // Currently there is at most one list of links per form, but iterating in case that changes.
  $listsOfLinks.each(function(i, listOfLinks) {
    var contentKey = $(listOfLinks).data('contentKey');
    var linkRows = $(listOfLinks).find('.link-row');
    if (linkRows.length) {
      var $presentLinkRows = linkRows.filter(function() {
        return $(this).find('input[name="content[{0}]links[][url]"]'.format(contentKey)).value();
      });

      $presentLinkRows.each(function(index, link) {
        var linkId = 'link_{0}'.format(index);
        $(link).find('.hidden-label-input').val(linkId);

        // TODO - actually support other locales and remove English hardcoding.
        var localeId = 'content[locales][en][{0}]links[{1}]'.format(contentKey, linkId);
        $(link).find('.localized-label-input').attr('name', localeId);
      });
    }
  });
}

// Toggle "save" button if form is valid/invalid
function toggleSaveButton($form) {
  if ($form.valid()) {
    $('#site_chrome_save, #site_chrome_preview').removeClass('error');
  } else {
    $('#site_chrome_save, #site_chrome_preview').addClass('error');
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

function toggleDisabledCopyrightText(checkbox) {
  var $textbox = $('#copyright-notice-text');
  $textbox.prop('disabled', !checkbox.checked);
}
