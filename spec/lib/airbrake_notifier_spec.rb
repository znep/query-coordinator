require 'rails_helper'

describe AirbrakeNotifier do
  let(:error) { StandardError.new('This is a test error.') }
  let(:message) { 'Some additional error message here' }

  before do
    error.set_backtrace(['one', 'two'])
    allow(Rails.logger).to receive(:error)
    allow(Airbrake).to receive(:notify)
  end

  describe '#report_error' do
    it 'logs error' do
      expect(Rails.logger).to receive(:error).with("StandardError: This is a test error. (on Some additional error message here):\n\none\\ntwo")
      AirbrakeNotifier.report_error(error, message)
    end

    it 'notifies airbrake' do
      expect(Airbrake).to receive(:notify).with(error, { message: message })
      AirbrakeNotifier.report_error(error, message)
    end

    it 'takes additional parameters to pass to the notice' do
      additional_params = { something_to_say: 'Blah ' }
      expect(Airbrake).to receive(:notify).with(error, additional_params.merge(message: message))
      AirbrakeNotifier.report_error(error, message, additional_params)
    end
  end

  describe '#default_payload' do
    let(:version) { '1.0.0' }
    let(:request_id) { 'abcdefghijklmnop0123456789' }
    let(:host) { 'the-host.data.socrat.com' }
    let(:session_headers) do
      {
        'X-Socrata-Host' => host,
        'X-Socrata-RequestId' => request_id
      }
    end
    let(:referrer) { 'http://otherdomain.com/someplace.html' }
    let(:story_uid) { 'hoth-mh2o' }

    let(:request_store) do
      {
        http_referrer: referrer,
        socrata_session_headers: session_headers,
        story_uid: story_uid
      }
    end

    let(:subject) { AirbrakeNotifier.default_payload }

    before do
      allow(Rails.application.config).to receive(:version).and_return(version)
      allow(RequestStore).to receive(:store).and_return(request_store)
    end

    it 'adds current app version to environment' do
      expect(subject[:environment][:appVersion]).to eq(version)
    end

    it 'adds requestId to context' do
      expect(subject[:context][:requestId]).to eq(request_id)
    end

    it 'adds host to context' do
      expect(subject[:context][:host]).to eq(host)
    end

    it 'adds referrer to context' do
      expect(subject[:context][:referrer]).to eq(referrer)
    end

    it 'adds storyUid to params' do
      expect(subject[:params][:storyUid]).to eq(story_uid)
    end
  end
end
