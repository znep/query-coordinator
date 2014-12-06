require 'test_helper'

class TileServerControllerTest < ActionController::TestCase

  def setup
    init_core_session
    init_current_domain
    @tileserver = TileServer.new
    @controller.stubs(:tileserver => @tileserver)

    @page_id = '1234-1234'
    @field_id = 'test_field'
    @zoom = '13'
    @x_coord = '11'
    @y_coord = '9'
    @limit = '4949'

    @request_params = {
      :page_id => @page_id,
      :field_id => @field_id,
      :zoom => @zoom,
      :x_coord => @x_coord,
      :y_coord => @y_coord,
      '$limit' => @limit,
      :cookies => nil
    }.with_indifferent_access

    @mock_result = {
      :status => '200',
      :body => '',
      :content_type => ''
    }
  end

  test 'should successfully get proxy_request with a valid page_id field_id zoom x_coord y_coord $limit' do
    @tileserver.stubs(:fetch_tile).returns(@mock_result)
    get :proxy_request, @request_params
    assert_response(:success)
  end

  test 'should call TileServer#fetch_tile with appropriate parameters (with no cookies)' do
    TileServer.any_instance.expects(:fetch_tile).
      with(@request_params).
      returns(:status => '200', :body => '', :content_type => '')
    get :proxy_request, @request_params
  end

  test 'should call TileServer#fetch_tile with appropriate parameters (with session cookies)' do
    @request.cookies['_socrata_session_id'] = 'some_id'
    @request.cookies['some_other_cookie'] = 'some_other_value'

    # NOTE: Only the session cookie should be passed through.
    request_params_with_cookies = @request_params.merge(:cookies => '_socrata_session_id=some_id')

    TileServer.any_instance.expects(:fetch_tile).
      with(request_params_with_cookies).
      returns(:status => '200', :body => '', :content_type => '')
    get :proxy_request, request_params_with_cookies
  end

  test 'should call TileServer#fetch_tile with appropriate parameters (with where clause)' do
    request_params_with_where = @request_params.merge('$where' => 'subjectiveoration=foo')
    TileServer.any_instance.expects(:fetch_tile).
      with(request_params_with_where).
      returns(:status => '200', :body => '', :content_type => '')
    get :proxy_request, request_params_with_where
  end

  test 'should return error as JSON' do
    result = {
      :status => '500',
      :body => {
        'error' => true,
        'reason' => 'error'
      }
    }
    @tileserver.stubs(:fetch_tile).returns(result)
    get :proxy_request, @request_params
    assert_response(500)
    assert(/^application\/json/.match(@response.headers['Content-Type']))
    assert_equal(result[:body], JSON.parse(@response.body))
  end
end
