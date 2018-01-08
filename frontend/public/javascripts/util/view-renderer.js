(function() {

  //
  //
  // Helper methods.
  //
  //

  function throwErrorIfViewIsNotInstanceOfReadOnlyView(view) {

    if (view.constructor.name !== 'ReadOnlyView') {
      throw new Error('The `view` parameter must be an instance of `ReadOnlyView`.');
    }
  }

  function throwErrorIfViewIsNotInstanceOfReadOnlyViewOrIsNotValid(view) {
    throwErrorIfViewIsNotInstanceOfReadOnlyView(view);

    if (!view.isValid()) {
      throw new Error('The `view` parameter is not a valid instance of `ReadOnlyView`.');
    }
  }

  //
  //
  // Implementation begins here!
  //
  //

  ViewRenderer = function() {
    throw new Error('The `ViewRenderer` class is a container for static methods and should not be instantiated.');
  };

  /**
   * @param view - An instance of ReadOnlyView.
   *
   * @return - The host, domain and port representing the origin of the view.
   */
  ViewRenderer.origin = function(view) {
    throwErrorIfViewIsNotInstanceOfReadOnlyViewOrIsNotValid(view);

    var location = document.location;
    var protocol = _.get(location, 'protocol', '');
    var domain = view.getDomainCName();
    var port = _.get(location, 'port', '');

    if (!_.isEmpty(protocol)) {
      protocol = protocol + '//';
    }

    if (!_.isEmpty(port)) {
      port = ':' + port;
    }

    return protocol + domain + port;
  };

  ViewRenderer.fullUrl = function(view) {
    throwErrorIfViewIsNotInstanceOfReadOnlyViewOrIsNotValid(view);

    var urlComponents;

    if (view.displayTypeIsStory()) {
      urlComponents = ['stories/s', view.getId()];
    } else if (_.isUndefined(view.getName())) {
      urlComponents = ['d', view.getId()];
    } else {
      urlComponents = [view.getCategory() || 'dataset', view.getName(), view.getId()];
    }

    return ViewRenderer.origin(view) + '/' + urlComponents.map(encodeURIComponent).join('/');
  };

  ViewRenderer.shortUrl = function(view) {
    throwErrorIfViewIsNotInstanceOfReadOnlyViewOrIsNotValid(view);

    var urlComponents;

    if (view.displayTypeIsStory()) {
      urlComponents = ['stories/s', view.getId()];
    } else {
      urlComponents = ['d', view.getId()];
    }

    return ViewRenderer.origin(view) + '/' + urlComponents.map(encodeURIComponent).join('/');
  };

  ViewRenderer.apiUrl = function(view) {
    throwErrorIfViewIsNotInstanceOfReadOnlyViewOrIsNotValid(view);

    return ViewRenderer.origin(view) + '/api/views/' + view.getId();
  };

  ViewRenderer.downloadUrl = function(view, type) {
    var ext = type.toLowerCase().split(' ')[0];
    var isGeoExport = GeoHelpers.isGeoDataset(view) && ext !== 'json' && ext !== 'csv';

    if (isGeoExport) {
      return '/api/geospatial/{0}?method=export&format={1}'.format(this.id, type);
    }

    var bom = (type == 'CSV for Excel' || type == 'CSV for Excel (Europe)') ? '&bom=true' : '';
    var format = (type == 'CSV for Excel' || type == 'CSV for Excel (Europe)') ? '&format=true' : '';
    var delimiter = (type == 'CSV for Excel (Europe)') ? '&delimiter=;' : '';
    return '/api/views/{0}/rows.{1}?accessType=DOWNLOAD{2}{3}{4}'.format(this.id, ext, bom, format, delimiter);
  };

  /**
   * Assign to `window` or export according to which context (the browser or node.js) wer are in.
   */

  if (blist.inBrowser) {
    this.ViewRenderer = ViewRenderer;
  } else {
    module.exports = ViewRenderer;
  }
})();
