#!/usr/bin/env bun

import { spawn } from 'bun';
import { existsSync, mkdirSync, appendFileSync } from 'fs';
import { join } from 'path';

const LOG_DIR = 'logs';
const DEV_LOG_FILE = join(LOG_DIR, 'app.log');
const DEV_SERVER_PORT = process.env.PORT || '5007';

// logsディレクトリが存在しない場合は作成
if (!existsSync(LOG_DIR)) {
	mkdirSync(LOG_DIR, { recursive: true });
}

// ログファイルにタイムスタンプ付きで書き込む関数
function writeLog(message: string, logFile: string) {
	const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
	const logLine = `[${timestamp}] ${message}\n`;
	
	// コンソールに出力
	process.stdout.write(logLine);
	
	// ファイルにも追記
	try {
		appendFileSync(logFile, logLine);
	} catch (error) {
		// エラーが発生しても続行
		console.error(`Failed to write to log file: ${error}`);
	}
}

// データベース初期化処理
async function initializeDatabase() {
	writeLog('Database initialization...', DEV_LOG_FILE);
	
	try {
		// db:generate
		writeLog('Running db:generate...', DEV_LOG_FILE);
		const generateProcess = spawn(['bun', 'run', 'db:generate'], {
			stdout: 'inherit',
			stderr: 'inherit',
		});
		await generateProcess.exited;
		if (generateProcess.exitCode !== 0) {
			throw new Error(`db:generate failed with exit code ${generateProcess.exitCode}`);
		}
		
		// db:deploy
		writeLog('Running db:deploy...', DEV_LOG_FILE);
		const deployProcess = spawn(['bun', 'run', 'db:deploy'], {
			stdout: 'inherit',
			stderr: 'inherit',
		});
		await deployProcess.exited;
		if (deployProcess.exitCode !== 0) {
			throw new Error(`db:deploy failed with exit code ${deployProcess.exitCode}`);
		}
		
		// db:seed
		writeLog('Running db:seed...', DEV_LOG_FILE);
		const seedProcess = spawn(['bun', 'run', 'db:seed'], {
			stdout: 'inherit',
			stderr: 'inherit',
		});
		await seedProcess.exited;
		if (seedProcess.exitCode !== 0) {
			writeLog(`Warning: db:seed failed with exit code ${seedProcess.exitCode}`, DEV_LOG_FILE);
		}
		
		writeLog('Database initialization completed.', DEV_LOG_FILE);
	} catch (error) {
		writeLog(`Error during database initialization: ${error}`, DEV_LOG_FILE);
		process.exit(1);
	}
}

// 開発サーバーを起動
async function startDevServer() {
	writeLog(`Starting development server on port ${DEV_SERVER_PORT}...`, DEV_LOG_FILE);
	
	const viteProcess = spawn(['bun', 'run', 'vite', 'dev', '--port', DEV_SERVER_PORT], {
		stdout: 'pipe',
		stderr: 'pipe',
		env: {
			...process.env,
			FORCE_COLOR: '1',
		},
	});
	
	// stdoutを処理
	viteProcess.stdout.pipeTo(
		new WritableStream({
			write(chunk) {
				const text = new TextDecoder().decode(chunk);
				const lines = text.split('\n').filter((line) => line.trim());
				for (const line of lines) {
					const formattedLine = `[vite] ${line}`;
					process.stdout.write(formattedLine + '\n');
					// ANSIカラーコードを削除してログファイルに書き込む
					const cleanLine = formattedLine.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
					try {
						appendFileSync(DEV_LOG_FILE, cleanLine + '\n');
					} catch (error) {
						// エラーが発生しても続行
					}
				}
			},
		})
	);
	
	// stderrを処理
	viteProcess.stderr.pipeTo(
		new WritableStream({
			write(chunk) {
				const text = new TextDecoder().decode(chunk);
				const lines = text.split('\n').filter((line) => line.trim());
				for (const line of lines) {
					const formattedLine = `[vite] ${line}`;
					process.stderr.write(formattedLine + '\n');
					// ANSIカラーコードを削除してログファイルに書き込む
					const cleanLine = formattedLine.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
					try {
						appendFileSync(DEV_LOG_FILE, cleanLine + '\n');
					} catch (error) {
						// エラーが発生しても続行
					}
				}
			},
		})
	);
	
	// Ctrl+Cで終了
	process.on('SIGINT', () => {
		writeLog('Stopping development server...', DEV_LOG_FILE);
		viteProcess.kill();
		process.exit(0);
	});
	
	process.on('SIGTERM', () => {
		writeLog('Stopping development server...', DEV_LOG_FILE);
		viteProcess.kill();
		process.exit(0);
	});
	
	writeLog(`Development server running on http://localhost:${DEV_SERVER_PORT}`, DEV_LOG_FILE);
	
	await viteProcess.exited;
}

// メイン処理
async function main() {
	const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
	writeLog('---- dev-server start ----', DEV_LOG_FILE);
	
	// データベース初期化
	await initializeDatabase();
	
	// 開発サーバー起動
	await startDevServer();
}

main().catch((error) => {
	writeLog(`Fatal error: ${error}`, DEV_LOG_FILE);
	process.exit(1);
});

