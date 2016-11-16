import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';

import { translate } from '../../../I18n';
import { onDebouncedEvent } from '../../helpers';
import { getTitle, getDescription, getViewSourceDataLink, getVisualizationType } from '../../selectors/vifAuthoring';
import { setTitle, setDescription, setViewSourceDataLink } from '../../actions';
import CustomizationTabPane from '../CustomizationTabPane';
import EmptyPane from './EmptyPane';
import Accordion from '../shared/Accordion';
import AccordionPane from '../shared/AccordionPane';

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
    const { vifAuthoring, onChangeTitle } = this.props;
    const title = getTitle(vifAuthoring);
    const onChange = onDebouncedEvent(this, onChangeTitle);

    return (
      <div className="authoring-field">
        <label className="block-label" htmlFor="title">{translate('panes.title_and_description.fields.title.title')}</label>
        <input id="title" className="text-input" type="text" onChange={onChange} defaultValue={title} />
      </div>
    );
  },

  renderDescriptionField() {
    const { vifAuthoring, onChangeDescription } = this.props;
    const description = getDescription(vifAuthoring);
    const onChange = onDebouncedEvent(this, onChangeDescription);

    return (
      <div className="authoring-field">
        <label className="block-label" htmlFor="description">{translate('panes.title_and_description.fields.description.title')}</label>
        <textarea id="description" className="text-input text-area" onChange={onChange} defaultValue={description} />
      </div>
    );
  },

  render() {
    const chartType = getVisualizationType(this.props.vifAuthoring);
    let content;

    if (_.isNull(chartType)) {
      content = <EmptyPane />;
    } else {
      content = (
        <Accordion>
          <AccordionPane title={translate('panes.title_and_description.subheaders.general')}>
            {this.renderTitleField()}
            {this.renderDescriptionField()}
            {this.renderShowSourceDataLink()}
          </AccordionPane>
        </Accordion>
      );
    }

    return (
      <form>
        { content }
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
    onChangeTitle: title => {
      dispatch(setTitle(title));
    },

    onChangeDescription: description => {
      dispatch(setDescription(description));
    },

    onChangeShowSourceDataLink: event => {
      const viewSourceDataLink = event.target.checked;
      dispatch(setViewSourceDataLink(viewSourceDataLink));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(TitleAndDescriptionPane);
