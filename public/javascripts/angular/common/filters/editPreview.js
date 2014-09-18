(function() {
  'use strict';

  function EditPreviewFilter() {
    return function(editMode) {
      return editMode ? 'Preview' : 'Edit';
    }
  }

  angular.
    module('socrataCommon.filters').
    filter('editPreview', EditPreviewFilter);

})();
