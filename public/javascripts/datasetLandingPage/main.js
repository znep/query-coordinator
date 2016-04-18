require('script!jquery');
require('dotdotdot');

var Clipboard = require('clipboard');
var Styleguide = require('socrata-styleguide');
var Collapsible = require('./collapsible'); // TODO integrate into styleguide

// Initialize the styleguide javascript components
Styleguide(document);

$(function() {
  initDescriptionHeight();
  initCollapsibles();
  initApiEndpointControls();
  initPrivateDismissal();
});

// Fixes a visual border issue when descriptions are very short
function initDescriptionHeight() {
  var metadata = document.querySelector('.entry-meta.second');
  var metadataHeight = metadata.getBoundingClientRect().height;

  var description = document.querySelector('.entry-description');
  var descriptionHeight = description.getBoundingClientRect().height;

  if (descriptionHeight < metadataHeight) {
    description.style.height = metadataHeight + 'px';
  }
}

// Ellipsify dataset description and tag list
function initCollapsibles() {
  var lineHeight = 24;
  var descriptionPadding = 11;

  // Collapse dataset description to 4 lines.
  Collapsible(document.querySelector('.entry-description'), {
    height: 4 * lineHeight + 2 * descriptionPadding
  });

  // Collapse tags to 2 lines, breaking on tags, preserving commas.
  if (document.querySelector('.tag-list')) {
    Collapsible(document.querySelector('.tag-list'), {
      height: 2 * lineHeight,
      wrap: 'children',
      lastCharacter: {
        remove: [ ' ', ';', '.', '!', '?' ]
      }
    });
  }
}

// Copy-to-clipboard and json/geojson toggle in API flannel and OData modal
function initApiEndpointControls() {

  // Highlight endpoint input on click
  $('.endpoint-input').
    focus(function() { $(this).select(); }).
    mouseup(function(event) { event.preventDefault(); });

  // Set up copy to clipboard button
  var copyButton = new Clipboard('.btn.copy', {
    text: function(trigger) {
      return $(trigger).closest('form').find('input').val();
    }
  });

  copyButton.on('success', function(event) {
    var $button = $(event.trigger);
    var copyText = $button.text();

    $button.
      addClass('btn-success').
      text($button.data('confirmation'));

    // Revert to pre-copy state after 2 seconds
    window.setTimeout(function() {
      $button.
        removeClass('btn-success').
        text(copyText);
    }, 2000);
  });

  // Set up switch API/OData endpoint between JSON and GeoJSON
  var apiEndpointFormatSelector = $('.endpoint-format-selector');
  apiEndpointFormatSelector.each(function(index, formatSelector) {
    $(formatSelector).find('.dropdown-options .option').click(function(event) {
      var $option = $(event.target);
      var $input = $option.closest('form').find('.endpoint-input');

      var oldEndpoint = $input.val();
      var newEndpoint = oldEndpoint.replace(/\w*json$/, $option.data('value'));

      $input.val(newEndpoint);
    });
  });
}

// Close private notice when clicked and remember using sessionStorage
function initPrivateDismissal() {
  var privateNotice = document.querySelector('.private-notice');
  var hasDismissedPrivateNotice;

  if (!privateNotice) {
    return;
  }

  try {
    var privateNoticesClosed = JSON.parse(sessionStorage.getItem('dismissedPrivateNotices'));
    hasDismissedPrivateNotice = privateNoticesClosed[privateNotice.dataset.storageKey];
  } catch(e) {
    hasDismissedPrivateNotice = false;
  }

  if (hasDismissedPrivateNotice) {
    return;
  }

  privateNotice.style.display = 'block';

  var dismissButton = privateNotice.querySelector('.alert-dismiss');

  if (!dismissButton) {
    return;
  }

  dismissButton.addEventListener('click', function(event) {
    try {
      var privateNoticesClosed = JSON.parse(sessionStorage.getItem('dismissedPrivateNotices'));
      privateNoticesClosed = privateNoticesClosed || {};
      privateNoticesClosed[privateNotice.dataset.storageKey] = true;
      sessionStorage.setItem('dismissedPrivateNotices', JSON.stringify(privateNoticesClosed));
    } finally {
      privateNotice.style.display = 'none';
    }
  });
}
