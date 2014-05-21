angular.module('dataCards.models').factory('Page', function(ModelHelper, PageProvider) {
  function Page(id) {
    var _this = this;
    this.id = id;

    ModelHelper.addPropertyWithLazyDefault('description', this, function() {
      return PageProvider.getDescription(id);
    });
  };

  return Page;
});
