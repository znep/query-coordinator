namespace :tag do

  desc 'Tag the current SHA with a label and timestamp'
  task :release do
    label = 'release'
    timestamp = Time.now.strftime("%Y/%m/%d/%H%M")
    tag = "#{label}/#{timestamp}"
    system "git tag -a #{tag} -m #{tag}"
  end

end
