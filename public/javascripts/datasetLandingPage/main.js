require('script!jquery');
require('dotdotdot');

var Clipboard = require('clipboard');
var styleguide = require('socrata-styleguide');
var collapsible = require('./collapsible'); // TODO integrate into styleguide

// Initialize the styleguide javascript components
styleguide(document);

$(function() {
  initDescriptionHeight();
  initCollapsibles();
  initFeaturedViewsTruncation();
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
  collapsible(document.querySelector('.info-pane .entry-description'), {
    height: 4 * lineHeight + 2 * descriptionPadding
  });

  // Collapse tags to 2 lines, breaking on tags, preserving commas.
  if (document.querySelector('.tag-list')) {
    collapsible(document.querySelector('.tag-list'), {
      height: 2 * lineHeight,
      wrap: 'children',
      lastCharacter: {
        remove: [ ' ', ';', '.', '!', '?' ]
      }
    });
  }
}

function initFeaturedViewsTruncation() {
  var titleLineHeight = 24;
  var descriptionLineHeight = 19;
  var descriptionPadding = 8;

  // Collapse featured view titles to 2 lines.
  $('.media-results .entry-title').dotdotdot({
    height: 2 * titleLineHeight
  });

  // Collapse featured view descriptions to 3 lines.
  $('.media-results .entry-description').dotdotdot({
    height: 3 * descriptionLineHeight + 2 * descriptionPadding
  });
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
  var privateNoticesClosed;

  if (!privateNotice) {
    return;
  }

  try {
    privateNoticesClosed = JSON.parse(sessionStorage.getItem('dismissedPrivateNotices'));
    hasDismissedPrivateNotice = privateNoticesClosed[privateNotice.dataset.storageKey];
  } catch (e) {
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

  dismissButton.addEventListener('click', function() {
    try {
      privateNoticesClosed = JSON.parse(sessionStorage.getItem('dismissedPrivateNotices'));
      privateNoticesClosed = privateNoticesClosed || {};
      privateNoticesClosed[privateNotice.dataset.storageKey] = true;
      sessionStorage.setItem('dismissedPrivateNotices', JSON.stringify(privateNoticesClosed));
    } finally {
      privateNotice.style.display = 'none';
    }
  });
}
