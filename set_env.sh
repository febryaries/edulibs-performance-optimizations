#!/bin/bash

# Ignore comments and empty lines
cat .env.production | while read line; do
  if [[ -n $line && ! $line =~ ^# ]]; then
    key=$(echo $line | cut -d '=' -f 1)
    value=$(echo $line | cut -d '=' -f 2-)
    echo "$key=$value"
    # echo [value] | vercel env add [key] [production]
    # echo "vercel env add $key production < <$(echo $value)"
    vercel env add $key preview < <(echo $value)
  fi
done
