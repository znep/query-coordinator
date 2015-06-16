require 'test_helper'

class PhidippidesDatasetsControllerTest < ActionController::TestCase

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
    @new_view_manager = NewViewManager.new
    @new_view_manager.stubs(fetch: { grants: [{ flags: ['public'] }] })
    @controller.stubs(
      :phidippides => @phidippides,
      :new_view_manager => @new_view_manager
    )
  end

  def set_up_json_request(body = nil)
    body = mock_v1_dataset_metadata.to_json unless body.present?

    @request.env['RAW_POST_DATA'] = body
    @request.env['CONTENT_TYPE'] = 'application/json'
  end

  test 'index returns list all v1 pages for a given dataset' do
    @phidippides.stubs(fetch_pages_for_dataset: { status: '200', body: mock_v1_mixed_pages_for_dataset_metadata })
    get :index, id: 'four-four', format: 'json'
    assert_response(:success)
    assert(JSON.parse(@response.body)['publisher'].all? { |page| page['version'] == '1' }, 'expected all pages to be v1')
  end

  test 'show gives forbidden error if CoreServer raises an error' do
    connection_stub = mock
    connection_stub.stubs(reset_counters: { requests: {}, runtime: 0 })
    connection_stub.stubs(:get_request).raises(CoreServer::Error.new)
    CoreServer::Base.stubs(connection: connection_stub)

    @controller.stubs(can_create_metadata?: true)
    @phidippides.stubs(issue_request: { body: mock_v1_dataset_metadata, status: '200' })
    get :show, id: 'four-four', format: 'json'
    assert_response(403)
  end

  test 'show gives forbidden error if CoreServer returns an error object' do
    connection_stub = mock
    connection_stub.stubs(reset_counters: { requests: {}, runtime: 0 })
    connection_stub.stubs(:get_request).returns('{"error":true}')
    CoreServer::Base.stubs(connection: connection_stub)

    @controller.stubs(can_create_metadata?: true)
    @phidippides.stubs(issue_request: { body: mock_v1_dataset_metadata, status: '200' })
    get :show, id: 'four-four', format: 'json'
    assert_response(403)
  end

  test 'show returns data for a given dataset' do
    connection_stub = mock
    connection_stub.stubs(reset_counters: { requests: {}, runtime: 0 })
    connection_stub.stubs(:get_request).returns('[{"_0": "0"}]', '')
    CoreServer::Base.stubs(connection: connection_stub)
    @controller.stubs(can_create_metadata?: true)
    @phidippides.stubs(issue_request: { body: mock_v1_dataset_metadata, status: '200' })

    get :show, id: 'four-four', format: 'json'

    assert_response(:success)
    metadata = JSON.parse(@response.body).with_indifferent_access
    assert_equal(
      ['permissions', 'columns', 'defaultPage', 'description', 'domain', 'id', 'locale', 'name', 'ownerId', 'updatedAt'].sort,
      metadata.keys.sort)

    # It should flag subcolumns with no data
    columns = metadata[:columns]
    assert(columns[:parent_column_child_no_data][:isSubcolumn])
    assert(columns[:parent_column_child_has_data][:isSubcolumn])
    assert(!columns[:time_column_fine_granularity][:isSubcolumn])
    assert(!columns[:parent_column][:isSubcolumn])
    assert_equal(columns.count - 2, columns.count { |key, column| !column[:isSubcolumn] })
  end

  test 'update returns 401 unless has necessary rights' do
    dataset_stub = mock
    dataset_stub.stubs(can_edit?: false)
    @controller.stubs(can_create_metadata?: false, dataset: dataset_stub)
    put :update, id: 'q77b-s2zi', datasetMetadata: mock_v1_dataset_metadata.to_json, format: :json
    assert_response(401)
  end

  test 'can_create_metadata? returns true when logged in and user is dataset owner (publisher)' do
    stub_user = stub(is_owner?: true, is_admin?: false, roleName: 'publisher')
    @controller.stubs(current_user: stub_user, dataset: 'foo')
    assert(@controller.send(:can_create_metadata?))
  end

  test 'can_create_metadata? returns true when logged in and user is superadmin' do
    stub_user = stub(is_owner?: false, is_admin?: true, roleName: 'administrator')
    @controller.stubs(current_user: stub_user, dataset: 'foo')
    assert(@controller.send(:can_create_metadata?))
  end

  test 'can_create_metadata? returns false when not logged in' do
    @controller.stubs(current_user: nil)
    refute(@controller.send(:can_create_metadata?))
  end

  test 'can_create_metadata? returns false when logged in but not dataset owner and not admin or publisher' do
    stub_user = stub(is_owner?: false, is_admin?: false, roleName: 'editor')
    @controller.stubs(current_user: stub_user, dataset: 'foo')
    refute(@controller.send(:can_create_metadata?))
  end

  test 'can_create_metadata? returns true when logged in as publisher but not dataset owner and not admin' do
    stub_user = stub(is_owner?: false, is_admin?: false, roleName: 'publisher')
    @controller.stubs(current_user: stub_user, dataset: 'foo')
    assert(@controller.send(:can_create_metadata?))
  end

  test 'can_create_metadata? returns true when logged in as (non-super) admininstrator but not dataset owner' do
    stub_user = stub(is_owner?: false, is_admin?: false, roleName: 'administrator')
    @controller.stubs(current_user: stub_user, dataset: 'foo')
    assert(@controller.send(:can_create_metadata?))
  end

  private

  def mock_pages_metadata
    { publisher: [ { datasetId: 'four-four', pageId: 'some-page' } ], user: [] }
  end

  def mock_v0_and_v1_mixed_pages_for_dataset_metadata
    { publisher: [ { datasetId: 'four-four', pageId: 'olde-page' }, { datasetId: 'four-four', pageId: 'neww-page', version: '1' } ], user: [] }
  end

  def mock_v1_mixed_pages_for_dataset_metadata
    { publisher: [ { datasetId: 'four-four', pageId: 'neww-page', version: '1' } ], user: [] }
  end

  def mock_v0_dataset_metadata
    JSON.parse(File.read("#{Rails.root}/test/fixtures/v0-dataset-metadata.json"))
  end

  def mock_v1_dataset_metadata
    JSON.parse(File.read("#{Rails.root}/test/fixtures/v1-dataset-metadata.json"))
  end

  def some_user
    { email: 'foo@bar.com',
      password: 'asdf',
      passwordConfirm: 'asdf',
      accept_terms: true
    }
  end
end
