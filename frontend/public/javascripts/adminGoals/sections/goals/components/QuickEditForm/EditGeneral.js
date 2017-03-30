import _ from 'lodash';
import { FeatureFlags } from 'common/feature_flags';
import * as React from 'react';
import * as ReactRedux from 'react-redux';
import * as State from '../../state';
import * as Components from '../../../../components';
import goalStatusTranslation from '../../../../helpers/goalStatus';

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

  renderVisibilityDisabledMessage() {
    const { translations, goal } = this.props;
    const goalEditUrl = `/stat/goals/single/${goal.get('id')}/edit`;

    return (
      <span className="form-message">
        { translations.getIn(['admin', 'visibility_controls_disabled', 'text']) + ' ' }
        <a href={ goalEditUrl } target="_blank">
          { translations.getIn(['admin', 'visibility_controls_disabled', 'link']) }
        </a>
      </span>
    );
  }

  renderVisibilityDropdown() {
    return (
      <Components.Select
        className="form-select-small"
        options={ this.visibilityOptions }
        value={ this.props.formData.get('visibility') }
        onChange={ _.wrap('visibility', this.props.onSelectChange) }
        searchable={ false }
        clearable={ false }/>
    );
  }

  renderVisibilitySection() {
    const { translations } = this.props;

    // If the new editor is enabled, we need to complete EN-12848 before we can support
    // visibility changes.
    const disableVisibilityChange =
      FeatureFlags.value('open_performance_narrative_editor') === 'storyteller';

    return (
      <div className="form-line">
        <label className="inline-label">
          { translations.getIn(['admin', 'quick_edit', 'visibility']) }
        </label>
        { disableVisibilityChange ?
          this.renderVisibilityDisabledMessage() :
          this.renderVisibilityDropdown()
        }
      </div>
    );
  }

  render() {
    const { translations, goal, formData } = this.props;

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
      </div>
    );
  }
}

const mapStateToProps = state => ({
  translations: state.get('translations'),
  formData: State.getQuickEdit(state).get('formData')
});

export default ReactRedux.connect(mapStateToProps)(EditGeneral);
