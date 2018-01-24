import { assert } from 'chai';
import { shallow } from 'enzyme';

import { App } from 'adminActivityFeedSoql/components/App';

describe('App', () => {

  it('render', () => {
    const element = shallow(<App isMobile={false}/>);
    assert.isNotNull(element);
    assert.equal(element.find('div.header').length, 1);
  });

  it('render mobile', () => {
    const element = shallow(<App isMobile={true}/>);
    assert.isNotNull(element);
    assert.equal(element.find('div.header.mobile').length, 1);
    assert.equal(element.find('div.catalog-results.mobile').length, 1);
  });
});
