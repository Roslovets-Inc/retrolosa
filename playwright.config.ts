import { defineConfig } from '@playwright/test'
export default defineConfig({ testDir: './tests', timeout: 90000, use: { baseURL: 'http://127.0.0.1:5173', channel: 'msedge', headless: true, viewport: { width: 1440, height: 960 }, launchOptions: { args: ['--enable-webgl', '--ignore-gpu-blocklist'] } }, reporter: 'list' })
