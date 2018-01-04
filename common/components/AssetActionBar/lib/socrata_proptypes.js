import _ from 'lodash';

// Facebook has largely declined to provide a usable API for chaning PropTypes,
// so we have to roll our own, just like everyone else. It is very sad.
// I've tried to design a pattern that can be extended usefully in the future.
//
// The other option is to use this, which I have declined to largely to avoid
// yet another library:
// https://github.com/jackrzhang/react-custom-proptypes
const chainTypeCheckWithIsRequired = (validate) => {
  const checkIsRequired = (isRequired, props, propName, componentName) => {
    if (isRequired) {
      if (_.isUndefined(props[propName])) {
        return new Error(
          'The prop `' + propName + '` is marked as required in ' +
          ('`' + componentName + '`, but its value is `undefined`.')
        );
      }
    } else {
      return validate(props, propName, componentName);
    }
  };

  let chainedCheckType = checkIsRequired.bind(null, false);
  chainedCheckType.isRequired = checkIsRequired.bind(null, true);

  return chainedCheckType;
};

const OptionalSocrataUid = (props, propName, componentName) => {
  if (!_.isUndefined(props[propName]) && !/\w{4}-\w{4}/.test(props[propName])) {
    return new Error(
      'Invalid prop `' + propName + '` supplied to' +
      ' `' + componentName + '` is not a Socrata UID. Validation failed.'
    );
  }
};

const SocrataUid = chainTypeCheckWithIsRequired(OptionalSocrataUid);

export { SocrataUid };
