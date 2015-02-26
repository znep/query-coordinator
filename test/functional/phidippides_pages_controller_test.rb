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
        body: v0_page_metadata
      }
    )
    get :show, pageId: 'four-four', format: 'json'
    assert_response(:success)
    assert_equal([], JSON.parse(@response.body).keys - %w(pageId datasetId name description primaryAmountField primaryAggregation filterSoql isDefaultPage pageSource cards))
  end

  test '(phase 0, 1 or 2) create returns 401 if not logged in' do
    @controller.stubs(can_update_metadata?: false)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    post :create, pageMetadata: { datasetId: 'four-four' }, format: :json
    assert_response(401)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    post :create, pageMetadata: { datasetId: 'four-four' }, format: :json
    assert_response(401)

    stub_feature_flags_with(:metadata_transition_phase, '2')
    post :create, pageMetadata: { datasetId: 'four-four', pageId: 'page-page' }, format: :json
    assert_response(401)
  end

  test '(phase 0, 1 or 2) create returns 406 if format is not JSON' do
    @controller.stubs(can_update_metadata?: true)
    @phidippides.stubs(issue_request: { status: '200' }, issue_soda_fountain_request: '')

    stub_feature_flags_with(:metadata_transition_phase, '0')
    post :create, pageMetadata: { datasetId: 'four-four' }.to_json, format: :text
    assert_response(406)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    post :create, pageMetadata: { datasetId: 'four-four' }.to_json, format: :text
    assert_response(406)

    stub_feature_flags_with(:metadata_transition_phase, '2')
    post :create, pageMetadata: { datasetId: 'four-four', pageId: 'page-page' }.to_json, format: :text
    assert_response(406)
  end

  test '(phase 0, 1 or 2) create returns 405 if method is not POST' do
    @controller.stubs(can_update_metadata?: true)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    get :create, format: :json
    assert_response(405)
    put :create, format: :json
    assert_response(405)
    delete :create, format: :json
    assert_response(405)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    get :create, format: :json
    assert_response(405)
    put :create, format: :json
    assert_response(405)
    delete :create, format: :json
    assert_response(405)

    stub_feature_flags_with(:metadata_transition_phase, '2')
    get :create, format: :json
    assert_response(405)
    put :create, format: :json
    assert_response(405)
    delete :create, format: :json
    assert_response(405)
  end

  test '(phase 0, 1 or 2) create returns new page metadata if logged in' do
    @controller.stubs(can_update_metadata?: true)
    PageMetadataManager.any_instance.stubs(create: { body: v0_page_metadata, status: '200' })
    stub_feature_flags_with(:metadata_transition_phase, '0')
    post :create, pageMetadata: v0_page_metadata, format: :json
    assert_response(200)
    assert_equal(v0_page_metadata, @response.body)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    post :create, pageMetadata: v0_page_metadata, format: :json
    assert_response(200)
    assert_equal(v0_page_metadata, @response.body)

    PageMetadataManager.any_instance.stubs(create: { body: v1_page_metadata, status: '200' })
    Phidippides.any_instance.stubs(request_new_page_id: { body: { id: 'iuya-fxdq' }, status: '200' })
    stub_feature_flags_with(:metadata_transition_phase, '2')
    post :create, pageMetadata: JSON.parse(v1_page_metadata).except('pageId').to_json, format: :json
    assert_response(200)
    assert_equal(v1_page_metadata, @response.body)
  end

  test '(phase 0, 1 or 2) update returns 406 if format is not JSON' do
    @controller.stubs(can_update_metadata?: false)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    put :update, pageId: 'four-four', format: :text
    assert_response(406)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    put :update, pageId: 'four-four', format: :text
    assert_response(406)

    stub_feature_flags_with(:metadata_transition_phase, '2')
    put :update, pageId: 'four-four', format: :text
    assert_response(406)
  end

  test '(phase 0, 1 or 2) update returns 401 if not logged in' do
    @controller.stubs(can_update_metadata?: false)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    put :update, pageId: 'four-four', format: :json
    assert_response(401)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    put :update, pageId: 'four-four', format: :json
    assert_response(401)

    stub_feature_flags_with(:metadata_transition_phase, '2')
    put :update, pageId: 'four-four', format: :json
    assert_response(401)
  end

  test '(phase 0, 1 or 2) update returns 405 if method is not PUT' do
    @controller.stubs(can_update_metadata?: true)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    get :update, pageId: 'four-four', format: :json
    assert_response(405)
    post :update, pageId: 'four-four', format: :json
    assert_response(405)
    delete :update, pageId: 'four-four', format: :json
    assert_response(405)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    get :update, pageId: 'four-four', format: :json
    assert_response(405)
    post :update, pageId: 'four-four', format: :json
    assert_response(405)
    delete :update, pageId: 'four-four', format: :json
    assert_response(405)

    stub_feature_flags_with(:metadata_transition_phase, '2')
    get :update, pageId: 'four-four', format: :json
    assert_response(405)
    post :update, pageId: 'four-four', format: :json
    assert_response(405)
    delete :update, pageId: 'four-four', format: :json
    assert_response(405)
  end

  test '(phase 0, 1 or 2) update returns 400 if required parameters are not present' do
    @controller.stubs(can_update_metadata?: true)

    stub_feature_flags_with(:metadata_transition_phase, '0')
    put :update, pageId: 'four-four', format: :json
    assert_response(400)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    put :update, pageId: 'four-four', format: :json
    assert_response(400)

    stub_feature_flags_with(:metadata_transition_phase, '2')
    put :update, pageId: 'four-four', format: :json
    assert_response(400)
  end

  test '(phase 0, 1 or 2) update returns success' do
    @controller.stubs(can_update_metadata?: true)
    PageMetadataManager.any_instance.stubs(update: { body: v0_page_metadata, status: '200' })

    stub_feature_flags_with(:metadata_transition_phase, '0')
    put :update, pageId: 'four-four', pageMetadata: v0_page_metadata, format: :json
    assert_response(200)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    put :update, pageId: 'four-four', pageMetadata: v0_page_metadata, format: :json
    assert_response(200)

    PageMetadataManager.any_instance.stubs(update: { body: nil, status: '200' })
    stub_feature_flags_with(:metadata_transition_phase, '2')
    put :update, pageId: 'four-four', pageMetadata: v1_page_metadata, format: :json
    assert_response(200)
  end

  test '(phase 0, 1 or 2) delete returns 403' do
    stub_feature_flags_with(:metadata_transition_phase, '0')
    delete :destroy, pageId: 'four-four'
    assert_response(403)

    stub_feature_flags_with(:metadata_transition_phase, '1')
    delete :destroy, pageId: 'four-four'
    assert_response(403)
  end

  # These tests are working but disabled until we are confident in moving
  # forward with delete functionality.
  #
  # test '(phase 2) delete returns 401 for unauthorized users' do
  #   @controller.stubs(can_update_metadata?: false)
  #   stub_feature_flags_with(:metadata_transition_phase, '2')
  #   delete :destroy, pageId: 'four-four'
  #   assert_response(401)
  # end

  # test '(phase 2) delete returns 405 if the http method is not DELETE' do
  #   @controller.stubs(can_update_metadata?: true)

  #   stub_feature_flags_with(:metadata_transition_phase, '2')
  #   get :destroy, pageId: 'four-four', format: :json
  #   assert_response(405)
  #   post :destroy, pageId: 'four-four', format: :json
  #   assert_response(405)
  #   put :destroy, pageId: 'four-four', format: :json
  #   assert_response(405)
  # end

  # test '(phase 2) delete returns success' do
  #   @controller.stubs(can_update_metadata?: true)
  #   Phidippides.any_instance.stubs(delete_page_metadata: { body: nil, status: '200' })
  #   stub_feature_flags_with(:metadata_transition_phase, '2')
  #   delete :destroy, pageId: 'four-four'
  #   assert_response(200)
  # end

  private

  def v0_page_metadata
    File.read("#{Rails.root}/test/fixtures/v0-page-metadata.json")
  end

  def v1_page_metadata
    File.read("#{Rails.root}/test/fixtures/v1-page-metadata.json")
  end

end
