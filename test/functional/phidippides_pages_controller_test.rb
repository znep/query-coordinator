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
    @controller.stubs(has_rights?: true)
    PageMetadataManager.any_instance.stubs(fetch: { body: mock_page_metadata, status: 200 })
    get :show, id: 'four-four', format: 'json'
    assert_response(:success)
    assert_equal([], JSON.parse(@response.body).keys - %w(pageId datasetId name description primaryAmountField primaryAggregation filterSoql isDefaultPage pageSource cards))
  end

  test 'create returns 401 unless logged in' do
    @controller.stubs(has_rights?: false)
    post :create, pageMetadata: { datasetId: 'four-four' }, format: :json
    assert_response(401)
  end

  test 'create returns 406 unless format is JSON' do
    @controller.stubs(has_rights?: true)
    @phidippides.stubs(issue_request: { status: 200 }, issue_soda_fountain_request: '')
    post :create, pageMetadata: { datasetId: 'four-four' }.to_json
    assert_response(406)
  end

  test 'create returns 405 unless method is a post' do
    @controller.stubs(has_rights?: true)
    get :create
    assert_response(405)
    put :create
    assert_response(405)
    delete :create
    assert_response(405)
  end

  test 'create returns new page metadata when logged in' do
    @controller.stubs(has_rights?: true)
    PageMetadataManager.any_instance.stubs(create: { body: mock_page_metadata, status: 200 })
    post :create, pageMetadata: mock_page_metadata, format: :json
    assert_response(200)
  end

  test 'update returns 401 unless logged in' do
    @controller.stubs(has_rights?: false)
    put :update, id: 'q77b-s2zi', format: :json
    assert_response(401)
  end

  test 'update returns 405 unless method is put' do
    @controller.stubs(has_rights?: true)
    get :update, id: 'q77b-s2zi', format: :json
    assert_response(405)
    post :update, id: 'q77b-s2zi', format: :json
    assert_response(405)
    delete :update, id: 'q77b-s2zi', format: :json
    assert_response(405)
  end

  test 'update returns 400 unless required params are present' do
    @controller.stubs(has_rights?: true)
    put :update, id: 'q77b-s2zi', format: :json
    assert_response(400)
  end

  test 'update returns success' do
    @controller.stubs(has_rights?: true)
    PageMetadataManager.any_instance.stubs(update: { body: mock_page_metadata, status: 200 })
    put :update, id: 'four-four', pageMetadata: mock_page_metadata, format: :json
    assert_response(200)
  end

  test 'delete return 403' do
    delete :destroy, id: 'four-four'
    assert_response(403)
  end

  test 'has_rights? returns true when logged in and user is dataset owner (publisher)' do
    stub_user = stub(is_owner?: true, is_admin?: false, roleName: 'publisher')
    @controller.stubs(current_user: stub_user, dataset: 'foo')
    assert(@controller.send(:has_rights?))
  end

  test 'has_rights? returns true when logged in and user is (super) admin' do
    stub_user = stub(is_owner?: false, is_admin?: true, roleName: 'administrator')
    @controller.stubs(current_user: stub_user, dataset: 'foo')
    assert(@controller.send(:has_rights?))
  end

  test 'has_rights? returns false when not logged in' do
    @controller.stubs(current_user: nil)
    refute(@controller.send(:has_rights?))
  end

  test 'has_rights? returns false when logged in but not database owner and not admin or publisher' do
    stub_user = stub(is_owner?: false, is_admin?: false, roleName: 'editor')
    @controller.stubs(current_user: stub_user, dataset: 'foo')
    refute(@controller.send(:has_rights?))
  end

  test 'has_rights? returns true when logged in and user is (non-super) admin' do
    stub_user = stub(is_owner?: false, is_admin?: false, roleName: 'administrator')
    @controller.stubs(current_user: stub_user, dataset: 'foo')
    assert(@controller.send(:has_rights?))
  end


  test 'has_rights? returns true when logged in and user is publisher' do
    stub_user = stub(is_owner?: false, is_admin?: false, roleName: 'publisher')
    @controller.stubs(current_user: stub_user, dataset: 'foo')
    assert(@controller.send(:has_rights?))
  end


  private

  def mock_page_metadata
    File.read("#{Rails.root}/test/fixtures/page-metadata.json")
  end

end
