# reminder: this APPENDS karma testing to the default task.
# rspec automatically enhances the default task upon being required.
task :default => 'test:karma:parallel'

# redundant name to help with muscle memory post-MiniTest removal
Rake::Task['test'].clear
task :test => 'default'
