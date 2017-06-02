(function() {
  'use strict';

  $(function() {
    var t = function(str, props) {
      return $.t('screens.admin.metadata.' + str, props);
    };

    $('.removeFieldsetButton').click(function(event) {
      if (!confirm(t('are_you_sure'))) {
        event.preventDefault();
      }
    });

    var buttonMap = {
      'required': {
        'on': 'required',
        'off': 'optional'
      },
      'private': {
        'on': 'private',
        'off': 'public'
      }
    };

    $('.toggleButton').adminButton({
      callback: function(response, $line, $link) {
        $link.
        val(t('make_' + buttonMap[response.option][response.value ? 'off' : 'on'])).
        closest('.item').
        toggleClass(response.option);
      }
    });

    var formActionRegex = _.mapValues(blist.field_action_urls, function(url) {
      return new RegExp(url.
        replace(':fieldset', '(\\d+)').
        replace(':index', '\\d+'). // This is the one we want to change, so don't capture group.
        replace(':field', '(\\w+)').
        replace(':option', '(\\w+)').
        replace(':direction', '(\\w+)')
      );
    });

    var buildFormAction = function(url, specifics) {
      // Determine which url we're looking at.
      var correctKey = _.findKey(formActionRegex, function(regex) {
        return regex.test(url);
      });

      // We don't care about fixing stuff if there's no :index component.
      if (!_.include(blist.field_action_urls[correctKey], ':index')) {
        return url;
      }

      // Figure out what the url is currently using for each component.
      var matches = url.match(formActionRegex[correctKey]);
      var parts = _.reject(blist.field_action_urls[correctKey].split('/'), function(part) {
        // We only care about the parts we captured.
        // We don't capture on :index, so ignore it.
        return part[0] !== ':' || part === ':index';
      });

      // Reconstruct the url from the abstract form using match captures.
      var action = _.clone(blist.field_action_urls[correctKey]);
      _.each(parts, function(part, index) {
        action = action.replace(part, matches[index + 1]);
      });

      // Fix the :index.
      action = action.replace(':index', specifics.index);
      return action;
    };

    $('.moveButton').adminButton({
      callback: function(response, $line) {
        $line.fadeOut(300, function() {
          if (response.direction == 'up') {
            $line.prev().before($line);
          } else {
            $line.next().after($line);
          }
          $line.fadeIn();

          $line.closest('tbody').
          find('.moveButton').
          removeClass('disabled').
          end().
          find('tr.item:first .upButton').
          addClass('disabled').
          end().
          find('tr.item:last .downButton').
          addClass('disabled');

          // Fix the indices in the form action urls.
          $line.parents('table').find('tr.item td.actions').each(function(index) {
            $(this).find('form').each(function() {
              var $action = $(this);
              var newAction = buildFormAction($action.attr('action'), { index: index });
              $action.attr('action', newAction);
            });
          });
        });
      }
    });

    $('.metadataFieldTable td.options').editableList({
      saveCallback: function($container, data) {
        var $row = $container.closest('tr');
        var error = function(text) {
          $container.removeClass('modified').addClass('error').
          find('.errorText').text(text);
        };
        $.socrataServer.makeRequest({
          url: '/admin/metadata/save_field',
          type: 'PUT',
          data: JSON.stringify({
            fieldset: $row.data('fieldset'),
            field: $row.data('fieldname'),
            options: data
          }),
          success: function(response) {
            $container.removeClass('modified error');
            if (response.error) {
              error(response.message);
            }
          },
          error: error
        });
      }
    });

    $('.customFields .requiredCheckbox').uniform();
  });

})();
