import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

const Header = (props) => {
  var { headline, description } = props;

  const managementPageHref = `/catalog_landing_page/manage${window.location.search}`;

  const toggleThrobber = () => {
    $('.management-button .throbber-icon,.management-button .socrata-icon-arrow-right').toggle();
  };

  const managementButton = (
    <a href={managementPageHref} onClick={toggleThrobber}>
      <button className="management-button btn btn-primary">
        {_.get(I18n, 'manager.manage_this_category', 'Manage This Category')}
        <i id="socrata-icon-arrow-right" className="socrata-icon-arrow-right"></i>
        <span className="throbber-icon"></span>
      </button>
    </a>
  );

  return (
    <div className="catalog-landing-page-header">
      {window.serverConfig.currentUserMayManage && managementButton}
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
