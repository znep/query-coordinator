import FilterConfig from 'components/FilterBar/FilterConfig';
import { Simulate } from 'react-addons-test-utils';
import { renderComponent } from '../../helpers';

describe('FilterConfig', () => {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      onRemove: _.noop
    });
  }

  const getRemoveButton = (element) => element.querySelector('.remove-btn');

  it('renders a remove button', () => {
    const element = renderComponent(FilterConfig, getProps());
    expect(getRemoveButton(element)).to.exist;
  });

  it('calls the onRemove prop when the remove button is clicked', () => {
    const onRemove = sinon.spy();
    const element = renderComponent(FilterConfig, getProps({ onRemove }));
    expect(onRemove.called).to.equal(false);
    Simulate.click(getRemoveButton(element));
    expect(onRemove.called).to.equal(true);
  });
});
