namespace :karma do
  task :phantomjs do
    cmd = './node_modules/karma/bin/karma start spec/karma/karma.conf.js --browsers PhantomJS --singleRun true --reporters=dots,coverage'
    fail($?.exitstatus) unless system(cmd)
  end

  desc 'Run all karma tests locally in PhantomJS, and re-run when files change'
  task :watch do
    cmd = './node_modules/karma/bin/karma start spec/karma/karma.conf.js --browsers PhantomJS --singleRun false'
    fail($?.exitstatus) unless system(cmd)
  end
end

desc 'Run all karma tests locally in PhantomJS'
task :karma => [ 'karma:phantomjs' ]
