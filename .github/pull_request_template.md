name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened, ready_for_review]

permissions:
  contents: read

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install deps
        run: npm ci

      - name: Typecheck
        run: npm run typecheck --if-present

      - name: Lint
        run: npm run lint --if-present

      - name: Build
        env:
          NEXT_PUBLIC_SITE_URL: http://localhost:3000
          NEXT_PUBLIC_SUPABASE_URL: https://example.supabase.co
          NEXT_PUBLIC_SUPABASE_ANON_KEY: anon
          NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: demo
          NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: demo
        run: npx next build