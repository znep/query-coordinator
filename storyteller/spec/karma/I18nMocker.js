import sinon from 'sinon';

import StorytellerUtils from '../../app/assets/javascripts/StorytellerUtils';

export default {
  t: sinon.spy(function(translationKeys) {
    return StorytellerUtils.format(
      'Translation for: {0}',
      translationKeys
    );
  })
};
