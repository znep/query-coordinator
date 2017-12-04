import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { EditBar as SocrataComponentsEditBar } from 'common/components';
import I18n from 'common/i18n';

import { enterPreviewMode } from '../actions/view';

// Container for the edit menu affordance, as well as save and preview buttons.
export class EditBar extends PureComponent {
  render() {
    const { name, onClickPreview } = this.props;

    const editBarProps = {
      name,
      menuLabel: I18n.t('open_performance.edit_menu_label'),
      menuIcon: 'socrata-icon-stories-menu'
    };

    return (
      <SocrataComponentsEditBar {...editBarProps}>
        <div className="edit-bar-child">
          <button type="button" className="btn btn-transparent btn-preview" onClick={onClickPreview}>
            {I18n.t('open_performance.preview')}
            <span className="socrata-icon-preview" role="presentation" />
          </button>
        </div>
      </SocrataComponentsEditBar>
    );
  }
}

EditBar.propTypes = {
  name: PropTypes.string
};

function mapStateToProps(state) {
  return state.view.measure;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onClickPreview: enterPreviewMode
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(EditBar);
