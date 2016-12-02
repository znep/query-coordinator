import _ from 'lodash';
import { Simulate } from 'react-addons-test-utils';
import { renderPureComponent } from '../../helpers';

import Header from 'components/Modal/Header';

describe('Header', () => {
  let element;

  function getProps(props) {
    return _.defaultsDeep({}, props, {
      onDismiss: _.noop
    });
  }

  // TODO: test for rendering children

  it('renders with relevant classes', () => {
    const props = getProps({
      className: 'testing-modal-header'
    });

    element = renderPureComponent(Header(props));

    expect(element).to.exist;
    expect(element).to.have.class('testing-modal-header');
  });

  it('renders a title when given', () => {
    const props = getProps({
      title: 'My Testing Header'
    });

    element = renderPureComponent(Header(props));

    expect(element).to.have.text('My Testing Header');
  });

  it('calls onDismiss when the close icon is clicked', () => {
    const props = {
      onDismiss: sinon.stub()
    };

    element = renderPureComponent(Header(props));

    const closeIcon = element.querySelector('.modal-header-dismiss');

    Simulate.click(closeIcon);

    expect(props.onDismiss.calledOnce).to.be.true;
  });
});
