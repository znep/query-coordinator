require 'rails_helper'

RSpec.describe AirbrakeHelper, type: :helper do

  let(:mock_airbrake_configuration) { double('airbrake_configuration') }
  let!(:project_id) { '3145' }

  before do
    allow(Airbrake).to receive(:configuration).and_return(mock_airbrake_configuration)
    allow(mock_airbrake_configuration).to receive(:to_hash).and_return(sample_airbrake_configuration)
    allow(mock_airbrake_configuration).to receive(:project_id).and_return(project_id)
  end

  describe '#airbrake_config_for_js' do
    let(:result) { airbrake_config_for_js }

    it 'returns a hash with selected keys' do
      expect(result).to be_a(Hash)
      expect(result.length).to eq(3)
    end

    it 'transforms api_key key' do
      expect(result[:projectKey]).to eq(sample_airbrake_configuration[:api_key])
    end

    it 'transforms environment_name key' do
      expect(result[:environment]).to eq(sample_airbrake_configuration[:environment_name])
    end

    # This is currently a separate code path since the airbrake gem does not include `project_id` in `to_hash`
    it 'injects project_id key' do
      expect(result[:projectId]).to eq('3145')
    end

    context 'when project_id is nil' do
      let(:project_id) { nil }

      it 'leaves :projectId nil' do
        expect(result[:projectId]).to eq(nil)
      end
    end
  end


  # This was dumped from `Airbrake.configuration.to_hash` in rails console
  def sample_airbrake_configuration
    {
      :api_key=>'sample_api_key',
      :backtrace_filters=>[],
      :development_environments=>["development", "test", "cucumber"],
      :development_lookup=>true,
      :environment_name=>"rspec-staging",
      :host=>"api.airbrake.io",
      :http_open_timeout=>2,
      :http_read_timeout=>5,
      :ignore=>[
        "ActiveRecord::RecordNotFound",
        "ActionController::RoutingError",
        "ActionController::InvalidAuthenticityToken",
        "CGI::Session::CookieStore::TamperedWithCookie",
        "ActionController::UnknownHttpMethod",
        "ActionController::UnknownAction",
        "AbstractController::ActionNotFound",
        "Mongoid::Errors::DocumentNotFound",
        "ActionController::UnknownFormat"
      ],
      :ignore_by_filters=>[],
      :ignore_user_agent=>[],
      :notifier_name=>"Airbrake Notifier",
      :notifier_url=>"https://github.com/airbrake/airbrake",
      :notifier_version=>"4.3.0",
      :params_filters=>["password", "password_confirmation"],
      :params_whitelist_filters=>[],
      :port=>80,
      :protocol=>"http",
      :proxy_host=>nil,
      :proxy_pass=>nil,
      :proxy_port=>nil,
      :proxy_user=>nil,
      :secure=>false,
      :use_system_ssl_cert_chain=>false,
      :framework=>"Rails: 4.2.2",
      :user_information=>"Airbrake Error {{error_id}}",
      :rescue_rake_exceptions=>nil,
      :rake_environment_filters=>[],
      :test_mode=>nil
    }
  end
end
