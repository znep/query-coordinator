require 'singleton'
require 'fileutils'

class MetricQueue
  include Singleton

  @@requests = []

  def initialize
    at_exit do
      flush_requests(true)
      # Yes, @, not @@, because we're in the class scope now
      @client.close if @client.present?
    end
  end

  def push_metric(entityId, metricName, count = 1)
    Rails.logger.debug("Pushing client-side metric, #{entityId}/#{metricName} = #{count}")
    push_request(
      :timestamp => Time.now.to_i * 1000,
      :entityId => entityId,
      :name => metricName,
      :value => count,
      :type => :aggregate
    )
  end

  def push_request(data)
    @@requests << data
    flush_requests if @@requests.size >= BATCH_REQUESTS_BY
  end

  private

  def flush_requests(synchronous = false)
    return if @@requests.blank?

    logger = Rails.logger
    current_requests = @@requests
    @@requests = []

    if Rails.env.development? || synchronous
      do_flush_requests(current_requests, logger)
    else
      Thread.new do
        # be chivalrous
        Thread.pass
        do_flush_requests(current_requests, logger)
      end
    end
  end

  def do_flush_requests(current_requests, logger)
    targetdir = APP_CONFIG.metrics_dir
    FileUtils.mkdir_p(targetdir)

    if APP_CONFIG.atomic_metrics_flush

      now = Time.now.strftime('%FT%H-%m-%s-%l%z')
      thread_id = Thread.current.object_id
      process_id = Process.pid
      filename = "#{targetdir}#{sprintf('/metrics2012.%s.%d.%d.data', now, thread_id, process_id )}"
      logger.debug("Flushing #{current_requests.length} metrics to file #{filename}")

      metrics_written = 0
      File.open(filename, 'ab') do |metricfile|
        current_requests.each do |request|
          write_start_of_record(metricfile)
          write_field(metricfile, request[:timestamp].to_s)
          write_field(metricfile, request[:entityId])
          write_field(metricfile, request[:name])
          write_field(metricfile, request[:value].to_s)
          write_field(metricfile, request[:type].to_s)
          metrics_written += 1
        end
      end

      logger.debug("successfully wrote #{metrics_written} metrics to file #{filename}.")

      filename_completed = "#{filename}.COMPLETED"
      FileUtils.mv(filename, filename_completed)
      logger.debug("successfully renamed file #{filename} to #{filename_completed} to mark as completed.")
    else
      lockfilename = "#{targetdir}/ruby-metrics.lock"
      File.open(lockfilename, 'wb') do |lockfile|
        logger.debug("About to acquire file lock")
        lockfile.flock(File::LOCK_EX) # Cross-process locking wooo!
        now = Time.now.to_i
        now -= now % 120
        now *= 1_000
        filename = "#{targetdir}#{sprintf('/metrics2012.%016x.data', now)}"
        logger.debug("Flushing #{current_requests.length} metrics to file #{filename}")
        File.open(filename, 'ab') do |metricfile|
          current_requests.each do |request|
            write_start_of_record(metricfile)
            write_field(metricfile, request[:timestamp].to_s)
            write_field(metricfile, request[:entityId])
            write_field(metricfile, request[:name])
            write_field(metricfile, request[:value].to_s)
            write_field(metricfile, request[:type].to_s)
          end
        end
        logger.debug("Successfully wrote to file #{filename}.")
      end
    end

    if APP_CONFIG.statsd_enabled
      current_requests.each do |request|
        next unless request[:name].end_with?('-time')
        if Frontend.statsd.present?
          Frontend.statsd.timing("browser.#{request[:name]}", request[:value])
        else
          logger.error('Unable to report timing to statsd because it is not configured properly.')
        end
      end
    end
  end

  def write_start_of_record(file)
    file.write(START_OF_RECORD)
  end

  def write_field(file, s)
    file.write(s.force_encoding('utf-8'))
    file.write(END_OF_FIELD)
  end

  def logger
    @logger ||= Rails.logger || Logger.new
  end

  START_OF_RECORD = [255].pack('C').force_encoding('iso-8859-1')
  END_OF_FIELD = [254].pack('C').force_encoding('iso-8859-1')
  BATCH_REQUESTS_BY = Rails.env.development? ? 1 : 100
end
