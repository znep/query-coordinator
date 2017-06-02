import _ from 'lodash';

// EN-15648 - ignore cross origin errors coming from within iframes on DSLP
export default function dslpCrossOriginErrorsFilter(notice) {
  const message = _.get(notice, 'errors[0].message', '');
  const crossOriginMessage = /Blocked a frame with origin/;

  if (crossOriginMessage.test(message)) {
    return null;
  }

  return notice;
}
