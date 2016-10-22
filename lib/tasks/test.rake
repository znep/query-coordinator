Rake::Task[:test].enhance do
  Rake::Task['webpack'].invoke
  Rake::Task['karma'].invoke
end
