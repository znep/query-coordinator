import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import marked from 'marked';

const Header = (props) => {
  var { headline, description } = props;

  let managementPageHref;
  if (_.get(props, 'query.custom_path')) {
    managementPageHref = `/catalog_landing_page/manage?custom_path=${props.query.custom_path}`;
  } else {
    managementPageHref = `/catalog_landing_page/manage${window.location.search}`;
  }

  const toggleThrobber = () => {
    $('.management-button .throbber-icon,.management-button .socrata-icon-arrow-right').toggle();
  };

  const managementButton = (
    <a className="management-button-anchor" href={managementPageHref} onClick={toggleThrobber}>
      <button className="management-button alert info">
        <i id="socrata-icon-edit" className="socrata-icon-edit"></i>
        <span className="hoverText">
          {_.get(I18n, 'manager.edit_action', 'Edit Featured Content')}
        </span>
        <span className="throbber-icon"></span>
      </button>
    </a>
  );

  const markedDescription = { __html: marked(description || '', { sanitize: true }) };

  const headerClassname = _.isEmpty(headline) ? 'no-headline' : '';

  return (
    <div className="catalog-landing-page-header">
      <h1 className={headerClassname}>
        {headline}
        {window.serverConfig.currentUserMayManage && managementButton}
      </h1>
      <div className="description" dangerouslySetInnerHTML={markedDescription} />
    </div>
  );
};

Header.propTypes = {
  headline: PropTypes.string,
  description: PropTypes.string,
  query: PropTypes.object.isRequired
};

const mapStateToProps = (state) => {
  return _.assign({}, state.header, { query: state.catalog.query });
};

export default connect(mapStateToProps)(Header);
