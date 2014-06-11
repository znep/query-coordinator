namespace :test do
  desc "Run all karma tests"
  task :karma do
    Open3.popen2e('karma start karma-test/data-cards/karma-unit.js --browsers PhantomJS --singleRun true') do |stdin, stdout_and_stderr, wait_thr|
      puts stdout_and_stderr.gets(nil)
      raise 'Karma tests failed' unless wait_thr.value.success?
    end
  end
end
Rake::Task[:test].enhance { Rake::Task["test:karma"].invoke }
