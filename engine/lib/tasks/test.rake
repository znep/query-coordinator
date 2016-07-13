RSpec::Core::RakeTask.new(:spec) do |t|
  t.pattern = 'spec/**/*_spec.rb'
end

task :test do
  Rake::Task['spec'].execute
end
