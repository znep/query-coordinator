import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

const Header = (props) => {
  var { headline, description } = props;

  return (
    <div className="catalog-landing-page-header">
      <h1>{headline}</h1>
      <div className="description">{description}</div>
    </div>
  );
};

Header.propTypes = {
  headline: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired
};

const mapStateToProps = (state) => {
  return state.header;
};

export default connect(mapStateToProps)(Header);
