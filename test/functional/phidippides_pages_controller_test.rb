require 'test_helper'

class PhidippidesPagesControllerTest < ActionController::TestCase

  def setup
    init_core_session
    init_current_domain
    UserSession.any_instance.stubs(
      save: Net::HTTPSuccess.new(1.1, 200, 'Success'),
      find_token: true
    )
    User.stubs(current_user: User.new(some_user))

    @phidippides = Phidippides.new
    @phidippides.stubs(end_point: 'http://localhost:2401')
    @page_metadata_manager = PageMetadataManager.new
    @controller.stubs(
      phidippides: @phidippides,
      page_metadata_manager: @page_metadata_manager,
      save_as_enabled?: true
    )
    @page_metadata_manager.stubs(
      create: { body: '', status: '200' },
      update: { body: '', status: '200' }
    )
  end

  def json_post(body = nil)
    @request.env['CONTENT_TYPE'] = 'application/json'
    return {
      phidippides_page: body || {
        datasetId: 'four-four',
        pageId: 'page-page',
      }
    }
  end

  def set_up_json_request(body = nil)
    body = v1_page_metadata.to_json unless body.present?

    @request.env['RAW_POST_DATA'] = body
    @request.env['CONTENT_TYPE'] = 'application/json'
  end

  test 'show returns data for a given page' do
    @controller.stubs(can_create_metadata?: true)
    @phidippides.stubs(
      fetch_page_metadata: {
        body: v0_page_metadata,
        status: '200'
      }
    )
    connection_stub = mock
    connection_stub.stubs(reset_counters: {requests: {}, runtime: 0})
    connection_stub.expects(:get_request).returns('{}')
    CoreServer::Base.stubs(connection: connection_stub)

    get :show, id: 'four-four', format: 'json'
    assert_response(:success)
    result = JSON.parse(@response.body)
    assert_equal(%w(pageId datasetId name description primaryAmountField primaryAggregation filterSoql isDefaultPage pageSource cards permissions), result.keys)
  end

  test 'show displays permission:private for views private in core' do
    @controller.stubs(can_create_metadata?: true)
    @phidippides.stubs(
      fetch_page_metadata: {
        body: v1_page_metadata,
        status: '200'
      }
    )
    connection_stub = mock
    connection_stub.stubs(reset_counters: {requests: {}, runtime: 0})
    connection_stub.expects(:get_request).returns('{"grants": []}')
    CoreServer::Base.stubs(connection: connection_stub)

    get :show, id: 'four-four', format: 'json'
    assert_response(:success)
    result = JSON.parse(@response.body).with_indifferent_access
    assert_equal({isPublic: false, rights: []}.with_indifferent_access, result['permissions'])
  end

  test 'show displays permission:public for views public in core' do
    @controller.stubs(can_create_metadata?: true)
    @phidippides.stubs(
      fetch_page_metadata: {
        body: v1_page_metadata,
        status: '200'
      }
    )
    connection_stub = mock
    connection_stub.stubs(reset_counters: {requests: {}, runtime: 0})
    connection_stub.expects(:get_request).returns('{"grants": [{"flags": ["public"]}]}')
    CoreServer::Base.stubs(connection: connection_stub)

    get :show, id: 'four-four', format: 'json'
    assert_response(:success)
    result = JSON.parse(@response.body).with_indifferent_access
    assert_equal({isPublic: true, rights: []}.with_indifferent_access, result['permissions'])
  end

  test 'show returns 401 if the Core view requires authn' do
    @controller.stubs(can_create_metadata?: true)
    connection_stub = mock
    connection_stub.stubs(reset_counters: {requests: {}, runtime: 0})
    connection_stub.expects(:get_request).with do |url|
      assert_equal('/views/four-four.json', url)
    end.then.raises(CoreServer::CoreServerError.new(nil, 'authentication_required', nil))
    CoreServer::Base.stubs(connection: connection_stub)

    get :show, id: 'four-four', format: 'json'
    assert_response(401)
  end

  test 'show returns 403 if the Core view requires authz' do
    @controller.stubs(can_create_metadata?: true)
    connection_stub = mock
    connection_stub.stubs(reset_counters: {requests: {}, runtime: 0})
    connection_stub.expects(:get_request).with do |url|
      assert_equal('/views/four-four.json', url)
    end.then.raises(CoreServer::CoreServerError.new(nil, 'permission_denied', nil))
    CoreServer::Base.stubs(connection: connection_stub)

    get :show, id: 'four-four', format: 'json'
    assert_response(403)
  end

  test 'delete returns 401 for unauthorized users' do
    dataset_stub = mock
    dataset_stub.stubs(can_edit?: false)
    @controller.stubs(dataset: dataset_stub)
    delete :destroy, id: 'four-four'
    assert_response(401)
  end

  test 'delete uses page_metadata_manager to delete' do
    dataset_stub = mock
    dataset_stub.stubs(can_edit?: true)
    @controller.stubs(dataset: dataset_stub)

    @page_metadata_manager.expects(:delete).with do |id|
      assert_equal(id, 'four-four')
    end.then.returns({ body: nil, status: '200' })

    delete :destroy, id: 'four-four'

    assert_response(200)
  end

  test 'delete still calls delete if core view not found, in case of orphaned phidippides pages' do
    @controller.expects(:dataset).with do |id|
      assert_equal('four-four', id)
    end.then.raises(CoreServer::ResourceNotFound.new(nil))

    @page_metadata_manager.expects(:delete).with do |id|
      assert_equal(id, 'four-four')
    end.then.returns({ body: nil, status: '200' })

    delete :destroy, id: 'four-four'
    assert_response(200)
  end

  test 'delete passes along result from page_metadata_manager' do
    dataset_stub = mock
    dataset_stub.stubs(can_edit?: true)
    @controller.stubs(dataset: dataset_stub)

    @page_metadata_manager.expects(:delete).with do |id|
      assert_equal(id, 'four-four')
    end.then.returns({ body: nil, status: '500' })

    delete :destroy, id: 'four-four'

    assert_response(500)
  end

  test 'create fails when save as is not enabled' do
    stub_feature_flags_with(:enable_data_lens_other_views, false)
    @controller.stubs(can_create_metadata?: true, save_as_enabled?: false)

    post :create, pageMetadata: { datasetId: 'four-four' }.to_json, format: :json
    assert_response(401)
  end

  private

  def v0_page_metadata
    JSON.parse(File.read("#{Rails.root}/test/fixtures/v0-page-metadata.json"))
  end

  def v1_page_metadata
    JSON.parse(File.read("#{Rails.root}/test/fixtures/v1-page-metadata.json"))
  end

  def some_user
    { email: 'foo@bar.com',
      password: 'asdf',
      passwordConfirm: 'asdf',
      accept_terms: true
    }
  end
end
