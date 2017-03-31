if ENV['METRICS_DIR'].blank?
  Rails.application.config.metrics_path = Rails.root.join('tmp', 'metrics')
else
  Rails.application.config.metrics_path = ENV['METRICS_DIR']
end
