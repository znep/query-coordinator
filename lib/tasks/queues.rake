namespace :queues do
  desc 'Process storyteller queues'
  task :process => :environment do
    QueueWorker.new.start
  end
end
