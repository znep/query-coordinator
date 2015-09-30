namespace :test do
  Rake::Task[:test].enhance do
    fail($?.exitstatus) unless system('rspec')
  end
end
