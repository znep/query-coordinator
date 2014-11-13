require 'test_helper'

class PolaroidControllerTest < ActionController::TestCase

  def setup
    init_core_session
    init_current_domain
    @polaroid = Polaroid.new
    @controller.stubs(:polaroid => @polaroid)
    @page_id = '1234-1234'
    @field_id = 'test_field'
    @request_params = { :page_id => @page_id, :field_id => @field_id }
    @mock_result = {
      :status => '200',
      :body => '',
      :content_type => ''
    }
  end

  test 'should successfully get proxy_request with a valid page_id and field_id' do
    @polaroid.stubs(:fetch_image).returns(@mock_result)
    get :proxy_request, @request_params
    assert_response :success
  end

  test 'should return renderTrackingId as cookie if provided' do
    @polaroid.stubs(:fetch_image).returns(@mock_result)
    tracking_id = 'test_render_tracking_id'
    get :proxy_request, @request_params.merge('renderTrackingId' => tracking_id)
    assert_response :success
    assert_not_nil @response.cookies["renderTrackingId_#{tracking_id}"], 'renderTrackingId_(tracking_id) cookie should be present'
    assert_equal '1', @response.cookies["renderTrackingId_#{tracking_id}"], 'renderTrackingId cookie should equal 1'
  end

  test 'should set content disposition correctly' do
    @polaroid.stubs(:fetch_image).returns(@mock_result)
    get :proxy_request, @request_params
    assert_response :success
    assert_equal "attachment; filename=\"#{@page_id}-#{@field_id}.png\"", @response.headers['Content-Disposition']
  end

  test 'should call Polaroid#fetch_image with appropriate parameters' do
    Polaroid.any_instance.expects(:fetch_image).
      with(@page_id, @field_id, anything).
      returns({:status => '200', :body => '', :content_type => ''})
    get :proxy_request, @request_params
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
    get :proxy_request, @request_params
    assert_response(500)
    assert /^application\/json/.match(@response.headers['Content-Type'])
    assert_equal result[:body], JSON.parse(@response.body)
  end
end
