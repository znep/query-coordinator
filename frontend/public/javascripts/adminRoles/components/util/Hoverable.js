import PropTypes from 'prop-types';
import React, { Component } from 'react';
import cssModules from 'react-css-modules';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { connectLocalization } from 'common/components/Localization';

import { hoverRow, unhoverRow } from '../../actions';

import styles from './hoverable.module.scss';

const mapStateToProps = (state) => ({
  hovered: state.get('hovered')
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      hoverRow: (name) => hoverRow({ name }),
      unhoverRow: (name) => unhoverRow({ name })
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
      styles,
      ...props
    } = this.props;

    const className = name == hovered ? 'hovered' : '';

    const childrenWithExtraProp = React.Children.map(this.props.children, child => {
      return React.cloneElement(child, props);
    });

    return (
      <div className={className} onMouseEnter={() => hoverRow(name)} onMouseLeave={() => unhoverRow(name)}>
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
