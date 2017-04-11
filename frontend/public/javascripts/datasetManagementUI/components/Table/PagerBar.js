import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { Link } from 'react-router';
import * as DisplayState from '../../lib/displayState';
import { PAGE_SIZE } from '../../actions/loadData';
import * as Selectors from '../../selectors';
import { commaify } from '../../../common/formatNumber.js';
import Pager from '../../../common/components/Pager';
import styles from 'styles/Table/PagerBar.scss';

function PagerBar({ currentPage, resultCount, urlForPage, changePage }) {
  if (resultCount) {
    const firstPageRow = commaify((currentPage - 1) * PAGE_SIZE + 1);
    const lastPageRow = commaify(Math.min(currentPage * PAGE_SIZE, resultCount));
    const lastPage = urlForPage(Math.ceil(resultCount / PAGE_SIZE));

    let resultCountElem;
    if (resultCount > PAGE_SIZE) {
      resultCountElem = <Link to={lastPage}>{commaify(resultCount)}</Link>;
    } else {
      resultCountElem = commaify(resultCount);
    }

    return (
      <div className={styles.pagerBar}>
        {I18n.home_pane.showing} {firstPageRow}&ndash;{lastPageRow} {I18n.home_pane.of} {resultCountElem}

        <Pager
          resultsPerPage={PAGE_SIZE}
          currentPage={currentPage}
          resultCount={resultCount}
          changePage={changePage} />
      </div>
    );
  } else {
    return <div className={styles.pagerBar}></div>;
  }
}

PagerBar.propTypes = {
  currentPage: PropTypes.number.isRequired,
  resultCount: PropTypes.number.isRequired,
  urlForPage: PropTypes.func.isRequired,
  changePage: PropTypes.func.isRequired
};

function numItemsToPaginate(db, outputSchemaId, displayState) {
  switch (displayState.type) {
    case DisplayState.COLUMN_ERRORS:
      return db.transforms[displayState.transformId].num_transform_errors;

    case DisplayState.ROW_ERRORS: {
      const outputSchema = db.output_schemas[outputSchemaId];
      return db.input_schemas[outputSchema.input_schema_id].num_row_errors;
    }
    case DisplayState.NORMAL: {
      const columns = Selectors.columnsForOutputSchema(db, outputSchemaId);
      return Selectors.rowsTransformed(columns);
    }
    default:
      console.error('unknown display state', displayState.type);
  }
}

function mapDispatchToProps(dispatch, ownProps) {
  const { displayState, path, routing } = ownProps;

  const urlForPage = (targetPage) => {
    const targetDisplayState = { ...displayState, pageNo: targetPage };
    const targetPageUrl = DisplayState.toUiUrl(path, targetDisplayState);

    return targetPageUrl;
  };

  const changePage = (targetPage) => {
    if (targetPage) {
      dispatch(push(urlForPage(targetPage)(routing)));
    }
  };

  return { urlForPage, changePage };
}

function mapStateToProps(state, ownProps) {
  const currentPage = ownProps.displayState.pageNo;
  const resultCount = numItemsToPaginate(state.db,
                                         ownProps.path.outputSchemaId,
                                         ownProps.displayState);

  return { currentPage, resultCount };
}

const ConnectedPagerBar = connect(mapStateToProps, mapDispatchToProps)(PagerBar);

ConnectedPagerBar.propTypes = {
  path: PropTypes.object.isRequired,
  routing: PropTypes.object.isRequired,
  displayState: DisplayState.propType.isRequired
};

export default ConnectedPagerBar;
