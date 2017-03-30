# Add your own tasks in files placed in lib/tasks ending in .rake,
# for example lib/tasks/capistrano.rake, and they will automatically be available to Rake.

require File.expand_path('../config/application', __FILE__)

Rails.application.load_tasks

# Rspec likes to take over the default task.
# We already have a :test task that runs rspec
# (and JS tests too).
Rake::Task[:default].prerequisites.clear
task :default => :test
