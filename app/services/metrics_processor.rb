# Much of this code is pulled from the app/models/metric_queue.rb in frontend.
# We're writing to a data directory for metrics, e.g. /data/metrics, which is
# configured via environment variables and loaded in the metrics_config.rb
# initializer.
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

    # Implementation copied from app/models/metric_queue.rb in frontend.
    def now
      return @now unless @now.nil?

      @now = Time.now.to_i
      @now -= @now % 120
      @now *= 1000
      @now
    end

    def metrics_path
      Rails.application.config.metrics_path
    end

    # Copied from app/models/metric_queue.rb in frontend.
    def metrics_file_path
      File.join(metrics_path, sprintf("/metrics2012.%016x.data", now))
    end
  end
end
