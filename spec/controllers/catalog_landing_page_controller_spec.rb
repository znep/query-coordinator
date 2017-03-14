require 'rails_helper'

describe CatalogLandingPageController do

  include TestHelperMethods

  before(:each) do
    init_core_session
    init_current_domain
    init_current_user(controller)
    init_signaller
    rspec_stub_feature_flags_with(cetera_search: true)
    login
    allow(subject).to receive(:get_site_title).and_return('site title')
  end

  describe 'GET #show' do
    # Note, this spec does NOT exercise the CatalogLandingPageConstraint.
    # Also the :category parameter is essentially ignored.
    it 'should render show with the catalog_landing_page layout' do
      VCR.use_cassette('catalog_landing_page_controller') do
        expect(subject.get_site_title).to eq('site title')
        get :show, :category => 'Government'
        expect(response).to have_http_status(:success)
      end
    end
  end

end
