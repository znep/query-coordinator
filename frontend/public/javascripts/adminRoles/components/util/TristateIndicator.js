import cond from 'lodash/fp/cond';
import constant from 'lodash/fp/constant';
import eq from 'lodash/fp/eq';
import stubTrue from 'lodash/fp/stubTrue';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { SocrataIcon } from 'common/components/SocrataIcon';

class TristateIndicator extends Component {
  static propTypes = {
    checkedState: PropTypes.oneOf([true, false, 'partial']).isRequired
  };

  render() {
    const { checkedState } = this.props;
    return cond([
      [eq(true), constant(<SocrataIcon name="checkmark-alt" />)],
      [eq(false), constant(null)],
      [stubTrue, constant(<SocrataIcon name="indeterminate-state-icon" />)]
    ])(checkedState);
  }
}

export default TristateIndicator;
