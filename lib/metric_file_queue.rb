require 'singleton'

class MetricFileQueue
  include Singleton

  @@requests = []

  def initialize
    at_exit do
      flush_requests
    end
  end

  def push_metric(entity, name, count = 1)
    @@requests << [Time.now.to_i * 1000, entity, name, count]
    flush_requests if @@requests.size >= @@batch_by
  end

  protected
  def flush_requests
    reqs, @@requests = @@requests, []

    begin
      file = get_dumpfile
      reqs.each do |request|
        file.puts(request.join('|'))
      end
    ensure
      file.close if file
    end
  end

  def get_dumpfile
    @@dir ||=  APP_CONFIG['metric_files_dir'] || File.join(Rails.root, 'log')
    prefix = ((rand * 100000).to_i).to_s
    dir = File.join(@@dir, "metrics/#{prefix[0..2]}/#{prefix[3..-1]}")
    FileUtils.mkdir_p(dir)
    File.new(File.join(dir, "#{Time.now.to_i}.log"), 'w')
  end

  @@batch_by = 1000
end
