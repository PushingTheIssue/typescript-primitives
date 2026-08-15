---
type: Capability
title: Blob Storage
description: Provider-neutral binary object storage selected through one facade.
tags: [infrastructure, blobs, port]
status: stable
---

# Does

`BlobStorage.create({ adapter, ...options })` loads a supported blob adapter and exposes upload, download, and deletion operations.

# Requires

The selected adapter's construction options and its provider dependency. Provider configuration belongs in that adapter's `.env.example` when environment variables are needed.
