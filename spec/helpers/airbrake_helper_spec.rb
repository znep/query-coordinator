require 'rails_helper'

RSpec.describe AirbrakeHelper, type: :helper do

  let(:environment) { 'development' }
  let(:project_id) { '3145' }
  let(:project_key) { 'abcdefghij' }
  let(:rails_env) { 'rails_environment' }

  before do
    allow(ENV).to receive(:[]).with('AIRBRAKE_ENVIRONMENT_NAME').and_return(environment)
    allow(ENV).to receive(:[]).with('AIRBRAKE_PROJECT_ID').and_return(project_id)
    allow(ENV).to receive(:[]).with('AIRBRAKE_API_KEY').and_return(project_key)
    allow(Rails).to receive(:env).and_return(rails_env)
  end

  describe '#airbrake_config_for_js' do
    it 'returns a hash with config values' do
      expected = {
        environment: environment,
        projectId: project_id,
        projectKey: project_key
      }
      expect(airbrake_config_for_js).to eq(expected)
    end

    context 'when environment is not set' do
      let(:environment) { nil }

      it 'has environment set to Rails.env' do
        expected = {
          environment: rails_env,
          projectId: project_id,
          projectKey: project_key
        }
        expect(airbrake_config_for_js).to eq(expected)
      end
    end
  end
end
