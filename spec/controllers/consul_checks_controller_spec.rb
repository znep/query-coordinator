require 'rails_helper'

RSpec.describe ConsulChecksController, type: :controller do
  describe '#active' do

    context 'when unauthenticated' do
      let(:active_status) { nil }

      before do
        expect(StorytellerService).to receive(:active?).and_return(active_status)
        get :active
      end

      context 'when service status is active' do
        let(:active_status) { true }

        it 'returns success status' do
          expect(response.status).to eq(200)
        end
      end

      context 'when service is not active' do
        let(:active_status) { false }

        it 'returns success status' do
          expect(response.status).to eq(503)
        end
      end
    end
  end
end
