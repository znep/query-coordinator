require 'rails_helper'

describe ProfileController do
  include TestHelperMethods

  before(:each) do
    init_core_session
    init_current_domain
    init_signaller
  end

  describe 'GET /profile' do
    render_views

    let(:current_user) { login }

    before do
      allow(subject).to receive(:current_user).and_return(current_user)
    end

    context 'when cetera_search is true and cetera_profile_search is false' do
      before do
        rspec_stub_feature_flags_with(:cetera_search => true, :cetera_profile_search => false)
        stub_site_chrome
      end

      it 'should not use browse2 to render the embedded catalog' do
        VCR.use_cassette('profile_controller/show') do
          get :show, current_user.route_params
          expect(response).to be_success
          assert_select('table.gridList')
        end
      end
    end

  end

end
