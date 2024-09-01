import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';
import sass from 'sass';
import { exec } from 'child_process';

function compileSass() {
    try {
        const srcPath = resolve(__dirname, 'src/main.scss');
        const distDir = resolve(__dirname, 'dist/');
        const distPath = resolve(distDir, 'index.css');

        console.log(`Compiling Sass from ${srcPath} to ${distPath}`);

        // Compile Sass to CSS
        const result = sass.renderSync({
            file: srcPath,
            outputStyle: 'compressed', // Compressed CSS output
        });

        // Ensure the dist directory exists
        fs.mkdirSync(distDir, { recursive: true });

        // Write the output CSS to the dist folder
        fs.writeFileSync(distPath, result.css);

        console.log('Sass compiled and CSS updated successfully.');
    } catch (error) {
        console.error('Sass compilation error:', error);
    }
}

function viteSassWatcher() {
    let serverRestarting = false;

    return {
        name: 'vite-sass-watcher',
        apply: 'serve',
        configureServer(server) {
            // Watch for changes in the src directory
            server.watcher.add(resolve(__dirname, 'src'));

            server.watcher.on('change', (file) => {
                if (file.endsWith('.scss') && !serverRestarting) {
                    console.log(`File changed: ${file}`);
                    compileSass();

                    serverRestarting = true;
                    console.log('Restarting Vite server to refresh changes...');

                    // Programmatically restart the server after a delay to ensure CSS is saved
                    setTimeout(() => {
                        serverRestarting = false;
                        exec('npx vite');
                        server.close(); // Close the existing server instance
                    }, 500);
                }
            });
        },
        buildStart() {
            compileSass(); // Compile once at the start
        }
    };
}

export default defineConfig({
    plugins: [viteSassWatcher()],
});
