require 'test_helper'

class PolaroidControllerTest < ActionController::TestCase

  def setup
    init_core_session
    init_current_domain
    @polaroid = Polaroid.new
    @controller.stubs(:polaroid => @polaroid)
    @vif = {}
    @request_params = { :vif => @vif }
    @mock_result = {
      :status => '200',
      :body => '',
      :content_type => ''
    }
  end

  test 'should successfully post proxy_request' do
    @polaroid.stubs(:fetch_image).returns(@mock_result)
    post :proxy_request, @request_params
    assert_response(:success)
  end

  test 'should return renderTrackingId as cookie if provided' do
    @polaroid.stubs(:fetch_image).returns(@mock_result)
    tracking_id = 'test_render_tracking_id'
    post :proxy_request, @request_params.merge('renderTrackingId' => tracking_id)
    assert_response(:success)
    assert_not_nil(@response.cookies["renderTrackingId_#{tracking_id}"], 'renderTrackingId_(tracking_id) cookie should be present')
    assert_equal('1', @response.cookies["renderTrackingId_#{tracking_id}"], 'renderTrackingId cookie should equal 1')
  end

  test 'should set content disposition correctly' do
    @polaroid.stubs(:fetch_image).returns(@mock_result)
    post :proxy_request, @request_params
    assert_response(:success)
    # vif fields are blank so the filename will just be "--"
    assert_equal("attachment; filename=\"--.png\"", @response.headers['Content-Disposition'])
  end

  test 'should call Polaroid#fetch_image with appropriate parameters (with no cookies)' do
    Polaroid.any_instance.expects(:fetch_image).
      with({}, anything).
      returns({:status => '200', :body => '', :content_type => ''})
    post :proxy_request, @request_params
  end

  test 'should call Polaroid#fetch_image with appropriate parameters (with session cookies)' do
    @request.cookies['_socrata_session_id'] = 'some_id'
    @request.cookies['some_other_cookie'] = 'some_other_value'

    # NOTE: Only the session cookie should be passed through.
    cookies_hash = { :cookies => '_socrata_session_id=some_id' }

    Polaroid.any_instance.expects(:fetch_image).
      with({}, cookies_hash).
      returns(:status => '200', :body => '', :content_type => '')
    post :proxy_request, @request_params
  end


  test 'should return error as JSON' do
    result = {
      :status => '500',
      :body => {
        'error' => true,
        'reason' => 'error'
      }
    }
    @polaroid.stubs(:fetch_image).returns(result)
    post :proxy_request, @request_params
    assert_response(500)
    assert(/^application\/json/.match(@response.headers['Content-Type']))
    assert_equal(result[:body], JSON.parse(@response.body))
  end
end
