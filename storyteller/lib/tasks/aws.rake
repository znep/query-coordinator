require File.expand_path('../../aws/database_maintainer', __FILE__)
require File.expand_path('../../aws/bucket_encrypter', __FILE__)

namespace :aws do
  desc 'Migrate database in AWS'
  task :migrate, [:region, :environment] do |t, args|
    database_mainainter(args).migrate
  end

  desc 'Check database migration status in AWS'
  task 'migrate:status', [:region, :environment] do |t, args|
    database_mainainter(args).status
  end

  desc 'Rollback database in AWS'
  task :rollback, [:region, :environment] do |t, args|
    database_mainainter(args).rollback
  end

  desc 'Seed database in AWS'
  task :seed, [:region, :environment] do |t, args|
    database_mainainter(args).seed
  end

  desc 'Enable server-side encryption for all items in bucket'
  task :encrypt_bucket, [:region, :environment, :bucket] do |t, args|
    Aws::BucketEncrypter.new(args).encrypt
  end

  def database_mainainter(args)
    Aws::DatabaseMaintainer.new(args)
  end
end