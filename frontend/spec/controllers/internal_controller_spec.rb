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
        init_current_user(subject)
        allow(current_user).to receive(:is_superadmin?).and_return(true)
      end

      xdescribe 'using Signaller' do
        before do
          init_signaller
        end

        # TODO: check behavior expectations on FeatureFlags#(re)set_value
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
