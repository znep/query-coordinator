Delayed::Worker.destroy_failed_jobs = true
Delayed::Worker.sleep_delay = ENV['DELAYED_JOB_SLEEP_DELAY'] || 5
Delayed::Worker.max_attempts = ENV['DELAYED_JOB_MAX_ATTEMPTS'] || 2
Delayed::Worker.max_run_time = Integer(ENV['DELAYED_JOB_MAX_RUN_TIME'] || 5).minutes
