require 'rails_helper'

describe PolaroidController do
  include TestHelperMethods

  let(:polaroid) { instance_double(Polaroid) }
  let(:polaroid_success) do
    {
      status: '200',
      body: 'image goes here',
      content_type: 'image/png'
    }
  end

  let(:vif) do
    { 'name' => 'viffy' }
  end

  let(:cookies) do
    {
      '_socrata_session_id' => 'my-session-id',
      'other_cookie' => 'other'
    }
  end

  before do
    init_anonymous_environment

    allow(subject).to receive(:polaroid).and_return(polaroid)
  end

  describe 'POST /view/vif.png' do
    describe 'when Polaroid succeeds' do
      before do
        cookies.each { |name, value| request.cookies[name] = value }

        expect(polaroid).to receive(:fetch_image).with(vif, cookies: cookies.slice('_socrata_session_id').to_query).
          and_return(polaroid_success)
      end

      it 'responds with the image and a correct content disposition' do
        post(:proxy_request, vif: vif)

        expect(response.code.to_i).to eq(200)
        expect(response.body).to eq('image goes here')
        expect(response.headers['Content-Disposition']).to start_with('attachment;')
      end

      it 'preserves the tracking ID if given' do
        post(:proxy_request, vif: vif, renderTrackingId: 'tracked')

        expect(response.code.to_i).to eq(200)
        expect(response.cookies).to include({ 'renderTrackingId_tracked' => "1" })
      end
    end

    describe 'when Polaroid errors unrecoverably' do
      before do
        allow(polaroid).to receive(:fetch_image).and_raise('oh no!')
      end

      it 'responds with error information' do
        post(:proxy_request, vif: vif)

        expect(response.code.to_i).to eq(500)
        expect(JSON.parse(response.body)).to include('error', 'reason', 'details')
      end
    end
  end
end
