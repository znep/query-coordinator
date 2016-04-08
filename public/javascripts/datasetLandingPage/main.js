require('script!jquery');
require('dotdotdot');
require('velocity-animate');

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
});
