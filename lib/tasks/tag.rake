desc 'Tag the current SHA with a label (default: "release") and timestamp'
task :tag do
  label = ENV['TAG_LABEL'] || 'release'
  timestamp = Time.now.strftime("%Y/%m/%d/%H%M")
  tag = "#{label}/#{timestamp}"
  system "git tag -a #{tag} -m #{tag}"
end
