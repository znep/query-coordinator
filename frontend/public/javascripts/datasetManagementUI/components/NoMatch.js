import React, { PropTypes } from 'react';
import { Link, withRouter } from 'react-router';
import * as Links from '../links';
import styles from 'styles/NoMatch.scss';

export function NoMatch({ location }) {
  return (
    <div className={styles.noMatch}>
      <h1>
        {I18n.no_match.title}
      </h1>
      <p>
        {I18n.no_match.subtitle}
      </p>
      <p>
        <Link to={Links.home(location.pathname)}>
          {I18n.no_match.suggestion}
        </Link>
      </p>
    </div>
  );
}

NoMatch.propTypes = {
  location: PropTypes.shape({
    pathname: PropTypes.string
  }).isRequired
};

export default withRouter(NoMatch);
