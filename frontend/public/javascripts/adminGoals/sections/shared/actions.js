import * as downloads from './downloads/actions';
export { downloads };

import * as loading from './loading/actions';
export { loading };

import * as feedback from '../../components/feedback';

export const showFeedbackFlannel = hoverable => feedback.Flannel.actions.open(hoverable);

