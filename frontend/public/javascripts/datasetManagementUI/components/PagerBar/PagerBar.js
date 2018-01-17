import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router';
import { PAGE_SIZE } from 'reduxStuff/actions/loadData';
import { commaify } from '../../../common/formatNumber';
import Pager from 'common/components/Pager';
import styles from './PagerBar.module.scss';

function PagerBar({ currentPage, resultCount, urlForPage, changePage, isLoading }) {
  if (resultCount) {
    const firstPageRow = commaify((currentPage - 1) * PAGE_SIZE + 1);
    const lastPageRow = commaify(Math.min(currentPage * PAGE_SIZE, resultCount));
    const lastPage = urlForPage(Math.ceil(resultCount / PAGE_SIZE));

    let resultCountElem;
    if (resultCount > PAGE_SIZE && !isLoading) {
      resultCountElem = (
        <Link to={lastPage}>
          {commaify(resultCount)}
        </Link>
      );
    } else {
      resultCountElem = commaify(resultCount);
    }

    let pager = null;
    if (isLoading) {
      pager = (
        <span className={styles.pageLoading}></span>
      );
    } else {
      pager = (
        <Pager
          resultsPerPage={PAGE_SIZE}
          currentPage={currentPage}
          resultCount={resultCount}
          changePage={changePage} />
      );
    }

    return (
      <div className={styles.pagerBar}>
        {I18n.home_pane.showing} {firstPageRow}–{lastPageRow} {I18n.home_pane.of} {resultCountElem}
        {pager}
      </div>
    );
  } else {
    return <div className={styles.pagerBar} />;
  }
}

PagerBar.propTypes = {
  currentPage: PropTypes.number.isRequired,
  resultCount: PropTypes.number,
  urlForPage: PropTypes.func.isRequired,
  changePage: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired
};

export default PagerBar;
