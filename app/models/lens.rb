class Lens < Model
  def is_shared?
    permissions.any? {|p| p.isEnabled && !p.isPublic}
  end
end
