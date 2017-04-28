require 'spec_helper'

describe OpenPerformance::Odysseus do
  let(:odysseus_service_uri) { 'http://odysseus.example.com:9999' }

  let(:odysseus_request_headers) do
    {
      'Cookie' => '_core_session_id=CORE_SESSION_ID; socrata-csrf-token=CSRF_TOKEN',
      'X-Socrata-Host' => 'example.com'
    }
  end

  let(:odysseus_response_status) { 200 }
  let(:odysseus_response_body) { '{ "id": "mock" }' }
  let(:odysseus_response_content_type) { 'application/json' }

  before do
    allow(Rails.application.config).to receive(:odysseus_service_uri).and_return(odysseus_service_uri)

    ::RequestStore.store[:socrata_session_headers] = odysseus_request_headers

    stub_request(:any, %r(^#{odysseus_service_uri})).
      with(
        headers: odysseus_request_headers # This will verify the headers are correct.
      ).
      to_return(
        status: odysseus_response_status,
        headers: { 'Content-Type' => odysseus_response_content_type },
        body: odysseus_response_body
      )
  end

  shared_examples 'cacheable GET request' do
    it 'caches result' do
      example_invocation.call
      example_invocation.call
      expect(a_request(:get, example_endpoint)).to have_been_made.once
    end
  end

  shared_examples 'error interpreter' do
    describe 'wrong content type' do
      let(:odysseus_response_content_type) { 'text/plain' }

      it 'raises with a distinctive message' do
        expect { example_invocation.call }.to raise_error(/Unexpected non-json non-csv response from Odysseus/)
      end
    end

    describe '5xx response code' do
      let(:odysseus_response_status) { 500 }

      it 'raises with a distinctive message' do
        expect { example_invocation.call }.to raise_error(/Unexpected server error response from Odysseus/)
      end
    end

    describe '400 response code' do
      let(:odysseus_response_status) { 400 }

      it 'raises with a distinctive message' do
        expect { example_invocation.call }.to raise_error(/Unexpected 400 response from Procrustes/)
      end
    end
  end

  describe '#get_goal' do
    let(:example_endpoint) { "#{odysseus_service_uri}/api/stat/v1/goals/four-four" }
    let(:example_invocation) do
      -> { OpenPerformance::Odysseus.get_goal('four-four') }
    end

    it_behaves_like 'cacheable GET request'
    it_behaves_like 'error interpreter'

    it 'does not cache result for different 4x4s' do
      OpenPerformance::Odysseus.get_goal('four-four')
      OpenPerformance::Odysseus.get_goal('four-five')

      expect(a_request(:get, "#{odysseus_service_uri}/api/stat/v1/goals/four-four")).to have_been_made.once
      expect(a_request(:get, "#{odysseus_service_uri}/api/stat/v1/goals/four-five")).to have_been_made.once
    end
  end

  describe '#get_goal_narrative' do
    let(:example_endpoint) { "#{odysseus_service_uri}/api/stat/v2/goals/four-four/narrative-migration-metadata" }
    let(:example_invocation) do
      -> { OpenPerformance::Odysseus.get_goal_narrative('four-four') }
    end

    it_behaves_like 'cacheable GET request'
    it_behaves_like 'error interpreter'

    it 'does not cache result for different 4x4s' do
      OpenPerformance::Odysseus.get_goal_narrative('four-four')
      OpenPerformance::Odysseus.get_goal_narrative('four-five')

      expect(a_request(:get, "#{odysseus_service_uri}/api/stat/v2/goals/four-four/narrative-migration-metadata")).to have_been_made.once
      expect(a_request(:get, "#{odysseus_service_uri}/api/stat/v2/goals/four-five/narrative-migration-metadata")).to have_been_made.once
    end
  end

  describe '#copy_goal' do
    let(:target_dashboard) { 'dash-bord' }
    let(:target_title) { 'title for copied goal' }

    let(:example_endpoint) { "#{odysseus_service_uri}/api/stat/v2/goals/four-four/copyToDashboard" }
    let(:example_invocation) do
      -> { OpenPerformance::Odysseus.copy_goal('four-four', target_dashboard, target_title) }
    end

    it_behaves_like 'error interpreter'

    it 'does not cache result' do
      example_invocation.call
      example_invocation.call

      query_params = {
        dashboard: target_dashboard,
        name: target_title
      }.to_query

      expect(a_request(:post, "#{example_endpoint}?#{query_params}")).to have_been_made.twice
    end
  end

  describe '#list_dashboards' do
    let(:example_endpoint) { "#{odysseus_service_uri}/api/stat/v1/dashboards" }
    let(:example_invocation) do
      -> { OpenPerformance::Odysseus.list_dashboards }
    end

    it_behaves_like 'cacheable GET request'
    it_behaves_like 'error interpreter'
  end
end
