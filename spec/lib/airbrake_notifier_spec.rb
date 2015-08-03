require 'rails_helper'

describe AirbrakeNotifier do
  let(:error) { StandardError.new('This is a test error.') }
  let(:message) { 'Some additional error message here' }

  before do
    error.set_backtrace(['one', 'two'])
  end

  describe '#report_error' do
    it 'logs error' do
      expect(Rails.logger).to receive(:error).with("StandardError: This is a test error. (on Some additional error message here):\n\none\\ntwo")
      AirbrakeNotifier.report_error(error, message)
    end

    it 'notifies airbrake' do
      expect(Airbrake).to receive(:notify_or_ignore).with(error, { :error_message => message })
      AirbrakeNotifier.report_error(error, message)
    end
  end
end
