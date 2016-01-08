listen 3000
worker_processes Integer(ENV['WORKER_PROCESSES'] || 4)
ENV['UNICORN'] = '1'
timeout 300

# By default, the Unicorn logger will write to stderr.
# (http://unicorn.bogomips.org/Unicorn/Configurator.html)
# One way to fix this is by setting the following for logger: logger Logger.new($stdout)
# Here we format the logs produced
  def get_logger
    logger = Logger.new(STDERR)
    logger.level = Logger.const_get((ENV['LOG_LEVEL'] || 'INFO').upcase)
    logger.formatter = proc do |severity, datetime, progname, msg|
      date_format = datetime.utc.strftime("%Y-%m-%d %H:%M:%S,%L")
      puts "#{severity}, [ #{date_format} ] -- #{progname}: #{msg}"
    end
    logger
  end

logger get_logger
