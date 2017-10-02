
### Ruby Version Driven Updates to The Build Deploy Pipeline for Frontend

Hear Ye, Hear Ye. So at long last the time has come to undertake the dreaded task of updating the frontend ruby version. The task has fallen to you O Unfortunate One. Here is a concise guide to making the updates you need to make.

#### Assumptions
- We assume that the ubuntu base image has changed in such a way that we are required to update ruby. (Deprecation, security fixes, etc)

#### Things to Change

- __Jenkins__ : _Build and Test Server cookbooks_
    - update the file `metachef/cookbooks/socrata-jenkins/recipes/_ruby.rb`. Change the list of ruby versions to be current-2, current-1, current
      - eg: ```['2.3.1', '2.3.3', '2.3.4'] => ['2.3.3', '2.3.4', '2.3.5']```
    - update the `metadata.rb` file version and push a PR. Once approved, merge to master
    - update the environment (per `How we Chef` document in google drive). You only need to update the `infrastructure` environment as this is the only place where Jenkins servers live currently


- __Jenkins__ : _Worker Cookbooks_
    - update the file `jenkins-workers/attributes/default.rb`. Change the list of rubies to be current-2, current-1, current as above
    - update the `metadata.rb` file version and push a PR. Merge to master when ready
    - Once merged, go to the `ami-build-v2` job and build each of the 3 workers
    - From each build, take the newly generated AMI name and put them in each of the Jenkins server config (you have to be a Jenkins Admin to do it)
    - Spool up each of the workers and make sure they contain what you expect by ssh'ing into them and inspecting them.
    - Run tests or builds to make sure they work properly


- __Docker Hub__ : _Refresh Images_
  - _The ruby2.3 docker image_
    - Go to docker hub : https://hub.docker.com/r/socrata/ruby2.3/builds/ and trigger build manually. Wait for it to complete before moving onto the next step

  - _The rails4-deps docker image_
    - Go to docker hub : https://hub.docker.com/r/socrata/rails4-deps/ and trigger build manually after step 1 build completes (can take 10-30 minutes)

- __Projects__: 
    - update the `.ruby-version` files to the new version of ruby (eg 2.3.5), build locally and push those updates with your project changes

- __Verify Functionality__
  - build frontend to ensure that it deploys successfully to staging and RC
