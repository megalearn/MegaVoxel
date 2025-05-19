# TODO

## Infrastructure
- [x] Initialize project with `npm init`
- [x] Create package.json with basic configuration
- [x] Set up Vite as build tool
  - [x] Install Vite (`npm install vite --save-dev`)
  - [x] Configure Vite for development and production builds
  - [x] Add build and dev scripts to package.json
- [x] Set up basic project structure
  - [x] Create src/ directory
  - [x] Add index.html entry point
  - [x] Add main.js/ts entry point

## Core Features
- [x] Basic 3D viewport
- [x] Camera controls
- [x] Voxel placement
- [x] Voxel deletion
- [x] Color selection

## Tweaks
- [x] Update to 8 color palette

## Bugs
- [x] Voxel should not be added/erased on drag end
- [x] Prevent more than one voxel to be added/removed at a time

## More tweaks
- [ ] Variable size color palette
- [x] Automatically choose "Add mode" if a color is chosen (erase button deselects any selected color)
- [x] Make background color part of the configuration/parameters, and change it to #FDF0EE
- [x] Make the erase button the last item in the list of color buttons. Also remove the Add button.
- [x] Effect when erasing voxels (make the erased block shrink away)
- [x] Add import/export functionality