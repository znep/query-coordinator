import _ from 'lodash';
import moment from 'moment';
import { FeatureFlags } from 'common/feature_flags';
import * as React from 'react';
import * as ReactRedux from 'react-redux';
import * as State from '../../state';
import * as Helpers from '../../../../helpers';
import * as Components from '../../../../components';
import goalStatusTranslation from '../../../../helpers/goalStatus';
import * as Actions from '../../actions';
import * as Selectors from '../../selectors';

import GoalEditLink from '../GoalEditLink';

class EditGeneral extends React.Component {
  constructor(props) {
    super(props);

    const translations = props.translations;

    this.visibilityOptions = [
      {
        label: translations.getIn(['admin', 'goal_values', 'status_public']),
        value: 'public'
      },
      {
        label: translations.getIn(['admin', 'goal_values', 'status_private']),
        value: 'private'
      }
    ];
  }

  renderPublicationNotice() {
    const { translations, usingStorytellerEditor } = this.props;

    return usingStorytellerEditor ? (
      <div className="form-light-notice will-publish-notice">
        { translations.getIn(['admin', 'visibility_controls_will_publish']) }
      </div>
    ) : null;
  }

  renderVisibilityDropdown() {
    return (
      <span>
        <Components.Select
          className="form-select-small"
          options={ this.visibilityOptions }
          value={ this.props.formData.get('visibility') }
          onChange={ _.wrap('visibility', this.props.onSelectChange) }
          searchable={ false }
          clearable={ false }/>
        { this.renderPublicationNotice() }
      </span>
    );
  }

  // The second line of the draft status line (i.e., published, publishing, or the publish button).
  renderDraftPublicationStatus() {
    const { translations, publishLatestDraft, goalPublicationStatus, saveInProgress } = this.props;

    const onPublishClick = (event) => {
      event.preventDefault();
      publishLatestDraft();
    };

    if (saveInProgress) {
      return (<span className="spinner-default spinner-small" />);
    } else if (goalPublicationStatus === 'status_public_with_draft') {
      return (<a
        role="button"
        href="#"
        onClick={ onPublishClick }>
        { translations.getIn(['admin', 'quick_edit', 'update_public_version']) }
      </a>);
    } else if (goalPublicationStatus === 'status_public') {
      return translations.getIn(['admin', 'quick_edit', 'draft_latest']);
    }
  }

  renderDraftStatus() {
    const { goal, translations } = this.props;
    const draftUpdatedAt = goal.getIn(['narrative', 'draft', 'created_at']);

    let content;
    if (draftUpdatedAt) {
      const statusMessage = Helpers.translator(
        translations,
        'admin.quick_edit.draft_saved_on',
        moment(draftUpdatedAt).format('ll')
      );
      content = <div className="form-block">
        { statusMessage }<br />
        { this.renderDraftPublicationStatus() }
      </div>;
    } else {
      content = translations.getIn(['admin', 'quick_edit', 'draft_not_present']);
    }

    return (
      <div className="form-line draft-status">
        <label className="inline-label">
          { translations.getIn(['admin', 'quick_edit', 'drafts'])}
        </label>
        { content }
      </div>
    );
  }

  renderVisibilitySection() {
    const { goal, translations, goalPublicationStatus, usingStorytellerEditor } = this.props;
    const draft = goal.getIn([ 'narrative', 'draft' ]);
    // Can't publish in this state - user must publish from within full editor.
    const readOnlyBecauseNoDraft = usingStorytellerEditor &&
      !draft &&
      goalPublicationStatus === 'status_private';

    const noDraftMessage = <div className="form-block no-draft-message">
      { translations.getIn(['admin', 'goal_values', goalPublicationStatus]) }.<br />
      <span className="form-light">
        { translations.getIn(['admin', 'quick_edit', 'cannot_publish_draft_not_present']) + ' ' }
        <GoalEditLink
          goal={ goal }
          text= { translations.getIn(['admin', 'quick_edit', 'upgrade']) }
        />
      </span>
    </div>;

    return (
      <div className="form-line visibility-status">
        <label className="inline-label">
          { translations.getIn(['admin', 'quick_edit', 'visibility']) }
        </label>
        { readOnlyBecauseNoDraft ? noDraftMessage : this.renderVisibilityDropdown() }
      </div>
    );
  }

  render() {
    const { translations, goal, formData, usingStorytellerEditor } = this.props;

    return (
      <div>
        <h5>{ translations.getIn(['admin', 'quick_edit', 'goal_name']) }</h5>

        <div className="form-line">
          <label className="inline-label">{ translations.getIn(['admin', 'quick_edit', 'goal_name']) }</label>
          <input
            name="name"
            className="text-input"
            value={ formData.get('name', '') }
            onChange={ this.props.onInputChange }/>
        </div>

        <div className="form-line">
          <label className="inline-label">
            { translations.getIn(['admin', 'quick_edit', 'status'])}
          </label>
          { goalStatusTranslation(translations, ['measure', 'progress', goal.get('status')]) || ' — '}
        </div>

        { this.renderVisibilitySection() }
        { usingStorytellerEditor ? this.renderDraftStatus() : null }
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  const quickEdit = State.getQuickEdit(state);
  const goalPublicationStatus = Selectors.getGoalPublicationStatus(state, props.goal.get('id'));

  return {
    goalPublicationStatus,
    saveInProgress: quickEdit.get('saveInProgress'),
    translations: state.get('translations'),
    formData: State.getQuickEdit(state).get('formData'),
    usingStorytellerEditor: FeatureFlags.value('open_performance_narrative_editor') === 'storyteller'
  };
};

const mapDispatchToProps = dispatch => ({
  publishLatestDraft: () => dispatch(Actions.QuickEdit.publishLatestDraft())
});

export default ReactRedux.connect(mapStateToProps, mapDispatchToProps)(EditGeneral);
