import PropTypes from 'prop-types';
import React from 'react';
import cssModules from 'react-css-modules';
import classNames from 'classnames';
import { SocrataIcon } from 'common/components/SocrataIcon';
import { connect } from 'react-redux';
import { collapseChanged } from '../actions';
import styles from './autocomplete.scss';

function CollapsedIcon({ onCollapsedChanged, adminHeaderClasses }) {
  return (
    <div
      styleName={classNames("collapsed-icon", adminHeaderClasses)}
      onClick={() => { onCollapsedChanged(false); }}>
      <SocrataIcon name="search" />
    </div>
  );
}

CollapsedIcon.propTypes = {
  onCollapsedChanged: PropTypes.func.isRequired,
  adminHeaderClasses: PropTypes.array.isRequired
};

const mapDispatchToProps = (dispatch) => ({
  onCollapsedChanged: (visible) => { dispatch(collapseChanged(visible)); }
});

export default connect(null, mapDispatchToProps)(cssModules(CollapsedIcon, styles, { allowMultiple: true }));
