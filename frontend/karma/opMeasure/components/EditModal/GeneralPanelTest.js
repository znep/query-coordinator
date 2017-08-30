import { assert } from 'chai';

import { GeneralPanel } from 'components/EditModal/GeneralPanel';

describe('GeneralPanel', () => {
  const getProps = (props) => {
    return {
      ...props
    };
  };

  it('renders', () => {
    const element = renderComponent(GeneralPanel, getProps());
    assert.ok(element);
  });
});
