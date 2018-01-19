import PropTypes from 'prop-types';
import React, { Component } from 'react';
import cssModules from 'react-css-modules';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Grid from '../util/Grid';

import Expandable from '../util/Expandable';
import Hoverable from '../util/Hoverable';
import TristateCheckbox from '../util/TristateCheckbox';
import TristateIndicator from '../util/TristateIndicator';
import { toggleRoleRightCategoryValue, toggleRoleRightValue } from '../../actions';
import { connectLocalization } from 'common/components/Localization';
import * as selectors from '../../adminRolesSelectors';

import styles from './roles-grid.module.scss';
import cssVariables from '../variables.scss';

const cellHeight = parseInt(cssVariables.cellHeight, 10);

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      toggleRoleRightCategoryValue: (role, rightCategory) =>
      toggleRoleRightCategoryValue({ role, rightCategory }),
      toggleRoleRightValue: (role, right) => toggleRoleRightValue({ role, right })
    },
    dispatch
  );

class RoleRightCategory extends Component {
  render() {
    const {
      editingColumn,
      isDefault,
      role,
      rightCategory,
      roleName,
      toggleRoleRightValue,
      toggleRoleRightCategoryValue
    } = this.props;

    return (
      <Expandable
        styleName="expandable-container"
        itemContainerClassName={styles['expandable-item-container']}
        key={`${roleName}_${selectors.getTranslationKeyFromRightCategory(rightCategory)}`}
        itemHeight={cellHeight}
        isExpanded={selectors.getExpandedStateFromRightCategory(rightCategory)}
      >
        <Hoverable name={rightCategory.get('translationKey')}>
          <Grid.Cell styleName="role-cell">
            {isDefault
              ? <TristateIndicator checkedState={selectors.rightCategoryStateForRole(role, rightCategory)} />
              : editingColumn
                ? <TristateCheckbox
                    id={`${roleName}_${selectors.getTranslationKeyFromRightCategory(rightCategory)}`}
                    checkedState={selectors.rightCategoryStateForRole(role, rightCategory)}
                    onChange={() => toggleRoleRightCategoryValue(role, rightCategory)}
                  />
                : <TristateIndicator checkedState={selectors.rightCategoryStateForRole(role, rightCategory)} />}
          </Grid.Cell>
        </Hoverable>
        {selectors.getRightsFromRightCategory(rightCategory).map(right =>
          <Hoverable name={right.get('name')} key={`${roleName}_${selectors.getNameFromRight(right)}`} >
            <Grid.Cell styleName="role-cell">
              {isDefault
                ? <TristateIndicator checkedState={selectors.roleHasRight(role, right)} />
                : editingColumn
                  ? <TristateCheckbox
                      id={`${roleName}_${selectors.getNameFromRight(right)}`}
                      checkedState={selectors.roleHasRight(role, right)}
                      onChange={() => toggleRoleRightValue(role, right)}
                    />
                  : <TristateIndicator checkedState={selectors.roleHasRight(role, right)} />}
            </Grid.Cell>
          </Hoverable>
        )}
      </Expandable>
    );
  }
}

RoleRightCategory.propTypes = {
  role: PropTypes.object.isRequired,
  rightCategory: PropTypes.object.isRequired,
  roleName: PropTypes.string.isRequired,
  editingColumn: PropTypes.bool.isRequired,
  isDefault: PropTypes.bool.isRequired,
  toggleRoleRightCategoryValue: PropTypes.func.isRequired,
  toggleRoleRightValue: PropTypes.func.isRequired
};

export default connectLocalization(
  connect(mapStateToProps, mapDispatchToProps)(cssModules(RoleRightCategory, styles))
);
