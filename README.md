# canvas-carousel

Currently just an html file with vanilla JS.

## Development environment
- nodejs v16.14.2 (latest TLS) version

## Setup
```
yarn install
```

## Running
This project uses [esbuild](https://esbuild.github.io/) as a package dependency to generate a JavaScript file under `dist` folder. Easiest way of running is to run a pre-defined package script task:

```
yarn build:dev
```

More information about options to run the project can be found by running the following:
```
./node_modules/esbuild/bin/esbuild
```

Lots to do including linting, prettify, babel build step. Moving JS into sensible files and out of script tags in html.
