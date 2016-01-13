class ProcessMetricsJob < ActiveJob::Base
  queue_as :metrics

  rescue_from(StandardError) do |error|
    ::AirbrakeNotifier.report_error(error, "ProcessMetricsJob#perform")
    raise error
  end

  def perform(metrics)
    MetricsProcessor.process(metrics)
  end
end
