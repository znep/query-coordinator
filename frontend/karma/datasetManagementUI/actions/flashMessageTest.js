import _ from 'lodash';

import {
  SHOW_FLASH_MESSAGE,
  HIDE_FLASH_MESSAGE,
  hideFlashMessage,
  showFlashMessage
} from 'actions/flashMessage';

describe('actions/flashMessage', () => {
  describe('showFlashMessage', () => {
    it('creates an action of the correct shape', () => {
      const expectedShape = {
        type: SHOW_FLASH_MESSAGE,
        kind: 'success',
        message: 'Data saved successfully.'
      };

      const action = showFlashMessage('success', 'Data saved successfully.');

      expect(_.isEqual(action, expectedShape)).to.eq(true);
    });
  });

  describe('hideFlashMessage', () => {
    it('creates an action of the correct shape', () => {
      const expectedShape = {
        type: HIDE_FLASH_MESSAGE
      };

      const action = hideFlashMessage();

      expect(_.isEqual(action, expectedShape)).to.eq(true);
    });
  });
});
