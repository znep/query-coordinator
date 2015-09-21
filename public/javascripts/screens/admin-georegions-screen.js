;
$(function() {
  var t = function(str, props) {
    return $.t('screens.admin.georegions.' + str, props);
  };
  var georegionsNS = blist.namespace.fetch('blist.georegions');
  var commonNS = blist.namespace.fetch('blist.common');
  var authenticityToken = $('.georegions-controls-custom [name="authenticity_token"]').value();
  var baseUrlPath = '/admin/geo/';

  $('.button', 'td.toggle-enabled, td.edit-action, td.remove-action').adminButton({
    callback: function(response, $line, $link) {
      alert('TBD');
    }
  });

  $('[data-action="add"]').click(function(event) {
    event.preventDefault();

    if ($(this).hasClass('disabled')) {
      return;
    }

    $('#selectDataset').jqmShow();
  });

  commonNS.georegionSelected = function(newGeoregionData) {
    $('#selectDataset').jqmHide();

    georegionsNS.georegions || (georegionsNS.georegions = []);

    var newGeoregionObj = _.extend({}, newGeoregionData);

    georegionsNS.georegions.push(newGeoregionObj);

    var georegionDirective = {
      '.item': {
        'georegion<-': {
          '.name': 'georegion.name',
          '.enabled-state': function(data) {
            return t(data.item.enabledFlag ? 'enabled_yes' : 'enabled_no')
          },
          '.enabled-state@class': function(data) {
            return 'enabled-state ' + (data.item.enabledFlag ? 'is-enabled' : 'is-disabled');
          },
          '.toggle-enabled-button@value': function(data) {
            if (data.item.enabledFlag) {
              return t('disable');
            } else {
              return t('enable');
            }
          },
          '.toggle-enabled-form@action': function(data) {
            var url = baseUrlPath + data.item.id;
            if (data.item.enabledFlag) {
              url += '/disable';
            } else {
              url += '/enable';
            }
            return url;
          },
          '[name="authenticity_token"]@value': function() { return authenticityToken; },
          '.edit-action-form@action': function(data) {
            return baseUrlPath + data.item.id;
          },
          '.remove-action-form@action': function(data) {
            return baseUrlPath + data.item.id;
          }
        }
      }
    };

    var newGeoregion = $.renderTemplate('georegions-table tbody', georegionsNS.georegions, georegionDirective);

    $('.georegions-custom tbody').html(newGeoregion);
    $('.georegions-custom tbody tr:last-child').effect('highlight', 10000);
    var enabledCount = _.filter(georegionsNS.georegions, _.property('enabledFlag')).length;
    var availableCount = georegionsNS.georegions.length;
    $('#georegions-page-subtitle').text(
      t('page_subtitle', {
        enabled_count: enabledCount,
        available_count: availableCount
      }));
  };


});
