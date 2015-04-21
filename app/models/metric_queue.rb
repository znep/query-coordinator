require 'singleton'
require 'fileutils'

class MetricQueue
  include Singleton

  @@requests = []

  def initialize
    at_exit do
      flush_requests(true)
      # Yes, @, not @@, because we're in the class scope now
      @client.close unless @client.nil?
    end
  end

  def push_metric(entityId, metricName, count = 1)
    Rails.logger.info("Pushing client-side metric, #{entityId}/#{metricName} = #{count}")
    push_request({
      :timestamp => Time.now.to_i * 1000,
      :entityId => entityId,
      :name => metricName,
      :value => count,
      :type => :aggregate
    })
  end

  def push_request(data)
    @@requests << data
    flush_requests if @@requests.size >= BATCH_REQUESTS_BY
  end

private
  def flush_requests(synchronous = false)
    return if @@requests.empty?

    current_requests = @@requests
    @@requests = []

    if Rails.env.development? || synchronous
      do_flush_requests(current_requests)
    else
      Thread.new do
        # be chivalrous
        Thread.pass
        do_flush_requests(current_requests)
      end
    end
  end

  def do_flush_requests(current_requests)
    targetdir = APP_CONFIG['metrics_dir']
    FileUtils.mkdir_p(targetdir)
    lockfilename = targetdir + "/ruby-metrics.lock"
    File.open(lockfilename, "wb") do |lockfile|
      lockfile.flock(File::LOCK_EX) # Cross-process locking wooo!
      now = Time.now.to_i
      now -= now % 120
      now *= 1000
      filename = targetdir + sprintf("/metrics2012.%016x.data", now)
      File.open(filename, "ab") do |metricfile|
        current_requests.each do |request|
          write_start_of_record(metricfile)
          write_field(metricfile, request[:timestamp].to_s)
          write_field(metricfile, request[:entityId])
          write_field(metricfile, request[:name])
          write_field(metricfile, request[:value].to_s)
          write_field(metricfile, request[:type].to_s)
        end
      end
    end
    if APP_CONFIG['statsd_enabled']
      current_requests.each do |request|
        next unless request[:name].end_with? "-time"
        Frontend.statsd.timing("browser.#{request[:name]}", request[:value])
      end
    end
  end

  def write_start_of_record(file)
    file.write(START_OF_RECORD)
  end

  def write_field(file, s)
    file.write(s.force_encoding("utf-8"))
    file.write(END_OF_FIELD)
  end

  def logger
    @logger ||= Rails.logger || Logger.new
  end

  START_OF_RECORD = [255].pack("C").force_encoding("iso-8859-1")
  END_OF_FIELD = [254].pack("C").force_encoding("iso-8859-1")
  BATCH_REQUESTS_BY = Rails.env.development? ? 1 : 100
end
