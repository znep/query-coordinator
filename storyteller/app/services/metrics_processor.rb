# Much of this code is pulled from the app/models/metric_queue.rb in frontend.
# We're writing to a data directory for metrics, e.g. /data/metrics, which is
# configured via environment variables and loaded in the metrics_config.rb
# initializer.
#
# There is a slight change in process from how the MetricQueue works in frontend.
# We will output a metrics file with every run of `process`. The previous method
# involved writing a new file every 2 minutes. See EN-2400 for more details.
class MetricsProcessor

  class << self
    def process(metrics)
      raise ArgumentError.new('arg[:metrics] must be an array') unless metrics.is_a?(Array)

      FileUtils.mkdir_p(metrics_path())

      File.open(metrics_file_path(), 'ab') do |metrics_file|
        metrics.each do |metric|
          metrics_file.write(START_OF_RECORD)

          write_field(metrics_file, metric[:timestamp])
          write_field(metrics_file, metric[:entityId])
          write_field(metrics_file, metric[:name])
          write_field(metrics_file, metric[:value])
          write_field(metrics_file, metric[:type])
        end
      end
    end

    private

    # These variables are pulled from app/models/metric_queue.rb in frontend.
    START_OF_RECORD = [255].pack("C").force_encoding("iso-8859-1")
    END_OF_FIELD = [254].pack("C").force_encoding("iso-8859-1")

    def write_field(file, val)
      file.write(val.to_s.force_encoding("utf-8"))
      file.write(END_OF_FIELD)
    end

    def metrics_path
      Rails.application.config.metrics_path
    end

    # Copied from app/models/metric_queue.rb in frontend.
    def metrics_file_path
      # Adding 'COMPLETED' so that the balboa agent knows it can consume this file.
      File.join(metrics_path, sprintf("/metrics2012.%016x.data.COMPLETED", Time.now.to_i))
    end
  end
end
