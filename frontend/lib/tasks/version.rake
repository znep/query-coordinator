desc 'Output semantic version'
task :version => :environment do
  require 'semver'
  puts SemVer.find.format '%M.%m.%p'
end
