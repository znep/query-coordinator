require 'rails_helper'

RSpec.describe VersionController, type: :controller do
  describe '#show' do
    before do
      stub_const('Storyteller::REVISION_NUMBER', 'therevisionnumber')
      stub_const('Storyteller::BUILD_TIMESTAMP', 12345678)
      stub_const('Storyteller::BOOTED_TIMESTAMP', 98765432)

      get :show
    end

    let(:result) { JSON.parse(response.body) }

    it 'renders json' do
      expect(response.headers['Content-Type']).to match 'application/json'
    end

    it 'renders revision number' do
      expect(result['revision']).to eq 'therevisionnumber'
    end

    it 'renders revision date' do
      expect(result['buildTimestamp']).to eq 12345678
    end

    it 'renders uptime' do
      expect(result['bootedTimestamp']).to eq 98765432
    end

    it 'renders delayedJobAge30sCount' do
      expect(result['delayedJobAge30sCount']).to eq(0)
    end

    it 'renders semantic version' do
      expect(result['version']).to eq(SemVer.find.format('%M.%m.%p'))
    end
  end
end
