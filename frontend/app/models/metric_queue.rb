# encoding: utf-8
# frozen_string_literal: true
require 'singleton'
require 'fileutils'

class MetricQueue
  include Singleton

  @@requests = []

  METRICS_BATCH_SIZE = APP_CONFIG.metrics_batch_size

  attr_accessor :batch_size

  def initialize
    @batch_size = METRICS_BATCH_SIZE
    @random = Random.new

    at_exit do
      flush(true)
      # Yes, @, not @@, because we're in the class scope now
      @client.close if @client.present?
    end
  end

  def flush(synchronous = false)
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

  def push_metric(entity_id, metric_name, count = 1, time = Time.now)
    Rails.logger.debug("[#{Process.pid}] [#{Thread.current.object_id}] Pushing metric, " +
                       "#{entity_id}/#{metric_name} = #{count}")
    push_request(
      :timestamp => time.to_i * 1000,
      :entity_id => entity_id,
      :name => metric_name,
      :value => count,
      :type => :aggregate
    )
  end

  def requests
    @@requests
  end

  def atomic_metrics_filename(now)
    now_formatted = now.strftime('%FT%H-%m-%s-%l%z')
    thread_id = Thread.current.object_id
    process_id = Process.pid
    sprintf('/metrics2012.%s.%d.%d.%d.data', now_formatted, thread_id, process_id, @random.rand(32000))
  end

  def two_minute_bucket_metrics_filename(now)
    now_int = now.to_i
    now_int -= now_int % 120
    now_int *= 1_000
    sprintf('metrics2012.%016x.data', now_int)
  end

  private

  def push_request(data)
    @@requests << data
    flush if @@requests.size >= @batch_size
  end

  def do_flush_requests(current_requests, logger)
    targetdir = APP_CONFIG.metrics_dir
    FileUtils.mkdir_p(targetdir)

    if APP_CONFIG.atomic_metrics_flush
      filename = "#{targetdir}/#{atomic_metrics_filename(Time.now)}"
      logger.debug("[#{Process.pid}] [#{Thread.current.object_id}] Flushing #{current_requests.length} metrics to file #{filename}")

      metrics_written = 0
      File.open(filename, 'ab') do |metricfile|
        current_requests.each do |request|
          write_start_of_record(metricfile)
          write_field(metricfile, request[:timestamp].to_s)
          write_field(metricfile, request[:entity_id])
          write_field(metricfile, request[:name])
          write_field(metricfile, request[:value].to_s)
          write_field(metricfile, request[:type].to_s)
          metrics_written += 1
        end
      end

      logger.debug("[#{Process.pid}] [#{Thread.current.object_id}] Successfully wrote #{metrics_written} metrics to file #{filename}.")

      filename_completed = "#{filename}.COMPLETED"
      FileUtils.mv(filename, filename_completed)
      logger.debug("[#{Process.pid}] [#{Thread.current.object_id}] Successfully renamed file #{filename} to #{filename_completed} to mark as completed.")
    else
      lockfilename = "#{targetdir}/ruby-metrics.lock"
      File.open(lockfilename, 'wb') do |lockfile|
        logger.debug('About to acquire file lock')
        lockfile.flock(File::LOCK_EX) # Cross-process locking wooo!
        now = Time.now
        filename = "#{targetdir}/#{two_minute_bucket_metrics_filename(now)}"
        logger.debug("Flushing #{current_requests.length} metrics to file #{filename}")
        File.open(filename, 'ab') do |metricfile|
          current_requests.each do |request|
            write_start_of_record(metricfile)
            write_field(metricfile, request[:timestamp].to_s)
            write_field(metricfile, request[:entity_id])
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
end
