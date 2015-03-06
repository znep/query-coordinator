require 'test_helper'

class PhidippidesDatasetsControllerTest < ActionController::TestCase

  def setup
    CurrentDomain.stubs(domain: stub(cname: 'localhost'))
    @phidippides = Phidippides.new
    @phidippides.stubs(end_point: 'http://localhost:2401')
    @controller.stubs(:phidippides => @phidippides)
  end

  test 'index returns list all pages for a given dataset' do
    @phidippides.stubs(fetch_pages_for_dataset: { body: mock_pages_metadata })
    get :index, id: 'four-four', format: 'json'
    assert_response(:success)
    assert_equal('four-four', JSON.parse(@response.body)['publisher'][0]['datasetId'])
  end

  test 'show returns data for a given dataset' do
    @controller.stubs(can_update_metadata?: true)
    @phidippides.stubs(issue_request: { body: mock_dataset_metadata })
    get :show, id: 'four-four', format: 'json'
    assert_response(:success)
    assert_equal([], JSON.parse(@response.body).keys - ['id', 'rowDisplayUnit', 'defaultAggregateColumn', 'domain', 'ownerId', 'updatedAt', 'columns', 'pages'])
  end

  test 'show calls migrate_dataset_metadata_to_v1 on a successful request' do
    @controller.stubs(can_update_metadata?: true)
    @phidippides.stubs(issue_request: { status: '200', body: mock_dataset_metadata }.with_indifferent_access)
    @phidippides.expects(:migrate_dataset_metadata_to_v1).with do |result|
      assert_equal('q77b-s2zi', result[:body][:id])
    end
    get :show, id: 'four-four', format: 'json'
    assert_response(:success)
  end

  test 'show does not call migrate_dataset_metadata_to_v1 on an unsuccessful request' do
    @controller.stubs(can_update_metadata?: true)
    @phidippides.stubs(issue_request: { status: 404, body: mock_dataset_metadata }.with_indifferent_access)
    @phidippides.expects(:migrate_dataset_metadata_to_v1).times(0)
    get :show, id: 'four-four', format: 'json'
  end

  test '(phase 0) create returns 401 unless logged in' do
    @controller.stubs(can_update_metadata?: false)
    post :create, format: :json
    assert_response(401)
  end

  test '(phase 0, 1, 2) create returns 404 unless in stage 0' do
    @controller.stubs(can_update_metadata?: false)
    @phidippides.stubs(issue_request: { body: 'not json', status: 200 })

    stub_feature_flags_with(:metadata_transition_phase, '0')
    post :create, id: 'four-four', datasetMetadata: '{}', format: :text
    assert_response(401)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    post :create, id: 'four-four', datasetMetadata: '{}', format: :text
    assert_response(404)

    stub_feature_flags_with(:metadata_transition_phase, '2')
    post :create, id: 'four-four', datasetMetadata: '{}', format: :text
    assert_response(404)
  end

  test '(phase 0) create returns 405 unless method is a post' do
    @controller.stubs(can_update_metadata?: true)
    get :create, id: 'q77b-s2zi', format: :json
    assert_response(405)
    put :create, id: 'q77b-s2zi', format: :json
    assert_response(405)
    delete :create, id: 'q77b-s2zi', format: :json
    assert_response(405)
  end

  test '(phase 0) create returns new dataset metadata when logged in' do
    @controller.stubs(can_update_metadata?: true)
    @phidippides.stubs(issue_request: { body: mock_dataset_metadata, status: 200 })
    stub_feature_flags_with(:metadata_transition_phase, '0')
    post :create, datasetMetadata: mock_dataset_metadata.to_json, format: :json
    assert_response(200)
  end

  test '(phase 1 or 2) create returns 404' do
    @controller.stubs(can_update_metadata?: true)
    @phidippides.stubs(issue_request: { body: mock_dataset_metadata, status: 200 })
    stub_feature_flags_with(:metadata_transition_phase, '1')
    post :create, datasetMetadata: mock_dataset_metadata.to_json, format: :json
    assert_response(404)

    stub_feature_flags_with(:metadata_transition_phase, '2')
    post :create, datasetMetadata: mock_dataset_metadata.to_json, format: :json
    assert_response(404)
  end

  test '(phase 0, 1) update works when format is not JSON' do
    @controller.stubs(can_update_metadata?: true)
    @phidippides.stubs(update_dataset_metadata: { body: '', status: 200 })

    stub_feature_flags_with(:metadata_transition_phase, '0')
    put :update, id: 'four-four', datasetMetadata: '{}', format: :text
    assert_response(:success)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    put :update, id: 'four-four', datasetMetadata: '{}', format: :text
    assert_response(:success)
  end

  test '(phase 2) update returns 406 unless format is JSON' do
    @controller.stubs(can_update_metadata?: true)
    @phidippides.stubs(issue_request: { body: 'not json', status: 200 })

    stub_feature_flags_with(:metadata_transition_phase, '2')
    put :update, id: 'four-four', datasetMetadata: '{}', format: :text
    assert_response(406)
  end

  test 'update returns 401 unless has necessary rights' do
    @controller.stubs(can_update_metadata?: false)
    put :update, id: 'q77b-s2zi', datasetMetadata: mock_dataset_metadata.to_json, format: :json
    assert_response(401)
  end

  test 'update returns 405 unless method is put' do
    @controller.stubs(can_update_metadata?: true)
    get :update, id: 'q77b-s2zi', datasetMetadata: mock_dataset_metadata.to_json, format: :json
    assert_response(405)
    post :update, id: 'q77b-s2zi', datasetMetadata: mock_dataset_metadata.to_json, format: :json
    assert_response(405)
    delete :update, id: 'q77b-s2zi', datasetMetadata: mock_dataset_metadata.to_json, format: :json
    assert_response(405)
  end

  test 'update returns 400 unless required params are present' do
    @controller.stubs(can_update_metadata?: true)
    put :update, id: 'q77b-s2zi', format: :json
    assert_response(400)
  end

  test 'update returns 406 if body id != endpoint id' do
    stub_feature_flags_with(:metadata_transition_phase, '0')
    @controller.stubs(can_update_metadata?: true)
    put :update, id: 'fake-four', datasetMetadata: mock_dataset_metadata.to_json, format: :json
    assert_response(406)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    put :update, id: 'fake-four', datasetMetadata: mock_dataset_metadata.to_json, format: :json
    assert_response(406)

    stub_feature_flags_with(:metadata_transition_phase, '2')
    put :update, id: 'fake-four', datasetMetadata: mock_dataset_metadata.to_json, format: :json
    assert_response(406)
  end

  test '(phase 0) update returns 200 success' do
    @controller.stubs(can_update_metadata?: true)
    @phidippides.stubs(issue_request: { body: mock_dataset_metadata, status: 200 })
    stub_feature_flags_with(:metadata_transition_phase, '0')
    put :update, id: 'q77b-s2zi', datasetMetadata: mock_dataset_metadata.to_json, format: :json
    assert_response(200)
  end

  test '(phase 1 or 2) update returns 204 no content' do
    @controller.stubs(can_update_metadata?: true)
    @phidippides.stubs(issue_request: { body: mock_dataset_metadata, status: 200 })

    stub_feature_flags_with(:metadata_transition_phase, '1')
    put :update, id: 'q77b-s2zi', datasetMetadata: mock_dataset_metadata.to_json, format: :json
    assert_response(204)

    stub_feature_flags_with(:metadata_transition_phase, '2')
    @request.env['CONTENT_TYPE'] = 'application/json'
    put :update, mock_dataset_metadata.merge(id: 'q77b-s2zi', format: :json)
    assert_response(204)
  end

  test '(phase 0) delete returns 403' do
    stub_feature_flags_with(:metadata_transition_phase, '0')
    delete :destroy, id: 'four-four'
    assert_response(403)
  end

  test '(phase 1 or 2) delete returns 400' do
    stub_feature_flags_with(:metadata_transition_phase, '1')
    delete :destroy, id: 'four-four'
    assert_response(400)

    stub_feature_flags_with(:metadata_transition_phase, '2')
    delete :destroy, id: 'four-four'
    assert_response(400)
  end

  test 'can_update_metadata? returns true when logged in and user is dataset owner (publisher)' do
    stub_user = stub(is_owner?: true, is_admin?: false, roleName: 'publisher')
    @controller.stubs(current_user: stub_user, dataset: 'foo')
    assert(@controller.send(:can_update_metadata?))
  end

  test 'can_update_metadata? returns true when logged in and user is superadmin' do
    stub_user = stub(is_owner?: false, is_admin?: true, roleName: 'administrator')
    @controller.stubs(current_user: stub_user, dataset: 'foo')
    assert(@controller.send(:can_update_metadata?))
  end

  test 'can_update_metadata? returns false when not logged in' do
    @controller.stubs(current_user: nil)
    refute(@controller.send(:can_update_metadata?))
  end

  test 'can_update_metadata? returns false when logged in but not dataset owner and not admin or publisher' do
    stub_user = stub(is_owner?: false, is_admin?: false, roleName: 'editor')
    @controller.stubs(current_user: stub_user, dataset: 'foo')
    refute(@controller.send(:can_update_metadata?))
  end

  test 'can_update_metadata? returns true when logged in as publisher but not dataset owner and not admin' do
    stub_user = stub(is_owner?: false, is_admin?: false, roleName: 'publisher')
    @controller.stubs(current_user: stub_user, dataset: 'foo')
    assert(@controller.send(:can_update_metadata?))
  end

  test 'can_update_metadata? returns true when logged in as (non-super) admininstrator but not dataset owner' do
    stub_user = stub(is_owner?: false, is_admin?: false, roleName: 'administrator')
    @controller.stubs(current_user: stub_user, dataset: 'foo')
    assert(@controller.send(:can_update_metadata?))
  end

  private

  def mock_pages_metadata
    { publisher: [ { datasetId: 'four-four', pageId: 'some-page' } ], user: [] }
  end

  def mock_dataset_metadata
    JSON.parse(File.read("#{Rails.root}/test/fixtures/v0-dataset-metadata.json"))
  end

end
