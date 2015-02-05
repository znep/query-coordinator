require 'test_helper'

class DatasetsControllerTest < ActionController::TestCase

  def setup
    init_core_session
    init_current_domain
    @view = View.new(
      'resourceName' => 'resource-name',
      'id' => 'four-four',
      'owner' => {
        'id' => 'four-five',
        'profile_name' => 'name'
      }
    )
    @view.stubs(user_granted?: false)
    @controller.stubs(:get_view => @view)
    @page_metadata_manager = PageMetadataManager.new
    @params = { :foo => 'foo', :bar => 'bar' }
    CurrentDomain.stubs(user_can?: false, default_widget_customization_id: nil)
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

  test 'shows old UX for datasets that are on the NBE and user is admin' do
    setup_nbe_dataset_test(true)
    get :show, { :category => 'dataset', :view_name => 'dataset', :id => 'four-four' }
    assert_match /Internal Only: Old UX view of New Backend dataset/, @response.body
    assert_response 200
  end

  test 'redirects to new UX for datasets that are on the NBE and user is not admin and has default page' do
    setup_nbe_dataset_test(false, false)
    Phidippides.any_instance.stubs(fetch_dataset_metadata: { status: '200', body: { defaultPage: 'page-xist' } })
    get :show, { :category => 'dataset', :view_name => 'dataset', :id => 'four-four' }
    assert_redirected_to '/view/page-xist'
  end

  test 'redirects to new UX for datasets that are on the NBE and user is not admin and page metadata exists but no default page' do
    setup_nbe_dataset_test(false, true)
    Phidippides.any_instance.stubs(fetch_dataset_metadata: { status: '200', body: {} })
    get :show, { :category => 'dataset', :view_name => 'dataset', :id => 'four-four' }
    assert_redirected_to '/view/last-page'
  end

  test 'redirects to homepage for datasets that are on the NBE and user is not admin and page metadata does not exist' do
    setup_nbe_dataset_test(false, false)
    Phidippides.any_instance.stubs(fetch_dataset_metadata: { status: '404', body: {} })
    get :show, { :category => 'dataset', :view_name => 'dataset', :id => 'four-four' }
    assert_redirected_to '/home'
  end

  def setup_nbe_dataset_test(is_admin = false, has_page_metadata = false)
    load_sample_data('test/fixtures/sample-data.json')
    @view.stubs(new_backend?: true, category_display: nil)
    stub_user = stub(is_admin?: is_admin, id: 'prix-fixe', email: nil)
    @controller.stubs(current_user: stub_user)
    if has_page_metadata
      @page_metadata_manager.stubs(
        pages_for_dataset: {
          status: '200',
          body: {
            publisher: [
              { pageId: 'page-xist' },
              { pageId: 'last-page' }
            ]
          }
        }
      )
      @controller.stubs(page_metadata_manager: @page_metadata_manager)
    else
      @page_metadata_manager.stubs(
        pages_for_dataset: {
          status: '404',
          body: {}
        }
      )
      @controller.stubs(page_metadata_manager: @page_metadata_manager)
    end
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
