import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { FeatureFlags } from 'common/feature_flags';
import Description from './Description';

const Header = (props) => {
  const { headline } = props;

  let managementPageHref;
  if (_.get(props, 'query.custom_path')) {
    managementPageHref = `/catalog_landing_page/manage?custom_path=${props.query.custom_path}`;
  } else {
    managementPageHref = `/catalog_landing_page/manage${window.location.search}`;
  }

  const toggleThrobber = () => {
    $('.management-button .throbber-icon, .management-button .socrata-icon-arrow-right').toggle();
  };

  const renderManagementButton = () => {
    if (document.querySelector('.alert.info.browse2-manage-catalog-landing-page')) {
      return null;
    }

    return (<a className="management-button-anchor" href={managementPageHref} onClick={toggleThrobber}>
      <button className="management-button alert info">
        <i id="socrata-icon-edit" className="socrata-icon-edit"></i>
        <span className="hoverText">
          {_.get(I18n, 'manager.edit_action', 'Edit Featured Content')}
        </span>
        <span className="throbber-icon"></span>
      </button>
    </a>);
  };

  const renderedDescription = FeatureFlags.value('clp_move_description_below_featured_content') ?
    null : <Description />;

  const headerClassname = _.isEmpty(headline) ? 'no-headline' : '';

  return (
    <div className="catalog-landing-page-header">
      <h1 className={headerClassname}>
        {headline}
        {window.serverConfig.currentUserMayManage && renderManagementButton()}
      </h1>
      {renderedDescription}
    </div>
  );
};

Header.propTypes = {
  headline: PropTypes.string,
  query: PropTypes.object.isRequired
};

const mapStateToProps = (state) => {
  return _.assign({}, state.header, { query: state.catalog.query });
};

export default connect(mapStateToProps)(Header);
