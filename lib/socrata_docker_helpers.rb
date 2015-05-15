module SocrataDockerHelpers

  private

  def socrata_docker_environment?
    !!ENV['ARK_HOST']
  end

end
