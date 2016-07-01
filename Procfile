web: bundle exec unicorn_rails -p 3010 -c ./config/unicorn.rb
docs_worker: QUEUES=documents,thumbnails bin/rake jobs:work
metrics_worker: QUEUE=metrics DELAYED_JOB_SLEEP_DELAY=20 DELAYED_JOB_DESTROY_FAILED_JOBS=false bin/rake jobs:work
webpack: npm run watch
