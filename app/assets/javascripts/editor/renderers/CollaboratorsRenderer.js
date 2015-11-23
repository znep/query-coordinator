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
    var $collaborators;
    var $saveButton;

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
        '<div id="collaborators-modal" class="modal hidden">' +
          '<div class="modal-overlay" data-action="{0}"></div>'.format(Actions.COLLABORATORS_CANCEL) +
          '<div class="modal-dialog">' +
            '<div class="modal-header-group">' +
              '<h1 class="modal-title">{0}</h1>'.format(t('editor.collaborators.modal.heading')) +
              '<button class="modal-close-btn icon-cross2" data-action="{0}"></button>'.format(Actions.COLLABORATORS_CANCEL) +
            '</div>' +
            '<div>' +
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
            '<div>' +
              '<h2 class="modal-input-label">{0}</h2>'.format(t('editor.collaborators.modal.invite_collaborators')) +
              '<div class="modal-input-group">' +
                '<div class="modal-left-panel">' +
                  '<input type="email" class="modal-input" placeholder="{0}">'.format(t('editor.collaborators.modal.email_placeholder')) +
                  '<div class="modal-select">' +
                    '<select class="modal-input">' +
                      '<option value="{0}">{1}</option>'.format('owner', t('editor.collaborators.modal.owner')) +
                      '<option value="{0}">{1}</option>'.format('contributor', t('editor.collaborators.modal.contributor')) +
                      '<option value="{0}">{1}</option>'.format('viewer', t('editor.collaborators.modal.viewer')) +
                    '</select>' +
                  '</div>' +
                '</div>' +
                '<div class="modal-right-panel">' +
                  '<button class="btn-default" data-action="{0}" disabled>{1}</button>'.format(Actions.COLLABORATORS_ADD, t('editor.collaborators.modal.add_contributor')) +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="modal-button-group r-to-l">' +
              '<button class="btn-default btn-inverse" data-action="{0}">{1}</button>'.format(Actions.COLLABORATORS_CANCEL, t('editor.modal.buttons.cancel')) +
              '<button class="btn-primary" data-action="{0}" disabled><span>{1}</span></button>'.format(Actions.COLLABORATORS_SAVE, t('editor.modal.buttons.save')) +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }

    function templateAccessLevel() {
      return (
        '<div class="modal-select">' +
          '<select data-action="{0}">'.format(Actions.COLLABORATORS_CHANGE) +
            '<option value="{0}">{1}</option>'.format('owner', t('editor.collaborators.modal.owner')) +
            '<option value="{0}">{1}</option>'.format('contributor', t('editor.collaborators.modal.contributor')) +
            '<option value="{0}">{1}</option>'.format('viewer', t('editor.collaborators.modal.viewer')) +
          '</select>' +
        '</div>'
      );
    }

    function templateContributor() {
      return (
        '<td>{email}</td>' +
        '<td>{0}</td>'.format(templateAccessLevel) +
        '<td>' +
          '<button ' +
            'class="btn-default btn-inverse"' +
            'data-action="{0}"'.format(Actions.COLLABORATORS_REMOVE) +
          '>{0}</button>'.format(t('editor.collaborators.modal.remove')) +
        '</td>'
      );
    }

    function templateStaticContributor() {
      return (
        '<td class="static">{email}</td>' +
        '<td class="static" colspan="2">{accessLevel}</td>'
      );
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
      $collaborators = $(template());
      $saveButton = $collaborators.find('[data-action="{0}"]'.format(Actions.COLLABORATORS_SAVE));

      $(document.body).append($collaborators);
    }

    function attachEvents() {
      storyteller.collaboratorsStore.addChangeListener(render);
      $collaborators.on('click', '[data-action]', dispatchActions);
      $collaborators.on('change', 'td select', dispatchActions);
      $collaborators.on('keyup', 'input[type="email"]', handleKeys);
    }

    function detachEvents() {
      $collaborators.off('click', '[data-action]', dispatchActions);
      $collaborators.off('change', 'td select', dispatchActions);
      $collaborators.off('keyup', 'input[type="email"]', handleKeys);
      storyteller.collaboratorsStore.removeChangeListener(render);
    }

    function handleKeys(event) {
      var invalid = !event.target.checkValidity();
      var isMissingValue = !event.target.value || event.target.value.length === 0;
      var isSharingSelf = window.currentUser.email === event.target.value;
      var hasCollaborator = storyteller.collaboratorsStore.hasCollaborator({
        email: event.target.value,
        accessLevel: $collaborators.find('option:selected').val()
      });

      var disabled = invalid ||
        isMissingValue ||
        hasCollaborator ||
        isSharingSelf;

      $collaborators.
        find('.modal-input-group button').
        prop('disabled', disabled);
    }

    function dispatchActions(event) {
      var $tr;
      var email;
      var accessLevel;
      var isModalOverlay;
      var isCollaboratorsModalOpen;
      var isCollaboratorsModalDirty;
      var dispatcher = storyteller.dispatcher;
      var $target = $(event.target);
      var action = $target.attr('data-action');
      var shouldClose = true;

      switch (action) {
        case Actions.COLLABORATORS_CANCEL:
          shouldClose = true;
          isModalOverlay = $target.hasClass('modal-overlay');
          isCollaboratorsModalOpen = storyteller.collaboratorsStore.isOpen();
          isCollaboratorsModalDirty = storyteller.collaboratorsStore.isDirty();

          if (isCollaboratorsModalOpen && isCollaboratorsModalDirty && isModalOverlay) {
            /* eslint-disable no-alert */
            shouldClose = confirm(
              I18n.t('editor.settings_panel.warnings.unsaved_collaborators_changes')
            );
            /* eslint-enable no-alert */
          }

          if (shouldClose) {
            dispatcher.dispatch({
              action: action
            });
          }

          break;
        case Actions.COLLABORATORS_SAVE:
          dispatcher.dispatch({
            action: action
          });
          break;
        case Actions.COLLABORATORS_MARK_REMOVAL:
        case Actions.COLLABORATORS_UNMARK_REMOVAL:
        case Actions.COLLABORATORS_REMOVE:
          $tr = $target.closest('tr');

          dispatcher.dispatch({
            action: action,
            collaborator: {
              email: $tr.attr('data-email'),
              accessLevel: $tr.attr('data-access-level')
            }
          });
          break;
        case Actions.COLLABORATORS_ADD:
          email = $collaborators.find('input[type="email"]').val();
          accessLevel = $collaborators.find('.modal-input-group option:selected').val();

          dispatcher.dispatch({
            action: Actions.COLLABORATORS_ADD,
            collaborator: {
              email: email,
              accessLevel: accessLevel
            }
          });
          break;
        case Actions.COLLABORATORS_CHANGE:
          $tr = $target.closest('tr');
          email = $tr.attr('data-email');
          accessLevel = $tr.attr('data-access-level');

          var newAccessLevel = $tr.find('option:selected').val();
          var hasChanged = accessLevel !== newAccessLevel;

          if (hasChanged || $target.is('button')) {
            dispatcher.dispatch({
              action: Actions.COLLABORATORS_CHANGE,
              collaborator: {
                email: email,
                accessLevel: newAccessLevel
              }
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

      renderErrorMessage();
    }

    function renderCollaborator(collaborator) {
      var buttonText;
      var buttonAction;
      var selectDisabled = false;
      var $collaborator = $('<tr>', {
        'class': collaborator.state.current,
        'data-email': collaborator.email,
        'data-access-level': collaborator.accessLevel
      });

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

      var subtemplate = templateContributor().format({
        email: collaborator.email
      });

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
      var $collaborator = $('<tr>', {
        'class': collaborator.state.current
      });
      var subtemplate = templateStaticContributor().format({
        email: collaborator.email,
        accessLevel: t('editor.collaborators.modal.{0}'.format(collaborator.accessLevel))
      });

      return $collaborator.append($(subtemplate));
    }

    function renderCollaborators(collaborators) {
      var staticCollaborators = _.filter(collaborators, {email: window.currentUser.email});
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
      $collaborators.find('.modal-input-group input').val('');
      $collaborators.find('.modal-input-group button').prop('disabled', true);
      $collaborators.find('.modal-input-group option:selected').prop('selected', false);
    }

    function toggleModal(show) {
      $collaborators[show ? 'removeClass' : 'addClass']('hidden');
    }

    function toggleSaveButton(enable) {
      $saveButton.prop('disabled', !enable);
    }

    function toggleLoadingButton(loading) {
      $saveButton[loading ? 'addClass' : 'removeClass']('btn-busy');
    }

    function saveCollaborators(collaborators) {
      function findByState(state) {
        return function(collaborator) {
          return collaborator.state.current === state;
        };
      }

      var promises = [];

      var add = collaborators.filter(findByState('added'));
      var addCollaborator = storyteller.collaboratorsDataProvider.addCollaborator;
      promises = promises.concat(add.map(addCollaborator));

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
      var message = response.getResponseHeader('X-Error-Message');

      $saveButton.removeClass('btn-busy');

      if (/email/i.test(response.getResponseHeader('X-Error-Message')) &&
        /invalid/i.test(response.getResponseHeader('X-Error-Message'))) {
        message = t('editor.collaborators.modal.errors.invalid_email');
      } else {
        message = t('editor.collaborators.modal.errors.unknown_error');
        storyteller.airbrake.notify(response);
      }

      storyteller.dispatcher.dispatch({
        action: Actions.COLLABORATORS_ERROR,
        error: message
      });
    }
  }

  storyteller.CollaboratorsRenderer = CollaboratorsRenderer;
})();
