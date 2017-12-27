import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { Button, EditBar as SocrataComponentsEditBar } from 'common/components';
import I18n from 'common/i18n';

import { openEditModal } from '../actions/editor';
import { enterPreviewMode } from '../actions/view';

// Container for the edit menu affordance, as well as save and preview buttons.
export class EditBar extends PureComponent {
  render() {
    const { name, onClickPreview, onClickEdit } = this.props;
    const editBarProps = { name };

    return (
      <SocrataComponentsEditBar {...editBarProps}>
        <div className="edit-bar-child">
          <Button variant="primary" dark onClick={onClickEdit}>
            {I18n.t('open_performance.edit')}
          </Button>
          <Button className="btn-save" dark>Save</Button>
          <Button className="btn-preview" variant="transparent" onClick={onClickPreview}>
            {I18n.t('open_performance.preview')}
            <span className="socrata-icon-preview" role="presentation" />
          </Button>
        </div>
      </SocrataComponentsEditBar>
    );
  }
}

EditBar.propTypes = {
  name: PropTypes.string,
  onClickPreview: PropTypes.func,
  onClickEdit: PropTypes.func
};

function mapStateToProps(state) {
  return state.view.measure;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onClickPreview: enterPreviewMode,
    onClickEdit: openEditModal
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(EditBar);
