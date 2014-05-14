// This model is intended to be an immutable reference to a View.
angular.module('socrataDatasetApp.models').factory('View', function(Dataset) {
  function View(id) {
    this.id = id;
  };

  View.prototype.getDataset = function() {
    //TODO real impl.
    return new Dataset('fake-ekaf');
  };

  return View;
});
