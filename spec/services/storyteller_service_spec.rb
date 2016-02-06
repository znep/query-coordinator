require 'rails_helper'

RSpec.describe StorytellerService do
  describe '#active?' do
    let(:consul_service_uri) { 'http://some-consul-server.socrata.net' }
    let(:active_version_url) { "#{consul_service_uri}/v1/kv/storyteller/active_version" }
    let(:consul_status) { 200 }
    let(:consul_response) { nil }

    before do
      allow(Rails.application.config).to receive(:consul_service_uri).and_return(consul_service_uri)

      stub_request(:get, active_version_url).
         to_return(status: consul_status, body: consul_response.to_json, headers: { 'Content-Type' => 'application/json' })
    end

    let(:subject) { StorytellerService.active? }

    context 'when no connection to consul' do
      before do
        allow(HTTParty).to receive(:get).and_raise
      end

      it 'is true' do
        expect(subject).to eq(true)
      end
    end

    context 'when consul does not contain key' do
      let(:consul_status) { 404 }

      it 'is true' do
        expect(subject).to eq(true)
      end
    end

    context 'when key and value exist in consul' do
      let(:active_version) { 'abc' }
      let(:current_version) { 'abc' }
      let(:consul_response) do
        [
          {
            'CreateIndex' => 284415428,
            'ModifyIndex' => 284736932,
            'LockIndex' => 0,
            'Key' => 'storyteller/active_version',
            'Flags' => 0,
            'Value' => Base64.encode64(active_version)
          }
        ]
      end

      before do
        allow(Rails.application.config).to receive(:version).and_return(current_version)
      end

      context 'when value in consul does not match current rails version' do
        let(:active_version) { 'def' }
        let(:current_version) { 'abc' }

        it 'is false' do
          expect(subject).to eq(false)
        end
      end

      context 'when value in consul matches current rails version' do
        let(:active_version) { 'abc' }
        let(:current_version) { 'abc' }

        it 'is true' do
          expect(subject).to eq(true)
        end
      end

      context 'when value in consul is nil' do
        let(:consul_response) do
          [
            {
              'CreateIndex' => 284415428,
              'ModifyIndex' => 284736932,
              'LockIndex' => 0,
              'Key' => 'storyteller/active_version',
              'Flags' => 0,
              'Value' => nil
            }
          ]
        end

        it 'is true' do
          expect(subject).to eq(true)
        end
      end
    end
  end
end
