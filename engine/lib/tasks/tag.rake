desc 'Tag the current SHA with the version number and timestamp'
task :tag do
  timestamp = Time.now.strftime("%Y/%m/%d/%H%M")
  tag = "#{SocrataSiteChrome::VERSION}-#{timestamp}"
  puts "Creating tag #{tag}"
  puts `git tag -a #{tag} -m #{tag}`
  puts "Run the command below if you ran this command by mistake\ngit tag -d #{tag}"
end
