#!/bin/sh
set -eu

# The source tree is bind-mounted over the image, so vendor is installed on
# first boot instead of being baked into the image.
if [ ! -d vendor ]; then
    composer install --no-interaction --prefer-dist
fi

exec "$@"
