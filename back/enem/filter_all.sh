#!/usr/bin/bash
jq '.[] | select(.discipline == "matematica" and .files == []) | {alternatives,question:.alternativesIntroduction,context}' *.json > maths.json
