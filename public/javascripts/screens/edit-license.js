;$(function() {

  // lol assertion
  if (!_.isArray(blist.licenses)) {
    return;
  }

  var $licenseId = $('#view_licenseId');

  // Initial value
  var initialValue = $licenseId.val();
  var initialCategory;
  _.each(blist.licenses, function(license) {
    if (license.id === initialValue) {
      initialCategory = license.id;
    } else if (_.isArray(license.licenses)) {
      if (_.detect(license.licenses, function(categorizedLicense) {
        return categorizedLicense.id === initialValue;
      })) {
        initialCategory = license.id;
      }
    }
  });

  // Do any categories exist?
  var $licenseType;
  var categoricalTypes = [];

  var get_name_for = function(license) {
    return license.selector_name || license.name || license.display_name;
  };

  var updateCascadingDropdown = function() {
    var licenseType = $licenseType.val();
    if (_.include(categoricalTypes, licenseType)) {
      $licenseId.empty();

      var category = _.detect(blist.licenses, function(license) {
        return license.id === licenseType;
      });

      _.each(category.licenses, function(license) {
        var $license = $.tag2({ _: 'option', contents: get_name_for(license), value: license.id });
        if (initialValue === license.id) {
          $license.attr('selected', 'selected');
        }
        $licenseId.append($license);
      });

      $licenseType.attr('name', '');
      $licenseId.attr('name', 'view[licenseId]');
      $licenseId.closest('.line').show().
        find('label').addClass('required');
    } else {
      $licenseType.attr('name', 'view[licenseId]');
      $licenseId.attr('name', '');
      $licenseId.closest('.line').hide();
    }

    $('select').uniform();
    if (_.isFunction($.deepGet($, 'uniform', 'update'))) {
      $.uniform.update();
    }
  };

  var requireAttribution = function() {
    var licenseId;
    if ($licenseId.filter(':visible').exists()) {
      licenseId = $licenseId.val();
    } else {
      licenseId = $licenseType.val();
    }

    var selectedLicense;
    _.each(blist.licenses, function(license) {
      if (license.id === licenseId) {
        selectedLicense = license;
      } else if (_.isArray(license.licenses)) {
        _.each((license.licenses || []), function(catLicense) {
          if (catLicense.id === licenseId) {
            selectedLicense = catLicense;
          }
        });
      }
    });

    var $viewAttribution = $('#view_attribution');
    if (selectedLicense.attribution_required) {
      $viewAttribution.siblings('label').addClass('required');
      $viewAttribution.rules('add', {
        required: true,
        messages: { required: ' ' + $.t('screens.edit_metadata.data_provider_required') }
      });
    } else {
      $viewAttribution.siblings('label').removeClass('required');
      $viewAttribution.rules("remove");
    }
  };

  blist.editLicenses = function() {
    $licenseId = $('#view_licenseId');

    if (_.any(blist.licenses, function(license) {
      return !_.isUndefined(license.licenses);
    })) {
      var $licenseTypeLine = $.tag2({
        _: 'div', 'class': 'line clearfix', contents: [
          { _: 'label', 'for': 'view_licenseType',
            contents: $.t('screens.edit_metadata.license_type') },
          { _: 'select', id: 'view_licenseType', name: 'view[licenseId]' }
        ]
      });

      $licenseType = $licenseTypeLine.find('select');
      _.each(blist.licenses, function(license) {
        if (license.licenses) {
          categoricalTypes.push(license.id);
        }
        var $license = $.tag2({ _: 'option', contents: license.name, value: license.id });
        if (license.id === initialCategory) {
          $license.attr('selected', 'selected');
        }
        $licenseType.append($license);
      });

      $licenseId.closest('.line').before($licenseTypeLine);
      $licenseId.empty();
    }

    if ($licenseType) {
      $licenseType.change(updateCascadingDropdown);
      updateCascadingDropdown();

      $licenseType.change(requireAttribution);
    }
    $licenseId.change(requireAttribution);
    requireAttribution();
  }
  if (blist.viewId) {
    blist.editLicenses();
  }
});
