import _ from 'lodash';

import Footer from 'components/Modal/Footer';

describe('Footer', () => {
  let element;

  function getProps(props) {
    return _.defaultsDeep({}, props);
  }

  // TODO: test for rendering children

  it('renders with relevant classes', () => {
    const props = getProps({
      className: 'testing-modal-footer'
    });

    element = renderPureComponent(Footer(props));

    expect(element).to.exist;
    expect(element).to.have.class('testing-modal-footer');
  });
});
