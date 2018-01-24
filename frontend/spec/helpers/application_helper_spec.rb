require 'rails_helper'

describe ApplicationHelper do
  include TestHelperMethods

  before do
    init_current_domain
    init_feature_flag_signaller
    init_current_user(
      ApplicationController.new.tap do |controller|
        session_double = double
        allow(session_double).to receive(:[]=)
        controller.request = ActionDispatch::Request.new(ENV)
        controller.response = ActionDispatch::Response.new
        allow(controller).to receive(:session).and_return(session_double)
      end
    )
  end

  describe 'render_feature_flags_for_javascript' do
    let(:flags) do
      {
        'foo_flag:' => 'bar_value_with_$pecial_chars{}"\\'
      }
    end

    before do
      allow(FeatureFlags).to receive(:derive).and_return(flags)
    end

    it 'renders feature flags into window.socrata.featureFlags' do
      rendered_value = render_feature_flags_for_javascript
      expect(rendered_value).to eq(%q(<script id="feature-flags">
//<![CDATA[
window.socrata = window.socrata || {};
window.socrata.featureFlags =
  {"foo_flag:":"bar_value_with_$pecial_chars{}\"\\\\"};

//]]>
</script>)
      )
    end
  end

  describe '#approvals_settings' do
    context 'when fontana approvals are disabled' do
      before do
        stub_feature_flags_with(use_fontana_approvals: false)
        allow(Fontana::Approval::Workflow).to receive(:find).and_return(nil)
      end

      it 'should return an empty hash' do
        result = helper.approvals_settings
        expect(result).to eq({})
      end
    end

    context 'when fontana approvals are enabled' do
      let(:mock_workflow) do
        OpenStruct.new(:steps => [
          OpenStruct.new(
            :official_task => OpenStruct.new(:manual? => false),
            :community_task => OpenStruct.new(:manual? => true)
          )
        ])
      end

      before do
        stub_feature_flags_with(use_fontana_approvals: true)
        allow(Fontana::Approval::Workflow).to receive(:find).and_return(mock_workflow)
      end

      it 'should return a hash of the approvals settings' do
        result = helper.approvals_settings
        expect(result).to eq({
          :official => 'automatic',
          :community => 'manual'
        })
      end
    end
  end

  describe '#suppress_govstat?', :verify_stubs => false do

    let(:current_user) { double('current_user') }
    let(:member_response) { false }

    before do
      allow(helper).to receive(:current_user).and_return(current_user)
      allow(CurrentDomain).to receive(:member?).with(current_user).and_return(member_response)
    end

    context 'when response from CurrentDomain is nil' do
      let(:member_response) { nil }

      it 'returns true' do
        expect(suppress_govstat?).to eq(true)
      end
    end

    context 'when response from CurrentDomain is false' do
      let(:member_response) { false }

      it 'returns true' do
        expect(suppress_govstat?).to eq(true)
      end
    end

    context 'when response from CurrentDomain is true' do
      let(:member_response) { true }

      it 'returns false' do
        expect(suppress_govstat?).to eq(false)
      end

      context 'when @suppress_govstat is true' do
        before do
          @suppress_govstat = true
        end

        it 'returns true' do
          expect(suppress_govstat?).to eq(true)
        end
      end
    end

  end

  describe '#prevent_platform_styling?' do

    context 'when the config does not exist' do
      before do
        allow(controller).to receive(:class).and_return(CustomContentController)
        allow(CurrentDomain).to receive(:configuration).and_return(nil)
        controller.instance_variable_set(:@page, OpenStruct.new(:path => '/custom-page'))
      end

      it 'should return false' do
        expect(helper.prevent_platform_styling?).to eq(false)
      end
    end

    context 'when the config exists but does not prevent the current page' do
      before do
        allow(controller).to receive(:class).and_return(CustomContentController)
        allow(CurrentDomain).to receive(:configuration).and_return(
          OpenStruct.new(:properties => OpenStruct.new(:prevent_platform_styling => ['^\/$', '^\/custom-page']))
        )
        controller.instance_variable_set(:@page, OpenStruct.new(:path => '/different-custom-page'))
      end

      it 'should return false' do
        expect(helper.prevent_platform_styling?).to eq(false)
      end
    end

    context 'when the config exists and prevents the current page' do
      before do
        allow(controller).to receive(:class).and_return(CustomContentController)
        allow(CurrentDomain).to receive(:configuration).and_return(
          OpenStruct.new(:properties => OpenStruct.new(:prevent_platform_styling => ['^\/$', '^\/custom-page']))
        )
        controller.instance_variable_set(:@page, OpenStruct.new(:path => '/custom-page'))
      end

      it 'should return true' do
        expect(helper.prevent_platform_styling?).to eq(true)
      end
    end

    context 'when the config exists and prevents the current page on a homepage' do
      before do
        allow(controller).to receive(:class).and_return(CustomContentController)
        allow(CurrentDomain).to receive(:configuration).and_return(
          OpenStruct.new(:properties => OpenStruct.new(:prevent_platform_styling => ['^\/$', '^\/custom-page']))
        )
        controller.instance_variable_set(:@page, OpenStruct.new(:path => '/'))
      end

      it 'should return true' do
        expect(helper.prevent_platform_styling?).to eq(true)
      end
    end

    context 'when the config prevents a cluster of pages that includes the current page' do
      before do
        allow(controller).to receive(:class).and_return(CustomContentController)
        allow(CurrentDomain).to receive(:configuration).and_return(
          OpenStruct.new(:properties => OpenStruct.new(:prevent_platform_styling => ['\/custom-path/blah\/.*']))
        )
        controller.instance_variable_set(:@page, OpenStruct.new(:path => '/custom-path/blah/some/page'))
      end

      it 'should return true' do
        expect(helper.prevent_platform_styling?).to eq(true)
      end
    end

    context 'when the config prevents a cluster of pages that does not include the current page' do
      before do
        allow(controller).to receive(:class).and_return(CustomContentController)
        allow(CurrentDomain).to receive(:configuration).and_return(
          OpenStruct.new(:properties => OpenStruct.new(:prevent_platform_styling => ['\/custom-path\/blah\/.*']))
        )
        controller.instance_variable_set(:@page, OpenStruct.new(:path => '/custom-path/blah2/some/page'))
      end

      it 'should return false' do
        expect(helper.prevent_platform_styling?).to eq(false)
      end
    end

    context 'when the config prevents all pages' do
      before do
        allow(controller).to receive(:class).and_return(CustomContentController)
        allow(CurrentDomain).to receive(:configuration).and_return(
          OpenStruct.new(:properties => OpenStruct.new(:prevent_platform_styling => ['.*']))
        )
        controller.instance_variable_set(:@page, OpenStruct.new(:path => '/custom-path/some/page'))
      end

      it 'should return true' do
        expect(helper.prevent_platform_styling?).to eq(true)
      end
    end
  end

  describe '#apply_custom_css?' do
    let(:custom_css) { 'body { color: rebeccapurple; }' }
    let(:govstat_enabled) { false }
    let(:action_name) { 'anything' }
    let(:using_dataslate) { false }
    let(:on_homepage) { false }
    let(:suppress_govstat) { false }

    before do
      allow(CurrentDomain)
        .to receive(:properties)
        .and_return(double(:custom_css => custom_css))

      allow_any_instance_of(ApplicationHelper)
        .to receive(:module_enabled?)
        .with(:govStat)
        .and_return(govstat_enabled)

      allow_any_instance_of(ApplicationHelper)
        .to receive(:suppress_govstat?)
        .and_return(suppress_govstat)

      @using_dataslate = using_dataslate
      @on_homepage = on_homepage
    end

    context 'when custom_css is blank' do
      let(:custom_css) { '' }

      it 'does not apply custom_css' do
        expect(apply_custom_css?).to eq(false)
      end
    end

    context 'when custom_css is not blank' do
      context 'in admin pages' do
        let(:request) { double('request', path: '/admin/activity_feed') }
        before do
          allow(helper).to receive(:request).and_return(request)
        end

        context 'when feature flag is true' do
          before do
            allow(FeatureFlags).to receive(:derive).and_return(
              :enable_custom_css_for_admin_pages => true
            )
          end

          it 'apply custom_css' do
            expect(apply_custom_css?).to eq(true)
          end
        end

        context 'when feature flag is false' do
          before do
            allow(FeatureFlags).to receive(:derive).and_return(
              :enable_custom_css_for_admin_pages => false
            )
          end

          it 'does not apply custom_css' do
            expect(apply_custom_css?).to eq(false)
          end
        end

      end
      context 'not in admin pages' do
        let(:request) { double('request', path: '/') }
        before do
          allow(helper).to receive(:request).and_return(request)
          allow(FeatureFlags).to receive(:derive).and_return(
            :enable_custom_css_for_admin_pages => false
          )
        end

        context 'when govStat is not enabled' do
          let(:govstat_enabled) { false }

          it 'applies custom_css' do
            expect(apply_custom_css?).to eq(true)
          end
        end

        context 'when govStat is enabled' do
          let(:govstat_enabled) { true }

          context 'when action is "chromeless"' do
            let(:action_name) { 'chromeless' }

            it 'does not apply custom_css' do
              expect(apply_custom_css?).to eq(false)
            end
          end

          context 'when action is not "chromeless"' do
            context 'when using dataslate and we are on the homepage' do
              let(:using_dataslate) { true }
              let(:on_homepage) { true }

              it 'applies custom_css' do
                expect(apply_custom_css?).to eq(true)
              end
            end

            context 'when not using dataslate or not on the homepage' do
              context 'when suppressing govstat' do
                let(:suppress_govstat) { true }

                it 'applies custom css' do
                  expect(apply_custom_css?).to eq(true)
                end
              end

              context 'when not suppressing govstat' do
                let(:suppress_govstat) { false }

                it 'does not apply custom css' do
                  expect(apply_custom_css?).to eq(false)
                end
              end
            end
          end
        end
      end
    end
  end

  describe '#dataset_landing_page_enabled?' do

    let(:site_chrome_find_double) do
      double.tap { |site_chrome| allow(site_chrome).to receive(:dslp_enabled?).and_return(dslp_enabled) }
    end

    before do
      allow(SiteAppearance).to receive(:find).and_return(site_chrome_find_double)
    end

    context 'site chrome is activated' do
      let(:dslp_enabled) { true }

      it 'returns true' do
        helper.request.cookies[:socrata_site_chrome_preview] = false
        expect(dataset_landing_page_enabled?).to eq(true)
      end
    end

    context 'site chrome is not activated' do
      let(:dslp_enabled) { false }

      it 'is true if in site chrome preview mode' do
        helper.request.cookies[:socrata_site_chrome_preview] = true
        expect(dataset_landing_page_enabled?).to eq(true)
      end

      it 'is false not in site chrome preview mode' do
        helper.request.cookies[:socrata_site_chrome_preview] = false
        expect(dataset_landing_page_enabled?).to eq(false)
      end
    end

  end

  describe 'using_cetera when feature flag is set' do

    let(:cetera_internal_uri) { 'http://localhost:1234' }
    let(:controller_name) { 'browse' }
    let(:action_name) { 'show' }

    before do
      init_current_domain
      init_signaller(with: { cetera_search: true })
      allow(APP_CONFIG).to receive(:cetera_internal_uri).and_return(cetera_internal_uri)
      allow(helper).to receive(:controller_name).and_return(controller_name)
      allow(helper).to receive(:action_name).and_return(action_name)
    end

    context 'cetera_internal_uri is not set' do
      let(:cetera_internal_uri) { nil }
      it 'should be false' do
        expect(helper.using_cetera?).to eq(false)
      end
    end

    context 'cetera_internal_uri is set' do
      it 'should be true' do
        expect(helper.using_cetera?).to eq(true)
      end

      context 'cetera_internal_uri syntax is incorrect' do
        let(:cetera_internal_uri) { 'localhost' }
        it 'should be false' do
          expect(Rails.logger).to receive(:error)
          expect(helper.using_cetera?).to eq(false)
        end
      end
    end

    context 'on profile controller' do
      let(:controller_name) { 'profile' }
      it 'should be false' do
        expect(helper.using_cetera?).to eq(false)
      end
    end

    context 'on browse controller' do
      context 'action is select_dataset' do
        let(:action_name) { 'select_dataset' }
        it 'should be false' do
          expect(helper.using_cetera?).to eq(false)
        end
      end
      context 'action is not select_dataset' do
        it 'should be true' do
          expect(helper.using_cetera?).to eq(true)
        end
      end
    end

    context 'on administration controller' do
      let(:controller_name) { 'administration' }
      context 'action is not home' do
        it 'should be false' do
          expect(helper.using_cetera?).to eq(false)
        end
      end
      context 'action is home' do
        let(:action_name) { 'home' }
        it 'should be false' do
          expect(helper.using_cetera?).to eq(true)
        end
      end
    end

    context 'included in non-controller classes' do
      before do
        helper.instance_eval do
          undef :controller_name, :action_name, :request
        end
      end

      after do
        helper.class_eval do
          attr_accessor :controller_name, :action_name, :request
        end
      end

      it 'should be true' do
        expect(helper.using_cetera?).to eq(true)
      end
    end

    context 'in date helpers' do
      let(:timestamp) { 1480410000 }
      context 'for short_date_span' do
        it 'returns a span containing the time formatted as %b %-d %Y' do
          expect(helper.short_date_span(timestamp)).to eq('<span class="dateLocalize" data-format="ll" data-rawdatetime="1480410000">Nov 29 2016</span>')
        end
      end
      context 'for long_date_span' do
        it 'returns a span containing the time formatted as %B %-d %Y' do
          expect(helper.long_date_span(timestamp)).to eq('<span class="dateLocalize" data-format="LL" data-rawdatetime="1480410000">November 29 2016</span>')
        end
      end
      context 'for date_time_span' do
        it 'returns a span containing the time formatted as %B %-d %Y %I:%M %P' do
          expect(helper.date_time_span(timestamp)).to match(/<span class="dateLocalize" data-format="LLL" data-rawdatetime="1480410000">November 29 2016 \d{2}:\d{2} [ap]m<\/span>/)
        end
      end
      context 'for format_date' do
        it 'returns the default formatting of %b %-d %Y if an unknown format type is passed in' do
          expect(helper.format_date(timestamp, 'foo')).to eq('Nov 29 2016')
        end
      end
      context 'for get_epoch' do
        it 'returns nil if the input type is not Integer, String, Time, or Date' do
          expect(helper.get_epoch({})).to eq(nil)
        end
        it 'returns the correct epoch time if the input type is an Integer' do
          expect(helper.get_epoch(timestamp)).to eq(timestamp)
        end
        it 'returns the correct epoch time if the input type is a String' do
          expect(helper.get_epoch('2016-11-29 01:00:00 -0800')).to eq(timestamp)
        end
        it 'returns the correct epoch time if the input type is a Time object' do
          expect(helper.get_epoch(Time.parse('2016-11-29 01:00:00 -0800'))).to eq(timestamp)
        end
        it 'returns the correct epoch time if the input type is a Date object' do
          # Returns a slightly different timestamp due to lack of H/M/S
          # 36000 = 10 hours; Jenkins and localhost are on different timezones
          expect(helper.get_epoch(Date.new(2016, 11, 29))).to be_within(36000).of(timestamp)
        end
        it 'returns the correct epoch time if the input type is a DateTime object' do
          expect(helper.get_epoch(DateTime.new(2016, 11, 29, 01, 00, 00, Rational(-8, 24)))).to eq(timestamp)
        end
      end
    end
  end

  describe 'custom_ga_tracking_code' do
    let(:enable_standard_ga_tracking) { false }
    let(:enable_opendata_ga_tracking) { true }

    before do
      allow(FeatureFlags).to receive(:derive).and_return(
        :enable_standard_ga_tracking => enable_standard_ga_tracking,
        :enable_opendata_ga_tracking => enable_opendata_ga_tracking
      )
    end

    context 'when enable_standard_ga_tracking is false' do
      context 'when enable_opendata_ga_tracking is true' do

        it 'should return true for use_ga_tracking_code?' do
          expect(helper.use_ga_tracking_code?).to eq(true)
        end

        context 'when the feature flag is an empty string' do
          let(:enable_opendata_ga_tracking) { '' }

          it 'should return true for use_ga_tracking_code?' do
            expect(helper.use_ga_tracking_code?).to eq(true)
          end
        end

        context 'when the feature flag is a tracking code' do
          let(:enable_opendata_ga_tracking) { 'UA-123456' }

          it 'should return true for use_ga_tracking_code?' do
            expect(helper.use_ga_tracking_code?).to eq(true)
          end
        end

        context 'when the tracking code is in the app_config' do
          let(:current_user) { User.new('id' => 'tugg-ikce', 'roleName' => 'admin') }

          before do
            allow(helper).to receive(:current_user).and_return(current_user)
            allow(APP_CONFIG).to receive(:opendata_ga_tracking_code).and_return('UA-9999999')
          end

          it 'should return the configured tracking code' do
            expect(helper.get_ga_tracking_code).to eq('UA-9999999')
          end

          it 'should render the proper _gaSocrata Javascript code' do
            expect(helper.render_ga_tracking).to match(/_gaSocrata\('create', 'UA-9999999', 'auto', 'socrata'\);/)
          end
        end

        context 'when the feature flag is an empty string' do
          let(:enable_opendata_ga_tracking) { '' }
          let(:current_user) { User.new('id' => 'tugg-ikce', 'roleName' => 'admin') }

          before do
            allow(helper).to receive(:current_user).and_return(current_user)
            allow(APP_CONFIG).to receive(:opendata_ga_tracking_code).and_return('UA-9999999')
          end

          it 'should return the configured tracking code' do
            expect(helper.get_ga_tracking_code).to eq('UA-9999999')
          end

          it 'should render the proper _gaSocrata Javascript code' do
            expect(helper.render_ga_tracking).to match(/_gaSocrata\('create', 'UA-9999999', 'auto', 'socrata'\);/)
          end
        end

        context 'when the feature flag contains a tracking code' do
          let(:enable_opendata_ga_tracking) { 'UA-123456' }
          let(:current_user) { User.new('id' => 'tugg-ikce', 'roleName' => 'admin') }

          before do
            allow(helper).to receive(:current_user).and_return(current_user)
            allow(APP_CONFIG).to receive(:opendata_ga_tracking_code).and_return(enable_opendata_ga_tracking)
          end

          it 'should return the tracking code from the feature flag' do
            expect(helper.get_ga_tracking_code).to eq(enable_opendata_ga_tracking)
          end

          it 'should render the proper _gaSocrata Javascript code' do
            expect(helper.render_ga_tracking).to match(/_gaSocrata\('create', 'UA-123456', 'auto', 'socrata'\);/)
          end
        end

        context 'extra tracking dimensions' do
          before do
            allow(helper).to receive(:current_user).and_return(current_user)
          end

          context 'when current_user is nil' do
            let(:current_user) { nil }

            it 'renders the extra tracking dimensions' do
              expect(helper.render_ga_tracking).to match(/_gaSocrata\('socrata\.send', 'pageview', extraDimensions\);/)
              expect(helper.render_ga_tracking).to match(/"dimension3":"none"/)
              expect(helper.render_ga_tracking).to match(/"dimension5":"none"/)
            end
          end

          context 'when the user is an admin' do
            let(:current_user) { User.new('id' => 'tugg-ikce', 'roleName' => 'admin') }

            it 'includes the user attributes' do
              expect(helper.render_ga_tracking).to match(/"dimension3":"admin"/)
              expect(helper.render_ga_tracking).to match(/"dimension5":"tugg-ikce"/)
            end
          end
        end
      end

      context 'when enable_opendata_ga_tracking is false' do
        let(:enable_opendata_ga_tracking) { false }
        let(:current_user) { User.new('id' => 'tugg-ikce', 'roleName' => 'admin') }

        before do
          allow(helper).to receive(:current_user).and_return(current_user)
          allow(APP_CONFIG).to receive(:opendata_ga_tracking_code).and_return(enable_opendata_ga_tracking)
        end

        it 'should return false for use_ga_tracking_code?' do
          expect(helper.use_ga_tracking_code?).to eq(false)
        end

        it 'should return false when get_ga_tracking_code is called' do
          expect(helper.get_ga_tracking_code).to eq(false)
        end

        it 'should render the proper _gaSocrata Javascript code' do
          expect(helper.render_ga_tracking).to_not match(/_gaSocrata\('create', 'UA-123456', 'auto', 'socrata'\);/)
        end
      end

      context 'when enable_opendata_ga_tracking is a tracking code' do
        context 'when enable_standard_ga_tracking is true' do
          let(:enable_standard_ga_tracking) { true }

          it 'should return the configured tracking code' do
            allow(APP_CONFIG).to receive(:standard_ga_tracking_code).and_return('UA-51234567')
            expect(helper.get_ga_tracking_code).to eq('UA-51234567')
          end
        end
      end

    end
  end

  describe 'find_user_id_and_role' do
    let(:current_user) { User.new('id' => 'tugg-ikce', 'roleName' => 'admin') }

    before do
      allow(helper).to receive(:current_user).and_return(current_user)
    end

    context 'with a current_user present' do
      it 'should return the user id for find_user_id' do
        expect(helper.find_user_id).to eq('tugg-ikce')
      end

      it 'should return the user role for find_user_role' do
        expect(helper.find_user_role).to eq('admin')
      end
    end

    context 'without a current_user' do
      let(:current_user) { nil }

      it 'should return "none" for find_user_id' do
        expect(helper.find_user_id).to eq('none')
      end

      it 'should return "none" for find_user_role' do
        expect(helper.find_user_role).to eq('none')
      end
    end

  end

  describe 'stylesheet_assets' do
    let(:asset_revision_key_regex) { %r{\?[\w\d]+\.\d+\.\d+} }

    it 'has assets' do
      expect(helper.stylesheet_assets.is_a?(Hash)).to eq(true)
      expect(helper.stylesheet_assets).to_not be_empty
    end

    it 'includes the asset revision key' do
      _, asset = helper.stylesheet_assets.first
      expect(asset).to match(asset_revision_key_regex)
    end

    it 'renders the configured id and updated_at in the revision key' do
      allow(CurrentDomain).to receive_messages(
        :default_config_id => '1234',
        :default_config_updated_at => '5678'
      )
      expect(helper.asset_revision_key).to match(/^[\w\d]+\.1234\.5678$/)
    end

    it 'renders the expected rendered stylesheet tag' do
      _, asset = STYLE_PACKAGES.first
      expect(helper.rendered_stylesheet_tag(asset.first)).to match(
        %r{<link type="text/css" rel="stylesheet" media="all" href="/styles/merged/#{asset.first}.css#{asset_revision_key_regex}"/>}
      )
    end
  end

  describe 'json_escape' do
    it 'produces sanitized json' do
      input_mapping = [
        ['1', '1'],
        ['null', 'null'],
        ['"&"', '"\u0026"'],
        ['"</script>"', '"\u003c/script\u003e"'],
        ['["</script>"]', '["\u003c/script\u003e"]'],
        ['{"name":"</script>"}', '{"name":"\u003c/script\u003e"}'],
        [%({"name":"d\u2028h\u2029h"}), '{"name":"d\u2028h\u2029h"}']
      ]
      input_mapping.each do |(raw, escaped)|
        expect(helper.json_escape(raw)).to eq(escaped)
      end
    end
  end

  describe 'font_tags' do

    it 'outputs typekit when config is present' do
      allow(CurrentDomain).to receive(:properties).and_return(OpenStruct.new(:typekit_id => 'abcdef'))
      expect(helper.font_tags).to match(%r{<script type="text/javascript" src="//use.typekit.net/abcdef.js"></script>})
      expect(helper.font_tags).to match(%r{<script type="text/javascript">try{Typekit.load\(\);}catch\(e\)\{\}</script>})
    end

    context 'when govStat module is enabled' do

      before do
        allow(helper).to receive(:module_enabled?).with(:govStat).and_return(true)
      end

      it 'outputs google font for govstat' do
        expect(helper.font_tags).to eq(
          '<link type="text/css" rel="stylesheet" href="https://fonts.googleapis.com/css?family=PT+Sans:400,700,400italic,700italic" />'
        )
      end

      context 'when typekit config is present' do

        before do
          allow(CurrentDomain).to receive(:properties).and_return(OpenStruct.new(:typekit_id => 'abcdef'))
        end

        it 'outputs typekit for govstat when config present' do
          expect(helper.font_tags).to match(%r{//use.typekit.net/abcdef.js})
        end

        it 'does not output google font for govstat when typekit config is present' do
          expect(helper.font_tags).to_not match(%r{fonts.googleapis.com})
        end

      end

    end

    context 'when govstat module is not enabled' do
      before do
        allow(helper).to receive(:module_enabled?).with(:govStat).and_return(false)
        allow(CurrentDomain).to receive(:properties).and_return(OpenStruct.new)
      end

      it 'does not output font tags at all' do
        expect(helper.font_tags).to_not match(%r{//use.typekit.net/abcdef.js})
        expect(helper.font_tags).to_not match(%r{fonts.googleapis.com})
      end
    end

    context 'storyteller user' do
      let(:stories_enabled) { true }
      let(:has_create_story) { true }
      let(:current_user) do
        double(User).tap do |user|
          allow(user).to receive(:has_right?).with('create_story').and_return(has_create_story)
        end
      end

      before do
        allow(Signaller).to receive(:healthy?).and_return(true)
        stub_feature_flags_with(stories_enabled: stories_enabled)
        allow(helper).to receive(:current_user).and_return(current_user)
      end

      context 'when stories_enabled and has_create_story are true' do

        it 'returns true when current_user_can_create_story? is called' do
          expect(helper.current_user_can_create_story?).to eq(true)
        end

      end

      context 'when stories_enabled is true and has_create_story is false' do
        let(:has_create_story) { false }

        it 'returns false when current_user_can_create_story? is called' do
          expect(helper.current_user_can_create_story?).to eq(false)
        end
      end

      context 'when stories_enabled is false and has_create_story is true' do
        let(:stories_enabled) { false }
        let(:has_create_story) { true }

        it 'returns false when current_user_can_create_story? is called' do
          expect(helper.current_user_can_create_story?).to eq(false)
        end
      end

      context 'when stories_enabled is false and has_create_story is false' do
        let(:stories_enabled) { false }
        let(:has_create_story) { false }

        it 'returns false when current_user_can_create_story? is called' do
          expect(helper.current_user_can_create_story?).to eq(false)
        end
      end
    end

  end

  describe 'is_mobile? method' do

    context 'with a request from a mobile user agent' do
      before do
        allow(CurrentDomain).to receive(:configuration).and_return(
          OpenStruct.new(:properties => OpenStruct.new(:view_type => 'table'))
        )
        allow(helper).to receive_messages(
          :request => OpenStruct.new(:env => { 'HTTP_USER_AGENT' => 'IPHone' }),
          :current_user => nil
        )
      end

      context 'when there are no request params' do
        it 'returns true' do
          allow(helper).to receive(:params).and_return({})
          expect(helper.is_mobile?).to eq(true)
        end
      end

      context 'when the mobile request param is true' do
        it 'returns true' do
          allow(helper).to receive(:params).and_return({ 'mobile' => 'trUE' }.with_indifferent_access)
          expect(helper.is_mobile?).to eq(true)
        end
      end

      context 'when the mobile request param is false' do
        it 'returns false' do
          allow(helper).to receive(:params).and_return({ 'mobile' => 'FALse' }.with_indifferent_access)
          expect(helper.is_mobile?).to eq(false)
        end
      end

      context 'when the no_mobile request param is false' do
        it 'returns true' do
          allow(helper).to receive(:params).and_return({ 'no_mobile' => 'FALse' }.with_indifferent_access)
          expect(helper.is_mobile?).to eq(true)
        end
      end

      context 'when the no_mobile request param is true' do
        it 'returns false' do
          allow(helper).to receive(:params).and_return({ 'no_mobile'  => 'trUE' }.with_indifferent_access)
          expect(helper.is_mobile?).to eq(false)
        end
      end

    end

    context 'with a request from a non-mobile user agent' do
      before do
        allow(CurrentDomain).to receive(:configuration).and_return(
          OpenStruct.new(:properties => OpenStruct.new(:view_type => 'table'))
        )
        allow(helper).to receive_messages(
          :request => OpenStruct.new(:env => { 'HTTP_USER_AGENT' => 'MaCiNtOsH' }),
          :current_user => nil
        )
      end

      context 'when there are no request params' do
        it 'returns false' do
          allow(helper).to receive(:params).and_return({})
          expect(helper.is_mobile?).to eq(false)
        end
      end

      context 'when the mobile request param is true' do
        it 'returns true' do
          allow(helper).to receive(:params).and_return({ 'mobile' => 'tRUe' }.with_indifferent_access)
          expect(helper.is_mobile?).to eq(true)
        end
      end

      context 'when the mobile request param is false' do
        it 'returns false' do
          allow(helper).to receive(:params).and_return({ 'mobile' => 'falSE' }.with_indifferent_access)
          expect(helper.is_mobile?).to eq(false)
        end
      end
    end
  end

  describe 'get_alt_dataset_link method' do
    it 'returns the proper link structure' do
      expect(helper.get_alt_dataset_link('test-name')).to match(%r{/d/test-name/alt})
    end
  end

  describe 'render_license method' do
    context 'with an empty view object' do
      it 'returns the (none) license' do
        expect(helper.render_license(View.new({}))).to eq('(none)')
      end
    end

    context 'with a minimal test license config' do
      it 'returns the test license' do
        allow_any_instance_of(LicenseConfig).to receive(:find_by_id).and_return(:name => 'license test')
        expect(helper.render_license(View.new('licenseId' => 'test'))).to eq('license test')
      end
    end

    context 'with a test license config that includes a terms link' do
      it 'returns the test license including the link' do
        allow_any_instance_of(LicenseConfig).to receive(:find_by_id).and_return(
          :name => 'license test',
          :terms_link => 'http://www.example.com'
        )
        html = Nokogiri::HTML(helper.render_license(View.new('licenseId' => 'test')))
        expect(html.text).to eq('license test')
        expect(html.css('body').children.first.name).to eq('a')
        expect(html.css('a').attribute('href').value).to eq('http://www.example.com')
      end
    end

    context 'with a test license config that includes a terms link and a logo with FDQN link' do
      it 'returns the test license including the link and the FDQN logo URL' do
        allow_any_instance_of(LicenseConfig).to receive(:find_by_id).and_return(
          :name => 'license test',
          :terms_link => 'http://www.example.com',
          :logo => 'http://www.example.com/logo.jpg'
        )
        html = Nokogiri::HTML(helper.render_license(View.new('licenseId' => 'test')))
        expect(html.text).to eq('')
        expect(html.css('body').children.first.name).to eq('a')
        expect(html.css('a').attribute('href').value).to eq('http://www.example.com')
        expect(html.css('a').children.first.name).to eq('img')
        expect(html.css('img').attribute('src').value).to eq('http://www.example.com/logo.jpg')
        expect(html.css('img').attribute('alt').value).to eq('license test')
      end
    end

    context 'with a test license config that includes a terms link and a logo with relative link' do
      it 'returns the test license including the link and the relative logo URL' do
        allow_any_instance_of(LicenseConfig).to receive(:find_by_id).and_return(
          :name => 'license test',
          :terms_link => 'http://www.example.com',
          :logo => 'images/logo.jpg'
        )
        html = Nokogiri::HTML(helper.render_license(View.new('licenseId' => 'test')))
        expect(html.text).to eq('')
        expect(html.css('body').children.first.name).to eq('a')
        expect(html.css('a').attribute('href').value).to eq('http://www.example.com')
        expect(html.css('a').children.first.name).to eq('img')
        expect(html.css('img').attribute('src').value).to eq('/images/logo.jpg')
        expect(html.css('img').attribute('alt').value).to eq('license test')
      end
    end

  end

  describe 'get_publish_embed_code_for_view method' do
    it 'returns the correct html content' do
      html = Nokogiri::HTML(helper.get_publish_embed_code_for_view(
        View.new('id' => 'blah-blah', 'domainCName' => 'local', 'federated' => false, 'name' => 'Templates'),
        :dimensions => { :width => 600, :height => 400 }
      ))
      expect(html.text).to match(/Templates/)
      expect(html.text).to match(/Powered by Socrata/)
      expect(html.css('iframe').attribute('width').value).to eq('600px')
      expect(html.css('iframe').attribute('height').value).to eq('400px')
      expect(html.css('a').attribute('href').value).to eq('http://local/dataset/Templates/blah-blah')
    end
  end

  # Note! This entire section relates to ONCALL-3032. The code under test, as originally written, may not
  # have been doing the right thing. The code was changed when these tests were ported from MiniTest
  # See corresponding comment in ApplicationHelper#user_has_domain_role_or_unauthenticated_share_by_email_enabled?
  describe 'user_has_domain_role_or_unauthenticated_share_by_email_enabled? method' do
    let(:has_view_rights) { true }
    let(:has_user_right) { true }
    let(:current_user) { User.new.tap { |user| allow(user).to receive(:has_right?).and_return(has_user_right) } }
    let(:view) { View.new.tap { |view| allow(view).to receive(:has_rights?).and_return(has_view_rights) } }
    let(:member) { true }

    before do
      allow(helper).to receive_messages(:request => nil, :current_user => current_user)
      allow(CurrentDomain).to receive(:member?).and_return(member)
    end

    context 'user has domain role or unauthenticated share by email enabled when view has grant right' do
      it 'returns true' do
        expect(helper.user_has_domain_role_or_unauthenticated_share_by_email_enabled?(view)).to eq(true)
      end
    end

    context 'user has domain role or unauthenticated share by email enabled when view does not have grant right and user is present and is member of current domain and has create datasets right' do
      let(:has_view_rights) { false }
      let(:has_user_right) { true }

      it 'returns true' do
        expect(helper.user_has_domain_role_or_unauthenticated_share_by_email_enabled?(view)).to eq(true)
      end
    end

    context 'user has domain role or unauthenticated share by email enabled when view does not have grant right and user is present and is member of current domain and does not have create datasets right' do
      let(:has_view_rights) { false }
      let(:has_user_right) { false }

      it 'returns falsey' do
        expect(helper.user_has_domain_role_or_unauthenticated_share_by_email_enabled?(view)).to be_falsey
      end
    end

    context 'user has domain role or unauthenticated share by email enabled when view does not have grant right and user is present and is not member of current domain and user has create datasets right' do
      let(:has_view_rights) { false }
      let(:member) { false }
      let(:has_user_right) { true }

      it 'returns falsey' do
        expect(helper.user_has_domain_role_or_unauthenticated_share_by_email_enabled?(view)).to be_falsey
      end
    end

    context 'user has domain role or unauthenticated share by email enabled when view does not have grant right and user is not present and is member of the current domain' do
      let(:has_view_rights) { false }
      let(:member) { false }
      let(:has_user_right) { false }

      it 'returns falsey' do
        expect(helper.user_has_domain_role_or_unauthenticated_share_by_email_enabled?(view)).to be_falsey
      end
    end

    context 'when user has domain role or unauthenticated share by email enabled when view does not have grant right and user is not present and is member of the current domain' do
      let(:has_view_rights) { false }
      let(:current_user) { nil }
      let(:member) { true }

      it 'returns falsey' do
        expect(helper.user_has_domain_role_or_unauthenticated_share_by_email_enabled?(view)).to be_falsey
      end
    end

    context 'when user has domain role or unauthenticated share by email enabled when view does not have grant right and user is not present and is not member of the current domain' do
      let(:has_view_rights) { false }
      let(:current_user) { nil }
      let(:member) { false }

      it 'returns falsey' do
        expect(helper.user_has_domain_role_or_unauthenticated_share_by_email_enabled?(view)).to be_falsey
      end
    end

    context 'when user has domain role or unauthenticated share by email enabled when view does not have grant right and user is not present and view is public' do
      let(:has_view_rights) { false }
      let(:current_user) { nil }
      let(:member) { false }

      it 'returns true' do
        allow(view).to receive(:is_public?).and_return(true)
        expect(helper.user_has_domain_role_or_unauthenticated_share_by_email_enabled?(view)).to eq(true)
      end
    end

    context 'when user has domain role or unauthenticated share by email enabled when view does not have grant right and user is not present and view is not public' do
      let(:has_view_rights) { false }
      let(:current_user) { nil }
      let(:member) { false }

      it 'returns true' do
        allow(view).to receive(:is_public?).and_return(false)
        expect(helper.user_has_domain_role_or_unauthenticated_share_by_email_enabled?(view)).to be_falsey
      end
    end
  end

  describe 'include_webpack_bundle' do
    let(:asset_manifest) { {'main.js' => 'main.js'} }

    before do
      expect(Rails.configuration.webpack).to receive(:[]).with(:use_dev_server).and_return(false)
      expect(Rails.configuration.webpack).to receive(:[]).with(:use_manifest).and_return(true)
    end

    it 'raises when the resource cannot be found' do
      expect(Rails.configuration.webpack).to receive(:[]).with(:asset_manifest).and_return(asset_manifest)
      expect { helper.include_webpack_bundle('missing') }.to raise_error(KeyError)
    end

    it 'renders a script tag with the appropriate resource' do
      expect(Rails.configuration.webpack).to receive(:[]).with(:asset_manifest).and_return(asset_manifest)
      expect(helper.include_webpack_bundle('main.js')).to match(%r{javascripts/build/main.js\?.*\d+"})
    end

    it 'handles resource names without the file extension' do
      expect(Rails.configuration.webpack).to receive(:[]).with(:asset_manifest).and_return(asset_manifest)
      expect(helper.include_webpack_bundle('main')).to match(%r{javascripts/build/main.js\?.*\d+"})
    end
  end

  describe '#webpack_bundle_src' do
    let(:resource) { 'some-resource' }
    let(:asset_revision_key) { 'testvalue' }
    let(:use_dev_server) { false }

    let(:result) { helper.webpack_bundle_src(resource) }

    before do
      allow(helper).to receive(:asset_revision_key).and_return(asset_revision_key)
      allow(Rails.configuration.webpack).to receive(:[]).with(:use_dev_server).and_return(use_dev_server)
    end

    context 'when `use_dev_server` is true' do
      let(:use_dev_server) { true }

      it 'returns correct path' do
        expect(result).to eq("/javascripts/webpack/#{resource}.js?#{asset_revision_key}")
      end
    end

    context 'when `use_dev_server` is false' do
      let(:use_dev_server) { false }
      let(:use_manifest) { false }

      before do
        allow(Rails.configuration.webpack).to receive(:[]).with(:use_manifest).and_return(use_manifest)
      end

      context 'when `use_manifest` is false' do
        let(:use_manifest) { false }

        it 'returns correct path' do
          expect(result).to eq("/javascripts/build/#{resource}.js?#{asset_revision_key}")
        end
      end

      context 'when `use_manifest` is true' do
        let(:use_manifest) { true }
        let(:asset_manifest) { { "#{resource}.js" => 'some-resource-file.js' } }

        before do
          allow(Rails.configuration.webpack).to receive(:[]).with(:asset_manifest).and_return(asset_manifest)
        end

        it 'returns correct path' do
          expect(result).to eq("/javascripts/build/some-resource-file.js?#{asset_revision_key}")
        end
      end
    end
  end

  describe 'aria helper methods' do

    context 'icon_with_aria_text' do

      it 'returns a span with class "icon" with an inner span containing aria text' do
        expect(helper.icon_with_aria_text('aria text')).
          to eq('<span class="icon"><span class="aria-not-displayed">aria text</span></span>')
      end

      it 'returns a span with a custom class with an inner span containing aria text' do
        expect(helper.icon_with_aria_text('aria text', :class => 'custom-icon-class')).
          to eq('<span class="custom-icon-class"><span class="aria-not-displayed">aria text</span></span>')
      end

    end
  end

  describe 'asset_inventory_view_model' do
    before do
      allow(helper).to receive_messages(:request => nil, :current_user => current_user)
    end

    let(:current_user) do
      double('current_user').tap { |user| allow(user).to receive(:is_superadmin?).and_return(false) }
    end

    context 'when find raises a core error' do
      before do
        allow(AssetInventoryService).to receive(:find).and_raise(CoreServer::CoreServerError.new(
          '/admin/assets',
          401,
          'nope'
        ))
      end

      it 'should disable button in view_model' do
        expect(helper.asset_inventory_view_model[:asset_inventory][:button_disabled]).to eq(true)
      end
    end

    context 'when find returns a value asset inventory dataset' do
      before do
        allow(AssetInventoryService).to receive(:find).and_return(double('view'))
      end

      it 'should not disable button in view_model' do
        expect(helper.asset_inventory_view_model[:asset_inventory][:button_disabled]).to eq(false)
      end
    end
  end

  describe 'valid_cname?' do
    it 'returns true when provided with valid cnames' do
      expect(helper.valid_cname?('localhost')).to eq(true)
      expect(helper.valid_cname?('example.com')).to eq(true)
      expect(helper.valid_cname?('data.weatherfordtx.gov')).to eq(true)
      expect(helper.valid_cname?('atf-performance-dashboards.demo.socrata.com')).to eq(true)
    end

    it 'returns false when provided with invalid cnames' do
      expect(helper.valid_cname?('localhost.')).to eq(false)
      expect(helper.valid_cname?('localhost..com')).to eq(false)
      expect(helper.valid_cname?('http://localhost')).to eq(false)
      expect(helper.valid_cname?('local--host')).to eq(false)
      expect(helper.valid_cname?('felixhernandez@demo.socrata.com')).to eq(false)
      expect(helper.valid_cname?('cityofmadison,demo.socrata.com')).to eq(false)
    end
  end
end
