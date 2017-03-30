Rake::Task[:test].enhance do
  Rake::Task['spec'].invoke
  Rake::Task['webpack'].invoke
  Rake::Task['karma'].invoke
end
