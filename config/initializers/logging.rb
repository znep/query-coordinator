Rails.application.config.log_tags = [
  lambda { |req| Time.now.utc.iso8601 },
  lambda { |req| req.host || 'unknown' },
  :uuid,
  lambda { |req| "PID-%.5d" % Process.pid }
]
