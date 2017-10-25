import { assert } from 'chai';
import { shallow } from 'enzyme';

import App from 'components/App/App';

describe('App', () => {

  it('does render ', () => {
    const element = shallow(<App />);

    assert.isNotNull(element);
  });

});
