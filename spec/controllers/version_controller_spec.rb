require 'rails_helper'

RSpec.describe VersionController, type: :controller do
  describe '#show' do
    before do
      stub_const('REVISION_NUMBER', 'therevisionnumber')
      stub_const('REVISION_DATE', 12345678)
    end

    let(:result) { JSON.parse(response.body) }

    it 'renders json' do
      get :show
      expect(response.headers['Content-Type']).to match 'application/json'
    end

    it 'renders revision number' do
      get :show
      expect(result['revision']).to eq 'therevisionnumber'
    end

    it "renders revision date" do
      get :show
      expect(result['timestamp']).to eq 12345678
    end
  end
end
