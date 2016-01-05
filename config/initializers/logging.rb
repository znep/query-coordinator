Rails.application.config.log_tags = [
  lambda { |req| Time.now.utc.strftime " %Y-%m-%d %H:%M:%S,%L "},
  lambda { |req| req.host || 'unknown' },
  :uuid,
  lambda { |req| "PID-%.5d" % Process.pid }
]
