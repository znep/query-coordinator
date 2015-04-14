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
    @phidippides = Phidippides.new
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
    get :show, :id => 'four-four'
    assert_response 304
  end

  test 'shows old UX for datasets that are on the NBE and user is admin' do
    setup_nbe_dataset_test(true)
    Phidippides.any_instance.stubs(
      fetch_dataset_metadata: { status: '200', body: { defaultPage: 'page-xist' } },
      fetch_page_metadata: { status: '200' }
    )
    get :show, :category => 'dataset', :view_name => 'dataset', :id => 'four-four'
    notice_matcher = lambda { |element|
      element.match(/#{I18n.t('screens.ds.new_ux_nbe_warning')}/i)
    }
    assert_select_quiet('.flash.notice').any?(&notice_matcher)
    assert_response 200
  end

  test 'redirects to default page for NBE datasets for non-admin users' do
    setup_nbe_dataset_test(false, false)
    Phidippides.any_instance.stubs(
      fetch_dataset_metadata: { status: '200', body: { defaultPage: 'page-xist' } },
      fetch_page_metadata: { status: '200' }
    )
    get :show, :category => 'dataset', :view_name => 'dataset', :id => 'four-four'
    assert_redirected_to '/view/page-xist'
  end

  test 'redirects to OBE view page for NBE datasets without default page for non-admin users' do
    setup_nbe_dataset_test(false, true)
    Phidippides.any_instance.stubs(fetch_dataset_metadata: { status: '200', body: {} })
    View.any_instance.stubs(:migrations => { 'obeId' => 'olde-four' })
    get :show, :category => 'dataset', :view_name => 'dataset', :id => 'four-four'
    assert_redirected_to '/d/olde-four'
  end

  test 'redirects to home page for NBE datasets without default page for non-admin users' do
    setup_nbe_dataset_test(false, false)
    Phidippides.any_instance.stubs(fetch_dataset_metadata: { status: '404', body: {} })
    expectent_flash = stub
    expectent_flash.expects(:[]=).with(:notice, I18n.t('screens.ds.unable_to_find_dataset_page'))
    @controller.class.any_instance.stubs(:flash => expectent_flash)
    get :show, :category => 'dataset', :view_name => 'dataset', :id => 'four-four'
    assert_redirected_to '/'
  end

  test 'redirects to home page for NBE datasets with inaccessible default page for non-admin users' do
    setup_nbe_dataset_test(false, false)
    Phidippides.any_instance.stubs(
      fetch_dataset_metadata: { status: '200', body: { defaultPage: 'page-xist' } },
      fetch_page_metadata: { status: '404' }
    )
    NewViewManager.any_instance.expects(:fetch).raises(NewViewManager::ViewAccessDenied)
    get :show, :category => 'dataset', :view_name => 'dataset', :id => 'four-four'
    assert_redirected_to '/'
  end

  def setup_nbe_dataset_test(is_admin = false, has_page_metadata = false)
    load_sample_data('test/fixtures/sample-data.json')
    @view.stubs(new_backend?: true, category_display: nil)
    stub_user = stub(is_admin?: is_admin, id: 'prix-fixe', email: nil)
    @controller.stubs(current_user: stub_user)
    if has_page_metadata
      @phidippides.stubs(
        fetch_pages_for_dataset: { status: '200', body: { publisher: [ { pageId: 'page-xist' }, { pageId: 'last-page' } ]} }
      )
      @controller.stubs(phidippides: @phidippides)
    else
      @phidippides.stubs(fetch_pages_for_dataset: { status: '404', body: {} })
      @controller.stubs(phidippides: @phidippides)
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
