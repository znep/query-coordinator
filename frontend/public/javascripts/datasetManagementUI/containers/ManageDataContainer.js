import { connect } from 'react-redux';
import _ from 'lodash';
import { withRouter, browserHistory } from 'react-router';
import * as Links from 'links/links';
import ManageData from 'components/ManageData/ManageData';
import * as Selectors from 'selectors';

const mapStateToProps = ({ entities }, { params }) => {
  const os = Selectors.currentOutputSchema(entities, _.toNumber(params.revisionSeq));
  const outputColumns = os ? Selectors.columnsForOutputSchema(entities, os.id) : [];

  return {
    hasDescribedCols: !!outputColumns.filter(col => col.description).length,
    colsExist: !!outputColumns.length,
    os,
    entities
  };
};

const mergeProps = (stateProps, { dispatch }, { params }) => {
  return {
    hasDescribedCols: stateProps.hasDescribedCols,
    colsExist: stateProps.colsExist,
    onDescribeColsClick: e => {
      if (!stateProps.os) {
        return;
      }
      e.preventDefault();
      browserHistory.push(Links.columnMetadataForm(params, stateProps.os.id));
    }
  };
};

export default withRouter(connect(mapStateToProps, null, mergeProps)(ManageData));
