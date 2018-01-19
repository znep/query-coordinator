import { connect as reduxConnect } from 'react-redux';
import connectLocalization from 'common/i18n/components/connectLocalization';
import flow from 'lodash/fp/flow';

/** Utility function that combines localization and redux store, making sure to add the localization
 * first so it can be used in mapStateToProps/mapDispatchToProps
 * @param mapStateToProps
 * @param mapDispatchToProps
 * @returns {*}
 */
export const connect = (mapStateToProps, mapDispatchToProps) => flow(
  reduxConnect(mapStateToProps, mapDispatchToProps),
  connectLocalization
);
