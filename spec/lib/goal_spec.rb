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
  let(:instance) do
    OpenPerformance::Goal.new(goal_uid)
  end

  before do
    allow(Rails.application.config).to receive(:odysseus_service_uri).and_return(odysseus_service_uri)
    ::RequestStore.store[:socrata_session_headers] = headers
  end

  describe '#accessible?' do
    context 'odysseus returns a' do
      let(:odysseus_status) { 500 }
      let(:odysseus_content_type) { 'application/json' }
      let(:odysseus_body) { '{ "error": true, "message": "mock error"}' }

      before do
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

      context 'non-json response' do
        let(:odysseus_content_type) { 'text/plain' }
        it 'should raise' do
          expect { instance.accessible? }.to raise_error(/non-json/)
        end
      end

      context 'json' do
        context 'unexpected errors' do
          context '500' do
            it 'should raise error including error from odysseus' do
              expect { instance.accessible? }.to raise_error(/mock error/)
            end
          end
          context '400' do
            let(:odysseus_status) { 400 }
            it 'should raise error including error from odysseus' do
              expect { instance.accessible? }.to raise_error(/mock error/)
            end
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

        context '200' do
          let(:odysseus_status) { 200 }
          let(:odysseus_body) { '{ "id": "mock" }' }
          it 'should return true' do
            expect(instance.accessible?).to eq(true)
          end
        end
      end
    end
  end
end
