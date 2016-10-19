require 'spec_helper'

describe OpenPerformance::Goal do
  let(:goal_uid) { 'itha-caaa' }
  let(:odysseus_service_uri) { 'http://itha.ca:9999' }
  let(:headers) do
    {
      'Cookie' => '_core_session_id=achilles; socrata-csrf-token=eurycleia',
      'X-Socrata-Host' => 'data.troy.gr'
    }
  end
  let(:goal_api_url) { "#{odysseus_service_uri}/api/stat/v1/goals/#{goal_uid}.json" }

  let(:odysseus_status) { 200 }
  let(:odysseus_body) { '{ "id": "mock" }' }
  let(:odysseus_content_type) { 'application/json' }

  let(:instance) do
    OpenPerformance::Goal.new(goal_uid)
  end

  before do
    allow(Rails.application.config).to receive(:odysseus_service_uri).and_return(odysseus_service_uri)
    ::RequestStore.store[:socrata_session_headers] = headers

    stub_request(:get, goal_api_url).
      with(
        headers: headers # This will verify the headers are correct.
      ).
      to_return(
        status: odysseus_status,
        headers: { 'Content-Type' => odysseus_content_type },
        body: odysseus_body
      )
  end

  shared_examples 'odysseus error forwarder' do
    let(:odysseus_status) { 500 }
    let(:odysseus_body) { '{ "error": true, "message": "mock error"}' }

    context 'odysseus returns a' do
      context 'non-json response' do
        let(:odysseus_content_type) { 'text/plain' }
        it 'should raise' do
          expect { instance.send(method) }.to raise_error(/non-json/)
        end
      end

      context 'json' do
        context 'unexpected errors' do
          context '500' do
            it 'should raise error including error from odysseus' do
              expect { instance.send(method) }.to raise_error(/mock error/)
            end
          end
          context '400' do
            let(:odysseus_status) { 400 }
            it 'should raise error including error from odysseus' do
              expect { instance.send(method) }.to raise_error(/mock error/)
            end
          end
        end
      end
    end
  end

  shared_examples 'metadata accessor' do |field|
    let(:field_value) { 'expected value' }
    let(:odysseus_body) do
      {
        'id' => 'mock',
        field => field_value
      }.to_json
    end

    it "returns metadata field: #{field}" do
      expect(instance.send(method)).to eq(field_value)
    end
  end

  describe '#accessible?' do
    let(:method) { :accessible? }
    it_behaves_like 'odysseus error forwarder'

    context '200' do
      it 'should return true' do
        expect(instance.accessible?).to eq(true)
      end
    end

    context 'normal errors' do
      context '404' do
        let(:odysseus_status) { 404 }
        it 'should return false' do
          expect(instance.accessible?).to eq(false)
        end
      end
      context '403' do
        let(:odysseus_status) { 403 }
        it 'should return false' do
          expect(instance.accessible?).to eq(false)
        end
      end
      context '401' do
        let(:odysseus_status) { 401 }
        it 'should return false' do
          expect(instance.accessible?).to eq(false)
        end
      end
    end
  end

  describe '#title' do
    let(:method) { :title }
    it_behaves_like 'odysseus error forwarder'
    it_behaves_like 'metadata accessor', 'name'
  end

  describe '#public?' do
    let(:method) { :public? }
    it_behaves_like 'odysseus error forwarder'
    it_behaves_like 'metadata accessor', 'is_public'
  end

  describe '#owner_id' do
    let(:method) { :owner_id }
    it_behaves_like 'odysseus error forwarder'
    it_behaves_like 'metadata accessor', 'created_by'
  end

  describe '#narrative_migration_metadata' do
    let(:method) { :narrative_migration_metadata }
    let(:goal_api_url) { "#{odysseus_service_uri}/api/stat/v2/goals/#{goal_uid}/narrative-migration-metadata.json" }
    let(:narrative) { { 'narrative' => [ 'foo' => 'bar' ] } }
    let(:odysseus_body) { narrative.to_json }

    it_behaves_like 'odysseus error forwarder'

    it 'returns narrative' do
      expect(instance.narrative_migration_metadata).to eq(narrative)
    end
  end
end
