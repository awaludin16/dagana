#!/bin/sh
set -eu

# Runs once on an empty volume: gives the test suite its own database so
# RefreshDatabase never touches the development schema.
psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
    -c "CREATE DATABASE \"${POSTGRES_DB}_test\" OWNER \"$POSTGRES_USER\";"
