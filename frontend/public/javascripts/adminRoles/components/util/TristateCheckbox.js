import PropTypes from 'prop-types';
import React, { Component } from 'react';
import cond from 'lodash/fp/cond';
import constant from 'lodash/fp/constant';
import eq from 'lodash/fp/eq';
import stubTrue from 'lodash/fp/stubTrue';
import styles from './tristate-checkbox.module.scss';
import cssModules from 'react-css-modules';

import { SocrataIcon } from 'common/components/SocrataIcon';

class TristateCheckbox extends Component {
  render() {
    const { checkedState, disabled, id, onChange } = this.props;
    const isChecked = checkedState !== false;
    const icon = cond([
      [eq(true), constant(<SocrataIcon name="check-2" />)],
      [eq(false), constant('')],
      [stubTrue, constant(<SocrataIcon name="indeterminate-state-checkbox" />)]
    ])(checkedState);

    return (
      <form styleName="tristate-checkbox">
        <div className="checkbox">
          <input id={id} type="checkbox" checked={isChecked} disabled={disabled} readOnly />
          <label htmlFor={id} onClick={ev => !disabled && onChange(ev)}>
            <span className="fake-checkbox">
              {icon}
            </span>
          </label>
        </div>
      </form>
    );
  }
}

TristateCheckbox.propTypes = {
  checkedState: PropTypes.oneOf([true, false, 'partial']).isRequired,
  disabled: PropTypes.bool,
  id: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};

export default cssModules(TristateCheckbox, styles);
