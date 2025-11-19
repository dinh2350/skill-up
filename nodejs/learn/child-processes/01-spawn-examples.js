const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * SPAWN() - Real World Examples
 * 
 * spawn() is best for:
 * - Long-running processes
 * - Streaming large amounts of data
 * - Real-time output processing
 * - Better performance (no shell by default)
 */

// ============================================
// Example 1: File Compression with Real-time Progress
// ============================================
function compressLargeFile(inputFile, outputFile) {
  console.log('=== Example 1: File Compression ===');
  
  return new Promise((resolve, reject) => {
    // Using tar to compress a directory (works on Unix/Linux/Mac)
    // On Windows, you might use 7zip or other tools
    const tar = spawn('tar', ['-czf', outputFile, inputFile]);
    
    let errorOutput = '';
    
    // Handle stdout - tar doesn't output much on success
    tar.stdout.on('data', (data) => {
      console.log(`Progress: ${data}`);
    });
    
    // Handle stderr - tar uses stderr for progress/warnings
    tar.stderr.on('data', (data) => {
      errorOutput += data;
      console.log(`Status: ${data}`);
    });
    
    // Handle process exit
    tar.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Compression failed with code ${code}: ${errorOutput}`));
      } else {
        console.log(`✓ Successfully compressed ${inputFile} to ${outputFile}\n`);
        resolve();
      }
    });
    
    // Handle errors
    tar.on('error', (err) => {
      reject(new Error(`Failed to start compression: ${err.message}`));
    });
  });
}

// ============================================
// Example 2: Real-time Log Monitoring (tail -f)
// ============================================
function monitorLogFile(logFilePath, callback) {
  console.log('=== Example 2: Real-time Log Monitoring ===');
  
  // For Windows, use PowerShell's Get-Content with -Wait
  const isWindows = process.platform === 'win32';
  
  let child;
  if (isWindows) {
    child = spawn('powershell.exe', [
      '-Command',
      `Get-Content -Path "${logFilePath}" -Wait -Tail 10`
    ]);
  } else {
    child = spawn('tail', ['-f', logFilePath]);
  }
  
  // Process each line of output
  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.log(`[LOG] ${line}`);
      if (callback) callback(line);
    });
  });
  
  child.stderr.on('data', (data) => {
    console.error(`[ERROR] ${data}`);
  });
  
  child.on('error', (err) => {
    console.error(`Failed to monitor log: ${err.message}`);
  });
  
  // Return function to stop monitoring
  return () => {
    child.kill();
    console.log('✓ Stopped monitoring log file\n');
  };
}

// ============================================
// Example 3: Video Transcoding with Progress
// ============================================
function transcodeVideo(inputVideo, outputVideo, onProgress) {
  console.log('=== Example 3: Video Transcoding (FFmpeg) ===');
  
  return new Promise((resolve, reject) => {
    // FFmpeg command to convert video
    // Install FFmpeg: https://ffmpeg.org/download.html
    const ffmpeg = spawn('ffmpeg', [
      '-i', inputVideo,           // Input file
      '-c:v', 'libx264',          // Video codec
      '-preset', 'medium',        // Encoding speed
      '-crf', '23',               // Quality (lower = better)
      '-c:a', 'aac',              // Audio codec
      '-b:a', '128k',             // Audio bitrate
      '-progress', 'pipe:1',      // Output progress to stdout
      '-y',                       // Overwrite output file
      outputVideo
    ]);
    
    let duration = 0;
    
    // Parse FFmpeg output for progress
    ffmpeg.stdout.on('data', (data) => {
      const output = data.toString();
      
      // Extract duration
      const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})/);
      if (durationMatch) {
        const [, hours, minutes, seconds] = durationMatch;
        duration = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
      }
      
      // Extract current time
      const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2})/);
      if (timeMatch && duration > 0) {
        const [, hours, minutes, seconds] = timeMatch;
        const currentTime = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
        const progress = Math.round((currentTime / duration) * 100);
        
        if (onProgress) onProgress(progress);
        process.stdout.write(`\rProgress: ${progress}%`);
      }
    });
    
    ffmpeg.stderr.on('data', (data) => {
      // FFmpeg outputs info to stderr
      const output = data.toString();
      if (output.includes('Duration:')) {
        const match = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})/);
        if (match) {
          console.log(`\nVideo duration detected: ${match[0]}`);
        }
      }
    });
    
    ffmpeg.on('close', (code) => {
      console.log('');
      if (code !== 0) {
        reject(new Error(`FFmpeg exited with code ${code}`));
      } else {
        console.log(`✓ Video transcoded successfully to ${outputVideo}\n`);
        resolve();
      }
    });
    
    ffmpeg.on('error', (err) => {
      reject(new Error(`Failed to start FFmpeg: ${err.message}`));
    });
  });
}

// ============================================
// Example 4: Large File Processing with Streaming
// ============================================
function processLargeFile(inputFile, outputFile, transformation) {
  console.log('=== Example 4: Large File Processing ===');
  
  return new Promise((resolve, reject) => {
    // Use system commands for efficient file processing
    // Example: Convert CSV to uppercase using awk/PowerShell
    const isWindows = process.platform === 'win32';
    
    let child;
    if (isWindows) {
      // PowerShell example
      child = spawn('powershell.exe', [
        '-Command',
        `Get-Content "${inputFile}" | ForEach-Object { $_.ToUpper() } | Set-Content "${outputFile}"`
      ]);
    } else {
      // Unix/Linux/Mac using awk
      child = spawn('awk', [
        '{ print toupper($0) }',
        inputFile
      ]);
      
      // Redirect output to file
      const writeStream = fs.createWriteStream(outputFile);
      child.stdout.pipe(writeStream);
    }
    
    let processedBytes = 0;
    
    child.stdout.on('data', (data) => {
      processedBytes += data.length;
      process.stdout.write(`\rProcessed: ${(processedBytes / 1024 / 1024).toFixed(2)} MB`);
    });
    
    child.stderr.on('data', (data) => {
      console.error(`Error: ${data}`);
    });
    
    child.on('close', (code) => {
      console.log('');
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}`));
      } else {
        console.log(`✓ File processed successfully to ${outputFile}\n`);
        resolve();
      }
    });
    
    child.on('error', (err) => {
      reject(new Error(`Failed to process file: ${err.message}`));
    });
  });
}

