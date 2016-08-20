var inputTypeValidations = {
  template: /^(rally|evergreen|default)$/i,
  google_analytics: /^ua-\d+-\d+$/i,
  color: /^(#(?=[a-z\d]*$)(?:.{3}|.{6})|transparent)$/i,
  dimensions: /^\d{1,4}px$/
};

var validationRules = {
  'content[general][template]': { pattern: inputTypeValidations.template },
  'content[general][google_analytics_token]': { pattern: inputTypeValidations.google_analytics },
  'content[general][styles][max_width]': { pattern: inputTypeValidations.dimensions },
  'content[header][styles][logo_height]': { pattern: inputTypeValidations.dimensions },
  'content[header][styles][logo_width]': { pattern: inputTypeValidations.dimensions },
  'content[header][styles][bg_color]': { pattern: inputTypeValidations.color },
  'content[header][styles][bg_color_secondary]': { pattern: inputTypeValidations.color },
  'content[header][styles][fg_color]': { pattern: inputTypeValidations.color },
  'content[footer][styles][logo_height]': { pattern: inputTypeValidations.dimensions },
  'content[footer][styles][logo_width]': { pattern: inputTypeValidations.dimensions },
  'content[footer][styles][bg_color]': { pattern: inputTypeValidations.color },
  'content[footer][styles][fg_color]': { pattern: inputTypeValidations.color }
};

// Note: This needs to be a function rather than an object because $.t is not defined on load.
var validationMessages = function() {
  return {
    'content[general][template]':
      $.t('screens.admin.site_chrome.tabs.general.fields.template.error'),
    'content[general][google_analytics_token]':
      $.t('screens.admin.site_chrome.tabs.general.fields.google_analytics_token.error'),
    'content[header][styles][logo_height]':
      $.t('screens.admin.site_chrome.tabs.header.fields.header_logo_height.error'),
    'content[header][styles][logo_width]':
      $.t('screens.admin.site_chrome.tabs.header.fields.header_logo_width.error'),
    'content[footer][styles][logo_height]':
      $.t('screens.admin.site_chrome.tabs.footer.fields.footer_logo_height.error'),
    'content[footer][styles][logo_width]':
      $.t('screens.admin.site_chrome.tabs.footer.fields.footer_logo_width.error')
  };
};

var $siteChromeForm = $('form#site_chrome_form');

$(document).ready(function() {
  var curTab = getActiveTabId();
  // Show appropriate tab given the url hash. Ex: /site_chrome#tab=general
  showTab(curTab);

  inputValidation();

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
    if ($siteChromeForm.length) {
      if ($siteChromeForm.valid()) {
        preSubmitLinkCleansing();
        $siteChromeForm.removeAttr('target');
        $siteChromeForm.find('input#stage').remove();
        $siteChromeForm.submit();
      }
    } else {
      alert('Could not find form to submit! Try submitting by pressing return in an input field instead.');
    }
  });

  // Submit the form from the active tab when save button is clicked
  $('button#site_chrome_preview').click(function(e) {
    e.preventDefault();
    if ($siteChromeForm.length) {
      if ($siteChromeForm.valid()) {
        $siteChromeForm.attr('target', '_blank');
        var $stage = $siteChromeForm.find('input#stage');
        if (!$stage.exists()) {
          $stage = $('<input type="hidden" id="stage" name="stage" />');
          $siteChromeForm.append($stage);
        }
        $stage.val('draft');
        $siteChromeForm.submit();
      }
    } else {
      alert('Could not find form to submit! Try submitting by pressing return in an input field instead.');
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

  sortableListOfLinks();
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

function showTab(tabId) {
  $('ul.tabs li, .tab-content').removeClass('current');
  $('.tab-content[data-tab-id="{0}"], .tab-link[data-tab-id="{0}"]'.format(tabId)).addClass('current');
  $('.tab-content[data-tab-id="{0}"], .tab-link[data-tab-id="{0}"]'.
    format(tabId)).addClass('current');

  // Replace the anchor part so that we reload onto the same tab we submit from.
  $siteChromeForm.attr('action', $siteChromeForm.attr('action').replace(/#tab=.*/, '#tab=' + tabId));
  updatePageControlsForActiveTab(tabId);
}

function updatePageControlsForActiveTab(tabId) {
  $('.page-controls a[href*=#]').attr('href', '#tab=' + tabId);
}

// Displays a notification to the user if they type invalid input.
// Uses jQuery Validate plugin: public/javascripts/plugins/jquery.validate.js
function inputValidation() {
  $siteChromeForm.validate({
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
    errorClass: 'site-chrome-input-error'
  });

  toggleSaveButton();

  $siteChromeForm.find('input').on('blur', toggleSaveButton);
}

// Toggle "save" button if form is valid/invalid
function toggleSaveButton() {
  if ($siteChromeForm.valid()) {
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

function currentLocale() {
  // TODO - actually support different locales
  return 'en';
}

function toggleDisabledCopyrightText(checkbox) {
  var $textbox = $('#copyright-notice-text');
  $textbox.prop('disabled', !checkbox.checked);
}

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

function addNewLinkRow(button) {
  var linkRowLimit = 15;
  var $allLinkRows = $(button).closest('.list-of-links').find('.link-row');
  var linkRowCount = $allLinkRows.not('.default').length;
  var isChildLink = $(button).parent().hasClass('link-menu');

  if (linkRowCount < linkRowLimit) {
    var defaultLinkRowSelector = isChildLink ? '.default.child' : '.default:not(.child)';
    var $defaultLinkRow = $allLinkRows.filter(defaultLinkRowSelector);
    var $newLinkRow = $defaultLinkRow.clone();

    $newLinkRow.removeClass('default');
    // Append newLinkMenu to end (of either top level or inside a menu).
    $(button).siblings('.links-and-menus, .child-links').append($newLinkRow);

    // If we're at the linkRowLimit after adding the newLinkRow, disable the "add" buttons.
    if (linkRowCount + 1 >= linkRowLimit) {
      $('.add-new-link-row').prop('disabled', true);
      $('.add-new-link-menu').prop('disabled', true);
    }
  }
}

function removeLinkRow(button) {
  $(button).closest('.link-row').remove();
  $('.add-new-link-row').prop('disabled', false);
  $('.add-new-link-menu').prop('disabled', false);
}

function addNewLinkMenu(button) {
  var $linkMenus = $(button).siblings('.links-and-menus').find('.link-menu');
  var $defaultLinkMenu = $(button).siblings('.links-and-menus').find('.link-menu.default');
  var $newLinkMenu = $defaultLinkMenu.clone();

  $newLinkMenu.removeClass('default');
  // Append new link menu after all other top-level links and menus
  $(button).siblings('.links-and-menus').
    // Use `.children` instead of `.find` to make sure we are only getting top-level link-rows
    children('.link-menu, .link-row').
    not('.default').
    last().
    after($newLinkMenu);
  // Create new link-row inside new menu.
  addNewLinkRow($newLinkMenu.find('.add-new-link-row'));
}

// Remove menu and move its child links to top-level links.
function removeLinkMenu(button) {
  var $childLinks = $(button).siblings('.child-links').find('.link-row');
  $childLinks.each(function(childLink) {
    moveChildLinkToTopLevelLink($childLinks);
  });

  $(button).closest('.link-menu').replaceWith($childLinks);
}

// Before submit, reorder the indices of the present links and menus to reflect the current
// appearance. Also remove any empty links to prevent them from being saved to the config.
function preSubmitLinkCleansing() {
  $siteChromeForm.find('.list-of-links').each(function(i, listOfLinks) {
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
