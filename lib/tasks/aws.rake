namespace :aws do
  desc 'Migrate database in AWS'
  task :migrate, [:region, :environment] do |t, args|
    database_mainainter(args).migrate
  end

  desc 'Rollback database in AWS'
  task :rollback, [:region, :environment] do |t, args|
    database_mainainter(args).rollback
  end

  desc 'Seed database in AWS'
  task :seed, [:region, :environment] do |t, args|
    database_mainainter(args).seed
  end

  def database_mainainter(args)
    Aws::DatabaseMaintainer.new(region: args[:region], environment: args[:environment])
  end
end