// ============================================
// Example 5: Running Python Script with Arguments
// ============================================
function runPythonScript(scriptPath, args = []) {
  console.log('=== Example 5: Running Python Script ===');
  
  return new Promise((resolve, reject) => {
    const python = spawn('python', [scriptPath, ...args]);
    
    let output = '';
    let errorOutput = '';
    
    python.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      console.log(`[Python] ${chunk.trim()}`);
    });
    
    python.stderr.on('data', (data) => {
      errorOutput += data;
      console.error(`[Python Error] ${data}`);
    });
    
    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script exited with code ${code}: ${errorOutput}`));
      } else {
        console.log('✓ Python script executed successfully\n');
        resolve(output);
      }
    });
    
    python.on('error', (err) => {
      reject(new Error(`Failed to start Python: ${err.message}`));
    });
  });
}

// ============================================
// Example 6: Interactive Process with Input/Output
// ============================================
function interactiveProcess() {
  console.log('=== Example 6: Interactive Process ===');
  
  // Example: Interactive node REPL
  const repl = spawn('node', [], {
    stdio: ['pipe', 'pipe', 'pipe'] // stdin, stdout, stderr
  });
  
  // Send commands to the process
  const commands = [
    '2 + 2',
    'console.log("Hello from child process")',
    'process.version',
    '.exit'
  ];
  
  let commandIndex = 0;
  
  repl.stdout.on('data', (data) => {
    console.log(`Output: ${data.toString().trim()}`);
    
    // Send next command after a delay
    if (commandIndex < commands.length) {
      setTimeout(() => {
        const cmd = commands[commandIndex++];
        console.log(`> ${cmd}`);
        repl.stdin.write(cmd + '\n');
      }, 500);
    }
  });
  
  repl.stderr.on('data', (data) => {
    console.error(`Error: ${data}`);
  });
  
  repl.on('close', (code) => {
    console.log(`✓ Interactive process closed with code ${code}\n`);
  });
  
  // Start first command
  setTimeout(() => {
    const cmd = commands[commandIndex++];
    console.log(`> ${cmd}`);
    repl.stdin.write(cmd + '\n');
  }, 500);
}

// ============================================
// Example 7: Process with Timeout
// ============================================
function processWithTimeout(command, args, timeoutMs = 5000) {
  console.log('=== Example 7: Process with Timeout ===');
  
  return new Promise((resolve, reject) => {
    const child = spawn(command, args);
    
    let output = '';
    let killed = false;
    
    // Set timeout
    const timeout = setTimeout(() => {
      killed = true;
      child.kill('SIGTERM');
      
      // Force kill if not terminated
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 1000);
      
      reject(new Error(`Process timeout after ${timeoutMs}ms`));
    }, timeoutMs);
    
    child.stdout.on('data', (data) => {
      output += data;
      console.log(`Output: ${data}`);
    });
    
    child.on('close', (code) => {
      clearTimeout(timeout);
      if (!killed) {
        console.log(`✓ Process completed with code ${code}\n`);
        resolve(output);
      }
    });
    
    child.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

// ============================================
// Main Execution (Demonstration)
// ============================================
async function main() {
  console.log('Node.js Child Process - spawn() Examples\n');
  console.log('These are real-world examples. Some may require:');
  console.log('- FFmpeg for video processing');
  console.log('- Python for script execution');
  console.log('- Unix tools (tar, awk) or Windows equivalents\n');
  
  try {
    // Example: Interactive process
    interactiveProcess();
    
    // Wait a bit for interactive example
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // Example: Process with timeout
    // This will timeout on Windows, use appropriate command
    if (process.platform !== 'win32') {
      try {
        await processWithTimeout('sleep', ['10'], 2000);
      } catch (err) {
        console.log(`Expected timeout: ${err.message}\n`);
      }
    }
    
    console.log('✓ All spawn() examples demonstrated!');
    console.log('\nKey Takeaways:');
    console.log('- spawn() is ideal for streaming and long-running processes');
    console.log('- Always handle stdout, stderr, and error events');
    console.log('- Use timeouts for potentially hanging processes');
    console.log('- Clean up child processes properly');
    
  } catch (error) {
    console.error('Error in examples:', error.message);
  }
}

// Export for use in other modules
module.exports = {
  compressLargeFile,
  monitorLogFile,
  transcodeVideo,
  processLargeFile,
  runPythonScript,
  interactiveProcess,
  processWithTimeout
};

// Run examples if executed directly
if (require.main === module) {
  main();
}
