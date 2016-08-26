import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../I18n';
import { INPUT_DEBOUNCE_MILLISECONDS } from '../../constants';
import { getTitle, getDescription, getViewSourceDataLink } from '../../selectors/vifAuthoring';
import { setTitle, setDescription, setViewSourceDataLink } from '../../actions';
import CustomizationTabPane from '../CustomizationTabPane';

export const TitleAndDescriptionPane = React.createClass({
  propTypes: {
    onChangeTitle: React.PropTypes.func,
    onChangeDescription: React.PropTypes.func,
    onChangeShowSourceDataLink: React.PropTypes.func
  },

  renderShowSourceDataLink() {
    const { vifAuthoring } = this.props;
    const inputAttributes = {
      id: 'show-source-data-link',
      type: 'checkbox',
      onChange: this.props.onChangeShowSourceDataLink,
      defaultChecked: getViewSourceDataLink(vifAuthoring)
    };

    return (
      <div className="authoring-field checkbox">
        <input {...inputAttributes} />
        <label className="inline-label" htmlFor="show-source-data-link">
          <span className="fake-checkbox">
            <span className="icon-checkmark3"></span>
          </span>
          {translate('panes.title_and_description.fields.show_source_data_link.title')}
        </label>
      </div>
    );
  },

  renderTitleField() {
    const title = getTitle(this.props.vifAuthoring);

    return (
      <div className="authoring-field">
        <label className="block-label" htmlFor="title">{translate('panes.title_and_description.fields.title.title')}</label>
        <input id="title" className="text-input" type="text" onChange={this.props.onChangeTitle} defaultValue={title} />
      </div>
    );
  },

  renderDescriptionField() {
    const description = getDescription(this.props.vifAuthoring);

    return (
      <div className="authoring-field">
        <label className="block-label" htmlFor="description">{translate('panes.title_and_description.fields.description.title')}</label>
        <textarea id="description" className="text-input text-area" onChange={this.props.onChangeDescription} defaultValue={description} />
      </div>
    );
  },

  render() {
    return (
      <form>
        {this.renderTitleField()}
        {this.renderDescriptionField()}
        {this.renderShowSourceDataLink()}
      </form>
    );
  }
});

function mapStateToProps(state) {
  return {
    vifAuthoring: state.vifAuthoring
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onChangeTitle: _.debounce(event => {
      const title = event.target.value;
      dispatch(setTitle(title));
    }, INPUT_DEBOUNCE_MILLISECONDS),

    onChangeDescription: _.debounce(event => {
      const description = event.target.value;
      dispatch(setDescription(description));
    }, INPUT_DEBOUNCE_MILLISECONDS),

    onChangeShowSourceDataLink: event => {
      const viewSourceDataLink = event.target.checked;
      dispatch(setViewSourceDataLink(viewSourceDataLink));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(TitleAndDescriptionPane);
