import $ from 'jquery';
import 'jquery-ujs';
import StorytellerUtils from '../StorytellerUtils';

import 'common/notifications/main';

function hookUpSectionCollapseCheckboxes() {
  $('.form-section').each(function() {
    var sectionName = this.getAttribute('data-section-name');
    var $formSection = $(this);
    var $associatedCheckbox = $(
      StorytellerUtils.format(
        '.form-section-checkbox[data-section-name="{0}"] input',
        sectionName
      )
    );

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
