import React, { PropTypes, PureComponent } from 'react';
import { connect } from 'react-redux';

import { EditBar as SocrataComponentsEditBar } from 'common/components';
import I18n from 'common/i18n';

// Container for the edit menu affordance, as well as save and preview buttons.
export class EditBar extends PureComponent {
  render() {
    const { name } = this.props;

    const editBarProps = {
      name,
      menuLabel: I18n.t('open_performance.edit_menu_label'),
      menuIcon: 'socrata-icon-stories-menu'
    };

    return (
      <SocrataComponentsEditBar {...editBarProps} />
    );
  }
}

EditBar.propTypes = {
  name: PropTypes.string
};

function mapStateToProps(state) {
  return state.view.measure;
}

export default connect(mapStateToProps)(EditBar);
