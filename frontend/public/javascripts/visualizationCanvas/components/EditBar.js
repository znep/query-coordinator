import React, { PropTypes, PureComponent } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import SaveButton from './SaveButton';
import SaveNotification from './SaveNotification';
import { EditBar as SocrataComponentsEditBar } from 'common/components';
import { t } from '../lib/I18n';
import { enterPreviewMode, openEditMenu } from '../actions';

// Note that there is a placeholder version of this component in visualization_canvas.html.erb,
// so be sure to verify the placeholder looks fine if you make significant changes to this
// component's appearance
export class EditBar extends PureComponent {
  render() {
    const { name, onClickPreview, onClickMenu, onClickName } = this.props;

    const editBarProps = {
      name,
      menuLabel: t('edit_menu_label'),
      menuIcon: 'socrata-icon-stories-menu',
      onClickMenu,
      onClickName
    };

    return (
      <SocrataComponentsEditBar {...editBarProps}>
        <div className="edit-bar-child">
          <SaveButton />
          <SaveNotification />
          <button className="btn btn-transparent btn-preview" onClick={onClickPreview}>
            {t('preview')}
            <span className="socrata-icon-preview" role="presentation" />
          </button>
        </div>
      </SocrataComponentsEditBar>
    );
  }
}

EditBar.propTypes = {
  name: PropTypes.string.isRequired,
  onClickMenu: PropTypes.func.isRequired,
  onClickName: PropTypes.func.isRequired,
  onClickPreview: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  return _.pick(state.view, 'name');
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onClickMenu: openEditMenu,
    onClickName: openEditMenu,
    onClickPreview: enterPreviewMode
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(EditBar);
