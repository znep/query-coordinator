require 'test_helper'

class WidgetsControllerTest < ActionController::TestCase

  def setup
    init_core_session
    init_current_domain
    init_feature_flag_signaller
    load_sample_data('test/fixtures/sample-data.json')
    stub_site_chrome
  end

  def teardown
    View.unstub(:find)
    View.unstub(:category_display)
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
      assert_select '.odataEndpointWrapper input' do |elements|
        elements.each do |element|
          element.to_s.scan(/http.?:\/\//).each do |match|
            assert_equal(match, 'https://')
          end
        end
      end
    end

    should 'should set the X-Frame-Options header to ALLOWALL' do
      get :show, id: 'four-four', customization_id: 'default'
      assert_response :success
      assert_equal 'ALLOWALL', @response.headers['X-Frame-Options']
    end
  end

end
