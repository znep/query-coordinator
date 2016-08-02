module FrameEmbedding

  # +before_filter+
  def disable_frame_embedding
    headers['X-Frame-Options'] = 'SAMEORIGIN' if !@suppress_chrome
  end

  # +before_filter+
  def allow_frame_embedding
    headers['X-Frame-Options'] = 'ALLOWALL'
  end

end
