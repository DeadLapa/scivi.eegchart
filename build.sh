#!/bin/bash

TSC="./node_modules/.bin/tsc"
BROWSERIFY="./node_modules/.bin/browserify"
UGLIFY="./node_modules/.bin/uglifyjs"

mkdir -p ./build

$TSC
if [ $1 == "debug" ]; then
    $BROWSERIFY ./build/renderer.js --standalone EEGChart -o build/scivi-eeg-chart.min.js
else
    $BROWSERIFY ./build/renderer.js --standalone EEGChart -o build/scivi-eeg-chart-tmp.js
    $UGLIFY ./build/scivi-eeg-chart-tmp.js -o build/scivi-eeg-cgraph.min.js
fi
