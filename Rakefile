require 'bundler/gem_tasks'
require 'rspec/core/rake_task'

RSpec::Core::RakeTask.new(:spec)

task :default => :spec
task :test => :spec

desc 'Open an irb session preloaded with this library'
task :console do
  sh 'irb -rubygems -I lib -r chrome.rb'
end

desc 'Create HTMl from ERB and CSS from SCSS'
task :templates do
  sh 'erb templates/src/views/header.html.erb > templates/dist/views/header.html'
  sh 'scss templates/src/styles/header.scss templates/dist/styles/header.css'
  sh 'cp templates/src/js/header.js templates/dist/js/header.js'
end
