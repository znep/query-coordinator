import PropTypes from 'prop-types';
import React, { Component } from 'react';
import cssModules from 'react-css-modules';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { connectLocalization } from 'common/components/Localization';
import omit from 'lodash/fp/omit';
import cx from 'classnames';

import * as Actions from '../../actions';

import styles from './hoverable.module.scss';

const mapStateToProps = (state) => ({
  hovered: state.get('hovered')
});

const mapDispatchToProps = (dispatch, { name }) =>
  bindActionCreators(
    {
      hoverRow: () => Actions.hoverRow(name),
      unhoverRow: () => Actions.unhoverRow(name)
    },
    dispatch
  );

class Hoverable extends Component {
  render() {
    const {
      children,
      name,
      hoverRow,
      unhoverRow,
      hovered,
      ...props
    } = this.props;

    const className = cx({ hovered: name === hovered });

    const childrenWithExtraProp = React.Children.map(children, child => React.cloneElement(child, omit('styles', props)));

    return (
      <div className={className} onMouseEnter={hoverRow} onMouseLeave={unhoverRow}>
        {childrenWithExtraProp}
      </div>
    );
  }
}

Hoverable.propTypes = {
  name: PropTypes.string.isRequired,
  hoverRow: PropTypes.func.isRequired,
  unhoverRow: PropTypes.func.isRequired,
  hovered: PropTypes.string
};

export default connectLocalization(
    connect(mapStateToProps, mapDispatchToProps)(cssModules(Hoverable, styles))
);
