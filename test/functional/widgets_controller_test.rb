require 'test_helper'

class WidgetsControllerTest < ActionController::TestCase

  def setup
    init_core_session
    init_current_domain
    load_sample_data('test/fixtures/sample-data.json')
  end

  context 'helper methods' do

    should 'respond to is_mobile?' do
      assert(@controller.respond_to?(:is_mobile?))
    end

  end

  context '#show' do
    setup do
      test_view = View.find('test-data')
      View.any_instance.stubs(
        :find => test_view,
        :category_display => ''
      )
    end

    should 'use https for odata endpoint wrapper' do
      @request.env['HTTPS'] = 'on'
      get :show, id: 'four-four', customization_id: 'default'
      assert_response :success
      assert_select_quiet '.odataEndpointWrapper pre' do |elements|
        elements.each do |element|
          element.to_s.scan(/http.?:\/\//).each do |match|
            assert_equal(match, 'https://')
          end
        end
      end
    end
  end
end
