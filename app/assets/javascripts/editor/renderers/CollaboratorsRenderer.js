(function() {
  'use strict';

  var socrata = window.socrata;
  var storyteller = socrata.storyteller;

  /**
   * @class CollaboratorsRenderer
   * Renders a modal that contains the list of collaborators for the current story.
   * The user is provided several editing actions, such as additions, removals, and changes.
   */
  function CollaboratorsRenderer() {
    var t = I18n.t;
    var debouncedHandleKeys;
    var $collaborators;
    var $saveButton;
    var $alreadyAddedWarning;
    var $userHasNoAccountWarning;

    // A mapping of email to user details (result of /api/users/4x4.json).
    // Changing this _must_ be followed with a call to updateUi.
    // See fetchUserThenUpdateUi.
    var userDetailsCache = {};

    compileDOM();
    attachEvents();

    /**
     * Public Methods
     */

    /**
     * @function destroy
     * @description
     * Removes all attached events to this instance of CollaboratorsRenderer
     */
    this.destroy = function() {
      detachEvents();
      $collaborators.remove();
    };

    /**
     * Private Methods
     */

    function template() {
      return (
          '<div>' +
            '<div>' +
              '<h2 class="modal-input-label">{0}</h2>'.format(t('editor.collaborators.modal.invite_collaborators')) +
              '<div class="modal-input-group">' +
                '<div class="collaborators-email-input-wrapper">' +
                  '<input name="collaborators-email" type="email" class="modal-input" placeholder="{0}">'.format(t('editor.collaborators.modal.email_placeholder')) +
                  '<button class="btn btn-transparent btn-busy"><span></span></button>' +
                '</div>' +
                '<div class="modal-radio-group">' +
                  '<div class="alert warning-bar hidden already-added"><p><span class="icon-warning"></span></p><p>{0}</p></div>'.format(t('editor.collaborators.modal.errors.already_added')) +
                  '<div class="alert warning-bar hidden user-has-no-account"><p><span class="icon-warning"></span></p><p>{0}</p></div>'.format(t('editor.collaborators.modal.errors.user_has_no_account')) +
                  '<h2 class="modal-input-label">{0}</h2>'.format(t('editor.collaborators.modal.access_level')) +
                  '<ul>' +
                    '<li>' +
                      '<label>' +
                        '<input type="radio" value="viewer" name="access-levels" id="access-level-viewer" checked>' +
                        '<div class="radio-label-title">{0}</div>'.format(t('editor.collaborators.modal.viewer')) +
                        '<div class="radio-label-subtitle"><small>{0}</small></div>'.format(t('editor.collaborators.modal.viewer_description')) +
                      '</label>' +
                    '</li>' +
                    '<li>' +
                      '<label>' +
                        '<input type="radio" value="contributor" name="access-levels" id="access-level-contributor">' +
                        '<div class="radio-label-title">{0}</div>'.format(t('editor.collaborators.modal.contributor')) +
                        '<div class="radio-label-subtitle"><small>{0}</small></div>'.format(t('editor.collaborators.modal.contributor_description')) +
                      '</label>' +
                    '</li>' +
                    '<li>' +
                      '<label class="disabled">' +
                        '<input type="radio" value="owner" name="access-levels" id="access-level-owner" disabled>' +
                        '<div class="radio-label-title">{0}</div>'.format(t('editor.collaborators.modal.owner')) +
                        '<div class="radio-label-subtitle"><small>{0}</small></div>'.format(t('editor.collaborators.modal.owner_description')) +
                        '<div class="radio-label-subtitle alert info"><small><span class="icon-info-inverse"></span>{0}</small></div>'.format(t('editor.collaborators.modal.licenses')) +
                      '</label>' +
                    '</li>' +
                  '</ul>' +
                '</div>' +
                '<button class="btn-default" data-action="{0}" disabled>{1}</button>'.format(Actions.COLLABORATORS_ADD, t('editor.collaborators.modal.add_contributor')) +
              '</div>' +
            '</div>' +
            '<div>' +
              '<h2 class="modal-input-label">{0}</h2>'.format(t('editor.collaborators.modal.who_has_access')) +
              '<table class="table-borderless">' +
                '<thead>' +
                  '<tr>' +
                    '<th>{0}</th>'.format(t('editor.collaborators.modal.collaborator')) +
                    '<th>{0}</th>'.format(t('editor.collaborators.modal.access_level')) +
                  '</tr>' +
                '</thead>' +
                '<tbody>' +
                '</tbody>' +
              '</table>' +
            '</div>' +
            '<div class="modal-button-group r-to-l">' +
              '<button class="btn-default btn-inverse" data-action="{0}">{1}</button>'.format(Actions.COLLABORATORS_CANCEL, t('editor.modal.buttons.cancel')) +
              '<button class="btn-primary" data-action="{0}" disabled><span>{1}</span></button>'.format(Actions.COLLABORATORS_SAVE, t('editor.modal.buttons.save')) +
            '</div>' +
          '</div>'
      ).format({
        // intentionally not a link, this should be pasted into an email by the user (not followed by them).
        domain: window.location.hostname
      });
    }

    function templateAccessLevel(role) {
      return (
        '<div class="modal-select">' +
          '<select data-action="{0}">'.format(Actions.COLLABORATORS_CHANGE) +
            '<option value="{0}"{1}>{2}</option>'.format('owner', isStoriesOrAdministratorRole(role) ? '' : ' disabled', t('editor.collaborators.modal.owner')) +
            '<option value="{0}">{1}</option>'.format('contributor', t('editor.collaborators.modal.contributor')) +
            '<option value="{0}">{1}</option>'.format('viewer', t('editor.collaborators.modal.viewer')) +
          '</select>' +
        '</div>'
      );
    }

    function templateRemove() {
      return (
        '<button ' +
          'class="btn-default btn-inverse"' +
          'data-action="{0}"'.format(Actions.COLLABORATORS_REMOVE) +
        '>{0}</button>'.format(t('editor.collaborators.modal.remove'))
      );
    }

    function templateContributor(contributor) {
      return (
        '<td>{displayName}</td>'.format(contributor) +
        '<td>{0}</td>'.format(templateAccessLevel(contributor.roleName)) +
        '<td>{0}</td>'.format(templateRemove)
      );
    }

    function templateContributorOnlyEmail(contributor) {
      return (
        '<td>{email}</td>'.format(contributor) +
        '<td>{0}</td>'.format(templateAccessLevel(contributor.roleName)) +
        '<td>{0}</td>'.format(templateRemove)
      );
    }

    function templateContributorAndEmail(contributor) {
      return (
        '<td>{displayName}, &lt;{email}&gt;</td>'.format(contributor) +
        '<td>{0}</td>'.format(templateAccessLevel(contributor.roleName)) +
        '<td>{0}</td>'.format(templateRemove)
      );
    }

    function templateStaticContributor(contributor) {
      return [
        '<td class="static">{displayName}</td>',
        '<td class="static" colspan="2">{accessLevel}</td>'
      ].join().format(contributor);
    }

    function templateStaticContributorAndEmail(contributor) {
      return [
        '<td class="static">{displayName}, &lt;{email}&gt;</td>',
        '<td class="static" colspan="2">{accessLevel}</td>'
      ].join().format(contributor);
    }

    function templateNoCollaborators() {
      return (
        '<td class="collaborators-empty" colspan="3">{0}</td>'.format(t('editor.collaborators.modal.no_collaborators'))
      );
    }

    function templateErrorMessage() {
      return (
        '<span class="errors">{error}</span>'
      );
    }

    function compileDOM() {
      $collaborators = $('<div>', { id: 'collaborators-modal' }).modal({
        title: t('editor.collaborators.modal.heading'),
        content: $(template())
      });

      $saveButton = $collaborators.find('[data-action="{0}"]'.format(Actions.COLLABORATORS_SAVE));
      $alreadyAddedWarning = $collaborators.find('.already-added');
      $userHasNoAccountWarning = $collaborators.find('.user-has-no-account');

      $(document.body).append($collaborators);
    }

    function attachEvents() {
      debouncedHandleKeys = _.debounce(handleKeys, 250);

      storyteller.collaboratorsStore.addChangeListener(render);
      $collaborators.on('click', '[data-action]', dispatchActions);
      $collaborators.on('modal-dismissed', handleModalDismissed);
      $collaborators.on('change', 'td select', dispatchActions);
      $collaborators.on('input', 'input[type="email"]', debouncedHandleKeys);
      $collaborators.on('change', 'input[type="radio"]', debouncedHandleKeys);
    }

    function detachEvents() {
      $collaborators.off('click', '[data-action]', dispatchActions);
      $collaborators.off('modal-dismissed', handleModalDismissed);
      $collaborators.off('change', 'td select', dispatchActions);
      $collaborators.off('input', 'input[type="email"]', debouncedHandleKeys);
      $collaborators.off('change', 'input[type="radio"]', debouncedHandleKeys);

      storyteller.collaboratorsStore.removeChangeListener(render);
    }

    function toggleOwnerSelection(enabled) {
      $collaborators.
        find('.modal-radio-group ul li:last-child label').
        toggleClass('disabled', !enabled);
      $collaborators.
        find('.modal-radio-group ul li:last-child input').
        prop('disabled', !enabled);
    }

    function toggleAddCollaboratorsButton(enabled) {
      $collaborators.
        find('.modal-input-group .btn-default').
        prop('disabled', !enabled);
    }

    function toggleAlreadyAddedWarning(enabled) {
      $alreadyAddedWarning.toggleClass('hidden', !enabled);
    }

    function toggleUserHasNoAccountWarning(enabled) {
      $userHasNoAccountWarning.toggleClass('hidden', !enabled);
    }

    function getUserOrNull(email) {
      return Promise.resolve($.getJSON('/api/search/users.json?q={0}'.format(email))).then(function(data) {
        return _.get(data, 'results[0]', null);
      });
    }

    function isStoriesOrAdministratorRole(role) {
      return _.includes(['publisher_stories', 'editor_stories', 'administrator'], role);
    }

    // Fetches details of the given user and populates userDetailsCache with the result.
    // Then, call updateUi.
    function fetchUserThenUpdateUi(email) {
      if (!_.has(userDetailsCache, email)) {
        getUserOrNull(email).
          catch(_.constant(null)). // If the request fails, assume user does not exist.
          then(function(userDetails) {
            userDetailsCache[email] = userDetails;
            updateUi();
          });
      }
    }

    function invalidateUserDetailsCache() {
      userDetailsCache = {};
    }

    // Updates the state of the UI (button enabled/disabled states,
    // warning visibilities, etc).
    function updateUi() {
      var value = getValueInInputBox();
      var accessLevel = $collaborators.find('option:selected').val();
      var collaborator = {email: value, accessLevel: accessLevel};

      var hasCollaborator = storyteller.collaboratorsStore.hasCollaborator(collaborator);
      var hasUserDetails = _.has(userDetailsCache, value);
      var userDetails = userDetailsCache[value]; // Updated async, we'll get called again if it changes.
      var roleName = _.get(userDetails, 'roleName');

      var validEmail = getValidEmailInInputBoxOrNull();
      $collaborators.find('.collaborators-email-input-wrapper').toggleClass('busy', !!validEmail && !hasUserDetails);

      if (hasCollaborator) {
        toggleAlreadyAddedWarning(true);
        toggleUserHasNoAccountWarning(false);
        toggleOwnerSelection(false);
        toggleAddCollaboratorsButton(false);
      } else if (hasUserDetails && validEmail) {
        if (isStoriesOrAdministratorRole(roleName)) {
          // Licensed stories user.
          toggleAlreadyAddedWarning(false);
          toggleUserHasNoAccountWarning(false);
          toggleOwnerSelection(true);
          toggleAddCollaboratorsButton(true);
        } else if (userDetails) {
          // Non stories, but still a registered user.
          toggleAlreadyAddedWarning(false);
          toggleUserHasNoAccountWarning(false);
          toggleOwnerSelection(false);
          toggleAddCollaboratorsButton(
            $collaborators.
              has('li:last-child input:not(:checked)').length === 1
          );
        } else {
          // Unroled user. Not allowed.
          toggleAlreadyAddedWarning(false);
          toggleUserHasNoAccountWarning(true);
          toggleOwnerSelection(false);
          toggleAddCollaboratorsButton(false);
        }
      } else {
        toggleAlreadyAddedWarning(false);
        toggleUserHasNoAccountWarning(false);
        toggleOwnerSelection(false);
        toggleAddCollaboratorsButton(false);
      }
    }

    // Returns whatever valid or invalid value there exists
    // in the input box.
    function getValueInInputBox() {
      var $input = $collaborators.find('input[type="email"]');
      return $input.val();
    }

    // If there's a valid email in the input box, return it.
    // Otherwise, return null.
    function getValidEmailInInputBoxOrNull() {
      var value = getValueInInputBox();
      var isValidEmail = Constants.VALID_EMAIL_PATTERN.test(value);

      return isValidEmail ? value : null;
    }

    // User stopped typing into input box. Cause rest of UI to be
    // updated.
    function handleKeys() {
      var validEmail = getValidEmailInInputBoxOrNull();

      if (validEmail) {
        fetchUserThenUpdateUi(validEmail);
      }

      updateUi();
    }

    function handleModalDismissed() {
      var shouldCancel = true;
      var isCollaboratorsModalOpen = storyteller.collaboratorsStore.isOpen();
      var isCollaboratorsModalDirty = storyteller.collaboratorsStore.isDirty();

      if (isCollaboratorsModalOpen && isCollaboratorsModalDirty) {
        /* eslint-disable no-alert */
        shouldCancel = confirm(
          I18n.t('editor.settings_panel.warnings.unsaved_collaborators_changes')
        );
        /* eslint-enable no-alert */
      }

      if (shouldCancel) {
        toggleAlreadyAddedWarning(false);
        storyteller.dispatcher.dispatch({
          action: Actions.COLLABORATORS_CANCEL
        });
      }
    }

    function dispatchActions(event) {
      var email;
      var accessLevel;
      var dispatcher = storyteller.dispatcher;
      var $target = $(event.target);
      var action = $target.attr('data-action');
      var $tr = $target.closest('tr');
      var collaborator = {accessLevel: $tr.attr('data-access-level')};

      if ($tr.attr('data-email')) {
        collaborator.email = $tr.attr('data-email');
      }

      if ($tr.attr('data-uid')) {
        collaborator.uid = $tr.attr('data-uid');
      }

      switch (action) {
        case Actions.COLLABORATORS_CANCEL:
        case Actions.COLLABORATORS_SAVE:
          dispatcher.dispatch({
            action: action
          });
          break;
        case Actions.COLLABORATORS_MARK_REMOVAL:
        case Actions.COLLABORATORS_UNMARK_REMOVAL:
        case Actions.COLLABORATORS_REMOVE:
          dispatcher.dispatch({
            action: action,
            collaborator: collaborator
          });
          break;
        case Actions.COLLABORATORS_ADD:
          email = $collaborators.find('input[type="email"]').val();
          accessLevel = $collaborators.find('.modal-radio-group input:checked').val();

          dispatcher.dispatch({
            action: Actions.COLLABORATORS_ADD,
            collaborator: {
              email: email,
              accessLevel: accessLevel
            }
          });
          break;
        case Actions.COLLABORATORS_CHANGE:
          accessLevel = $tr.attr('data-access-level');
          var newAccessLevel = $tr.find('option:selected').val();
          var hasChanged = accessLevel !== newAccessLevel;

          if (hasChanged || $target.is('button')) {
            collaborator.accessLevel = newAccessLevel;

            dispatcher.dispatch({
              action: Actions.COLLABORATORS_CHANGE,
              collaborator: collaborator
            });
          }
          break;
      }
    }

    function render() {
      var isOpen = storyteller.collaboratorsStore.isOpen();
      var isSaving = storyteller.collaboratorsStore.isSaving();
      var isDirty = storyteller.collaboratorsStore.isDirty();
      var collaborators = storyteller.collaboratorsStore.getCollaborators();

      if (isSaving) {
        toggleLoadingButton(true);
        toggleSaveButton(false);
        saveCollaborators(collaborators);
      } else {
        toggleSaveButton(isDirty);
        toggleModal(isOpen);
        resetInputs();

        if (collaborators.length > 0) {
          renderCollaborators(collaborators);
        } else {
          renderNoCollaborators();
        }
      }

      if (isOpen) {
        updateUi();
      } else {
        invalidateUserDetailsCache();
      }

      renderErrorMessage();
    }

    function renderCollaborator(collaborator) {
      var buttonText;
      var buttonAction;
      var subtemplate;
      var $collaborator = $('<tr>', {
        'class': collaborator.state.current,
        'data-access-level': collaborator.accessLevel
      });
      var selectDisabled = false;

      if (collaborator.email) {
        $collaborator.attr('data-email', collaborator.email);
      }

      if (collaborator.uid) {
        $collaborator.attr('data-uid', collaborator.uid);
      }

      switch (collaborator.state.current) {
        case 'added':
          buttonAction = Actions.COLLABORATORS_REMOVE;
          buttonText = t('editor.collaborators.modal.remove');
          break;
        case 'marked':
          buttonAction = Actions.COLLABORATORS_UNMARK_REMOVAL;
          buttonText = t('editor.collaborators.modal.keep');
          selectDisabled = true;
          break;
        case 'changed':
        case 'loaded':
          buttonAction = Actions.COLLABORATORS_MARK_REMOVAL;
          buttonText = t('editor.collaborators.modal.remove');
          break;
      }

      if (collaborator.email && collaborator.displayName) {
        subtemplate = templateContributorAndEmail(collaborator);
      } else if (collaborator.email) {
        subtemplate = templateContributorOnlyEmail(collaborator);
      } else {
        subtemplate = templateContributor(collaborator);
      }

      var $subtemplate = $(subtemplate);

      $subtemplate.
        find('select').
        prop('disabled', selectDisabled);

      $subtemplate.
        find('[value="{0}"]'.format(collaborator.accessLevel)).
        prop('selected', true);

      $subtemplate.
        find('button').
        attr('data-action', buttonAction).
        text(buttonText);

      return $collaborator.append($subtemplate);
    }

    function renderStaticCollaborator(collaborator) {
      var subtemplate;
      var $collaborator = $('<tr>', {
        'class': collaborator.state.current
      });

      if (collaborator.email) {
        subtemplate = templateStaticContributorAndEmail({
          displayName: collaborator.displayName,
          email: collaborator.email,
          accessLevel: t('editor.collaborators.modal.{0}'.format(collaborator.accessLevel))
        });
      } else {
        subtemplate = templateStaticContributor({
          displayName: collaborator.displayName,
          accessLevel: t('editor.collaborators.modal.{0}'.format(collaborator.accessLevel))
        });
      }

      return $collaborator.append($(subtemplate));
    }

    function renderCollaborators(collaborators) {
      var staticCollaborators = _.filter(collaborators, function(collaborator) {
        var primaryOwnerUid = storyteller.storyStore.getStoryPrimaryOwnerUid();
        return collaborator.uid === window.currentUser.id || collaborator.uid === primaryOwnerUid;
      });
      var editableCollaborators = _.difference(collaborators, staticCollaborators);

      $collaborators.find('tbody').
        empty().
        append(editableCollaborators.map(renderCollaborator)).
        append(staticCollaborators.map(renderStaticCollaborator));
    }

    function renderNoCollaborators() {
      $collaborators.find('tbody').
        empty().
        append(templateNoCollaborators());
    }

    function renderErrorMessage() {
      var hasErrors = storyteller.collaboratorsStore.hasErrors();
      var errorMessage = storyteller.collaboratorsStore.getErrorMessage();

      if (hasErrors) {
        var error = templateErrorMessage().format({error: errorMessage});
        $collaborators.find('.modal-header-group').
          append($(error));
      } else {
        $collaborators.find('.modal-header-group .errors').remove();
      }
    }

    function resetInputs() {
      $collaborators.find('.modal-input-group input[type="email"]').val('');
      $collaborators.find('.modal-input-group button').prop('disabled', true);
      $collaborators.find('.modal-radio-group ul li:first-child input').prop('checked', true);
      $collaborators.find('.modal-radio-group ul li:last-child label').addClass('disabled');
      $collaborators.find('.modal-radio-group ul li:last-child input').prop('disabled', true);
    }

    function toggleModal(show) {
      $collaborators.trigger(
        show ? 'modal-open' : 'modal-close'
      );
    }

    function toggleSaveButton(enable) {
      $saveButton.prop('disabled', !enable);
    }

    function toggleLoadingButton(loading) {
      $saveButton.toggleClass('btn-busy', loading);
    }

    function saveCollaborators(collaborators) {
      function findByState(state) {
        return function(collaborator) {
          return collaborator.state.current === state;
        };
      }

      var promises = [];

      var add = collaborators.filter(findByState('added'));
      var addCollaborators = storyteller.collaboratorsDataProvider.addCollaborators.bind(storyteller.collaboratorsDataProvider);
      promises = promises.concat(addCollaborators(add));

      var remove = collaborators.filter(findByState('marked'));
      var removeCollaborator = storyteller.collaboratorsDataProvider.removeCollaborator;
      promises = promises.concat(remove.map(removeCollaborator));

      var change = collaborators.filter(findByState('changed'));
      var changeCollaborator = storyteller.collaboratorsDataProvider.changeCollaborator;
      promises = promises.concat(change.map(changeCollaborator));

      Promise.all(promises).
        then(saveCollaboratorsSuccess).
        catch(saveCollaboratorsError);
    }

    function saveCollaboratorsSuccess() {
      $saveButton.
        removeClass('btn-busy').
        removeClass('btn-primary').
        addClass('btn-success');

      $saveButton.find('span').text(t('editor.modal.buttons.saved'));

      storyteller.collaboratorsDataProvider.getCollaborators().
        then(function(collaborators) {
          storyteller.storyCollaborators = collaborators;

          setTimeout(function() {
            storyteller.dispatcher.dispatch({
              action: Actions.COLLABORATORS_CANCEL
            });

            $saveButton.
              removeClass('btn-success').
              addClass('btn-primary');
            $saveButton.find('span').text(t('editor.modal.buttons.save'));
          }, 700);
        });
    }

    function saveCollaboratorsError(response) {
      var isXMLRequest = response instanceof XMLHttpRequest;
      var message = isXMLRequest ? response.getResponseHeader('X-Error-Message') : response;
      var errorReportingLabel = 'CollaboratorsRenderer#_saveCollaboratorsError';

      $saveButton.removeClass('btn-busy');

      if (/email/i.test(message) && /invalid/i.test(message)) {
        message = t('editor.collaborators.modal.errors.invalid_email');
      } else {
        storyteller.airbrake.notify(response.responseText);
        message = t('editor.collaborators.modal.errors.unknown_error');
      }

      storyteller.dispatcher.dispatch({
        action: Actions.COLLABORATORS_ERROR,
        error: message,
        errorReporting: {
          message: '{0}: {1} (story: {2}, status: {3})'.
            format(errorReportingLabel, message, storyteller.userStoryUid, message.status),
          label: errorReportingLabel
        }
      });
    }
  }

  storyteller.CollaboratorsRenderer = CollaboratorsRenderer;
})();
