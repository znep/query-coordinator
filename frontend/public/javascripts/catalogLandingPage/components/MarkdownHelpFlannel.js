import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import Styleguide from 'common/components';

export class MarkdownHelpFlannel extends React.Component {
  render() {
    const text = _.get(I18n, 'manager.description.how_to_markdown');
    return (<Styleguide.Flannel title="markdownHelp" className="markdownHelp" {...this.props}>
      <Styleguide.FlannelContent>
        <div className="info-button">
          <i className="socrata-icon-info"></i>
        </div>
        <div>
          <p className="heading">
            {_.get(text, 'header_0')}<br />
            {_.get(text, 'header_1')}
          </p>
          <p>
            {_.get(text, 'basics_0')}<br />
            {_.get(text, 'basics_1')}<br />
            {_.get(text, 'basics_2')}
          </p>
          <p>{_.get(text, 'links_head')}</p>
          <p>
            {_.get(text, 'links_0_0')}<br />
            {_.get(text, 'links_0_1')}
          </p>
          <p>
            {_.get(text, 'links_1_0')}<br />
            {_.get(text, 'links_1_1')}
          </p>
        </div>
        <div className="close-button">
          <i onClick={this.props.onDismiss} className="socrata-icon-close"></i>
        </div>
      </Styleguide.FlannelContent>
    </Styleguide.Flannel>);
  }
}

MarkdownHelpFlannel.propTypes = {
  target: PropTypes.object.isRequired,
  onDismiss: PropTypes.func.isRequired
};

const mapStateToProps = state => { return state; };

export default connect(mapStateToProps)(MarkdownHelpFlannel);
