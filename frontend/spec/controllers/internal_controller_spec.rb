require 'rails_helper'

describe InternalController do
  include TestHelperMethods

  let(:current_user) { instance_double(User) }
  let(:domain_cname) { CurrentDomain.cname }

  before do
    init_environment

    allow(subject).to receive(:current_user).and_return(current_user)
    allow(Domain).to receive(:find).and_return(CurrentDomain.domain)
    allow(CurrentDomain).to receive(:default_locale).and_return('en')
  end

  describe 'POST /set_feature_flags' do
    # NOTE: there seem to be be conflicting behavior about whether feature_flags
    # needs to be set, based on whether Signaller is used or not!
    let(:set_feature_flag_payload) do
      {
        domain_id: domain_cname,
        feature_flags: {
          test_feature: 'test_value'
        }
      }.with_indifferent_access
    end
    let(:reset_feature_flag_payload) do
      {
        domain_id: domain_cname,
        feature_flags: {
          test_feature: nil
        },
        reset_to_default: {
          test_feature: nil
        }
      }.with_indifferent_access
    end

    describe 'when anonymous' do
      let(:current_user) { nil }

      it 'is rejected with a redirect to login' do
        post(:set_feature_flags, set_feature_flag_payload)

        # see note on InternalController#check_auth
        expect(response).to redirect_to(:login)
      end
    end

    describe 'when non-superadmin' do
      before do
        init_current_user(subject)
        allow(current_user).to receive(:is_superadmin?).and_return(false)

        allow(Signaller).to receive(:healthy?).and_return(false)
      end

      it 'is rejected as forbidden' do
        post(:set_feature_flags, set_feature_flag_payload)

        expect(response.code.to_i).to eq(403)
      end
    end

    describe 'when superadmin' do
      before do
        init_feature_flag_signaller
        stub_site_chrome
        init_current_user(subject)
        allow(current_user).to receive(:is_superadmin?).and_return(true)
        allow(Organization).to receive(:find).and_return([])
      end

      render_views

      context 'feature_flags' do
        before do
          allow_any_instance_of(Domain).to receive(:has_child_domains?).and_return(true)
        end
        it 'does not render the left_nav at all' do
          get :feature_flags, :org_id => 1, :domain_id => 'localhost'
          expect(response).to have_http_status(:ok)
          assert_select('.leftNavBox.internalPanel')
          assert_select('.super-admin-menu', :count => 0)
          assert_select('.leftNavBox.adminNavBox', :count => 0)
        end
      end

      %i(index index_orgs analytics feature_flag_report demos).each do |page|
        it "renders the internal_panel left_nav on the '#{page}' page" do
          VCR.use_cassette('internal_panel') do
            get page
            expect(response).to have_http_status(:ok)
            assert_select('.leftNavBox.internalPanel') unless page == :demos
            assert_select('.super-admin-menu', :count => 0)
            assert_select('.leftNavBox.adminNavBox', :count => 0)
          end
        end
      end
    end
  end

  describe 'preventing invalid modules' do
    MODULE_NAMES_UNDER_TEST = ['routing_approval', 'view_moderation']

    let(:create_domain_params) do
      {
        'utf8' => '✓',
        'authenticity_token' => 't8aKIa1wNLjA0w5GlGOt/2fSFuRi1Ca6gSk/vKaA1w3C/alFTZyT8F86fEmXQYf9xS/5gDhmTQZPlwQLQUMDWg==',
        'domain' => {
          'organizationId' => '34',
          'name' => 'Domain Name',
          'cName' => 'domain-cname',
          'parentDomainId' => '2'
        },
        'config' => {
          'parentDomainCName' => 'dontuse.ly'
        },
        'org_id' => '34'
      }
    end

    before do
      allow(current_user).to receive(:is_superadmin?).and_return(true)
      stub_feature_flags_with(flags)
    end

    MODULE_NAMES_UNDER_TEST.each do |module_name|
      describe 'create_domain' do
        let(:account_module) { AccountModule.new }
        let(:does_include) { true }

        before do
          allow(AccountModule).to receive(:include?).and_return(does_include)
          allow(AccountTier).to receive(:find_by_name).and_return(AccountTier.new('id' => 1))
          allow(Domain).to receive(:create).and_return(Domain.new('cname' => 'cname'))
          allow(Domain).to receive(:add_account_module)
          allow(Configuration).to receive(:find_by_type).and_return([Configuration.new('id' => 1)])
          allow(Configuration).to receive(:create)
          allow_any_instance_of(Configuration).to receive(:create_property)
        end


        context 'use_fontana_approvals feature flag is false' do
          let(:flags) { { 'use_fontana_approvals' => false }.with_indifferent_access }

          it "allows adding the #{module_name} module" do
            allow(subject).to receive(:module_features_on_by_default).and_return(
              %W(canvas2 geospatial staging_lockdown staging_api_lockdown #{module_name})
            )

            VCR.use_cassette('prevent_invalid_modules') do
              post :create_domain, create_domain_params
              expect(flash[:error]).to be_blank
            end
          end
        end

        context 'use_fontana_approvals is true' do
          let(:flags) { { 'use_fontana_approvals' => true }.with_indifferent_access }

          it "prevents adding the #{module_name} module" do
            allow(subject).to receive(:module_features_on_by_default).and_return(
              %W(canvas2 geospatial staging_lockdown staging_api_lockdown #{module_name})
            )

            VCR.use_cassette('prevent_invalid_modules') do
              post :create_domain, create_domain_params
              expect(assigns(:flashes)[:error].include?(subject.module_error_for(module_name))).to eq(true)
            end
          end
        end
      end

      describe 'add_a_module_feature' do
        let(:default_module_feature_params) do
          {
            'utf8' => '✓',
            'authenticity_token' => 'n0yWUwYdaf/cBd4LIv8Mq2hekMvuhWe/ifYEaAx7+8vqd7U35vHOt0PsrAQh3SapyqN/r7Q3DANHSD/f67gvnA==',
            'new-feature_enabled' => 'enabled',
            'commit' => 'Add',
            'domain_id' => 'cname'
          }
        end

        def params_for(feature_name)
          default_module_feature_params.merge('new-feature_name' => feature_name)
        end

        let(:account_module) { AccountModule.new }
        let(:does_include) { false }

        before do
          allow(AccountModule).to receive(:find).and_return(account_module)
          allow(AccountModule).to receive(:include?).and_return(does_include)
          allow_any_instance_of(Configuration).to receive(:update_property)
          allow_any_instance_of(Configuration).to receive(:create_property)
        end

        context 'use_fontana_approvals feature flag is false' do
          let(:flags) { { 'use_fontana_approvals' => false }.with_indifferent_access }

          it "allows adding the #{module_name} module" do
            VCR.use_cassette('prevent_invalid_modules') do
              post :add_module_feature, params_for(module_name)
              expect(flash[:error]).to be_blank
            end
          end
        end

        context 'use_fontana_approvals is true' do
          let(:flags) { { 'use_fontana_approvals' => true }.with_indifferent_access }
          let(:does_include) { true }

          it "prevents adding the #{module_name} module" do
            allow(Domain).to receive(:add_account_module)
            VCR.use_cassette('prevent_invalid_modules') do
              post :add_module_feature, params_for(module_name)
              expect(flash[:error]).to eq(subject.module_error_for(module_name))
            end
          end
        end
      end
    end
  end
end
