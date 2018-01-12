import React from 'react';
import PropTypes from 'prop-types';
import { browserHistory, withRouter } from 'react-router';
import _ from 'lodash';
import * as Links from 'links/links';
import styles from './SourceMessage.module.scss';

const LINK_ID = 'dsmui-parse-error-link';

function handler(e, params) {
  e.preventDefault();

  if (_.get(e, 'target.id') === LINK_ID) {
    browserHistory.push(Links.hrefSource(params));
  }
}

const SourceMessage = ({ hrefExists, sourceExists, params }) => {
  let message;

  if (hrefExists) {
    message = I18n.show_sources.error_href_exists.format(
      `<a id='${LINK_ID}'>${
        I18n.show_sources.error_href_exists_link_text
      }</a>`
    );
  } else if (sourceExists) {
    message = I18n.show_sources.error_schema_exists;
  } else {
    message = I18n.show_sources.error_unknown;
  }

  return (
    <section
      className={styles.container}
      data-cheetah-hook="no-source-ingress-message">
      <span
        className={styles.message}
        onClick={e => handler(e, params)}
        dangerouslySetInnerHTML={{ __html: message }} />
    </section>
  );
};

SourceMessage.propTypes = {
  hrefExists: PropTypes.bool,
  sourceExists: PropTypes.bool,
  params: PropTypes.object
};

export default withRouter(SourceMessage);
