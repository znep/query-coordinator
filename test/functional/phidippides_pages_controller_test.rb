require 'test_helper'

class PhidippidesPagesControllerTest < ActionController::TestCase

  def setup
    CurrentDomain.stubs(domain: stub(cname: 'localhost'))
    @phidippides = Phidippides.new
    @phidippides.stubs(end_point: 'http://localhost:2401')
    @controller.stubs(:phidippides => @phidippides)
  end

  test 'index returns 403' do
    get :index, id: 'four-four', format: 'json'
    assert_response(403)
  end

  test 'show returns data for a given page' do
    @controller.stubs(can_update_metadata?: true)
    @phidippides.stubs(
      fetch_page_metadata: {
        body: mock_page_metadata
      }
    )
    get :show, id: 'four-four', format: 'json'
    assert_response(:success)
    assert_equal([], JSON.parse(@response.body).keys - %w(pageId datasetId name description primaryAmountField primaryAggregation filterSoql isDefaultPage pageSource cards))
  end

  test '(phase 0 or 1) create returns 401 if not logged in' do
    @controller.stubs(can_update_metadata?: false)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    post :create, pageMetadata: { datasetId: 'four-four' }, format: :json
    assert_response(401)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    post :create, pageMetadata: { datasetId: 'four-four' }, format: :json
    assert_response(401)
  end

  test '(phase 0 or 1) create returns 406 if format is not JSON' do
    @controller.stubs(can_update_metadata?: true)
    @phidippides.stubs(issue_request: { status: 200 }, issue_soda_fountain_request: '')

    stub_feature_flags_with(:metadata_transition_phase, '0')
    post :create, pageMetadata: { datasetId: 'four-four' }.to_json
    assert_response(406)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    post :create, pageMetadata: { datasetId: 'four-four' }.to_json
    assert_response(406)
  end

  test '(phase 0 or 1) create returns 405 if method is not POST' do
    @controller.stubs(can_update_metadata?: true)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    get :create
    assert_response(405)
    put :create
    assert_response(405)
    delete :create
    assert_response(405)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    get :create
    assert_response(405)
    put :create
    assert_response(405)
    delete :create
    assert_response(405)
  end

  test '(phase 0 or 1) create returns new page metadata if logged in' do
    @controller.stubs(can_update_metadata?: true)
    PageMetadataManager.any_instance.stubs(create: { body: mock_page_metadata, status: 200 })

    stub_feature_flags_with(:metadata_transition_phase, '0')
    post :create, pageMetadata: mock_page_metadata, format: :json
    assert_response(200)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    post :create, pageMetadata: mock_page_metadata, format: :json
    assert_response(200)
  end

  test '(phase 0 or 1) update returns 401 if not logged in' do
    @controller.stubs(can_update_metadata?: false)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    put :update, id: 'q77b-s2zi', format: :json
    assert_response(401)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    put :update, id: 'q77b-s2zi', format: :json
    assert_response(401)
  end

  test '(phase 0 or 1) update returns 405 if method is not PUT' do
    @controller.stubs(can_update_metadata?: true)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    get :update, id: 'q77b-s2zi', format: :json
    assert_response(405)
    post :update, id: 'q77b-s2zi', format: :json
    assert_response(405)
    delete :update, id: 'q77b-s2zi', format: :json
    assert_response(405)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    get :update, id: 'q77b-s2zi', format: :json
    assert_response(405)
    post :update, id: 'q77b-s2zi', format: :json
    assert_response(405)
    delete :update, id: 'q77b-s2zi', format: :json
    assert_response(405)
  end

  test '(phase 0 or 1) update returns 400 if required parameters are not present' do
    @controller.stubs(can_update_metadata?: true)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    put :update, id: 'q77b-s2zi', format: :json
    assert_response(400)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    put :update, id: 'q77b-s2zi', format: :json
    assert_response(400)
  end

  test '(phase 0 or 1) update returns success' do
    @controller.stubs(can_update_metadata?: true)
    PageMetadataManager.any_instance.stubs(update: { body: mock_page_metadata, status: 200 })

    stub_feature_flags_with(:metadata_transition_phase, '0')
    put :update, id: 'four-four', pageMetadata: mock_page_metadata, format: :json
    assert_response(200)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    put :update, id: 'four-four', pageMetadata: mock_page_metadata, format: :json
    assert_response(200)
  end

  test '(phase 0 or 1) delete returns 403' do
    stub_feature_flags_with(:metadata_transition_phase, '0')
    delete :destroy, id: 'four-four'
    assert_response(403)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    delete :destroy, id: 'four-four'
    assert_response(403)
  end

  private

  def mock_page_metadata
    File.read("#{Rails.root}/test/fixtures/page-metadata.json")
  end

end
