Rails.application.config.log_tags = [
  lambda { |req| Time.now.utc.strftime " %Y-%m-%d %H:%M:%S,%L "},
  lambda { |req| req.host || 'unknown' },
  lambda { |req| req.env['action_dispatch.request_id'].gsub('-', '') },
  lambda { |req| "PID-%.5d" % Process.pid }
]
