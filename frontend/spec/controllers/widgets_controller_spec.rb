require 'rails_helper'

describe WidgetsController do
  include TestHelperMethods

  let(:view) { instance_double(View).as_null_object }

  before do
    init_core_session
    init_current_domain
    init_signaller
    stub_site_chrome
  end

  describe 'GET /widgets/:id' do

    it 'should set the X-Frame-Options header to ALLOWALL' do
      allow(View).to receive(:find).and_return(view)
      allow(view).to receive(:display) # remove pointless reference printed by double
      get :show, id: 'four-four'
      expect(response.code.to_i).to eq(200)
      expect(response.headers).to include({ 'X-Frame-Options' => 'ALLOWALL' })
    end

  end

end
