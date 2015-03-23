require 'test_helper'

class PhidippidesPagesControllerTest < ActionController::TestCase

  def setup
    CurrentDomain.stubs(domain: stub(cname: 'localhost'))
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

  test 'index returns 403' do
    get :index, id: 'four-four', format: 'json'
    assert_response(403)
  end

  test 'show returns data for a given page' do
    @controller.stubs(can_update_metadata?: true)
    @phidippides.stubs(
      fetch_page_metadata: {
        body: v0_page_metadata
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
    @controller.stubs(can_update_metadata?: true)
    @phidippides.stubs(
      fetch_page_metadata: {
        body: v0_page_metadata
      }
    )
    connection_stub = mock
    connection_stub.stubs(reset_counters: {requests: {}, runtime: 0})
    connection_stub.expects(:get_request).returns('{"grants": []}')
    CoreServer::Base.stubs(connection: connection_stub)

    get :show, id: 'four-four', format: 'json'
    assert_response(:success)
    result = JSON.parse(@response.body)
    assert_equal('private', result['permissions'])
  end

  test 'show displays permission:public for views public in core' do
    @controller.stubs(can_update_metadata?: true)
    @phidippides.stubs(
      fetch_page_metadata: {
        body: v0_page_metadata
      }
    )
    connection_stub = mock
    connection_stub.stubs(reset_counters: {requests: {}, runtime: 0})
    connection_stub.expects(:get_request).returns('{"grants": [{"flags": ["public"]}]}')
    CoreServer::Base.stubs(connection: connection_stub)

    get :show, id: 'four-four', format: 'json'
    assert_response(:success)
    result = JSON.parse(@response.body)
    assert_equal('public', result['permissions'])
  end

  test 'show returns 401 if the Core view requires authn' do
    @controller.stubs(can_update_metadata?: true)
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
    @controller.stubs(can_update_metadata?: true)
    connection_stub = mock
    connection_stub.stubs(reset_counters: {requests: {}, runtime: 0})
    connection_stub.expects(:get_request).with do |url|
      assert_equal('/views/four-four.json', url)
    end.then.raises(CoreServer::CoreServerError.new(nil, 'permission_denied', nil))
    CoreServer::Base.stubs(connection: connection_stub)

    get :show, id: 'four-four', format: 'json'
    assert_response(403)
  end

  test '(phase 0, 1 or 2) create returns 401 if not logged in' do
    @controller.stubs(can_update_metadata?: false)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    post :create, pageMetadata: { datasetId: 'four-four' }.to_json, format: :json
    assert_response(401)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    post :create, pageMetadata: { datasetId: 'four-four' }.to_json, format: :json
    assert_response(401)

    stub_feature_flags_with(:metadata_transition_phase, '2')
    post :create, json_post.merge(format: :json)
    assert_response(401)
  end

  test '(phase 0, 1) create works fine if format is not JSON' do
    @controller.stubs(can_update_metadata?: true)
    @phidippides.stubs(issue_request: { status: '200' }, issue_soda_fountain_request: '')

    stub_feature_flags_with(:metadata_transition_phase, '0')
    post :create, pageMetadata: { datasetId: 'four-four' }.to_json, format: :text
    assert_response(200)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    post :create, pageMetadata: { datasetId: 'four-four' }.to_json, format: :text
    assert_response(200)
  end

  test '(phase 2) create returns 406 if format is not JSON' do
    @controller.stubs(can_update_metadata?: true)
    @phidippides.stubs(issue_request: { status: '200' }, issue_soda_fountain_request: '')

    stub_feature_flags_with(:metadata_transition_phase, '2')
    post :create, json_post.merge(format: :text)
    assert_response(406)
  end

  test '(phase 2) create returns 400 if JSON does not include datasetId' do
    @controller.stubs(can_update_metadata?: true)
    @page_metadata_manager.unstub(:create)

    stub_feature_flags_with(:metadata_transition_phase, '2')
    modified_page_metadata = v1_page_metadata.except('datasetId').to_json
    set_up_json_request(modified_page_metadata)
    post :create, format: :json
    assert_response(400)
  end

  test '(phase 0, 1 or 2) create returns new page metadata if logged in' do
    @controller.stubs(can_update_metadata?: true)
    @page_metadata_manager.stubs(create: { body: v0_page_metadata.to_json, status: '200' })
    stub_feature_flags_with(:metadata_transition_phase, '0')
    post :create, pageMetadata: v0_page_metadata.to_json, format: :json
    assert_response(200)
    assert_equal(v0_page_metadata, JSON.parse(@response.body))

    stub_feature_flags_with(:metadata_transition_phase, '1')
    post :create, pageMetadata: v0_page_metadata.to_json, format: :json
    assert_response(200)
    assert_equal(v0_page_metadata, JSON.parse(@response.body))

    @page_metadata_manager.stubs(create: { body: v1_page_metadata.to_json, status: '200' })
    Phidippides.any_instance.stubs(request_new_page_id: { body: { id: 'iuya-fxdq' }, status: '200' })
    stub_feature_flags_with(:metadata_transition_phase, '2')
    set_up_json_request(v1_page_metadata.except('pageId').to_json)
    post :create, format: :json
    assert_response(200)
    assert_equal(v1_page_metadata, JSON.parse(@response.body))
  end

  test '(phase 0, 1) update gets past 406 error if format is not JSON' do
    @controller.stubs(can_update_metadata?: true)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    put :update, json_post.merge(id: 'four-four', format: :text)
    assert_response(400)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    put :update, json_post.merge(id: 'four-four', format: :text)
    assert_response(400)
  end

  test '(phase 2) update returns 406 if format is not JSON' do
    @controller.stubs(can_update_metadata?: true)

    stub_feature_flags_with(:metadata_transition_phase, '2')
    put :update, json_post.merge(id: 'four-four', format: :text)
    assert_response(406)
  end

  test '(phase 0, 1 or 2) update returns 401 if not logged in' do
    @controller.stubs(can_update_metadata?: false)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    put :update, id: 'four-four', format: :json
    assert_response(401)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    put :update, id: 'four-four', format: :json
    assert_response(401)

    stub_feature_flags_with(:metadata_transition_phase, '2')
    put :update, json_post.merge(id: 'four-four', format: :json)
    assert_response(401)
  end

  test '(phase 0, 1 or 2) update returns 400 if required parameters are not present' do
    @controller.stubs(can_update_metadata?: true)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    put :update, id: 'four-four', format: :json
    assert_response(400)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    put :update, id: 'four-four', format: :json
    assert_response(400)

    stub_feature_flags_with(:metadata_transition_phase, '2')
    put :update, json_post({}).merge(id: 'four-four', format: :json)
    assert_response(400)
  end

  test '(phase 2) update returns 400 if JSON does not include datasetId' do
    @controller.stubs(can_update_metadata?: true)
    @page_metadata_manager.unstub(:update)

    stub_feature_flags_with(:metadata_transition_phase, '2')
    modified_page_metadata = v1_page_metadata.except('datasetId').to_json
    set_up_json_request(modified_page_metadata)
    put :update, id: 'iuya-fxdq', format: :json
    assert_response(400)
  end

  test '(phase 0, 1 or 2) update returns success' do
    @controller.stubs(can_update_metadata?: true)
    @page_metadata_manager.stubs(update: { body: v0_page_metadata.to_json, status: '200' })

    stub_feature_flags_with(:metadata_transition_phase, '0')
    put :update, id: 'desk-chek', pageMetadata: v0_page_metadata.to_json, format: :json
    assert_response(200)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    put :update, id: 'desk-chek', pageMetadata: v0_page_metadata.to_json, format: :json
    assert_response(200)

    @page_metadata_manager.stubs(update: { body: nil, status: '200' })
    stub_feature_flags_with(:metadata_transition_phase, '2')
    set_up_json_request(v1_page_metadata.to_json)
    put :update, id: 'iuya-fxdq', format: :json
    assert_response(200)
  end

  test '(phase 0, 1 or 2) update returns 406 when body page_id != endpoint id' do
    @controller.stubs(can_update_metadata?: true)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    put :update, id: 'four-four', pageMetadata: {pageId: 'five-five'}.to_json, format: :json
    assert_response(406)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    put :update, id: 'four-four', pageMetadata: {pageId: 'five-five'}.to_json, format: :json
    assert_response(406)

    stub_feature_flags_with(:metadata_transition_phase, '2')
    modified_page_metadata = v1_page_metadata.deep_dup.tap { |page_metadata| page_metadata['pageId'] = 'five-five' }
    set_up_json_request(modified_page_metadata.to_json)
    put :update, id: 'iuya-fxdq', format: :json
    assert_response(406)
  end

  test '(phase 0, 1 or 2) delete returns 403' do
    stub_feature_flags_with(:metadata_transition_phase, '0')
    delete :destroy, id: 'four-four'
    assert_response(403)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    delete :destroy, id: 'four-four'
    assert_response(403)
  end

  # These tests are working but disabled until we are confident in moving
  # forward with delete functionality.
  #
  # test '(phase 2) delete returns 401 for unauthorized users' do
  #   @controller.stubs(can_update_metadata?: false)
  #   stub_feature_flags_with(:metadata_transition_phase, '2')
  #   delete :destroy, id: 'four-four'
  #   assert_response(401)
  # end

  # test '(phase 2) delete returns 405 if the http method is not DELETE' do
  #   @controller.stubs(can_update_metadata?: true)

  #   stub_feature_flags_with(:metadata_transition_phase, '2')
  #   get :destroy, id: 'four-four', format: :json
  #   assert_response(405)
  #   post :destroy, id: 'four-four', format: :json
  #   assert_response(405)
  #   put :destroy, id: 'four-four', format: :json
  #   assert_response(405)
  # end

  # test '(phase 2) delete returns success' do
  #   @controller.stubs(can_update_metadata?: true)
  #   Phidippides.any_instance.stubs(delete_page_metadata: { body: nil, status: '200' })
  #   stub_feature_flags_with(:metadata_transition_phase, '2')
  #   delete :destroy, id: 'four-four'
  #   assert_response(200)
  # end

  test 'create fails when save as is not enabled' do
    stub_feature_flags_with(:enable_data_lens_save_as_button, false)
    @controller.stubs(can_update_metadata?: true, save_as_enabled?: false)

    post :create, pageMetadata: { datasetId: 'four-four' }.to_json, format: :json
    assert_response(401)
  end

  test 'create succeeds when save as is enabled' do
    @controller.stubs(can_update_metadata?: true, save_as_enabled?: true)
    @page_metadata_manager.stubs(create: { body: v0_page_metadata.to_json, status: '200' })
    stub_feature_flags_with(:metadata_transition_phase, '0')

    post :create, pageMetadata: v0_page_metadata.to_json, format: :json
    assert_response(200)
  end

  private

  def v0_page_metadata
    JSON.parse(File.read("#{Rails.root}/test/fixtures/v0-page-metadata.json"))
  end

  def v1_page_metadata
    JSON.parse(File.read("#{Rails.root}/test/fixtures/v1-page-metadata.json"))
  end

end
