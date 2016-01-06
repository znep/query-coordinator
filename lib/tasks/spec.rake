require 'rspec/core/rake_task'

RSpec::Core::RakeTask.new(:rspec) do |t|
  t.rspec_opts = '--color '
end

namespace :test do
  desc 'Run the specs'
  task :specs => :rspec
end

Rake::Task[:test].enhance { Rake::Task['test:specs'].invoke }
