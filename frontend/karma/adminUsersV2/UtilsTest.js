import { assert } from 'chai';
import { getCustomRoleName } from 'adminUsersV2/utils';

describe('utils', () => {
  describe('getCustomRoleName', () => {
    const defaultPublisherRole = {
      name: 'publisher',
      isDefault: true
    };

    const customPublisherRole = {
      name: 'Publisher',
      isDefault: false
    };

    const customRole = {
      name: 'Custom Role',
      isDefault: false
    };

    const roles = [
      defaultPublisherRole,
      customPublisherRole,
      customRole
    ];

    const customString = 'Custom';

    const fakeI18n = {
      t: () => customString
    };

    it('just returns the role name if no default roles match', () => {
      assert.equal(getCustomRoleName(customRole, roles, fakeI18n), customRole.name);
    });

    it('returns the role name appended with (Custom) if a default role matches', () => {
      assert.equal(getCustomRoleName(customPublisherRole, roles, fakeI18n), `${customPublisherRole.name} (${customString})`);
    });
  });
});
