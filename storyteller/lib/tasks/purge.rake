desc 'Purge blocks and draft stories that are unreachable and sufficiently stale'
task :purge => :environment do
  Purge.run
end
