require 'test_helper'

class PhidippidesPagesControllerTest < ActionController::TestCase

  def setup
    CurrentDomain.set_domain('localhost')
    @controller.stubs(:service_end_point => 'http://localhost:2401')
  end

  test 'index returns 403' do
    get :index, :id => 'four-four', :format => 'json'
    assert_response(403)
  end

  test 'show returns data for a given page' do
    @controller.stubs(
      :current_user => 'user',
      :issue_phidippides_request => { body: mock_page_metadata }
    )
    get :show, :id => 'four-four', :format => 'json'
    assert_response(:success)
    assert_equal([], JSON.parse(@response.body).keys - %w(pageId datasetId name description primaryAmountField primaryAggregation filterSoql isDefaultPage pageSource cards))
  end

  test 'create returns 401 unless logged in' do
    @controller.stubs(:current_user => nil)
    post :create, :pageMetadata => { :datasetId => 'four-four' }, :format => :json
    assert_response(401)
  end

  test 'create returns 406 unless format is JSON' do
    @controller.stubs(
      :current_user => 'user',
      :issue_phidippides_request => ''
    )
    post :create, :pageMetadata => { :datasetId => 'four-four' }
    assert_response(406)
  end

  test 'create returns 405 unless method is a post' do
    @controller.stubs(:current_user => 'user')
    get :create
    assert_response(405)
    put :create
    assert_response(405)
    delete :create
    assert_response(405)
  end

  test 'create returns new page metadata when logged in' do
    @controller.stubs(
      :current_user => 'user',
      :issue_phidippides_request => { body: mock_page_metadata, status: 201 }
    )
    post :create, :pageMetadata => JSON.parse(mock_page_metadata), :format => :json
    assert_response(201)
  end

  test 'update returns 401 unless logged in' do
    @controller.stubs(:current_user => nil)
    put :update, :id => 'q77b-s2zi', :format => :json
    assert_response(401)
  end

  test 'update returns 405 unless method is put' do
    @controller.stubs(:current_user => 'user')
    get :update, :id => 'q77b-s2zi', :format => :json
    assert_response(405)
    post :update, :id => 'q77b-s2zi', :format => :json
    assert_response(405)
    delete :update, :id => 'q77b-s2zi', :format => :json
    assert_response(405)
  end

  test 'update returns 400 unless required params are present' do
    @controller.stubs(:current_user => 'user')
    put :update, :id => 'q77b-s2zi', :format => :json
    assert_response(400)
  end

  test 'update returns success' do
    @controller.stubs(
      :current_user => 'user',
      :issue_phidippides_request => { body: mock_page_metadata, status: 201 }
    )
    put :update, :id => 'four-four', :pageMetadata => mock_page_metadata, :format => :json
    assert_response(201)
  end

  test 'delete return 403' do
    delete :destroy, :id => 'four-four'
    assert_response(403)
  end

  private

  def mock_page_metadata
    File.read("#{Rails.root}/test/fixtures/page-metadata.json")
  end

end
