import _ from 'lodash';
import { assert } from 'chai';
import SearchBox from 'components/SearchBox';

describe('SearchBox', () => {
  const props = {
    searchValue: 'test',
    searchCallback: _.noop,
    placeholder: 'search'
  };

  const element = renderPureComponent(<SearchBox {...props}/>);

  it('should render input', () => {
    const actual = element.querySelector('.search-box-input');
    assert.isNotNull(actual);
  });

  it('should render icon', () => {
    const actual = element.querySelector('.search-icon-wrapper');
    assert.isNotNull(actual);
  });

  it('should render correct placeholder', () => {
    const actual = element.querySelector('.search-box-input').getAttribute('placeholder');
    assert.equal(actual, props.placeholder);
  });

  it('should get search value from props', () => {
    const actual = element.querySelector('.search-box-input').getAttribute('value');
    assert.equal(actual, props.searchValue);
  });
});
