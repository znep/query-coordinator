import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as Actions from '../actions';
import _ from 'lodash';

/**
 * Wrapper utility component for triggering data load on component mount
 */
class BaseDataLoader extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, 'componentDidMount');
  }

  componentDidMount() {
    this.props.loadData();
  }

  render() {
    return <div>{this.props.children}</div>;
  }
}

BaseDataLoader.propTypes = {
  children: PropTypes.any.isRequired,
  loadData: PropTypes.func.isRequired
};

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch => {
  return {
    loadData: () => dispatch(Actions.loadData())
  };
};

export const DataLoader = connect(mapStateToProps, mapDispatchToProps)(BaseDataLoader);
