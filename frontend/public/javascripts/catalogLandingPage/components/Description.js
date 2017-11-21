import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import marked from 'marked';

export class Description extends React.Component {
  render() {
    const { descriptionText } = this.props;
    const markedDescription = { __html: marked(descriptionText || '', { sanitize: true }) };

    return <div className="clp-description" dangerouslySetInnerHTML={markedDescription} />;
  }
}

Description.propTypes = {
  descriptionText: PropTypes.string.isRequired
};

const mapStateToProps = (state) => ({
  descriptionText: state.header.description
});

export default connect(mapStateToProps)(Description);
