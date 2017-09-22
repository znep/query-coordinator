import $ from 'jquery';
import _ from 'lodash';
import { Simulate } from 'react-dom/test-utils';
import { renderPureComponent } from '../../helpers';

import Header from 'components/Modal/Header';

/* eslint-disable new-cap */
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

    assert.isNotNull(element);
    assert.isTrue($(element).hasClass('testing-modal-header'));
  });

  it('renders a title when given', () => {
    const props = getProps({
      title: 'My Testing Header'
    });

    element = renderPureComponent(Header(props));

    assert.equal($(element).text(), 'My Testing Header');
  });

  it('calls onDismiss when the close icon is clicked', () => {
    const props = {
      onDismiss: sinon.stub()
    };

    element = renderPureComponent(Header(props));

    const closeIcon = element.querySelector('.modal-header-dismiss');

    Simulate.click(closeIcon);

    assert.isTrue(props.onDismiss.calledOnce);
  });

  it('does not render close button when told not to', () => {
    const props = {
      showCloseButton: false
    };

    element = renderPureComponent(Header(props));

    const closeIcon = element.querySelector('.modal-header-dismiss');

    assert.isNull(closeIcon);
  });
});
/* eslint-disable new-cap */
