require 'rails_helper'

RSpec.describe ProcessMetricsJob, type: :job do

  describe '#perform' do
    let(:metrics) { :metrics }

    it 'sends metrics to MetricsProcessor service object' do
      expect(MetricsProcessor).to receive(:process).with(metrics)
      ProcessMetricsJob.perform_now(metrics)
    end

    context 'when processing fails' do
      it 'notifies airbrake' do
        error = StandardError.new('Y U NO AIRBRAKE?')
        allow_any_instance_of(ProcessMetricsJob).to receive(:perform).and_raise(error)
        allow(AirbrakeNotifier).to receive(:report_error)

        expect {
          ProcessMetricsJob.perform_now(metrics)
        }.to raise_error(error)

        expect(AirbrakeNotifier).to have_received(:report_error).with(error, on_method: "ProcessMetricsJob#perform")
      end
    end
  end
end
