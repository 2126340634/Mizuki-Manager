const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { EsbuildPlugin } = require('esbuild-loader')
const webpack = require('webpack')
const fs = require('fs')

const envPath = path.resolve(__dirname, '../.env')
if (!fs.existsSync(envPath)) {
	console.error('\n==================== .env 文件不存在, 请创建 .env 文件并添加必要的环境变量配置 ====================\n')
	process.exit(1)
}
require('dotenv').config({ path: envPath }) // 注入.env配置
const isProd = process.env.NODE_ENV === 'production'

module.exports = {
	mode: isProd ? 'production' : 'development',
	entry: './src/index.tsx',
	module: {
		rules: [
			{
				test: /\.[jt]sx?$/,
				exclude: /node_modules/,
				loader: 'esbuild-loader',
				options: {
					loader: 'tsx',
					target: 'esnext',
					sourcemap: !isProd
				}
			},
			{
				test: /\.scss$/,
				use: [isProd ? MiniCssExtractPlugin.loader : 'style-loader', 'css-loader', 'sass-loader'] // 提取css
			}
		]
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.jsx', '.js']
	},
	optimization: {
		minimize: isProd,
		minimizer: [
			new EsbuildPlugin(
				isProd
					? {
							target: 'esnext',
							css: true,
							jsx: 'automatic',
							minify: true,
							minifyWhitespace: true,
							minifyIdentifiers: true,
							minifySyntax: true,
							drop: ['console', 'debugger'],
							dropLabels: ['unused'],
							ignoreAnnotations: true,
							legalComments: 'none',
							treeShaking: true
						}
					: {}
			)
		],
		splitChunks: { chunks: 'all', minSize: 30000, maxSize: 244000 }
	},
	output: {
		filename: '[name].[contenthash:8].chunk.js',
		path: path.resolve(__dirname, 'dist'),
		clean: true
	},
	plugins: [
		new webpack.DefinePlugin({
			'process.env': JSON.stringify({
				NODE_ENV: isProd ? 'production' : 'development',
				DB_VERSION: process.env.DB_VERSION
			})
		}),
		new HtmlWebpackPlugin({
			template: './public/index.html',
			templateParameters: { PUBLIC_URL: '' },
			filename: 'index.html',
			publicPath: '/',
			minify: isProd && {
				removeComments: true,
				collapseWhitespace: true,
				collapseInlineTagWhitespace: true,
				conservativeCollapse: true,
				preserveLineBreaks: true,
				removeAttributeQuotes: true,
				removeEmptyAttributes: true,
				removeOptionalTags: true,
				removeRedundantAttributes: true,
				removeScriptTypeAttributes: true,
				removeStyleLinkTypeAttributes: true,
				trimCustomFragments: true,
				sortAttributes: true,
				sortClassName: true,
				minifyJS: true,
				minifyCSS: true,
				minifyURLs: true
			}
		}),
		new MiniCssExtractPlugin({
			filename: '[name].[contenthash:8].chunk.css'
		})
	],
	performance: {
		hints: false
	},
	stats: {
		preset: 'minimal',
		moduleTrace: true,
		errorDetails: true
	},
	devServer: {
		compress: false,
		port: process.env.FRONTEND_DEV_PORT || 3000,
		open: false,
		hot: true,
		historyApiFallback: {
			disableDotRule: true // 允许路径包含.符号
		},
		static: [
			{
				directory: path.resolve(process.env.BASE_PATH, 'public'), // 注意这是博客根目录下的public
				publicPath: '/',
				watch: false
			},
			{
				directory: path.resolve(process.env.BASE_PATH, 'src/assets'), // 注意这是博客根目录下的src
				publicPath: '/assets',
				watch: false
			},
			{
				directory: '../frontend/public',
				publicPath: '/',
				watch: false
			}
		],
		proxy: [
			{
				context: ['/mizuki'],
				target: `http://localhost:${process.env.PORT || 3001}`,
				changeOrigin: true,
				secure: false
			}
		]
	}
}
