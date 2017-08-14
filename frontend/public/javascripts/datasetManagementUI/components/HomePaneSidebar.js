import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import * as Links from '../links';
import ManageData from 'components/ManageData';
import RecentActions from 'components/RecentActionsContainer';
import styles from 'styles/HomePaneSidebar.scss';

function HomePaneSidebar({ params, entities, columnsExist }) {
  const showManageTab = params.sidebarSelection === 'manageTab';
  const contents = showManageTab
    ? <ManageData entities={entities} columnsExist={columnsExist} params={params} />
    : <RecentActions />;

  return (
    <div className={styles.sidebar}>
      <div className={styles.nav}>
        <Link to={Links.home(params)}>
          <button className={!showManageTab ? styles.navBtnEnabled : styles.navBtn}>
            {I18n.home_pane.home_pane_sidebar.recent_actions}
          </button>
        </Link>
        <Link to={Links.manageTab(params)}>
          <button className={showManageTab ? styles.navBtnEnabled : styles.navBtn}>
            {I18n.home_pane.home_pane_sidebar.manage}
          </button>
        </Link>
      </div>
      {contents}
    </div>
  );
}

HomePaneSidebar.propTypes = {
  entities: PropTypes.object,
  columnsExist: PropTypes.bool,
  params: PropTypes.object.isRequired
};

export default HomePaneSidebar;
