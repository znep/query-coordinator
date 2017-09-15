import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import marked from 'marked';
import { FeatureFlags } from 'common/feature_flags';

export class Description extends React.Component {
  render() {
    const { descriptionText } = this.props;

    if (FeatureFlags.value('enable_markdown_for_catalog_landing_page_description')) {
      const markedDescription = { __html: marked(descriptionText || '', { sanitize: true }) };

      return <div className="clp-description" dangerouslySetInnerHTML={markedDescription} />;
    } else {
      return <div className="clp-description">{descriptionText}</div>;
    }
  }
}

Description.propTypes = {
  descriptionText: PropTypes.string.isRequired
};

const mapStateToProps = (state) => ({
  descriptionText: state.header.description
});

export default connect(mapStateToProps)(Description);
