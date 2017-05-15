Rake::Task['default'].clear

task :default => [:spec, :test]

task :test_karma_parallel_afterwards do
  at_exit do
    Rake::Task['test:karma:parallel'].invoke
  end
end

# This is the only reliable way I've found to force the karma tests to run last after a given task.
# EN-12313: In order to spot failing tests more quickly, run the tests in order of fastest, to slowest.
# P.S. I spent _hours_ trying to figure out why the karma tests would _always_ run second after the specs, no
# matter what kinds of "normal" things one did to the rake tasks to cause the tests to run in a given order.
# If you have strong feelings about the order of test runs, let's have a discussion about it.
Rake::Task['test'].enhance(['test_karma_parallel_afterwards'])
