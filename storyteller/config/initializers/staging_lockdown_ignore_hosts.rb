ignore_hosts = ENV['STAGING_LOCKDOWN_IGNORE_HOSTS'].to_s.split(',').map(&:strip)

Rails.application.config.staging_lockdown_ignore_hosts = ignore_hosts
