require 'rails_helper'

describe ProfileController do
  include TestHelperMethods

  before(:each) do
    init_anonymous_environment
  end

  describe 'GET /profile' do
    render_views

    let(:current_user) do
      login.tap do |user|
        allow(user).to receive_messages(rights: nil, profileImageUrlLarge: nil)
      end
    end

    before do
      allow(subject).to receive(:current_user).and_return(current_user)
      # For reasons unknown, VCR isn't trapping this network request
      allow(subject).to receive(:retrieve_zendesk_news).and_return(
        YAML.load_file("#{Rails.root}/spec/fixtures/vcr_cassettes/profile_controller/zendesk.yml")
      )
    end

    context 'when cetera_search is true and cetera_profile_search is false' do
      before do
        rspec_stub_feature_flags_with(:cetera_search => true, :cetera_profile_search => false)
        stub_site_chrome
        allow(CurrentDomain).to receive(:configUpdatedAt).and_return(1477332912)
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
