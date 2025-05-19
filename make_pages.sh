#!/bin/bash

# Create a new directory for the pages
mkdir -p docs

npm run build

# Copy the build files to the docs directory
cp -r dist/* docs/