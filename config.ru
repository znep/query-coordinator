require 'unicorn/worker_killer'
require 'unicorn_metrics/middleware'

###############################################################################
# Start of unicorn worker killer code
max_request_min =  Integer(ENV['UNICORN_MAX_REQUEST_MIN'] || 3072)
max_request_max =  Integer(ENV['UNICORN_MAX_REQUEST_MAX'] || 4096)

# Max lifetime requests per worker before it's reaped
use Unicorn::WorkerKiller::MaxRequests, max_request_min, max_request_max

oom_min = Integer(ENV['UNICORN_OOM_MIN'] || 400) * (1024 * 1024)
oom_max = Integer(ENV['UNICORN_OOM_MAX'] || 512) * (1024 * 1024)

# Max memory size (RSS) per worker before it's reaped
use Unicorn::WorkerKiller::Oom, oom_min, oom_max
# End of unicorn worker killer code
###############################################################################

###############################################################################
# Start of UnicornMetrics code
UnicornMetrics.configure do |config|
  config.http_metrics = true
end

# The part of the URL used to access the metrics. Needs to be protected from public access.
use UnicornMetrics::Middleware, :path => ENV.fetch('UNICORN_METRICS_PATH', '/metrics')
# End of UnicornMetric code
###############################################################################

require ::File.expand_path('../config/environment', __FILE__)

run Rails.application
