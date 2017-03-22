require 'rails_helper'

describe InternalController do
  include TestHelperMethods

  let(:current_user) { instance_double(User) }
  let(:domain_cname) { CurrentDomain.cname }

  before do
    init_core_session
    init_current_domain
    stub_site_chrome

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
        init_current_user(subject)
        allow(current_user).to receive(:is_superadmin?).and_return(true)
      end

      xdescribe 'using Signaller' do
        before do
          init_signaller
        end

        # TODO: check behavior expectations on FeatureFlags#(re)set_value
      end

      describe 'not using Signaller' do
        before do
          allow(Signaller).to receive(:healthy?).and_return(false)
        end

        it 'succeeds and redirects to the canonical page when HTML' do
          post(:set_feature_flags, set_feature_flag_payload)

          expect(response).to redirect_to(feature_flags_config_path(domain_id: domain_cname))
        end

        # Although it seems like we intend to support JSON, it doesn't seem like
        # the format parameter is being respected (request.format is text/html)!

        #it 'succeeds when JSON' do
        #  post(:set_feature_flags, set_feature_flag_payload, format: :json)

        #  expect(response.code.to_i).to eq(200)
        #end

        it 'sends a request to Core when setting a feature flag' do
          expect_any_instance_of(CoreServer::Connection).to receive(:batch_request)

          post(:set_feature_flags, set_feature_flag_payload)
        end

        it 'sends a request to Core when resetting a feature flag' do
          expect_any_instance_of(CoreServer::Connection).to receive(:batch_request)

          post(:set_feature_flags, reset_feature_flag_payload)
        end

        it 'uses an existing configuration if it exists' do
          existing_configuration = instance_double(Configuration)
          allow(existing_configuration).to receive(:domainCName).and_return(domain_cname)
          allow(existing_configuration).to receive(:properties)
          allow_any_instance_of(Domain).to receive(:default_configuration).and_return(existing_configuration)

          expect(Configuration).to_not receive(:create)

          post(:set_feature_flags, set_feature_flag_payload)
        end

        it 'creates a configuration when no feature flag config exists' do
          new_configuration = instance_double(Configuration)
          allow(new_configuration).to receive(:properties)

          allow_any_instance_of(Domain).to receive(:default_configuration).and_return(nil)

          expect(Configuration).to receive(:create).and_return(new_configuration)

          post(:set_feature_flags, set_feature_flag_payload)
        end

        it 'creates a configuration when the cname does not match' do
          new_configuration = instance_double(Configuration)
          allow(new_configuration).to receive(:properties)

          parent_configuration = instance_double(Configuration)
          allow(parent_configuration).to receive(:domainCName).and_return('dontuse.ly')
          allow_any_instance_of(Domain).to receive(:default_configuration).and_return(parent_configuration)

          expect(Configuration).to receive(:create).and_return(new_configuration)

          post(:set_feature_flags, set_feature_flag_payload)
        end

        it 'updates the cached feature flag values for the current domain' do
          expect(CurrentDomain).to receive(:flag_out_of_date!).with(domain_cname)

          post(:set_feature_flags, reset_feature_flag_payload)
        end
      end
    end
  end
end

# Old Minitest tests for `valid_cname?` have been preserved here.
# These really should be exposed as a public method somewhere else, not as a
# private method of this controller.

#   test 'provided with valid cnames, valid_cname? should return true' do
#     assert(@controller.send(:valid_cname?, 'localhost'))
#     assert(@controller.send(:valid_cname?, 'example.com'))
#     assert(@controller.send(:valid_cname?, 'data.weatherfordtx.gov'))
#     assert(@controller.send(:valid_cname?, 'atf-performance-dashboards.demo.socrata.com'))
#   end

#   test 'provided with invalid cnames, valid_name? should return false' do
#     refute(@controller.send(:valid_cname?, 'localhost.'))
#     refute(@controller.send(:valid_cname?, 'localhost..com'))
#     refute(@controller.send(:valid_cname?, 'http://localhost'))
#     refute(@controller.send(:valid_cname?, 'local--host'))
#     refute(@controller.send(:valid_cname?, 'felixhernandez@demo.socrata.com'))
#     refute(@controller.send(:valid_cname?, 'cityofmadison,demo.socrata.com'))
#   end
