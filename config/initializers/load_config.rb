revision_file = File.join(Rails.root, "REVISION")

begin
  Storyteller::REVISION_NUMBER = File.read(revision_file).chomp
  Storyteller::BUILD_TIMESTAMP = File.stat(revision_file).mtime.to_i
rescue
  Storyteller::REVISION_NUMBER = nil
  Storyteller::BUILD_TIMESTAMP = nil
end
