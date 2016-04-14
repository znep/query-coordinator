require('script!jquery');
require('dotdotdot');
require('velocity-animate');

var Clipboard = require('clipboard');
var Styleguide = require('socrata-styleguide');

$(function() {
  var $description = $('.entry-description');
  var $container = $($description).parents('.entry-description-container');
  var animationDuration = 300;
  var animationEasing = [.645, .045, .355, 1];

  var lineHeight = 24;
  var padding = 11;

  var truncatedHeight = null;

  function truncateDescription() {
    $description.dotdotdot({
      height: lineHeight * 4 + padding * 2,
      after: '.entry-description-toggle.more',
      watch: true,
      callback: function(isTruncated) {
        if (isTruncated) {
          $container.attr('data-description-display', 'truncate');
          truncatedHeight = truncatedHeight || $container.height();
        } else {
          $(this).children('a.entry-description-toggle').hide();
        }
      }
    });
  }

  $('.entry-description-toggle').click(function(event) {
    event.preventDefault();
    var currentDisplay = $container.attr('data-description-display');

    if (currentDisplay === 'show') {
      $container.velocity({
        height: truncatedHeight
      }, {
        duration: animationDuration,
        easing: animationEasing,
        complete: truncateDescription
      });
    } else {
      $container.attr('data-description-display', 'show');
      $description.trigger('destroy.dot');
      $description.height('auto');
      var originalHeight = $description.height();
      $container.height(truncatedHeight);
      $container.velocity({
        height: originalHeight + 2 * padding
      }, {
        duration: animationDuration,
        easing: animationEasing
      });
    }
  });

  var $metadata = $('.entry-meta.second');
  if ($description.height() < $metadata.height()) {
    $description.height($metadata.height());
  }

  truncateDescription();

  // Highlight input on click
  $('.api-endpoint-input').
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

  // Set up switch api endpoint between JSON and GeoJSON
  var apiEndpointFormatSelector = $('.api-endpoint-format-selector');
  apiEndpointFormatSelector.each(function(index, formatSelector) {

    // Set up dropdown
    new Styleguide.Dropdown(formatSelector);

    // Set up endpoint format switching
    $(formatSelector).find('.dropdown-options .option').click(function(event) {
      var $option = $(event.target);
      var $input = $option.closest('form').find('.api-endpoint-input');

      var oldEndpoint = $input.val();
      var newEndpoint = oldEndpoint.replace(/\w*json$/, $option.data('value'));

      $input.val(newEndpoint);
    });
  });

  new Styleguide.FlannelFactory(document);
  new Styleguide.ToggleFactory(document);
  new Styleguide.ModalFactory(document);

  if (document.querySelector('.dropdown.download')) {
    new Styleguide.Dropdown(document.querySelector('.dropdown.download'));
  }
});
