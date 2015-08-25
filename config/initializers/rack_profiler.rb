if Rails.env.development?
  require 'rack-mini-profiler'

  # initialization is skipped so trigger it
  Rack::MiniProfilerRails.initialize!(Rails.application)

  # Do not let rack-mini-profiler disable caching. Setting this to true would let
  # MiniProfiler delete ETags which are necessary for the save endpoint to work.
  Rack::MiniProfiler.config.disable_caching = false
end
