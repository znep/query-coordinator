require 'test_helper'

class PhidippidesDatasetsControllerTest < ActionController::TestCase

  def setup
    CurrentDomain.set_domain('localhost')
    @controller.stubs(:service_end_point => 'http://localhost:2401')
  end

  test 'index returns list all pages for a given dataset' do
    @controller.stubs(:issue_phidippides_request => { body: mock_pages_metadata })
    get :index, :id => 'four-four', :format => 'json'
    assert_response(:success)
    assert_equal('four-four', JSON.parse(@response.body)['publisher'][0]['datasetId'])
  end

  test 'show returns data for a given dataset' do
    @controller.stubs(
      :current_user => 'user',
      :issue_phidippides_request => { body: mock_dataset_metadata }
    )
    get :show, :id => 'four-four', :format => 'json'
    assert_response(:success)
    assert_equal([], JSON.parse(@response.body).keys - ['id', 'rowDisplayUnit', 'defaultAggregateColumn', 'domain', 'ownerId', 'updatedAt', 'columns', 'pages'])
  end

  test 'create returns 401 unless logged in' do
    @controller.stubs(:current_user => nil)
    post :create
    assert_response(401)
  end

  test 'create returns 406 unless format is JSON' do
    @controller.stubs(
      :current_user => 'user',
      :issue_phidippides_request => ''
    )
    post :create, :id => 'four-four', :datasetMetadata => dataset_metadata.to_json
    assert_response(406)
  end

  test 'create returns 405 unless method is a post' do
    @controller.stubs(:current_user => 'user')
    get :create, :id => 'q77b-s2zi', :format => :json
    assert_response(405)
    put :create, :id => 'q77b-s2zi', :format => :json
    assert_response(405)
    delete :create, :id => 'q77b-s2zi', :format => :json
    assert_response(405)
  end

  test 'create returns new dataset metadata when logged in' do
    @controller.stubs(
      :current_user => 'user',
      :issue_phidippides_request => { body: mock_dataset_metadata, status: 201 }
    )
    post :create, :datasetMetadata => mock_dataset_metadata, :format => :json
    assert_response(201)
  end

  test 'update returns 401 unless logged in' do
    @controller.stubs(:current_user => nil)
    put :update, :id => 'q77b-s2zi', :datasetMetadata => dataset_metadata.to_json, :format => :json
    assert_response(401)
  end

  test 'update returns 405 unless method is put' do
    @controller.stubs(:current_user => 'user')
    get :update, :id => 'q77b-s2zi', :datasetMetadata => dataset_metadata.to_json, :format => :json
    assert_response(405)
    post :update, :id => 'q77b-s2zi', :datasetMetadata => dataset_metadata.to_json, :format => :json
    assert_response(405)
    delete :update, :id => 'q77b-s2zi', :datasetMetadata => dataset_metadata.to_json, :format => :json
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
      :issue_phidippides_request => { body: mock_dataset_metadata, status: 201 }
    )
    put :update, :id => 'four-four', :datasetMetadata => mock_dataset_metadata, :format => :json
    assert_response(201)
  end

  test 'delete return 403' do
    delete :destroy, :id => 'four-four'
    assert_response(403)
  end

  private

  def dataset_metadata
    {
      'id' => 'q77b-s2zi',
      'rowDisplayUnit' => 'rowDisplayUnit',
      'defaultAggregateColumn' => 'defaultAggregateColumn',
      'domain' => 'localhost',
      'ownerId' => 'four-four',
      'updatedAt' => Time.now.utc.iso8601,
      'columns' => []
    }
  end

  def mock_pages_metadata
    {
      :publisher => [
        :datasetId => 'four-four'
      ]
    }
  end

  def mock_dataset_metadata
    File.read("#{Rails.root}/test/fixtures/dataset-metadata.json")
  end

end
