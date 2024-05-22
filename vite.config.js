import { defineConfig, normalizePath, build } from 'vite'
import path, { resolve } from 'path'
import { fileURLToPath } from 'url';
import fs from 'fs'
import { viteStaticCopy } from 'vite-plugin-static-copy';
import nunjucks from 'vite-plugin-nunjucks'
import sidebarItems from "./src/sidebar-items.json";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = resolve(__dirname, 'src')

const getFiles = () => {
    let files = {}

    fs.readdirSync(root)
        .filter(filename => filename.endsWith('.html'))
        .forEach(filename => {
            files[filename.slice(0, -5)] = resolve(root, filename)
        })
    return files
};

const files = getFiles()

const getVariables = (mode) => {
    const variables = {}
    Object.keys(files).forEach((filename) => {
        if (filename.includes('layouts')) filename = `layouts/${filename}`
        variables[filename + '.html'] = {
            web_title: "Mazer Admin Dashboard",
            sidebarItems,
            isDev: mode === 'development'
        }
    })
    return variables
};

build({
    configFile: false,
    build: {
        emptyOutDir: false,
        outDir: resolve(__dirname, 'dist/assets/compiled/js'),
        lib: {
            name: 'app',
            formats: ['umd'],
            fileName: 'app',
            entry: './src/assets/js/app.js',
        },
        rollupOptions: {
            output: {
                entryFileNames: '[name].js'
            }
        }
    },
});

export default defineConfig((env) => ({
    publicDir: 'static',
    base: './',
    root,
    plugins: [
        viteStaticCopy({
            targets: [
                { src: normalizePath(resolve(__dirname, './src/assets/static')), dest: 'assets' }
            ],
            watch: {
                reloadPageOnChange: true
            }
        }),
        nunjucks({
            templatesDir: root,
            variables: getVariables(env.mode),
            nunjucksEnvironment: {
                filters: {
                    containString: (str, containStr) => {
                        if (!str.length) return false
                        return str.indexOf(containStr) >= 0
                    },
                    startsWith: (str, targetStr) => {
                        if (!str.length) return false
                        return str.startsWith(targetStr)
                    }
                }
            }
        })
    ],
    resolve: {
        alias: {
        }
    },
    build: {
        emptyOutDir: false,
        manifest: true,
        target: "chrome58",
        outDir: resolve(__dirname, 'dist'),
        rollupOptions: {
            input: files,
            output: {
                entryFileNames: `assets/compiled/js/[name].js`,
                chunkFileNames: `assets/compiled/js/[name].js`,

                assetFileNames: (a) => {
                    const extname = a.name.split('.')[1]
                    let folder = extname ? `${extname}/` : ''

                    // Put fonts into css folder
                    if (['woff', 'woff2', 'ttf'].includes(extname))
                        folder = 'fonts/'

                    return `assets/compiled/${folder}[name][extname]`
                }
            }
        },
    }
}));