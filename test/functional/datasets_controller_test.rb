require 'test_helper'

class DatasetsControllerTest < ActionController::TestCase

  def setup
    init_core_session
    init_current_domain
    load_sample_data('test/fixtures/sample-data.json')
    test_view = View.find('test-data')
    View.any_instance.stubs(
      :find => test_view,
      :find_related => [test_view],
      :user_granted? => false
    )
    @view = View.new(
      'resourceName' => 'resource-name',
      'id' => 'four-four',
      'owner' => {
        'id' => 'four-five',
        'profile_name' => 'name'
      }
    )
    @controller.stubs(:get_view => @view)
    @phidippides = Phidippides.new('localhost', 2401)
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

  test 'generic dataset paths route here' do
    test_paths = %w(
      datasets/four-four
    )

    test_paths.each do |path|
      assert_routing(path, { controller: 'datasets', action: 'show', id: 'four-four' })
    end
  end

  test 'seo dataset paths route here' do
    base_path_params = {controller: 'datasets', action: 'show'}
    test_paths = %w(
      cats/dogs/four-four
    )

    test_paths.each do |path|
      segments = path.split('/')
      flunk('invalid url') unless !segments.empty?
      if segments.length >= 3
        add_path_params = {category: segments[0], view_name: segments[1], id: segments[2]}
      elsif segments.length == 2
        add_path_params = {id: segments[1]}
      else
        add_path_params = {id: segments[0]}
      end

      # rails skips automatic params parsing sometimes https://github.com/rspec/rspec-rails/issues/172
      ActionDispatch::Request.any_instance.stubs(
        :path_parameters => base_path_params.merge(add_path_params).with_indifferent_access
      )

      assert_routing(path, base_path_params.merge(add_path_params))
    end
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

  #
  # See comment at the beginning of `view_redirection_url` in `datasets_controller.rb`
  #
  # test 'redirects to default page for NBE datasets for non-admin users' do
  #   setup_nbe_dataset_test(false, false)
  #   Phidippides.any_instance.stubs(
  #     fetch_dataset_metadata: { status: '200', body: { defaultPage: 'page-xist' } },
  #     fetch_page_metadata: { status: '200' }
  #   )
  #   get :show, :category => 'dataset', :view_name => 'dataset', :id => 'four-four'
  #   assert_redirected_to '/view/page-xist'
  # end

  test 'redirects to OBE view page for NBE datasets without default page for non-admin users when feature flag set' do
    setup_nbe_dataset_test(false, true)
    Phidippides.any_instance.stubs(fetch_dataset_metadata: { status: '200', body: {} })
    FeatureFlags.stubs(derive: Hashie::Mash.new.tap { |x| x.stubs(force_redirect_to_data_lens: true ) })
    View.any_instance.stubs(:migrations => { 'obeId' => 'olde-four' })
    get :show, :category => 'dataset', :view_name => 'dataset', :id => 'four-four'
    assert_redirected_to '/view/page-xist'
  end

  test 'redirects to OBE view page for NBE datasets without default page for non-admin users' do
    setup_nbe_dataset_test(false, true)
    Phidippides.any_instance.stubs(fetch_dataset_metadata: { status: '200', body: {} })
    FeatureFlags.stubs(derive: Hashie::Mash.new.tap { |x| x.stubs(force_redirect_to_data_lens: false ) })
    View.any_instance.stubs(:migrations => { 'obeId' => 'olde-four' })
    get :show, :category => 'dataset', :view_name => 'dataset', :id => 'four-four'
    assert_redirected_to '/d/olde-four'
  end

  test 'stops redirection to OBE view page when the feature flag disable_obe_redirection is true' do
    setup_nbe_dataset_test(false, true)
    FeatureFlags.stubs(derive: Hashie::Mash.new.tap { |x| x.stubs(disable_obe_redirection: true) })
    get :show, :category => 'dataset', :view_name => 'dataset', :id => 'four-four'
    assert_response :success
  end

  test 'redirects to Lens page for NBE datasets for non-admin users when feature flag set' do
    setup_nbe_dataset_test(false, true)
    FeatureFlags.stubs(derive: Hashie::Mash.new.tap { |x| x.stubs(force_redirect_to_data_lens: true ) })
    get :show, :category => 'dataset', :view_name => 'dataset', :id => 'four-four'
    assert_redirected_to '/view/page-xist'
  end

  test 'redirects to home page for NBE datasets without default page for non-admin users when feature flag set' do
    setup_nbe_dataset_test(false, false)
    Phidippides.any_instance.stubs(fetch_dataset_metadata: { status: '404', body: {} })
    FeatureFlags.stubs(derive: Hashie::Mash.new.tap { |x| x.stubs(force_redirect_to_data_lens: true ) })
    expectent_flash = stub
    expectent_flash.expects(:[]=).with(:notice, I18n.t('screens.ds.unable_to_find_dataset_page'))
    assert_match(/Data Lens/, I18n.t('screens.ds.unable_to_find_dataset_page'))
    @controller.class.any_instance.stubs(:flash => expectent_flash)
    get :show, :category => 'dataset', :view_name => 'dataset', :id => 'four-four'
    assert_redirected_to '/'
  end

  test 'redirects to home page for NBE datasets without default page for non-admin users' do
    setup_nbe_dataset_test(false, false)
    Phidippides.any_instance.stubs(fetch_dataset_metadata: { status: '404', body: {} })
    FeatureFlags.stubs(derive: Hashie::Mash.new.tap { |x| x.stubs(force_redirect_to_data_lens: false ) })
    expectent_flash = stub
    expectent_flash.expects(:[]=).with(:notice, I18n.t('screens.ds.unable_to_find_dataset_page'))
    assert_match(/Data Lens/, I18n.t('screens.ds.unable_to_find_dataset_page'))
    @controller.class.any_instance.stubs(:flash => expectent_flash)
    get :show, :category => 'dataset', :view_name => 'dataset', :id => 'four-four'
    assert_redirected_to '/'
  end

  test 'renders page meta content over https and not http' do
    setup_nbe_dataset_test(true)
    @request.env['HTTPS'] = 'on'
    get :show, :category => 'dataset', :view_name => 'dataset', :id => 'four-four'
    assert_select_quiet 'meta' do |elements|
      elements.each do |element|
        element.attributes.values.each do |value|
          value.to_s.scan(/http.?:\/\//).each do |match|
            assert_equal(match, 'https://')
          end
        end
      end
    end
  end

  #
  # See comment at the beginning of `view_redirection_url` in `datasets_controller.rb`
  #
  # test 'redirects to home page for NBE datasets with inaccessible default page for non-admin users' do
  #   setup_nbe_dataset_test(false, false)
  #   Phidippides.any_instance.stubs(
  #     fetch_dataset_metadata: { status: '200', body: { defaultPage: 'page-xist' } },
  #     fetch_page_metadata: { status: '404' }
  #   )
  #   DataLensManager.any_instance.expects(:fetch).raises(DataLensManager::ViewAccessDenied)
  #   get :show, :category => 'dataset', :view_name => 'dataset', :id => 'four-four'
  #   assert_redirected_to '/'
  # end

  def setup_nbe_dataset_test(is_admin = false, has_page_metadata = false)
    load_sample_data('test/fixtures/sample-data.json')
    @view.stubs(new_backend?: true, category_display: nil)
    stub_user = stub(is_admin?: is_admin, id: 'prix-fixe', email: nil, rights: [:some_right])
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

  # Leaving CSRF token validation disabled for email is not without some risk. It could allow
  # mallicious attackers to attempt to use the site as an email relay, among other things.
  # However, the risk is somewhat mitgated by the fact that a captcha is included on the form.
  context 'without a valid request forgery token' do

    setup do
      stub_request(:post, "http://localhost:8080/views/four-four.json?from_address=user@domain.com&id=1234-abcd&message=message%20body&method=flag&subject=A%20visitor%20has%20sent%20you%20a%20message%20about%20your%20'Test%20for%20Andrew'%20'Socrata'%20dataset&type=other").
        with(:body => "{}", :headers => {'Accept'=>'*/*', 'Content-Type'=>'application/json', 'User-Agent'=>'Ruby', 'X-Socrata-Host'=>'localhost'}).
        to_return(:status => 200, :body => "", :headers => {})
    end

    should 'login and return a JSON success result' do
      UserSession.controller = @controller
      @controller.stubs(:protect_against_forgery? => true, :verify_recaptcha => true)
      post(:validate_contact_owner, contact_form_data.merge(:id => '1234-abcd', :format => :data))
      assert_equal('200', @response.code)
      assert_equal({:success => true}.to_json, @response.body, 'should include a success JSON response')
    end

  end

  private

  def contact_form_data
    {
      :method => 'flag',
      :type => 'other',
      :subject => "A visitor has sent you a message about your 'Test for Andrew' 'Socrata' dataset",
      :message => 'message body',
      :from_address => 'user@domain.com'
    }
  end

end
