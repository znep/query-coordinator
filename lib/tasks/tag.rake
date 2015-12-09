namespace :tag do

  desc 'Tag the current SHA with a label and timestamp'
  task :release => :environment do
    tag = Rails.application.config.version
    puts "Tagging release '#{tag}'"
    system "git tag -a #{tag} -m #{tag}"
  end

end
