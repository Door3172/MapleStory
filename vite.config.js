import { defineConfig } from 'vite';

export default defineConfig({
    root: 'client',
    server: {
        port: 3000,
        proxy: {
            '/socket.io': {
                target: 'http://localhost:8080',
                ws: true
            }
        }
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true
    }
});
