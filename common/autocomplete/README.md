# Socrata Platform UI

This repo houses the Socrata Platform UI: Frontend, Storyteller and shared UI code.

## Quick Links

* [Frontend](https://github.com/socrata/platform-ui/blob/master/frontend/README.md)
* [Storyteller](https://github.com/socrata/platform-ui/blob/master/storyteller/README.md)
* [common](https://github.com/socrata/platform-ui/blob/master/common/README.md)

## Organization

Each root-level directory in this repository contains either a service (i.e., Storyteller or Frontend), the shared repository of common code, or common scripts and utilities.

## Contributing

Guidelines vary slightly depending on which codebase you are modifying (storyteller vs frontend vs common).
Please see the relevant READMEs in the Quick Links section.

## Starting up

The Socrata dev server is a prerequisite to running the projects in this repo:

```bash
sudo nginx -c ${PWD}/dev-server/nginx.conf
```

Please refer to the specific service READMEs for specific setup instructions.

## Run all the tests

To run all tests:

```bash
rake test
```

To lint everything:

```bash
rake lint
```
