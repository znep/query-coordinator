require 'test_helper'

class DatasetsControllerTest < ActionController::TestCase

  def setup
    load_sample_data('test/fixtures/sample-data.json')
    @test_view = View.find('test-data')
    User.any_instance.stubs(:profile_image_path => 'foo.png')
    View.any_instance.stubs(
      :op_measure? => false,
      :find_related => [@test_view],
      :user_granted? => false
    )
    View.stubs(:find => @test_view)
    @view = View.new(
      'resourceName' => 'resource-name',
      'id' => 'four-four',
      'owner' => {
        'id' => 'four-five',
        'profile_name' => 'name'
      }
    )
    @controller.stubs(:get_view => @view)
    @params = { :foo => 'foo', :bar => 'bar' }
    CurrentDomain.stubs(user_can?: false, default_widget_customization_id: nil)
    default_url_options[:host] = @request.host
  end

  def teardown
    @controller.unstub(:get_view)
    @controller.unstub(:current_user)
    View.unstub(:new_backend?)
    View.unstub(:category_display)
    CurrentDomain.unstub(:user_can?)
    CurrentDomain.unstub(:default_widget_customization_id)
  end

  context 'unauthenticated user' do
    setup do
      init_environment(test_user: TestHelperMethods::ANONYMOUS)
    end

    should 'returns 304 if no changes have occurred for anonymous user' do
      dsmtime = 12345
      View.any_instance.stubs(:mtime_according_to_core => dsmtime)
      @request.env['HTTP_IF_NONE_MATCH'] = "#{dsmtime}-ANONYMOUS-#{@controller.get_revision}"
      get :show, :id => 'four-four'
      assert_response 304
    end
  end

  context 'authenticated user' do
    context 'with disable_obe_direction == true' do
      setup do
        init_environment(test_user: TestHelperMethods::ADMIN, site_chrome: true, feature_flags: {
          :disable_obe_redirection => true
        })
      end

      should 'no redirect to OBE view page when the feature flag disable_obe_redirection is true and there is no OBE view' do
        setup_nbe_dataset_test(false, true)
        mock_metadata = Metadata.new.tap do |metadata|
          metadata.stubs(:feature_flags => Hashie::Mash.new, :attachments => [], :data => Hashie::Mash.new)
        end
        View.any_instance.stubs(:migrations).raises(CoreServer::ResourceNotFound, 'No migrations found')
        View.any_instance.stubs(:metadata => mock_metadata)
        get :show, :category => 'dataset', :view_name => 'dataset', :id => 'four-four'
        assert_response :success
      end

      should 'redirect to OBE view page when the feature flag disable_obe_redirection is true and there is an OBE view' do
        setup_nbe_dataset_test(false, true)
        View.any_instance.stubs(:migrations => { 'obeId' => 'olde-four' })
        mock_metadata = Metadata.new.tap do |metadata|
          metadata.stubs(:feature_flags => Hashie::Mash.new, :attachments => [], :data => Hashie::Mash.new)
        end
        View.any_instance.stubs(:metadata => mock_metadata)
        get :show, :category => 'dataset', :view_name => 'dataset', :id => 'four-four'
        assert_redirected_to '/d/olde-four'
      end
    end

    context 'with disable_obe_direction at default' do
      setup do
        init_environment

        init_feature_flag_signaller(with: {
          enable_visualization_canvas: false,
          enable_catalog_landing_page: true,
          disable_obe_redirection: false,
          show_govstat_header: false
        })
      end

      # https://opendata.test-socrata.com/dataset/28-Formwidtest/zwjk-24g6.json?text=1
      # should redirect to https://opendata.test-socrata.com/resource/zwjk-24g6.json?text=1
      should 'redirects to format URLs include query string parameters' do
        load_sample_data('test/fixtures/sample-data.json')
        @user = login
        get :show, { :id => @view.id, :format => 'json' }.merge(@params)
        assert_redirected_to resource_url({:id => @view.id, :format => 'json'}.merge(@params.except('controller')))
      end

      should 'generic dataset paths route here' do
        test_paths = %w(datasets/four-four)

        test_paths.each do |path|
          assert_routing(path, { controller: 'datasets', action: 'show', id: 'four-four' })
        end
      end

      should 'seo dataset paths route here' do
        base_path_params = {controller: 'datasets', action: 'show'}
        test_paths = %w(cats/dogs/four-four)

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

      should 'get_view method returns nil when ResourceNotFound' do
        @controller.unstub(:get_view)
        View.stubs(:find).raises(CoreServer::ResourceNotFound.new('response'))
        @controller.instance_variable_set('@_response', ActionDispatch::Response.new)
        value = @controller.send(:get_view, 'igno-reme')
        refute(value)
      end

      should 'get_view method returns nil when CoreServerError - authentication_required' do
        @controller.unstub(:get_view)
        View.stubs(:find).raises(CoreServer::CoreServerError.new('source', 'authentication_required', 'error message'))
        @controller.instance_variable_set('@_response', ActionDispatch::Response.new)
        value = @controller.send(:get_view, 'igno-reme')
        refute(value)
      end

      should 'get_view method returns nil when CoreServerError - permission_denied' do
        @controller.unstub(:get_view)
        View.stubs(:find).raises(CoreServer::CoreServerError.new('source', 'permission_denied', 'error message'))
        @controller.instance_variable_set('@_response', ActionDispatch::Response.new)
        value = @controller.send(:get_view, 'igno-reme')
        refute(value)
      end

      should 'get_view method returns nil when CoreServerError - other error' do
        @controller.unstub(:get_view)
        View.stubs(:find).raises(CoreServer::CoreServerError.new('source', 'other error', 'error message'))
        @controller.instance_variable_set('@_response', ActionDispatch::Response.new)
        value = @controller.send(:get_view, 'igno-reme')
        refute(value)
      end

      should 'get_view method returns nil when View#is_form? is true and View#can_add? is false' do
        @controller.unstub(:get_view)
        mock_view = stub
        mock_view.expects(:is_form? => true)
        mock_view.expects(:can_add? => false)
        View.stubs(:find => mock_view)
        @controller.instance_variable_set('@_response', ActionDispatch::Response.new)
        value = @controller.send(:get_view, 'igno-reme')
        refute(value)
      end

      should 'get_view method returns nil when View#can_read? is false' do
        @controller.unstub(:get_view)
        mock_view = stub
        mock_view.expects(:is_form? => false)
        mock_view.expects(:can_read? => false)
        View.stubs(:find => mock_view)
        @controller.instance_variable_set('@_response', ActionDispatch::Response.new)
        value = @controller.send(:get_view, 'igno-reme')
        refute(value)
      end

      should 'no redirect for datasets that are on the NBE and user is admin' do
        setup_nbe_dataset_test(true)
        mock_metadata = Metadata.new.tap do |metadata|
          metadata.stubs(:feature_flags => Hashie::Mash.new, :attachments => [], :data => Hashie::Mash.new)
        end
        View.any_instance.stubs(:metadata => mock_metadata)
        get :show, :category => 'dataset', :view_name => 'dataset', :id => 'four-four'
        notice_matcher = lambda { |element|
          element =~ /#{I18n.t('screens.ds.new_ux_nbe_warning')}/i
        }
        assert_select('.flash.notice').any?(&notice_matcher)
        assert_response 200
      end

      should 'redirects to OBE view page for NBE datasets without default page for non-admin users' do
        setup_nbe_dataset_test(false, true)
        View.any_instance.stubs(:migrations => { 'obeId' => 'olde-four' })
        Metadata.any_instance.stubs(:feature_flags => Hashie::Mash.new)
        get :show, :category => 'dataset', :view_name => 'dataset', :id => 'four-four'
        assert_redirected_to '/d/olde-four'
      end

      should 'redirects to home page for NBE datasets without default page for non-admin users' do
        setup_nbe_dataset_test(false, false)
        mock_metadata = Metadata.new.tap do |metadata|
          metadata.stubs(:feature_flags => Hashie::Mash.new, :attachments => [], :data => Hashie::Mash.new)
        end
        View.any_instance.stubs(:metadata => mock_metadata)
        get :show, :category => 'dataset', :view_name => 'dataset', :id => 'four-four'
        assert_redirected_to '/'
        assert_match(@controller.flash[:notice], I18n.t('screens.ds.unable_to_find_dataset_page'))
        assert_match(/Data Lens/, I18n.t('screens.ds.unable_to_find_dataset_page'))
      end

      should 'special snowflake SF api geo datasets do not die' do
        setup_nbe_dataset_test(false, false)
        @view.stubs(is_api_geospatial?: true)
        get :show, :category => 'dataset', :view_name => 'dataset', :id => 'four-four'
        assert_response :success
      end

      context 'with DSLP fully enabled' do
        setup do
          @controller.stubs(:dataset_landing_page_enabled? => true)
          @test_view.stubs(migrations: {'nbeId' => 'test-nbe1'})
          init_current_user(@controller)
        end

        context 'if the view is a dataset' do
          context 'display the DLSP' do
            setup do
              DatasetLandingPage.stubs(:fetch_derived_views => [])
              stub_request(:get, 'http://localhost:8080/domains/test.host.json').
                with(:headers => { 'X-Socrata-Host' => 'test.host' }).
                to_return(
                  :status => 200,
                  :body => '{"id": "four-four", "cname": "test.host", "configsLastUpdatedAt": 1477332982}',
                  :headers => {}
                )
              @controller.stubs(get_view: @test_view)
              @test_view.stubs(:dataset? => true)
              @test_view.stubs(find_dataset_landing_page_related_content: [])
              @test_view.stubs(featured_content: [])
            end

            should 'successfully on the show path' do
              DatasetLandingPage.stubs(:fetch_all => {})
              get :show, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'
              assert_select '#app', 1
              assert_response 200
            end

            should 'successfully when /about is appended to the show path' do
              mock_metadata = Metadata.new.tap do |metadata|
                metadata.stubs(:feature_flags => Hashie::Mash.new, :attachments => [], :data => Hashie::Mash.new)
              end
              View.any_instance.stubs(:metadata => mock_metadata)
              get :about, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'
              assert_select '#app', 1
              assert_response 200
            end
          end

          should 'display the grid view when /data is appended to the show path' do
            setup_nbe_dataset_test
            mock_metadata = Metadata.new.tap do |metadata|
              metadata.stubs(:feature_flags => Hashie::Mash.new, :attachments => [], :data => Hashie::Mash.new)
            end
            View.any_instance.stubs(:metadata => mock_metadata)
            get :show, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data', :bypass_dslp => true
            assert_select '#app', 0
            assert_response 302 # we know this is not the authoritative path
          end
        end

        context 'if the view is not a dataset' do
          setup do
            @controller.stubs(get_view: @test_view)
            @test_view.stubs(:dataset? => false)
            @test_view.stubs(featured_content: [])
          end

          should 'does not show the dslp at /about' do
            mock_metadata = Metadata.new.tap do |metadata|
              metadata.stubs(:feature_flags => Hashie::Mash.new, :attachments => [], :data => Hashie::Mash.new)
            end
            View.any_instance.stubs(:metadata => mock_metadata)
            FeatureFlags.stubs(:derive => Hashie::Mash.new.tap { |mash| mash.stubs(:reenable_ui_for_nbe => true)})
            get :about, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'
            assert_select '#app', 0
            assert_response 200
          end

          should 'show the normal display view at show' do
            mock_metadata = Metadata.new.tap do |metadata|
              metadata.stubs(:feature_flags => Hashie::Mash.new, :attachments => [], :data => Hashie::Mash.new)
            end
            View.any_instance.stubs(:metadata => mock_metadata)
            get :show, :category => 'Personal', :view_name => 'Test-Data', :id => 'test-data'
            assert_select '#infoBox'
            assert_response 200
          end
        end
      end

      should 'renders page meta content over https and not http' do
        setup_nbe_dataset_test(true)
        Metadata.any_instance.stubs(:feature_flags => Hashie::Mash.new, :attachments => [], :data => Hashie::Mash.new)
        @request.env['HTTPS'] = 'on'
        get :show, :category => 'dataset', :view_name => 'dataset', :id => 'four-four'
        assert_select 'meta' do |elements|
          elements.each do |element|
            element.attributes.values.each do |value|
              value.to_s.scan(/http.?:\/\//).each do |match|
                assert_equal(match, 'https://')
              end
            end
          end
        end
      end

    # These tests don't work because 302 is returned for non-authoritative URLs.
    #  should 'returns 200 if changes have occurred for unsigned user' do
    #    dsmtime = 12345
    #    VersionAuthority.stubs(:get_core_dataset_mtime => { 'four-four' => dsmtime })
    #    @request.env['HTTP_IF_NONE_MATCH'] = "#{dsmtime + 1000}-ANONYMOUS"
    #    @request.stubs(:path => view_path(@view)) # Please stop 302ing.
    #    get :show, { :id => 'four-four' }
    #    assert_response :success
    #  end
    #
    #  should 'returns 200 if signed user' do
    #    dsmtime = 12345
    #    VersionAuthority.stubs(:get_core_dataset_mtime => { 'four-four' => dsmtime })
    #    @request.env['HTTP_IF_NONE_MATCH'] = "#{dsmtime}-#{login.id}"
    #    get :show, { :id => 'four-four' }
    #    assert_response :success
    #  end

      # Leaving CSRF token validation disabled for email is not without some risk. It could allow
      # malicious attackers to attempt to use the site as an email relay, among other things.
      # However, the risk is somewhat mitgated by the fact that a captcha is included on the form.
      context 'without a valid request forgery token' do

        setup do
          stub_request(:post, "http://localhost:8080/views/four-four.json?from_address=user@domain.com&id=1234-abcd&message=message%20body&method=flag&subject=A%20visitor%20has%20sent%20you%20a%20message%20about%20your%20'Test%20for%20Andrew'%20'Socrata'%20dataset&type=other").
            with(:body => "{}", :headers => request_headers).
            to_return(:status => 200, :body => "", :headers => {})
        end

        should 'login and return a JSON success result' do
          SocrataRecaptcha.stubs(:valid => true)
          @controller.stubs(:protect_against_forgery? => true)
          post(:validate_contact_owner, contact_form_data.merge(:id => '1234-abcd', :format => :data))
          assert_equal('200', @response.code)
          assert_equal({:success => true}.to_json, @response.body, 'should include a success JSON response')
        end

      end

      context 'contacting dataset owner' do
        setup do
          stub_request(:post, "http://localhost:8080/views/four-four.json?from_address=user@domain.com&id=1234-abcd&message=message%20body&method=flag&subject=A%20visitor%20has%20sent%20you%20a%20message%20about%20your%20'Test%20for%20Andrew'%20'Socrata'%20dataset&type=other").
            with(:body => "{}", :headers => request_headers).
            to_return(:status => 200, :body => "", :headers => {})
        end

        should 'return a JSON failure result if view is missing' do
          @controller.stubs(:get_view => nil)
          post(:contact_dataset_owner, contact_form_data.merge(:id => '1234-abcd'))
          assert_equal('400', @response.code)
          assert_equal({:success => false, :message => 'Can\'t find view: 1234-abcd'}.to_json, @response.body, 'should include a failure JSON response')
        end

        should 'return a JSON failure result if missing params' do
          post(:contact_dataset_owner, {:id => '1234-abcd'})
          assert_equal('400', @response.code)
          assert_equal({:success => false, :message => 'Missing key: type'}.to_json, @response.body, 'should include a failure JSON response')
        end

        should 'return a JSON failure result if Recaptcha is invalid' do
          SocrataRecaptcha.stubs(:valid => false)

          post(:contact_dataset_owner, contact_form_data.merge(:id => '1234-abcd', :recaptcha_response_token => 'wombats-in-top-hats'))
          assert_equal('400', @response.code)
          assert_equal({:success => false, :message => 'Invalid Recaptcha'}.to_json, @response.body, 'should include a failure JSON response')
        end

        should 'return a JSON success result if Recaptcha is valid' do
          SocrataRecaptcha.stubs(:valid => true)

          post(:contact_dataset_owner, contact_form_data.merge(:id => '1234-abcd', :recaptcha_response_token => 'wombats-in-top-hats'))
          assert_equal('200', @response.code)
          assert_equal({:success => true}.to_json, @response.body, 'should include a success JSON response')
        end

        should 'send email and return a JSON success result if all params present' do
          SocrataRecaptcha.stubs(:valid => true)

          post(:contact_dataset_owner, contact_form_data.merge(:id => '1234-abcd', :recaptcha_response_token => 'wombats-in-top-hats'))
          assert_equal('200', @response.code)
          assert_equal({:success => true}.to_json, @response.body, 'should include a success JSON response')
        end
      end

      context 'helper methods' do

        should 'respond to is_mobile?' do
          assert(@controller.respond_to?(:is_mobile?))
        end

        # compute_extension
        should 'compute extension defaulting to the extension provided' do
          assert_equal(@controller.send(:compute_extension, 'pdf', 'test.com'), 'pdf')
        end

        should 'compute extension from url if empty extension is provided' do
          assert_equal(@controller.send(:compute_extension, '', 'test.xml'), 'xml')
        end

        should 'compute extension from url if nil extension is provided' do
          assert_equal(@controller.send(:compute_extension, nil, 'test.abc'), 'abc')
        end
      end
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

  def setup_nbe_dataset_test(is_superadmin = false, has_page_metadata = false)
    load_sample_data('test/fixtures/sample-data.json')
    @view.stubs(new_backend?: true, category_display: nil)
    role_name = is_superadmin ? 'admin' : 'user'
    stub_user = stub(
      :displayName =>  nil,
      :email =>  nil,
      :id =>  'prix-fixe',
      :is_superadmin? =>  is_superadmin,
      :rights => [:some_right],
      :role_name => role_name
    )
    stub_user.stubs(has_right?: false)
    @controller.stubs(current_user: stub_user)
  end
end
