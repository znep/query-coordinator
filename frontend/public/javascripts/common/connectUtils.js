import { connect as reduxConnect } from 'react-redux';
import localizedConnect from 'common/i18n/components/connectLocalization';
import flow from 'lodash/fp/flow';
import compact from 'lodash/fp/compact';
import cssModules from 'react-css-modules';

export { I18nPropType } from 'common/i18n/components/connectLocalization';

// Re-export the individual connect functions
export { cssModules, localizedConnect, reduxConnect };

/** Utility function that combines localization, cssModules, and redux store, making sure to add the localization
 * last so it can be used in mapStateToProps/mapDispatchToProps when the actual higher-order components are rendered
 * @param {object} options
 * @param {object | function} options.mapStateToProps - redux-style mapStateToProps
 * @param {object | function} options.mapDispatchToProps - redux-style mapDispatchToProps
 * @param {object} options.styles - cssModules imported styles object
 */
export const customConnect = ({ mapStateToProps, mapDispatchToProps, styles } = {}) =>
  flow(
    compact([
      styles ? cssModules(styles) : null,
      (mapStateToProps || mapDispatchToProps) ? reduxConnect(mapStateToProps, mapDispatchToProps) : null,
      localizedConnect
    ])
  );
