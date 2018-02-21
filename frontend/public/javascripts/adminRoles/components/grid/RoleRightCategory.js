import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';

import { customConnect } from 'common/connectUtils';

import * as Actions from '../../actions';
import * as selectors from '../../adminRolesSelectors';
import Expandable from '../util/Expandable';
import Grid from '../util/Grid';
import Hoverable from '../util/Hoverable';
import TristateCheckbox from '../util/TristateCheckbox';
import TristateIndicator from '../util/TristateIndicator';
import cssVariables from '../variables.scss';
import styles from './roles-grid.module.scss';

const cellHeight = parseInt(cssVariables.cellHeight, 10);

const mapDispatchToProps = (dispatch, { role, rightCategory }) =>
  bindActionCreators(
    {
      toggleRoleRightCategoryValue: () => Actions.toggleRoleRightCategoryValue(role, rightCategory),
      toggleRoleRightValue: right => Actions.toggleRoleRightValue(role, right)
    },
    dispatch
  );

class RoleRightCategory extends Component {
  static propTypes = {
    role: PropTypes.object.isRequired,
    rightCategory: PropTypes.object.isRequired,
    roleName: PropTypes.string.isRequired,
    editingColumn: PropTypes.bool.isRequired,
    isDefault: PropTypes.bool.isRequired,
    toggleRoleRightCategoryValue: PropTypes.func.isRequired,
    toggleRoleRightValue: PropTypes.func.isRequired
  };

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
            {isDefault ? (
              <TristateIndicator checkedState={selectors.rightCategoryStateForRole(role, rightCategory)} />
            ) : editingColumn ? (
              <TristateCheckbox
                id={`${roleName}_${selectors.getTranslationKeyFromRightCategory(rightCategory)}`}
                checkedState={selectors.rightCategoryStateForRole(role, rightCategory)}
                onChange={toggleRoleRightCategoryValue}
              />
            ) : (
              <TristateIndicator checkedState={selectors.rightCategoryStateForRole(role, rightCategory)} />
            )}
          </Grid.Cell>
        </Hoverable>
        {selectors.getRightsFromRightCategory(rightCategory).map(right => (
          <Hoverable name={right.get('name')} key={`${roleName}_${selectors.getNameFromRight(right)}`}>
            <Grid.Cell styleName="role-cell">
              {isDefault ? (
                <TristateIndicator checkedState={selectors.roleHasRight(role, right)} />
              ) : editingColumn ? (
                <TristateCheckbox
                  id={`${roleName}_${selectors.getNameFromRight(right)}`}
                  checkedState={selectors.roleHasRight(role, right)}
                  onChange={() => toggleRoleRightValue(right)}
                />
              ) : (
                <TristateIndicator checkedState={selectors.roleHasRight(role, right)} />
              )}
            </Grid.Cell>
          </Hoverable>
        ))}
      </Expandable>
    );
  }
}

export default customConnect({ mapDispatchToProps, styles })(RoleRightCategory);
