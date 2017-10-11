import React from 'react';
import PropTypes from 'prop-types';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from './ManageData.scss';

export const Card = ({ title, blurb, iconName, done, children }) => (
  <div className={styles.card}>
    <SocrataIcon name={iconName} className={styles.icon} />
    {done && <SocrataIcon name="checkmark-alt" className={styles.icon} />}
    <h3>{title}</h3>
    <p>{blurb}</p>
    {children}
  </div>
);

Card.propTypes = {
  title: PropTypes.string.isRequired,
  blurb: PropTypes.string.isRequired,
  iconName: PropTypes.string.isRequired,
  done: PropTypes.bool,
  children: PropTypes.element.isRequired
};

export const CardButton = ({ onButtonClick, isDisabled, title, children }) => (
  <button
    className={isDisabled ? styles.sidebarBtnDisabled : styles.sidebarBtn}
    title={isDisabled && title}
    disabled={isDisabled}
    onClick={onButtonClick}
    tabIndex="-1">
    {children}
  </button>
);

CardButton.propTypes = {
  onButtonClick: PropTypes.func,
  isDisabled: PropTypes.bool.isRequired,
  title: PropTypes.string,
  children: PropTypes.string.isRequired
};

const ManageData = ({ hasDescribedCols, colsExist, onDescribeColsClick }) => (
  <div>
    <Card
      title={I18n.home_pane.sidebar.column_descriptions}
      blurb={I18n.home_pane.sidebar.column_descriptions_blurb}
      done={hasDescribedCols}
      iconName="column-info">
      <CardButton
        onButtonClick={onDescribeColsClick}
        title={I18n.home_pane.sidebar.no_columns_msg}
        isDisabled={!colsExist}>
        {I18n.home_pane.sidebar.column_descriptions_button}
      </CardButton>
    </Card>

    <Card
      title={I18n.home_pane.sidebar.visualize}
      blurb={I18n.home_pane.sidebar.visualize_blurb}
      iconName="cards">
      <CardButton isDisabled>{I18n.home_pane.sidebar.visualize_button}</CardButton>
    </Card>

    <Card
      title={I18n.home_pane.sidebar.feature}
      blurb={I18n.home_pane.sidebar.feature_blurb}
      iconName="featured">
      <CardButton isDisabled>{I18n.home_pane.sidebar.feature_button}</CardButton>
    </Card>
  </div>
);

ManageData.propTypes = {
  hasDescribedCols: PropTypes.bool.isRequired,
  colsExist: PropTypes.bool.isRequired,
  onDescribeColsClick: PropTypes.func.isRequired
};

export default ManageData;
