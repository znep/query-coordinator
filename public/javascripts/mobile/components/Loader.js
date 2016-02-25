module.exports = function(container) {

  var _container = container;
  var _loaderContainer;

  this.render = function() {

    var loaderTemplate = $(
      '<div>',
      {
        'class': 'loading'
      }
    );

    _container.append(loaderTemplate);
    _loaderContainer = $(_container.find('.loading'));
  };

  this.showLoader = function() {
    _loaderContainer.addClass('visible');
  };

  this.hideLoader = function() {
    _loaderContainer.removeClass('visible');
  };

  this.render();
};
