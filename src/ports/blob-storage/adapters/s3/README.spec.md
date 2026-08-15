---
type: Adapter
title: Amazon S3 Blob Adapter
description: Stores and retrieves binary objects through an S3-compatible client.
tags: [infrastructure, blobs, s3, adapter]
status: stable
---

# Does

Implements `BlobStorage` with S3 put, get, and delete commands. Missing objects return `undefined`.

# Requires

The `@aws-sdk/client-s3` dependency, a bucket and region passed to the facade, and credentials supplied through the AWS SDK environment/configuration. The `.env.example` provides conventional lab variables to map into those options.
