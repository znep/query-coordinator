import PropTypes from 'prop-types';
import React from 'react';
import ParseOptions from 'containers/ParseOptionsContainer';
import classNames from 'classnames';
import styles from './ShowOutputSchema.scss';

const ParseOptionsPane = ({ params }) => (
  <div className={classNames(styles.contentWrap, styles.optionsWrap)}>
    <ParseOptions params={params} />
  </div>
);

ParseOptionsPane.propTypes = {
  params: PropTypes.object.isRequired
};

export default ParseOptionsPane;
