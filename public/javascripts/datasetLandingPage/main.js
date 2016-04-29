require('script!jquery');
require('dotdotdot');

var Clipboard = require('clipboard');
var styleguide = require('socrata-styleguide');
var collapsible = require('./collapsible'); // TODO integrate into styleguide
var velocity = require('velocity-animate');

// Initialize the styleguide javascript components
styleguide(document);

function getHeight(element) {
  return element.getBoundingClientRect().height;
}

$(function() {
  initDescriptionHeight();
  initCollapsibles();
  initFeaturedViewsTruncation();
  initMetadataTableToggle();
  initSchemaPreview();
  initApiEndpointControls();
  initPrivateDismissal();

  // Legendary firefox hack, see https://bugzilla.mozilla.org/show_bug.cgi?id=1266901
  Array.prototype.slice.call(document.querySelectorAll('td.attachment a')).forEach(function(link) {
    link.style.display = 'none';
    link.offsetHeight;
    link.style.display = '';
  });
});

// Fixes a visual border issue when descriptions are very short
function initDescriptionHeight() {
  var metadata = document.querySelector('.entry-meta.second');
  var metadataHeight = getHeight(metadata);

  var description = document.querySelector('.entry-description');
  var descriptionHeight = getHeight(description);

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

function initMetadataTableToggle() {
  var leftColumnHeight = document.querySelector('.metadata-column.fancy').offsetHeight;
  var tableColumn = document.querySelector('.metadata-column.tables');
  var tables = Array.prototype.slice.call(tableColumn.querySelectorAll('.metadata-table'));
  var shouldHideToggles = true;

  // Add a 'hidden' class to tables whose top is below the bottom of the left column.  These will be
  // shown and hidden as the tableColumn is expanded and collapsed.
  tables.forEach(function(table) {
    if (table.offsetTop > leftColumnHeight) {
      table.classList.add('hidden');
      shouldHideToggles = false;
    }
  });

  var columnToggles = Array.prototype.slice.call(document.querySelectorAll('.metadata-table-toggle'));

  // If there is not enough content in the tableColumn, hide the toggles and avoid binding event
  // handlers, as no collapsing is necessary.
  if (shouldHideToggles) {
    var toggleGroups = Array.prototype.slice.call(document.querySelectorAll('.metadata-table-toggle-group'));
    toggleGroups.forEach(function(group) {
      group.style.display = 'none';
    });

    tableColumn.classList.remove('collapsed');
    tableColumn.style.paddingBottom = 0;

    return;
  }

  columnToggles.forEach(function(toggle) {
    toggle.addEventListener('click', function(event) {
      event.preventDefault();

      var wasCollapsed = tableColumn.classList.contains('collapsed');
      var originalHeight = getHeight(tableColumn);
      tableColumn.classList.toggle('collapsed');
      var targetHeight = getHeight(tableColumn);
      tableColumn.style.height = originalHeight + 'px';

      if (wasCollapsed) {
        velocity(tableColumn, {
          height: targetHeight
        }, function() {
          tableColumn.style.height = '';
        });
      } else {
        tableColumn.classList.remove('collapsed');

        tableColumn.style.height = originalHeight + 'px';
        velocity(tableColumn, {
          height: targetHeight
        }, function() {
          tableColumn.style.height = '';
          tableColumn.classList.add('collapsed');
        });
      }
    });
  });
}

// Init expand/collapse for schema table.
function initSchemaPreview() {
  var schemaSections = Array.prototype.slice.call(document.querySelectorAll('.schema-preview .section-content'));

  schemaSections.forEach(function(schemaSection) {
    var tableWrapper = schemaSection.querySelector('.table-wrapper');
    var tableToggles = Array.prototype.slice.call(schemaSection.querySelectorAll('.table-collapse-toggle'));

    // Expand/collapse the table upon clicking "Show All" or "Show Less" toggle.
    tableToggles.forEach(function(toggle) {
      toggle.addEventListener('click', function() {
        var wasCollapsed = schemaSection.classList.contains('collapsed');
        var originalScrollPosition = document.body.scrollTop;

        // Calculate current height and the height we are going to animate to.
        var originalHeight = getHeight(tableWrapper);
        schemaSection.classList.toggle('collapsed');
        var newHeight = getHeight(tableWrapper);

        // Here we expand the table if we are collapsing so the contents are visible while the
        // animation is playing.  We also reset the scroll position to the original position because
        // getBoundingClientRect was called while the table was collapsed which will reset the scroll
        // position of the window.
        if (!wasCollapsed) {
          schemaSection.classList.remove('collapsed');
          window.scrollTo(0, originalScrollPosition);
        }

        // Set the height to the original height and animate to the new height.
        tableWrapper.style.height = originalHeight + 'px';
        velocity(tableWrapper, {
          height: newHeight
        }, function() {

          // Let the wrapper set its own height after the animation is finished.  This allows the
          // wrapper height to naturally adjust as the nested collapsibles are animating.
          tableWrapper.style.height = '';

          // If we just collapsed the table, hide the contents at the end of the animation.
          if (!wasCollapsed) {
            schemaSection.classList.add('collapsed');
          }
        });
      });
    });

    // Expand and collapse each row of the table when clicked.  There are two elements that are
    // simultaneously animated: the row itself (animated to show the full description), and the
    // "details" row that immediately follows the "summary" row in the DOM, containing more
    // information about the column.
    var collapsibleRows = Array.prototype.slice.call(tableWrapper.querySelectorAll('.column-summary'));
    collapsibleRows.forEach(function(row) {
      row.addEventListener('click', function() {
        var columnId = row.dataset.column;

        // Animate the sister row
        var detailRow = tableWrapper.querySelector('.column-details[data-column="' + columnId + '"]');
        if (detailRow) {
          var detailRowIsHidden = detailRow.style.display === 'none' || detailRow.style.display === '';
          var detailRowContents = detailRow.querySelector('.contents');

          if (detailRowIsHidden) {
            var originalRowHeight = 0;
            var targetRowHeight;
            var padding = 15;

            // Show the row
            detailRow.style.display = 'table-row';

            // Temporarily set height to auto to determine the height to animate to
            detailRowContents.style.height = 'auto';
            targetRowHeight = getHeight(detailRowContents);
            detailRowContents.style.height = originalRowHeight;

            // Also animate padding due to the way <td>s work
            velocity(detailRowContents, {
              height: targetRowHeight + (2 * padding),
              paddingTop: padding,
              paddingBottom: padding
            });
          } else {
            velocity(detailRowContents, {
              height: 0,
              paddingTop: 0,
              paddingBottom: 0
            }, function() {
              detailRow.style.display = 'none';
            });
          }
        }

        // Animate the description
        var description = row.querySelector('.column-description .contents');
        if (description) {
          if (description.classList.contains('clamped')) {
            var originalDescriptionHeight = getHeight(description);
            var targetDescriptionHeight;

            // Keep track of current collapsed height for collapse animation.
            description.dataset.originalHeight = originalDescriptionHeight;

            // Remove ellipsification and determine target height
            description.classList.remove('clamped');
            description.style.height = 'auto';
            targetDescriptionHeight = getHeight(description);

            // Set height to original and animate to target
            description.style.height = originalDescriptionHeight + 'px';
            velocity(description, {
              height: targetDescriptionHeight
            }, function() {
              description.style.height = 'auto';
            });
          } else {

            // Animate to collapsed height, ellipsify when done
            velocity(description, {
              height: description.dataset.originalHeight
            }, function() {
              description.classList.add('clamped');
            });
          }
        }
      });
    });
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
