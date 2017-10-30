# ANATOMY OF A FRONTEND BUILD


## The Jenkins Jobs

### Builds

#### staging
- frontend-canary : *compile frontend from Hai's team. Dockerize using `jenkins-worker_frontend:latest` image. deploys to staging canary*
- frontend-pull-request-test : *build and test a pull request when a new commit is pushed to origin/master using `jenkins-worker_frontend:latest` image*
- frontend-staging : *DISABLED: polls the master branch of the frontend repo and triggers frontend job with various parameters*
- frontend-staging-watcher : *polls the origin/master branch and triggers a frontend job when the head changes*

#### rc
- frontend-build-release : *compile frontend and dockerize using `jenkins-worker_frontend:latest` image. deploys to RC*
- frontend-release : *polls the origin/release branch and triggers frontend-build-release job and deploy to RC when the head changes.*

#### common
- build-worker-frontend  : *generates the jenkins-worker_frontend:latest image*
- build-worker-frontend-testing : *test job for building multiple flavors of the jenkins-worker_frontend:latest image. designed to let us play with building a variety of node / ruby / phantomjs configs. not really used.*
- dockerize : *job that dockerizes the frontend build artifacts. called by other jobs.*
- frontend : *compile frontend and dockerize using the `jenkins-worker_frontend:latest` image. deploys to either RC or staging*
- frontend-docker-old : *DISABLED: old process to dockerize frontend*
- frontend-eletric-imp : *DISABLED: build result checker*
- frontend-utils-version-bump-check : *checks to see if the version is bumped in the package.json of frontend-utils*
- frontend-vizualizations-publisher : *builds and deploys frontend visualization updates*
- frontend-vizualizations-pull-request-builder : *builds frontend visualization project*
- frontend-vizualizations-pull-request-lint : *runs linter on frontend visualization project*
- frontend-vizualization-versoin-bump-check : *runs version bump check on frontend visualizations project*
- marathon-deploy : *job that deploys the frontend dockerized artifact to an environment (RC or staging)*

### Cut and Deploy
  *(All jobs below deploy to RC)*
- frontend-cherrypick: *cut a frontend build applying a list of cherry-picks*
- frontend-cut *cut a frontend build from master*
- frontend-hotfix *cut a frontend build using an older base tag and applying cherry-picks to it*


## The Docker Images

- registry.docker.aws-us-west-2-infrastructure.socrata.net:5000/internal/jenkins-worker_base:latest : *the build environment for the jenkins-worker_frontend worker image below. it builds the jenkins-worker_frontend:latest image. not sure where this build is generated?*
- 649617362025.dkr.ecr.us-west-2.amazonaws.com/internal/jenkins-worker_frontend:latest  : *the build environment for the frontend build*
-
