#!/bin/sh
set -eu

# Tunggu MinIO siap, buat bucket gambar katalog, lalu izinkan public read
# lewat bucket policy (bukan object ACL).
ENDPOINT="${PRODUCT_IMAGES_ENDPOINT:-http://minio:9000}"
BUCKET="dagana-product-images"

until aws --endpoint-url "$ENDPOINT" s3api list-buckets >/dev/null 2>&1; do
    sleep 2
done

aws --endpoint-url "$ENDPOINT" s3api create-bucket --bucket "$BUCKET" >/dev/null 2>&1 || true

aws --endpoint-url "$ENDPOINT" s3api put-bucket-policy --bucket "$BUCKET" --policy "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [{
    \"Effect\": \"Allow\",
    \"Principal\": {\"AWS\": [\"*\"]},
    \"Action\": [\"s3:GetObject\"],
    \"Resource\": [\"arn:aws:s3:::$BUCKET/*\"]
  }]
}"
