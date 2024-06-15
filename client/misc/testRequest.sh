#!/bin/bash

curl https://api.openai.com/v1/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer METTRE_CLE_API_ICI" \
  -d '{
    "model": "text-davinci-003",
    "prompt": "Propose un nom pour la MIAGE de Nice: ",
    "max_tokens": 7,
    "temperature": 1
  }'
