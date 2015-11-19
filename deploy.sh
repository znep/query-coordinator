if [[ -z $(git status -s) ]]; then
  bundle exec middleman build
  git checkout gh-pages
  ls | grep -v "build"
else
  echo >&2 "Please commit of stash your changes."
  exit 1
fi
