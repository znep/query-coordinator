revision_file = File.join(Rails.root, "REVISION")

begin
  Storyteller::REVISION_NUMBER = File.read(revision_file).chomp()
  Storyteller::REVISION_DATE = File.stat(revision_file).mtime.to_i
rescue
  Storyteller::REVISION_NUMBER = nil
  Storyteller::REVISION_DATE = nil
end
