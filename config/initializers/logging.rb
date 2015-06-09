# Logging with X-Request-Id and Host
Rails.application.config.log_tags = [
  lambda { |req| Time.now.utc.iso8601 },
  lambda { |req| req.domain || 'unknown' },
  :uuid
]
