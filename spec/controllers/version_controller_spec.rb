require 'rails_helper'

describe VersionController do
  include TestHelperMethods

  before do
    init_core_session
    init_current_domain
    init_signaller
  end

  describe 'GET /version' do
    context 'as HTML' do
      render_views

      before do
        stub_site_chrome
      end

      it 'responds with HTML' do
        get :index
        expect(response.code.to_i).to eq(200)
        expect(response).to render_template('version/index')
        expect(response.body).to match(/Current Version:/)
      end
    end

    context 'as JSON' do
      it 'responds with JSON' do
        get :index, format: :json
        expect(response.code.to_i).to eq(200)
        expect(JSON.parse(response.body)).to have_key('version')
      end
    end
  end
end
