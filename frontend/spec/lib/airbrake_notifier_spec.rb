require 'rails_helper'

describe AirbrakeNotifier do

  describe '#default_payload' do
    let(:sha) { 'some1sha' }
    let(:request_id) { 'abcdefghijklmnop0123456789' }

    let(:subject) { AirbrakeNotifier.default_payload }

    before do
      allow(Socrata::RequestIdHelper).to receive(:current_request_id).and_return(request_id)
    end

    it 'adds current sha to environment' do
      with_constants :REVISION_NUMBER => sha do
        expect(subject[:environment][:sha]).to eq(sha)
      end
    end

    it 'adds rails_env to environment' do
      expect(subject[:environment][:rails_env]).to eq(Rails.env)
    end

    it 'adds request_id to context' do
      expect(subject[:context][:request_id]).to eq(request_id)
    end
  end
end
