# By default we want to destroy failed jobs, but want to disable that with an env var
Delayed::Worker.destroy_failed_jobs = ENV['DELAYED_JOB_DESTROY_FAILED_JOBS'] != 'false'
Delayed::Worker.sleep_delay = Integer(ENV['DELAYED_JOB_SLEEP_DELAY'] || 5)
Delayed::Worker.max_attempts = Integer(ENV['DELAYED_JOB_MAX_ATTEMPTS'] || 2)
Delayed::Worker.max_run_time = Integer(ENV['DELAYED_JOB_MAX_RUN_TIME'] || 5).minutes
