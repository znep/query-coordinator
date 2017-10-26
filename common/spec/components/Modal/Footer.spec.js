import $ from 'jquery';
import _ from 'lodash';
import { renderPureComponent } from '../../helpers';

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

    element = renderPureComponent(Footer(props)); // eslint-disable-line new-cap

    assert.isNotNull(element);
    assert.isTrue($(element).hasClass('testing-modal-footer'));
  });
});
