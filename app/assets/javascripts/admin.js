//= require jquery
//= require jquery_ujs
//= require lodash
// NOTE: The usage of socrata-utils isn't obvious. It's String.format.
//= require socrata-utils/dist/socrata.utils
//= require_self

(function() {
  'use strict';

  function hookUpSectionCollapseCheckboxes() {
    $('.form-section').each(function() {
      var sectionName = this.getAttribute('data-section-name');
      var $formSection = $(this);
      var $associatedCheckbox = $('.form-section-checkbox[data-section-name="{0}"] input'.format(sectionName));

      // Toggle visibility of the form section.
      $associatedCheckbox.change(function() {
        if (this.checked) {
          $formSection.slideDown();
        } else {
          $formSection.slideUp();
        }

        // Disable/enable the section's inputs so they don't/do send data to the server.
        $formSection.find('input').prop('disabled', !this.checked);
      });

      // Ensure the visibility of the form section matches the initial checkbox state.
      $associatedCheckbox.triggerHandler('change');
      $formSection.stop(false, true); // But we don't want the animations.
    });
  }

  $(function() {
    $('.alert').delay(3000).slideUp();
    hookUpSectionCollapseCheckboxes();
  });
})();
