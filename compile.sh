#!/bin/bash


cp "code/$1" "src/index.js"
npx webpack
echo "Bundled for and optimized for distribution!"

