import components from 'socrata-components';
import { translate as t } from '../lib/I18n';
import { connect } from 'react-redux';

function mapStateToProps(state) {
  return {
    name: state.view.name,
    menuLabel: t('edit_menu_label')
  };
}

export default connect(mapStateToProps)(components.EditBar);
