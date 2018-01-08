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

  function makeCoreServerRequest(requestConfig) {

    return new Promise(function(resolve, reject) {

      function handleError(jqXHR) {
        reject({
          status: parseInt(jqXHR.status, 10),
          message: jqXHR.statusText,
          detail: jqXHR.responseJSON || jqXHR.responseText || '<No response>'
        });
      }

      $.ajax({
        url: _.get(requestConfig, 'url', new Error('The `url` parameter is required.')),
        headers: _.merge(
          { 'X-Socrata-Federation': 'Honey Badger' },
          _.get(requestConfig, 'headers', {})
        ),
        type: _.get(requestConfig, 'method', new Error('The `method` parameter is required.')),
        contentType: _.get(requestConfig, 'contentType', undefined),
        data: _.get(requestConfig, 'data', undefined),
        success: resolve,
        error: handleError
      });
    });
  }

  function getViewById(viewId) {

    return makeCoreServerRequest(
      {
        url: '/api/views/' + viewId + '.json',
        method: 'GET'
      }
    );
  }

  function makeCoreServerRequestAndReturnFreshView(requestConfig) {

    return makeCoreServerRequest(requestConfig).
      then(function() {
        return new ReadOnlyView(getViewById(requestConfig.view.getId()));
      });
  }

  //
  //
  // Implementation begins here!
  //
  //

  ViewPersistor = function() {
    throw new Error('The `ViewPersistor` class is a container for static methods and should not be instantiated.');
  };

  //
  //
  // Modify a view as a coherent entity.
  //
  //

  /**
   * @param view - An instance of ReadOnlyView.
   * @param createOnNewBackend - Whether or not to create an NBE-only view.
   *
   * @return - A new instance of ReadOnlyView reflecting the requested change.
   */
  ViewPersistor.create = function(view, createOnNewBackend) {
    throwErrorIfViewIsNotInstanceOfReadOnlyView(view);

    return makeCoreServerRequest({
      view: view,
      url: (createOnNewBackend) ? '/views/?nbe=true' : '/views',
      method: 'POST',
      contentType: 'application/json',
      data: view.serialize()
    }).
      then(function(createdView) {
        return Promise.resolve(new ReadOnlyView(createdView));
      });
  };

  /**
   * @param view - An instance of ReadOnlyView.
   *
   * @return - A new instance of ReadOnlyView reflecting the requested change.
   */
  ViewPersistor.update = function(view) {
    throwErrorIfViewIsNotInstanceOfReadOnlyViewOrIsNotValid(view);

    if (!view.isPublic()) {
      return Promise.resolve(view);
    }

    return makeCoreServerRequestAndReturnFreshView({
      view: view,
      url: '/views/' + view.getId() + '.json',
      method: 'PUT',
      contentType: 'application/json',
      data: view.serialize()
    });
  };

  /**
   * @param view - An instance of ReadOnlyView.
   *
   * @return - True on success.
   */
  ViewPersistor.delete = function(view) {
    throwErrorIfViewIsNotInstanceOfReadOnlyViewOrIsNotValid(view);

    return makeCoreServerRequest({
      view: view,
      url: '/api/views/' + view.getId() + '.json',
      method: 'DELETE'
    }).
      then(function() {
        return Promise.resolve(true);
      });
  };

  //
  //
  // Modify individual properties of a view using RPC methods.
  //
  //

  /**
   * @param view - An instance of ReadOnlyView.
   *
   * @return - A new instance of ReadOnlyView reflecting the requested change.
   */
  ViewPersistor.makePublic = function(view) {
    throwErrorIfViewIsNotInstanceOfReadOnlyViewOrIsNotValid(view);

    if (view.isPublic()) {
      return Promise.resolve(view);
    }

    var permissionValue = (view.displayTypeIsForm()) ? 'public.add' : 'public.read';

    return makeCoreServerRequestAndReturnFreshView({
      view: view,
      url: '/views/' + view.getId() + '.json?method=setPermission&value=' + permissionValue,
      method: 'PUT'
    });
  };

  /**
   * @param view - An instance of ReadOnlyView.
   *
   * @return - A new instance of ReadOnlyView reflecting the requested change.
   */
  ViewPersistor.makePrivate = function(view) {
    throwErrorIfViewIsNotInstanceOfReadOnlyViewOrIsNotValid(view);

    if (!view.isPublic()) {
      return Promise.resolve(view);
    }

    return makeCoreServerRequestAndReturnFreshView({
      view: view,
      url: '/views/' + view.getId() + '.json?method=setPermission&value=private',
      method: 'PUT'
    });
  };

  /**
   * @param view - An instance of ReadOnlyView.
   * @param userId - The four-by-four of the user to which we are transferring ownership.
   *
   * @return - A new instance of ReadOnlyView reflecting the requested change.
   */
  ViewPersistor.changeOwner = function(view, userId) {
    throwErrorIfViewIsNotInstanceOfReadOnlyViewOrIsNotValid(view);

    return makeCoreServerRequestAndReturnFreshView({
      view: view,
      url: '/views/' + view.getId() + '.json?method=plagiarize&userId=' + userId,
      method: 'PUT'
    });
  };

  /**
   * @param view - An instance of ReadOnlyView.
   * @param grant - An object representing the grant to create on the specified view.
   *
   * @return - A new instance of ReadOnlyView reflecting the requested change.
   */
  ViewPersistor.createGrant = function(view, grant) {
    throwErrorIfViewIsNotInstanceOfReadOnlyViewOrIsNotValid(view);

    if (!view.hasGrant(grant)) {
      return Promise.resolve(view);
    }

    return makeCoreServerRequestAndReturnFreshView({
      view: view,
      url: '/views/' + view.getId() + '/grants',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(grant)
    });
  };

  /**
   * @param view - An instance of ReadOnlyView.
   * @param grant - An object representing the grant to be removed from the specified view.
   *
   * @return - A new instance of ReadOnlyView reflecting the requested change.
   */
  ViewPersistor.deleteGrant = function(view, grant) {
    throwErrorIfViewIsNotInstanceOfReadOnlyViewOrIsNotValid(view);

    if (!view.hasGrant(grant)) {
      return Promise.resolve(view);
    }

    return makeCoreServerRequestAndReturnFreshView({
      view: view,
      url: '/views/' + view.getId() + '/grants?method=delete',
      method: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify(grant)
    });
  };

  //
  //
  // Transition through the Publication Cycle.
  //
  //

  /**
   * @param view - An instance of ReadOnlyView.
   *
   * @return - A new instance of ReadOnlyView reflecting the requested change.
   */
  ViewPersistor.createDraft = function(view) {
    throwErrorIfViewIsNotInstanceOfReadOnlyViewOrIsNotValid(view);

    if (view.isDraft()) {
      return Promise.resolve(view);
    }

    return makeCoreServerRequest({
      view: view,
      url: '/api/views/' + view.getId() + '/publication.json?method=copy',
      method: 'POST'
    }).
      then(function(createdDraftView) {
        return new ReadOnlyView(createdDraftView);
      });
  };

  /**
   * @param view - An instance of ReadOnlyView.
   *
   * @return - A new instance of ReadOnlyView reflecting the requested change.
   */
  ViewPersistor.publishDraft = function(view) {
    throwErrorIfViewIsNotInstanceOfReadOnlyViewOrIsNotValid(view);

    if (view.isPublished()) {
      return Promise.resolve(view);
    }

    return makeCoreServerRequest({
      view: view,
      url: '/api/views/' + view.getId() + '/publication.json',
      method: 'POST'
    }).
      then(function(createdPublishedView) {
        return new ReadOnlyView(createdPublishedView);
      });
  };

  /**
   * @param view - An instance of ReadOnlyView.
   *
   * @return - True if the view is ready for a new publication operation
   *           to be applied to it, false if it is not. (Because, for
   *           example, there is some currently-outstanding asyncrhonous
   *           operation being applied to it).
   */
  ViewPersistor.viewIsReadyForPublicationOperation = function(view) {

    if (view.isOBE()) {

      if (view.getColumnsByDataType('location').length === 0) {
        return Promise.resolve(true);
      }

      return makeCoreServerRequest(
        {
          view: view,
          url: '/api/geocoding/' + view.getId() + '.json?method=pending'
        }
      ).
        then(function(response) {
          var publicationAvailable = _.get(response, 'view', 0) < 1;

          return Promise.resolve(publicationAvailable);
        });
    } else {

      return makeCoreServerRequest(
        {
          view: view,
          url: '/api/views/' + view.getId() + '/replication.json',
          method: 'GET'
        }
      ).
        then(function(response) {
          var publicationAvailable = _.get(response, 'asynchronous_computation_up_to_date', true);

          return Promise.resolve(publicationAvailable);
        });
    }
  };

  /**
   *
   * Backups
   *
   * These methods are NBE-only; archived copies of OBE datasets are just related views
   * created automatically as part of the publication cycle. As such, no API is needed
   * to create them and the ordinary delete view API call can be used to delete them).
   *
   */

  /**
   * @param view - An instance of ReadOnlyView.
   *
   * @return - A backup id for the backup just created.
   */
  ViewPersistor.createBackup = function(view) {
    throwErrorIfViewIsNotInstanceOfReadOnlyViewOrIsNotValid(view);

    if (view.getStorageBackend() !== ReadOnlyView.NBE) {
      throw new Error('The backups API is available only for NBE views.');
    }

    return makeCoreServerRequest({
      view: view,
      url: '/api/views/' + view.getId() + '/backups',
      method: 'POST'
    }).
      then(function(createdBackupId) {
        return Promise.resolve(createdBackupId);
      });
  };

  /**
   * @param view - An instance of ReadOnlyView.
   * @param backupId - An ISO-8601 date string identifying the backup to be deleted.
   *
   * @return - True on success.
   */
  ViewPersistor.deleteBackup = function(view, backupId) {
    throwErrorIfViewIsNotInstanceOfReadOnlyViewOrIsNotValid(view);

    if (view.getStorageBackend() !== ReadOnlyView.NBE) {
      throw new Error('The backups API is available only for NBE views.');
    }

    // Archived copy ids for NBE datasets are ISO-8601 timestamps.
    var validBackupIdPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

    if (!validBackupIdPattern.test(backupId)) {
      throw new Error('The `backupId` parameter is invalid.');
    }

    return makeCoreServerRequest({
      view: view,
      url: '/api/views/' + view.getId() + '/backups/' + backupId,
      method: 'DELETE'
    }).
      then(function() {
        return Promise.resolve(true);
      });
  };

  /**
   * Assign to `window` or export according to which context (the browser or node.js) wer are in.
   */

  if (blist.inBrowser) {
    this.ViewPersistor = ViewPersistor;
  } else {
    module.exports = ViewPersistor;
  }
})();
