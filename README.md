# Socrata Platform UI

This repo houses the Socrata Platform UI (Frontend for now), and shortly Storyteller and shared UI code.

## Quick Links

[Frontend](https://github.com/socrata/frontend/blob/master/frontend/README.md)

## Organization

Each root-level directory in this repository contains either a service (i.e., Storyteller or Frontend), the shared repository of common code, or common scripts and utilities.

## Contributing

Until more services are added to this repository, please see the frontend service's [README](https://github.com/socrata/frontend/blob/master/frontend/README.md).

## Starting up

The Socrata dev server is a prerequisite to running the projects in this repo:

```bash
sudo nginx -c ${PWD}/dev-server/nginx.conf
```

Please refer to the specific service READMEs for specific setup instructions.
