import * as React from 'react';
import * as ReactRedux from 'react-redux';
import * as Actions  from '../actions/bulkEdit';
import * as State from '../State';
import * as Helpers from '../../../helpers';

import SocrataButton from '../../../components/SocrataButton';

function SocrataBulkActions(props) {
  const { selectedRowsCount, translations, openModal } = props;
  const editTitle = Helpers.translator(translations, 'admin.bulk_edit.button_title');

  return (
    <div className="bulk-actions">
      <SocrataButton simple disabled={ selectedRowsCount < 2 } onClick={ openModal }>{ editTitle }</SocrataButton>
    </div>
  );
}

const mapStateToProps = state => ({
  translations: state.get('translations'),
  selectedRowsCount: State.getSelectedIds(state).count()
});

const mapDispatchToProps = dispatch => ({
  openModal: () => dispatch(Actions.openModal())
});

export default ReactRedux.connect(mapStateToProps, mapDispatchToProps)(SocrataBulkActions);
