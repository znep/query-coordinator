import $ from 'jquery';
import _ from 'lodash';

import I18n from '../I18n';
import Actions from '../Actions';
import Constants from '../Constants';
import Environment from '../../StorytellerEnvironment';
import StorytellerUtils from '../../StorytellerUtils';
import CollaboratorsDataProvider from '../CollaboratorsDataProvider';
import { exceptionNotifier } from '../../services/ExceptionNotifier';
import { storyStore } from '../stores/StoryStore';
import { collaboratorsStore } from '../stores/CollaboratorsStore';
import { dispatcher } from '../Dispatcher';

/**
 * @class CollaboratorsRenderer
 * Renders a modal that contains the list of collaborators for the current story.
 * The user is provided several editing actions, such as additions, removals, and changes.
 */
export default function CollaboratorsRenderer() {
  var t = I18n.t;
  var debouncedHandleKeys;
  var $collaborators;
  var $saveButton;
  var $alreadyAddedWarning;
  var $userHasNoAccountWarning;
  var collaboratorsDataProvider = new CollaboratorsDataProvider();
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
    /* eslint-disable indent */
    return [
      '<form>',
        '<div>',
          StorytellerUtils.format('<h2 class="modal-input-label">{0}</h2>', t('editor.collaborators.modal.invite_collaborators')),
          '<div class="modal-input-group">',
            '<div class="collaborators-email-input-wrapper">',
              StorytellerUtils.format('<input name="collaborators-email" type="email" class="modal-input text-input" placeholder="{0}">', t('editor.collaborators.modal.email_placeholder')),
              '<button type="button" class="btn btn-transparent btn-busy"><span></span></button>',
            '</div>',
            '<div class="modal-radio-group">',
              StorytellerUtils.format('<div class="alert warning-bar hidden already-added"><p><span class="socrata-icon-warning"></span></p><p>{0}</p></div>', t('editor.collaborators.modal.errors.already_added')),
              StorytellerUtils.format('<div class="alert warning-bar hidden user-has-no-account"><p><span class="socrata-icon-warning"></span></p><p>{0}</p></div>', t('editor.collaborators.modal.errors.user_has_no_account')),
              StorytellerUtils.format('<h2 class="modal-input-label">{0}</h2>', t('editor.collaborators.modal.access_level')),
              '<ul>',
                '<li>',
                  '<label>',
                    '<input type="radio" value="viewer" name="access-levels" id="access-level-viewer" checked>',
                    StorytellerUtils.format('<div class="radio-label-title">{0}</div>', t('editor.collaborators.modal.viewer')),
                    StorytellerUtils.format('<div class="radio-label-subtitle"><small>{0}</small></div>', t('editor.collaborators.modal.viewer_description')),
                  '</label>',
                '</li>',
                '<li>',
                  '<label>',
                    '<input type="radio" value="contributor" name="access-levels" id="access-level-contributor">',
                    StorytellerUtils.format('<div class="radio-label-title">{0}</div>', t('editor.collaborators.modal.contributor')),
                    StorytellerUtils.format('<div class="radio-label-subtitle"><small>{0}</small></div>', t('editor.collaborators.modal.contributor_description')),
                  '</label>',
                '</li>',
                '<li>',
                  '<label class="disabled">',
                    '<input type="radio" value="owner" name="access-levels" id="access-level-owner" disabled>',
                    StorytellerUtils.format('<div class="radio-label-title">{0}</div>', t('editor.collaborators.modal.owner')),
                    StorytellerUtils.format('<div class="radio-label-subtitle"><small>{0}</small></div>', t('editor.collaborators.modal.owner_description')),
                    StorytellerUtils.format('<div class="radio-label-subtitle alert info"><small><span class="socrata-icon-info-inverse"></span>{0}</small></div>', t('editor.collaborators.modal.licenses')),
                  '</label>',
                '</li>',
              '</ul>',
            '</div>',
            StorytellerUtils.format('<button type="button" class="btn btn-default" data-action="{0}" disabled>{1}</button>', Actions.COLLABORATORS_ADD, t('editor.collaborators.modal.add_contributor')),
          '</div>',
        '</div>',
        '<div>',
          StorytellerUtils.format('<h2 class="modal-input-label">{0}</h2>', t('editor.collaborators.modal.who_has_access')),
          '<table class="table-borderless">',
            '<thead>',
              '<tr>',
                StorytellerUtils.format('<th>{0}</th>', t('editor.collaborators.modal.collaborator')),
                StorytellerUtils.format('<th>{0}</th>', t('editor.collaborators.modal.access_level')),
              '</tr>',
            '</thead>',
            '<tbody>',
            '</tbody>',
          '</table>',
        '</div>',
        '<div class="modal-button-group r-to-l">',
          StorytellerUtils.format('<button class="btn btn-default" type="button" data-action="{0}">{1}</button>', Actions.COLLABORATORS_CANCEL, t('editor.modal.buttons.cancel')),
          StorytellerUtils.format('<button type="submit" class="btn btn-primary btn-legacy" data-action="{0}" disabled><span>{1}</span></button>', Actions.COLLABORATORS_SAVE, t('editor.modal.buttons.save')),
        '</div>',
      '</form>'
    ].join('').format({
      // intentionally not a link, this should be pasted into an email by the user (not followed by them).
      domain: window.location.hostname
    });
    /* eslint-enable indent */
  }

  function templateAccessLevel(role) {
    /* eslint-disable indent */
    return [
      '<div class="modal-select">',
        StorytellerUtils.format('<select data-action="{0}">', Actions.COLLABORATORS_CHANGE),
          StorytellerUtils.format('<option value="{0}"{1}>{2}</option>', 'owner', isStoriesOrAdministratorRole(role) ? '' : ' disabled', t('editor.collaborators.modal.owner')),
          StorytellerUtils.format('<option value="{0}">{1}</option>', 'contributor', t('editor.collaborators.modal.contributor')),
          StorytellerUtils.format('<option value="{0}">{1}</option>', 'viewer', t('editor.collaborators.modal.viewer')),
        '</select>',
      '</div>'
    ].join('');
    /* eslint-enable indent */
  }

  function templateRemove() {
    /* eslint-disable indent */
    return [
      '<button ',
        'type="button" class="btn btn-default"',
        StorytellerUtils.format('data-action="{0}"', Actions.COLLABORATORS_REMOVE),
      StorytellerUtils.format('>{0}</button>', t('editor.collaborators.modal.remove'))
    ].join('');
    /* eslint-disable indent */
  }

  function templateContributor(contributor) {
    return [
      StorytellerUtils.format('<td>{displayName}</td>', contributor),
      StorytellerUtils.format('<td>{0}</td>', templateAccessLevel(contributor.roleName)),
      StorytellerUtils.format('<td>{0}</td>', templateRemove)
    ].join('');
  }

  function templateContributorOnlyEmail(contributor) {
    return [
      StorytellerUtils.format('<td>{email}</td>', contributor),
      StorytellerUtils.format('<td>{0}</td>', templateAccessLevel(contributor.roleName)),
      StorytellerUtils.format('<td>{0}</td>', templateRemove)
    ].join('');
  }

  function templateContributorAndEmail(contributor) {
    return [
      StorytellerUtils.format('<td>{displayName}, &lt;{email}&gt;</td>', contributor),
      StorytellerUtils.format('<td>{0}</td>', templateAccessLevel(contributor.roleName)),
      StorytellerUtils.format('<td>{0}</td>', templateRemove)
    ].join('');
  }

  function templateStaticContributor(contributor) {
    return StorytellerUtils.format([
      '<td class="static">{displayName}</td>',
      '<td class="static" colspan="2">{accessLevel}</td>'
    ].join(''), contributor);
  }

  function templateStaticContributorAndEmail(contributor) {
    return StorytellerUtils.format([
      '<td class="static">{displayName}, &lt;{email}&gt;</td>',
      '<td class="static" colspan="2">{accessLevel}</td>'
    ].join(''), contributor);
  }

  function templateNoCollaborators() {
    return (
      StorytellerUtils.format('<td class="collaborators-empty" colspan="3">{0}</td>', t('editor.collaborators.modal.no_collaborators'))
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

    $saveButton = $collaborators.find(
      StorytellerUtils.format('[data-action="{0}"]', Actions.COLLABORATORS_SAVE)
    );
    $alreadyAddedWarning = $collaborators.find('.already-added');
    $userHasNoAccountWarning = $collaborators.find('.user-has-no-account');

    $(document.body).append($collaborators);
  }

  function attachEvents() {
    debouncedHandleKeys = _.debounce(handleKeys, 250);

    collaboratorsStore.addChangeListener(render);
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

    collaboratorsStore.removeChangeListener(render);
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

  function isStoriesOrAdministratorRole(role) {
    return _.includes(['publisher_stories', 'editor_stories', 'administrator'], role);
  }

  // Fetches details of the given user and populates userDetailsCache with the result.
  // Then, call updateUi.
  function fetchUserThenUpdateUi(email) {
    if (!_.has(userDetailsCache, email)) {
      collaboratorsDataProvider.doesUserWithEmailHaveStoriesRights(email).
        catch(_.constant(null)). // If the request fails, assume user does not exist.
        then((userInfo) => {
          userDetailsCache[email] = userInfo;
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
    const value = getValueInInputBox();
    const accessLevel = $collaborators.find('option:selected').val();
    const collaborator = { email: value, accessLevel: accessLevel };

    const hasCollaborator = collaboratorsStore.hasCollaborator(collaborator);
    const hasUserDetails = _.has(userDetailsCache, value);

    // Updated async, we'll get called again if it changes.
    const userInfo = userDetailsCache[value];
    const userExists = _.get(userInfo, 'userExists', false);
    const hasStoriesRights = _.get(userInfo, 'hasStoriesRights', false);

    // the "!!" here is to coerce the value into a boolean instead of a truthy value
    // this is because jQuery expects a boolean in its "toggleClass" method
    const isValidEmail = !!getValidEmailInInputBoxOrNull();

    // turn on/off the spinny thing based on whether or not
    // we've gotten a repsonse from the user lookup
    $collaborators.find('.collaborators-email-input-wrapper').toggleClass('busy', isValidEmail && !hasUserDetails);

    if (hasCollaborator) {
      // User is already a collaborator;
      // Add a message and disable everything
      toggleAlreadyAddedWarning(true);
      toggleUserHasNoAccountWarning(false);
      toggleOwnerSelection(false);
      toggleAddCollaboratorsButton(false);
    } else if (isValidEmail) {
      if (hasStoriesRights === true) {
        // Licensed stories user,
        // allowed to add as co-owner
        toggleAlreadyAddedWarning(false);
        toggleUserHasNoAccountWarning(false);
        toggleOwnerSelection(true);
        toggleAddCollaboratorsButton(true);
      } else if (userExists === true) {
        // Non-licensed existant user,
        // cannot be co-owner
        toggleAlreadyAddedWarning(false);
        toggleUserHasNoAccountWarning(false);
        toggleOwnerSelection(false);
        toggleAddCollaboratorsButton(
          $collaborators.
            has('li:last-child input:not(:checked)').length === 1
        );
      } else {
        // Non-existant user; disable everything
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
    var isCollaboratorsModalOpen = collaboratorsStore.isOpen();
    var isCollaboratorsModalDirty = collaboratorsStore.isDirty();

    if (isCollaboratorsModalOpen && isCollaboratorsModalDirty) {
      /* eslint-disable no-alert */
      shouldCancel = confirm(
        I18n.t('editor.settings_panel.warnings.unsaved_collaborators_changes')
      );
      /* eslint-enable no-alert */
    }

    if (shouldCancel) {
      toggleAlreadyAddedWarning(false);
      handleCloseAndDataRefresh();
    }
  }

  function handleCloseAndDataRefresh() {
    dispatcher.dispatch({
      action: Actions.COLLABORATORS_CANCEL
    });

    collaboratorsDataProvider.getCollaborators().
      then(function(collaborators) {
        dispatcher.dispatch({
          action: Actions.COLLABORATORS_LOAD,
          collaborators: collaborators
        });
      });
  }

  function dispatchActions(event) {
    var email;
    var accessLevel;
    var $target = $(event.target).closest('[data-action]');
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
        handleCloseAndDataRefresh();
        break;
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
    if (Environment.IS_GOAL) {
      return null;
    }

    var isOpen = collaboratorsStore.isOpen();
    var isSaving = collaboratorsStore.isSaving();
    var isDirty = collaboratorsStore.isDirty();
    var collaborators = collaboratorsStore.getCollaborators();

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
      find(StorytellerUtils.format('[value="{0}"]', collaborator.accessLevel)).
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
        accessLevel: t(StorytellerUtils.format('editor.collaborators.modal.{0}', collaborator.accessLevel))
      });
    } else {
      subtemplate = templateStaticContributor({
        displayName: collaborator.displayName,
        accessLevel: t(StorytellerUtils.format('editor.collaborators.modal.{0}', collaborator.accessLevel))
      });
    }

    return $collaborator.append($(subtemplate));
  }

  function renderCollaborators(collaborators) {
    var staticCollaborators = _.filter(collaborators, function(collaborator) {
      var primaryOwnerUid = storyStore.getStoryPrimaryOwnerUid();
      return collaborator.uid === Environment.CURRENT_USER.id || collaborator.uid === primaryOwnerUid;
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
    var hasErrors = collaboratorsStore.hasErrors();
    var errorMessage = collaboratorsStore.getErrorMessage();

    if (hasErrors) {
      var error = StorytellerUtils.format(templateErrorMessage(), {error: errorMessage});
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
    var addCollaborators = collaboratorsDataProvider.addCollaborators;
    promises = promises.concat(addCollaborators(add));

    var remove = collaborators.filter(findByState('marked'));
    var removeCollaborator = collaboratorsDataProvider.removeCollaborator;
    promises = promises.concat(remove.map(removeCollaborator));

    var change = collaborators.filter(findByState('changed'));
    var changeCollaborator = collaboratorsDataProvider.changeCollaborator;
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

    setTimeout(function() {
      handleCloseAndDataRefresh();

      $saveButton.
        removeClass('btn-success').
        addClass('btn-primary');
      $saveButton.find('span').text(t('editor.modal.buttons.save'));
    }, 700);
  }

  function saveCollaboratorsError(response) {
    var isXMLRequest = response instanceof XMLHttpRequest;
    var message = isXMLRequest ? response.getResponseHeader('X-Error-Message') : response;
    var errorReportingLabel = 'CollaboratorsRenderer#_saveCollaboratorsError';

    $saveButton.removeClass('btn-busy');

    if (/email/i.test(message) && /invalid/i.test(message)) {
      message = t('editor.collaborators.modal.errors.invalid_email');
    } else {

      exceptionNotifier.notify(
        new Error(
          _.get(
            response,
            'responseText',
            '<No response text for save collaborators request>'
          )
        )
      );
      message = t('editor.collaborators.modal.errors.unknown_error');
    }

    dispatcher.dispatch({
      action: Actions.COLLABORATORS_ERROR,
      error: message,
      errorReporting: {
        message: StorytellerUtils.format(
          '{0}: {1} (story: {2}, status: {3})',
          errorReportingLabel,
          message,
          Environment.STORY_UID,
          message.status
        ),
        label: errorReportingLabel
      }
    });
  }
}
