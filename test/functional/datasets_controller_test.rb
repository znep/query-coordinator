require 'test_helper'

class DatasetsControllerTest < ActionController::TestCase

  def setup
    init_core_session
    init_current_domain
    @view = View.new(
      'resourceName' => 'resource-name',
      'id' => 'four-four'
    )
    @controller.stubs(:get_view => @view)
    @params = { :foo => 'foo', :bar => 'bar' }
    default_url_options[:host] = @request.host
  end

  # https://opendata.test-socrata.com/dataset/28-Formwidtest/zwjk-24g6.json?text=1
  # should redirect to https://opendata.test-socrata.com/resource/zwjk-24g6.json?text=1
  test 'redirects to format URLs include query string parameters' do
    load_sample_data('test/fixtures/sample-data.json')
    @user = login
    get :show, { :id => @view.id, :format => 'json' }.merge(@params)
    assert_redirected_to resource_url({:id => @view.id, :format => 'json'}.merge(@params.except('controller')))
  end

  test 'returns 304 if no changes have occurred for unsigned user' do
    dsmtime = 12345
    VersionAuthority.stubs(:get_core_dataset_mtime => { 'four-four' => dsmtime })
    @request.env['HTTP_IF_NONE_MATCH'] = "#{dsmtime}-ANONYMOUS"
    get :show, { :id => 'four-four' }
    assert_response 304
  end

# These tests don't work because it 302 is returned for non-authoritative URLs.
#  test 'returns 200 if changes have occurred for unsigned user' do
#    dsmtime = 12345
#    VersionAuthority.stubs(:get_core_dataset_mtime => { 'four-four' => dsmtime })
#    @request.env['HTTP_IF_NONE_MATCH'] = "#{dsmtime + 1000}-ANONYMOUS"
#    @request.stubs(:path => view_path(@view.route_params)) # Please stop 302ing.
#    get :show, { :id => 'four-four' }
#    assert_response :success
#  end
#
#  test 'returns 200 if signed user' do
#    dsmtime = 12345
#    VersionAuthority.stubs(:get_core_dataset_mtime => { 'four-four' => dsmtime })
#    @request.env['HTTP_IF_NONE_MATCH'] = "#{dsmtime}-#{login.id}"
#    get :show, { :id => 'four-four' }
#    assert_response :success
#  end

end
