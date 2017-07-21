var inputTypeValidations = {
  google_analytics: /^ua-\d+-\d+$/i,
  color: /^(#(?=[a-f0-9]*$)(?:.{3}|.{6})|transparent)$/i,
  dimensions: /^\d{1,4}(px|pt|em|rem|%)$/,
  url: /^(https?|www|mailto|\/)/
};

var validationRules = {
  'content[general][google_analytics_token]': {
    pattern: inputTypeValidations.google_analytics
  },
  'content[general][webtrends_url]': {
    pattern: inputTypeValidations.url
  },
  'content[general][window_icon]': {
    pattern: inputTypeValidations.url
  },
  'content[general][styles][max_width]': {
    pattern: inputTypeValidations.dimensions
  },
  'content[header]links[][url]': {
    pattern: inputTypeValidations.url
  },
  'content[header][logo][src]': {
    pattern: inputTypeValidations.url
  },
  'content[header][styles][logo_height]': {
    pattern: inputTypeValidations.dimensions
  },
  'content[header][styles][logo_width]': {
    pattern: inputTypeValidations.dimensions
  },
  'content[header][logo][url]': {
    pattern: inputTypeValidations.url
  },
  'content[header][styles][display_name_fg_color]': {
    pattern: inputTypeValidations.color
  },
  'content[header][styles][display_name_size]': {
    pattern: inputTypeValidations.dimensions
  },
  'content[header][styles][bg_color]': {
    pattern: inputTypeValidations.color
  },
  'content[header][styles][bg_color_secondary]': {
    pattern: inputTypeValidations.color
  },
  'content[header][styles][fg_color]': {
    pattern: inputTypeValidations.color
  },
  'content[footer]links[][url]': {
    pattern: inputTypeValidations.url
  },
  'content[header]links[]links[][url]': {
    pattern: inputTypeValidations.url
  },
  'content[footer][logo][src]': {
    pattern: inputTypeValidations.url
  },
  'content[footer][styles][logo_height]': {
    pattern: inputTypeValidations.dimensions
  },
  'content[footer][styles][logo_width]': {
    pattern: inputTypeValidations.dimensions
  },
  'content[footer][logo][url]': {
    pattern: inputTypeValidations.url
  },
  'content[footer][styles][display_name_fg_color]': {
    pattern: inputTypeValidations.color
  },
  'content[footer][styles][display_name_size]': {
    pattern: inputTypeValidations.dimensions
  },
  'content[footer][styles][bg_color]': {
    pattern: inputTypeValidations.color
  },
  'content[footer][styles][fg_color]': {
    pattern: inputTypeValidations.color
  },
  'content[general][social_shares][facebook][url]': {
    pattern: inputTypeValidations.url
  },
  'content[general][social_shares][twitter][url]': {
    pattern: inputTypeValidations.url
  },
  'content[general][social_shares][youtube][url]': {
    pattern: inputTypeValidations.url
  },
  'content[general][social_shares][linked_in][url]': {
    pattern: inputTypeValidations.url
  },
  'content[general][social_shares][flickr][url]': {
    pattern: inputTypeValidations.url
  },
  'content[general][social_shares][instagram][url]': {
    pattern: inputTypeValidations.url
  },
  'content[general][social_shares][tumblr][url]': {
    pattern: inputTypeValidations.url
  },
  'content[general][social_shares][pinterest][url]': {
    pattern: inputTypeValidations.url
  },
  'content[general][social_shares][yammer][url]': {
    pattern: inputTypeValidations.url
  },
  'content[general][social_shares][google_plus][url]': {
    pattern: inputTypeValidations.url
  },
  'content[general][social_shares][vimeo][url]': {
    pattern: inputTypeValidations.url
  },
  'content[general][social_shares][github][url]': {
    pattern: inputTypeValidations.url
  }
};

// Note: This needs to be a function rather than an object because $.t is not defined on load.
var validationMessages = function() {
  return {
    'content[general][google_analytics_token]': $.t('screens.admin.site_appearance.tabs.general.fields.google_analytics_token.error'),
    'content[header][styles][logo_height]': $.t('screens.admin.site_appearance.tabs.header.fields.header_logo_height.error'),
    'content[header][styles][logo_width]': $.t('screens.admin.site_appearance.tabs.header.fields.header_logo_width.error'),
    'content[footer][styles][logo_height]': $.t('screens.admin.site_appearance.tabs.footer.fields.footer_logo_height.error'),
    'content[footer][styles][logo_width]': $.t('screens.admin.site_appearance.tabs.footer.fields.footer_logo_width.error')
  };
};

var $siteAppearanceForm = $('form#site_appearance_form');

$(document).ready(function() {
  // EN-12175: If using custom header/footer, only show a Preview button on Site Appearance.
  if ($('.site-appearance').hasClass('custom')) {
    $('button#site_appearance_preview').click(function(e) {
      e.preventDefault();
      document.cookie = 'socrata_site_chrome_preview=true;path=/';
      location.reload();
    });

    return;
  }

  var curTab = getActiveTabId();
  // Show appropriate tab given the url hash. Ex: /site_appearance#tab=general
  showTab(curTab);

  inputValidation();

  // Change active tab and tab-content on click
  $('ul.tabs li').click(function() {
    curTab = $(this).data('tab-id');
    showTab(curTab);
  });

  // EN-8454: On back button click that changes only the url fragment,
  // render the correct tab.
  window.onpopstate = function() {
    var curTabOnPopState = getActiveTabId();
    if (curTab !== curTabOnPopState) {
      curTab = curTabOnPopState;
      showTab(curTab);
    }
  };

  // Submit the form when save button is clicked
  $('button#site_appearance_save').click(function() {
    if ($siteAppearanceForm.length && $siteAppearanceForm.valid()) {
      preSubmitLinkCleansing();
      $siteAppearanceForm.removeAttr('target');
      $siteAppearanceForm.find('input#stage').remove();
      $siteAppearanceForm.submit();
    }
  });

  // Secret button only visible to superadmins that allows saving the configuration without activation.
  $('button#save_without_activation').click(function() {
    if ($siteAppearanceForm.length && $siteAppearanceForm.valid()) {
      preSubmitLinkCleansing();
      $('#enable_activation').attr('disabled', true);
      $siteAppearanceForm.removeAttr('target');
      $siteAppearanceForm.find('input#stage').remove();
      $siteAppearanceForm.submit();
    }
  });

  // Submit the preview form when preview button is clicked
  $('button#site_appearance_preview').click(function(e) {
    e.preventDefault();
    if ($siteAppearanceForm.length && $siteAppearanceForm.valid()) {
      preSubmitLinkCleansing();
      $siteAppearanceForm.attr('target', '_blank');
      var $stage = $siteAppearanceForm.find('input#stage');
      if (!$stage.exists()) {
        $stage = $('<input type="hidden" id="stage" name="stage" />');
        $siteAppearanceForm.append($stage);
      }
      $stage.val('draft');
      $siteAppearanceForm.submit();
      var intervalCounter = 0;
      var checkCookieInterval = setInterval(function() {
        intervalCounter++;
        if (document.cookie.indexOf('socrata_site_chrome_preview=true') > -1) {
          clearInterval(checkCookieInterval);
          window.location.reload();
        }
        if (intervalCounter > 20) {
          clearInterval(checkCookieInterval);
          alert($.t('screens.admin.site_appearance.preview_failure'));
        }
      }, 500);
    }
  });

  var onLoadOrClickingSigninSignoutCheckbox = function() {
    var value = $('#content_general_show_signin_signout').attr('checked');
    var $knockonEffects = $('#content_general_show_signup, #content_general_show_profile');
    if (value) {
      $knockonEffects.prop('disabled', false);
    } else {
      $knockonEffects.removeAttr('checked').
      prop('disabled', true);
    }
  };
  onLoadOrClickingSigninSignoutCheckbox();
  $('#content_general_show_signin_signout').on('click change', onLoadOrClickingSigninSignoutCheckbox);

  $('.flyout-target').hover(function(e) {
    $(e.target).closest('.flyout-container').find('.flyout').removeClass('flyout-hidden');
  }, function(e) {
    $(e.target).closest('.flyout-container').find('.flyout').addClass('flyout-hidden');
  });

  sortableListOfLinks();
});

$('.activate-site-appearance').click(function() {
  if ($siteAppearanceForm.length && $siteAppearanceForm.valid()) {
    preSubmitLinkCleansing();
    $('#enable_activation').attr('disabled', false);
    $siteAppearanceForm.removeAttr('target');
    $siteAppearanceForm.find('input#stage').remove();
    $siteAppearanceForm.submit();
  }
});

// Figure out which tab is active (current) and get its id
function getActiveTabId() {
  var urlHash = document.location.hash.substring(1);
  var activeTabId = urlHash.substr(urlHash.indexOf('tab=')).split('&')[0].split('=')[1];
  if (activeTabId) {
    return activeTabId;
  } else {
    // No tab specified, show first tab
    return _.get($('ul.tabs li').first().data(), 'tabId', 'general');
  }
}

function showTab(tabId) {
  $('ul.tabs li, .tab-content').removeClass('current');
  $('.tab-content[data-tab-id="{0}"], .tab-link[data-tab-id="{0}"]'.format(tabId)).addClass('current');
  $('.tab-content[data-tab-id="{0}"], .tab-link[data-tab-id="{0}"]'.format(tabId)).addClass('current');

  // Replace the anchor part so that we reload onto the same tab we submit from.
  $siteAppearanceForm.attr('action', $siteAppearanceForm.attr('action').replace(/#tab=.*/, '#tab=' + tabId));
  updatePageControlsForActiveTab(tabId);
}

function updatePageControlsForActiveTab(tabId) {
  $('.page-controls a[href*=#]').attr('href', '#tab=' + tabId);
}

// Displays a notification to the user if they type invalid input.
// Uses jQuery Validate plugin: public/javascripts/plugins/jquery.validate.js
function inputValidation() {
  $siteAppearanceForm.validate({
    rules: validationRules,
    messages: validationMessages(),
    onkeyup: false,
    focusInvalid: false,
    // Validator ignores :hidden by default, which ignores all the hidden tabs.
    // We want it to care about the hidden tabs, so using a dummy selector for it to operate on.
    ignore: '.irrelevant',
    errorPlacement: function($error, $element) {
      $error.appendTo($element.parent());
    },
    errorClass: 'site-appearance-input-error'
  });

  toggleSaveButton();

  $siteAppearanceForm.find('input').on('blur', toggleSaveButton);
}

// Toggle "save" button if form is valid/invalid
function toggleSaveButton() {
  var $saveButtons = $('#site_appearance_save, #site_appearance_preview, #site_appearance_activate, #save_without_activation');
  if ($siteAppearanceForm.valid()) {
    $saveButtons.removeClass('error');
  } else {
    $saveButtons.addClass('error');
  }
}

$('.confirm-reload').click(function() {
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
});

$('.dropdown-option').click(function() {
  // Update the hidden dropdown input value
  var selectedValue = $(this).attr('value');
  $(this).closest('div.dropdown').siblings('.hidden-dropdown-input').value(selectedValue);

  // Remove the placeholder class on the title if it's present
  $(this).closest('div.dropdown').find('span.placeholder').removeClass('placeholder');
});

function currentLocale() {
  return blist.locale || 'en';
}

$('.copyright-checkbox').click(function() {
  var $textbox = $('#copyright-notice-text');
  $textbox.prop('disabled', !this.checked);
});

/*
  listOfLinks - a sortable list of text inputs.
*/

// Mapping of different input types to their 'name' attributes. Note that the name attribute is what
// determines where the data is saved into the JSON blob.
var listOfLinksInputNames = function(contentKey, id) {
  return {
    hiddenLabelInput: {
      linkRow: 'content[{0}]links[][key]'.format(contentKey),
      linkMenu: 'content[{0}]links[][key]'.format(contentKey),
      childLinkRow: 'content[{0}]links[]links[][key]'.format(contentKey)
    },
    localizedLabelInput: {
      linkRow: 'content[locales][{0}][{1}]links[{2}]'.format(currentLocale(), contentKey, id),
      linkMenu: 'content[locales][{0}][{1}]links[{2}]'.format(currentLocale(), contentKey, id),
      childLinkRow: 'content[locales][{0}][{1}]links[{2}]'.format(currentLocale(), contentKey, id)
    },
    urlInput: {
      linkRow: 'content[{0}]links[][url]'.format(contentKey),
      childLinkRow: 'content[{0}]links[]links[][url]'.format(contentKey)
    }
  };
};

// Called after a link/menu is added or removed. If the count of top-level links/menus is >=
// the limit, then we disable the buttons to add new top-level links/menus.
function checkTopLevelLinkCount($listOfLinks) {
  const topLevelLinkLimit = 15; // Max number of top level links and menus
  var topLevelLinkCount = $listOfLinks.
    find('.links-and-menus').
    // `children` to make sure we aren't including nested links inside `.link-menu`s
    children('.link-row, .link-menu').
    not('.default').
    length;
  if (topLevelLinkCount < topLevelLinkLimit) {
    $listOfLinks.children('.add-new-link-row, .add-new-link-menu').prop('disabled', false);
  } else {
    $listOfLinks.children('.add-new-link-row, .add-new-link-menu').prop('disabled', true);
  }
}

$('.list-of-links').on('click', '.add-new-link-row', function() {
  var isChildLink = $(this).parent().hasClass('link-menu');
  var $listOfLinks = $(this).closest('.list-of-links');

  var defaultLinkRowSelector = isChildLink ? '.link-row.default.child' : '.link-row.default:not(.child)';
  var $defaultLinkRow = $listOfLinks.find(defaultLinkRowSelector);
  var $newLinkRow = $defaultLinkRow.clone();

  $newLinkRow.removeClass('default');

  var $urlInput = $newLinkRow.find('.url-input');

  // EN-11064: Unique id so jquery validate plugin can hook onto individual url-inputs
  var randomId = Math.random().toString(36).slice(2);
  $urlInput.attr('id', randomId);

  // EN-16394: Make URL inputs required.
  $urlInput.attr('required', 'required');

  // Append newLinkMenu to end (of either top level or inside a menu).
  $(this).siblings('.links-and-menus, .child-links').append($newLinkRow);

  checkTopLevelLinkCount($listOfLinks);
  inputValidation();
});

$('.list-of-links').on('click', '.remove-link-row', function() {
  var $listOfLinks = $(this).closest('.list-of-links');
  $(this).closest('.link-row').remove();
  checkTopLevelLinkCount($listOfLinks);
  inputValidation();
});

$('.list-of-links').on('click', '.add-new-link-menu', function() {
  var $defaultLinkMenu = $(this).siblings('.links-and-menus').find('.link-menu.default');
  var $newLinkMenu = $defaultLinkMenu.clone();

  $newLinkMenu.removeClass('default');
  // Append new link menu after all other top-level links and menus
  $(this).siblings('.links-and-menus').
    // Use `.children` instead of `.find` to make sure we are only getting top-level link-rows
    children('.link-menu, .link-row').
    not('.default').
    last().
    after($newLinkMenu);
  // Create new link-row inside new menu.
  $newLinkMenu.find('.add-new-link-row').click();
});

// Remove menu and move its child links to top-level links.
$('.list-of-links').on('click', '.remove-link-menu', function() {
  var $listOfLinks = $(this).closest('.list-of-links');
  var $childLinks = $(this).siblings('.child-links').find('.link-row');
  $childLinks.each(function() {
    moveChildLinkToTopLevelLink($childLinks);
  });

  $(this).closest('.link-menu').replaceWith($childLinks);
  checkTopLevelLinkCount($listOfLinks);
});

// EN-9029: Allow users to upload images as assets
$('.form-field-image-input-button').click(function() {
  $(this).siblings('.form-field-image-hidden-input').click();
});

$('.form-field-image-hidden-input').on('change', function() {
  var imageFile = this.files[0];
  if (imageFile && /^image/.test(imageFile.type)) {
    var formData = new FormData();
    formData.append('file', imageFile);

    var $defaultButton = $(this).siblings('button.form-field-image-input-button');
    var $busyButton = $(this).siblings('button.btn-busy');
    $defaultButton.hide();
    $busyButton.show();

    $.ajax({
      url: '/api/assets',
      type: 'POST',
      data: formData,
      context: this,
      contentType: false,
      processData: false,
      timeout: 30000,
      success: function(json) {
        var response = JSON.parse(json);
        var relativeUrl = '/api/assets/{0}?{1}'.format(response.id, response.nameForOutput);
        $(this).siblings('.upload-failed').hide(); // hide any previous errors
        $(this).siblings('.form-field-url-input').val(relativeUrl);
        $busyButton.hide();
        $defaultButton.show();
      },
      error: function(e) {
        console.log(e);
        $(this).siblings('.upload-failed').show();
        $busyButton.hide();
        $defaultButton.show();
        // Clear the value of the hidden input, so if the user tries again to upload the same image,
        // we detect the `change` event.
        this.value = '';
      }
    });
  }
});

// Before submit, reorder the indices of the present links and menus to reflect the current
// appearance. Also remove any empty links to prevent them from being saved to the config.
function preSubmitLinkCleansing() {
  $siteAppearanceForm.find('.list-of-links').each(function(i, listOfLinks) {
    var contentKey = $(listOfLinks).data('contentKey');
    var $linkRows = $(listOfLinks).children('.links-and-menus').children('.link-row');
    var $presentLinkRows = $linkRows.filter(function() {
      return $(this).find('input[name="{0}"]'.format(listOfLinksInputNames(contentKey).urlInput.linkRow)).value();
    });

    // Top level links: add the link index to their input names and values
    $presentLinkRows.each(function(index, link) {
      var linkId = 'link_{0}'.format(index);
      $(link).find('.hidden-label-input').val(linkId);

      var linkLocaleId = listOfLinksInputNames(contentKey, linkId).localizedLabelInput.linkRow;
      $(link).find('.localized-label-input').attr('name', linkLocaleId);
    });

    // Link Menus: add menu index to input names and values
    $(listOfLinks).children('.links-and-menus').children('.link-menu').not('.default').each(
      function(menuIndex, menu) {
        var menuId = 'menu_{0}'.format(menuIndex);
        $(menu).find('.hidden-label-input').val(menuId);

        var menuLocaleId = listOfLinksInputNames(contentKey, menuId).localizedLabelInput.linkMenu;
        $(menu).find('.localized-label-input').attr('name', menuLocaleId);

        // Child links: add the menu + childLink index to their input names and values
        var $childLinks = $(menu).children('.child-links').children('.link-row');
        var $presentChildLinks = $childLinks.filter(function() {
          return $(this).find('input[name="{0}"]'.format(listOfLinksInputNames(contentKey).urlInput.childLinkRow)).value();
        });

        $presentChildLinks.each(function(childLinkIndex, childLink) {
          var childLinkId = '{0}_link_{1}'.format(menuId, childLinkIndex);
          $(childLink).find('.hidden-label-input').val(childLinkId);

          var childLinkLocaleId = '{0}'.format(listOfLinksInputNames(contentKey, childLinkId).localizedLabelInput.childLinkRow);
          $(childLink).find('.localized-label-input').attr('name', childLinkLocaleId);
        });
      }
    );

    // Remove non-present link-rows and menus
    $linkRows.not($presentLinkRows).remove();
    $(listOfLinks).children('.links-and-menus').children('.link-menu.default').remove();
  });
}

// Change data structure (name attribute) of child links to match that of top-level links.
function moveChildLinkToTopLevelLink($link) {
  var tab = getActiveTabId();
  $link.removeClass('child');
  $link.find('.hidden-label-input').attr('name', listOfLinksInputNames(tab).hiddenLabelInput.linkRow);
  $link.find('.url-input').attr('name', listOfLinksInputNames(tab).urlInput.linkRow);
  $link.find('.hidden-label-input').attr('name', listOfLinksInputNames(tab).hiddenLabelInput.linkRow);
}

// Change data structure (name attribute) of links to match that of child links.
function moveTopLevelLinkToChildLink($link) {
  var tab = getActiveTabId();
  $link.addClass('child');
  $link.find('.hidden-label-input').attr('name', listOfLinksInputNames(tab).hiddenLabelInput.childLinkRow);
  $link.find('.url-input').attr('name', listOfLinksInputNames(tab).urlInput.childLinkRow);
  $link.find('.hidden-label-input').attr('name', listOfLinksInputNames(tab).hiddenLabelInput.childLinkRow);
}

function linkIsChildLink($link) {
  return $link.parent().hasClass('child-links');
}

// jQuery UI Sortable list of links
// https://jqueryui.com/sortable/
function sortableListOfLinks() {
  $('.list-of-links').each(function(i, listOfLinks) {
    $(listOfLinks).find('.links-and-menus').sortable({
      connectWith: '.link-row',
      items: '.link-row',
      revert: 100,
      update: function(event, ui) {
        if (linkIsChildLink(ui.item)) {
          moveTopLevelLinkToChildLink(ui.item);
        } else {
          moveChildLinkToTopLevelLink(ui.item);
        }
      }
    });
  });
}
