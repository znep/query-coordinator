namespace :test do
  desc "Run all karma tests"
  task :karma do
    # Manually enable the coverage reporter. It isn't enabled by default as the instrumentation step makes
    # the product code unintelligible.
    success = system('karma start karma-test/dataCards/karma-unit.js --browsers PhantomJS --singleRun true --reporters dots,coverage')
    raise 'Karma test failure' unless success
  end
end
Rake::Task[:test].enhance { Rake::Task["test:karma"].invoke }
