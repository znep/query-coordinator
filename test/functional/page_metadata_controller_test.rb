require 'test_helper'

class PageMetadataControllerTest < ActionController::TestCase

  def setup
    init_core_session
    init_current_domain
    UserSession.any_instance.stubs(
      save: Net::HTTPSuccess.new(1.1, 200, 'Success'),
      find_token: true
    )
    User.stubs(current_user: User.new(some_user))

    @page_metadata_manager = PageMetadataManager.new
    @controller.stubs(
      page_metadata_manager: @page_metadata_manager,
      save_as_enabled?: true
    )
    @page_metadata_manager.stubs(
      show: { body: '', status: '200' },
      create: { body: '', status: '200' },
      update: { body: '', status: '200' }
    )

    StandaloneVisualizationManager.any_instance.stubs(
      create: {id: 'page-test'}
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
    body = data_lens_page_metadata.to_json unless body.present?

    @request.env['RAW_POST_DATA'] = body
    @request.env['CONTENT_TYPE'] = 'application/json'
  end

  test 'show returns data for a given page' do
    @controller.stubs(can_create_metadata?: true)
    @page_metadata_manager.stubs(
      show: data_lens_page_metadata.merge(core_permissions_public)
    )
    get :show, id: 'four-four', format: 'json'
    assert_response(:success)
    result = JSON.parse(@response.body)
    assert((%w(
      cards datasetId description name pageId version defaultDateTruncFunction permissions
    ) - result.keys).empty?)
  end

  test 'show returns 401 if the Core view requires authn' do
    @controller.stubs(can_create_metadata?: true)
    @page_metadata_manager.stubs(:show).raises(NewViewManager::ViewAuthenticationRequired)

    get :show, id: 'four-four', format: 'json'
    assert_response(401)
  end

  test 'show returns 403 if the Core view requires authz' do
    @controller.stubs(can_create_metadata?: true)
    @page_metadata_manager.stubs(:show).raises(NewViewManager::ViewAccessDenied)

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

  test 'create fails when neither save-as nor ephemeral-bootstrap is enabled' do
    @controller.stubs(can_create_metadata?: true, save_as_enabled?: false, ephemeral_bootstrap_enabled?: false)

    post :create, pageMetadata: { datasetId: 'four-four' }.to_json, format: :json
    assert_response(401)
  end

  test 'create_standalone_visualization passes along result from standalone_visualization_manager' do
    post :create_standalone_visualization, vif: vif
    assert_response(200)
    result = JSON.parse(@response.body)
    assert_equal({'id' => 'page-test'}, result)
  end

  private

  def data_lens_page_metadata
    outer_metadata = JSON.parse(File.read("#{Rails.root}/test/fixtures/v2-page-metadata.json"))
    outer_metadata['displayFormat']['data_lens_page_metadata']
  end

  def core_permissions_public
    JSON.parse(File.read("#{Rails.root}/test/fixtures/core-permissions-public.json"))
  end

  def vif
    JSON.parse(File.read("#{Rails.root}/test/fixtures/vif.json"))
  end

  def some_user
    { email: 'foo@bar.com',
      password: 'asdf',
      passwordConfirm: 'asdf',
      accept_terms: true
    }
  end
end
