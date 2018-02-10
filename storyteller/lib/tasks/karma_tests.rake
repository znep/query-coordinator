namespace :karma do
  task :phantomjs do
    cmd = 'RAILS_ENV=karma ./node_modules/karma/bin/karma start spec/karma/karma.conf.js --browsers PhantomJS --singleRun true --reporters=dots'
    unless system(cmd)
      fail("Test run failed with exit code: #{$?.exitstatus}")
    end
  end

  desc 'Run all karma tests locally in PhantomJS, and re-run when files change'
  task :watch do
    cmd = 'RAILS_ENV=karma node --max_old_space_size=4096 ./node_modules/karma/bin/karma start spec/karma/karma.conf.js --browsers PhantomJS --singleRun false'
    unless system(cmd)
      fail("Test run failed with exit code: #{$?.exitstatus}")
    end
  end
end

desc 'Run all karma tests locally in PhantomJS'
task :karma => [ 'karma:phantomjs' ]
