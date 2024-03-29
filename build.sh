#!/bin/bash

rm build/*
mkdir build
cp src/manifest.json build/manifest.json
cp src/background.js build/background.js
(cd src/panel && ng build --output-hashing none && npm exec webpack)
