Rake::Task[:spec].enhance { Rake::Task['engine:spec'].invoke }
