const { execFile } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs');

// Promisify execFile for async/await usage
const execFilePromise = util.promisify(execFile);

/**
 * EXECFILE() - Real World Examples
 * 
 * execFile() is best for:
 * - Executing specific binaries or scripts directly
 * - Better security (no shell parsing, prevents injection)
 * - Better performance than exec() (no shell overhead)
 * - When you don't need shell features
 */

// ============================================
// Example 1: Running Python Data Processing Script
// ============================================
async function runPythonDataProcessor(inputFile, outputFile) {
  console.log('=== Example 1: Python Data Processing ===');
  
  // First, create a sample Python script
  const pythonScript = path.join(__dirname, 'scripts', 'data_processor.py');
  
  // Ensure scripts directory exists
  const scriptsDir = path.join(__dirname, 'scripts');
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
  }
  
  // Create sample Python script if it doesn't exist
  if (!fs.existsSync(pythonScript)) {
    const scriptContent = `#!/usr/bin/env python3
import sys
import json

def process_data(input_file, output_file):
    """Process data from input file and write to output file"""
    try:
        with open(input_file, 'r') as f:
            data = json.load(f)
        
        # Process data (example: add ID and timestamp)
        processed = []
        for i, item in enumerate(data):
            item['id'] = i + 1
            item['processed'] = True
            processed.append(item)
        
        with open(output_file, 'w') as f:
            json.dump(processed, f, indent=2)
        
        print(f"Successfully processed {len(processed)} items")
        return 0
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python data_processor.py <input_file> <output_file>")
        sys.exit(1)
    
    sys.exit(process_data(sys.argv[1], sys.argv[2]))
`;
    fs.writeFileSync(pythonScript, scriptContent);
    console.log('Created sample Python script');
  }
  
  try {
    console.log(`Processing: ${inputFile} -> ${outputFile}`);
    
    const { stdout, stderr } = await execFilePromise('python', [
      pythonScript,
      inputFile,
      outputFile
    ], {
      timeout: 30000, // 30 second timeout
      maxBuffer: 5 * 1024 * 1024 // 5MB
    });
    
    if (stdout) {
      console.log('Output:', stdout.trim());
    }
    
    if (stderr) {
      console.error('Errors:', stderr.trim());
    }
    
    console.log('✓ Python processing completed\n');
    return { stdout, stderr };
  } catch (error) {
    console.error(`Python processing failed: ${error.message}\n`);
    throw error;
  }
}

// ============================================
// Example 2: Running Node.js Script in Isolation
// ============================================
async function runNodeScript(scriptPath, args = []) {
  console.log('=== Example 2: Running Node.js Script ===');
  
  try {
    console.log(`Executing: ${scriptPath}`);
    console.log(`Arguments: ${args.join(', ')}`);
    
    const startTime = Date.now();
    
    const { stdout, stderr } = await execFilePromise('node', [
      scriptPath,
      ...args
    ], {
      timeout: 10000,
      maxBuffer: 2 * 1024 * 1024,
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    const executionTime = Date.now() - startTime;
    
    console.log('Output:', stdout.trim());
    console.log(`✓ Script completed in ${executionTime}ms\n`);
    
    return { stdout, stderr, executionTime };
  } catch (error) {
    console.error(`Script execution failed: ${error.message}\n`);
    throw error;
  }
}

// ============================================
// Example 3: Image Processing with ImageMagick
// ============================================
async function resizeImage(inputImage, outputImage, width, height) {
  console.log('=== Example 3: Image Resize with ImageMagick ===');
  
  try {
    console.log(`Resizing ${inputImage} to ${width}x${height}`);
    
    // Using ImageMagick's convert command
    await execFilePromise('magick', [
      inputImage,
      '-resize',
      `${width}x${height}`,
      '-quality',
      '90',
      outputImage
    ], {
      timeout: 30000
    });
    
    const inputSize = fs.existsSync(inputImage) ? fs.statSync(inputImage).size : 0;
    const outputSize = fs.existsSync(outputImage) ? fs.statSync(outputImage).size : 0;
    
    console.log('✓ Image resized successfully');
    console.log(`  Original: ${(inputSize / 1024).toFixed(2)} KB`);
    console.log(`  Resized: ${(outputSize / 1024).toFixed(2)} KB\n`);
    
    return outputImage;
  } catch (error) {
    console.error(`Image resize failed: ${error.message}\n`);
    throw error;
  }
}

// ============================================
// Example 4: PDF Generation with wkhtmltopdf
// ============================================
async function htmlToPdf(htmlFile, pdfFile, options = {}) {
  console.log('=== Example 4: HTML to PDF Conversion ===');
  
  const {
    pageSize = 'A4',
    orientation = 'Portrait',
    marginTop = '10mm',
    marginBottom = '10mm'
  } = options;
  
  try {
    console.log(`Converting ${htmlFile} to PDF`);
    
    const args = [
      '--page-size', pageSize,
      '--orientation', orientation,
      '--margin-top', marginTop,
      '--margin-bottom', marginBottom,
      htmlFile,
      pdfFile
    ];
    
    await execFilePromise('wkhtmltopdf', args, {
      timeout: 60000
    });
    
    if (fs.existsSync(pdfFile)) {
      const size = fs.statSync(pdfFile).size;
      console.log('✓ PDF generated successfully');
      console.log(`  Size: ${(size / 1024).toFixed(2)} KB\n`);
    }
    
    return pdfFile;
  } catch (error) {
    console.error(`PDF generation failed: ${error.message}\n`);
    throw error;
  }
}

// ============================================
// Example 5: Running Custom Binary/Executable
// ============================================
async function runCustomBinary(binaryPath, args = []) {
  console.log('=== Example 5: Running Custom Binary ===');
  
  try {
    // Check if binary exists and is executable
    if (!fs.existsSync(binaryPath)) {
      throw new Error(`Binary not found: ${binaryPath}`);
    }
    
    console.log(`Executing: ${binaryPath}`);
    console.log(`Arguments: ${JSON.stringify(args)}`);
    
    const { stdout, stderr } = await execFilePromise(binaryPath, args, {
      timeout: 10000,
      maxBuffer: 1024 * 1024,
      // For Windows, might need shell: true in some cases
      windowsHide: true
    });
    
    console.log('Output:', stdout.trim());
    if (stderr) {
      console.log('Stderr:', stderr.trim());
    }
    console.log('✓ Binary executed successfully\n');
    
    return { stdout, stderr };
  } catch (error) {
    console.error(`Binary execution failed: ${error.message}\n`);
    throw error;
  }
}

// ============================================
// Example 6: Running Shell Script (Unix/Linux)
// ============================================
async function runShellScript(scriptPath, args = []) {
  console.log('=== Example 6: Running Shell Script ===');
  
  const isWindows = process.platform === 'win32';
  
  try {
    let executable, scriptArgs;
    
    if (isWindows) {
      // Windows: Use PowerShell or cmd
      executable = 'powershell.exe';
      scriptArgs = ['-ExecutionPolicy', 'Bypass', '-File', scriptPath, ...args];
    } else {
      // Unix/Linux/Mac: Use bash
      executable = 'bash';
      scriptArgs = [scriptPath, ...args];
    }
    
    console.log(`Executing script: ${scriptPath}`);
    
    const { stdout, stderr } = await execFilePromise(executable, scriptArgs, {
      timeout: 30000,
      maxBuffer: 2 * 1024 * 1024
    });
    
    console.log('Script output:', stdout.trim());
    console.log('✓ Shell script completed\n');
    
    return { stdout, stderr };
  } catch (error) {
    console.error(`Shell script failed: ${error.message}\n`);
    throw error;
  }
}

// ============================================
// Example 7: Validation and Sanitization
// ============================================
async function safeExecuteFile(executable, userInputArgs) {
  console.log('=== Example 7: Safe Execution with Validation ===');
  
  // Whitelist of allowed executables
  const allowedExecutables = ['node', 'python', 'git'];
  
  // Validate executable
  const executableName = path.basename(executable).replace(/\.(exe|cmd|bat)$/i, '');
  if (!allowedExecutables.includes(executableName)) {
    throw new Error(`Executable not allowed: ${executable}`);
  }
  
  // Sanitize arguments - remove dangerous characters
  const sanitizedArgs = userInputArgs.map(arg => {
    // Remove shell metacharacters
    return arg.replace(/[;&|`$()]/g, '');
  });
  
  try {
    console.log(`Safely executing: ${executable}`);
    console.log(`Sanitized args: ${JSON.stringify(sanitizedArgs)}`);
    
    const { stdout } = await execFilePromise(executable, sanitizedArgs, {
      timeout: 5000,
      maxBuffer: 512 * 1024,
      shell: false // NEVER use shell with user input
    });
    
    console.log('✓ Safe execution completed\n');
    return stdout;
  } catch (error) {
    console.error(`Safe execution failed: ${error.message}\n`);
    throw error;
  }
}

// ============================================
// Example 8: Batch Processing Multiple Files
// ============================================
async function batchProcessFiles(processor, files, concurrency = 3) {
  console.log('=== Example 8: Batch File Processing ===');
  console.log(`Processing ${files.length} files with concurrency: ${concurrency}\n`);
  
  const results = [];
  const errors = [];
  
  // Process files in batches
  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);
    console.log(`Processing batch ${Math.floor(i / concurrency) + 1}...`);
    
    const batchPromises = batch.map(async (file) => {
      try {
        const result = await processor(file);
        console.log(`  ✓ ${file}`);
        return { file, success: true, result };
      } catch (error) {
        console.log(`  ✗ ${file}: ${error.message}`);
        return { file, success: false, error: error.message };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n✓ Batch processing completed: ${successCount}/${files.length} successful\n`);
  
  return results;
}

// ============================================
// Example 9: Execute with Resource Limits
// ============================================
async function executeWithLimits(executable, args, limits = {}) {
  console.log('=== Example 9: Execute with Resource Limits ===');
  
  const {
    timeout = 5000,
    maxBuffer = 1024 * 1024, // 1MB
    maxMemory = null // In MB, requires ulimit on Unix
  } = limits;
  
  try {
    console.log(`Executing with limits:`);
    console.log(`  Timeout: ${timeout}ms`);
    console.log(`  Max Buffer: ${(maxBuffer / 1024).toFixed(0)} KB`);
    
    const options = {
      timeout,
      maxBuffer,
      killSignal: 'SIGTERM'
    };
    
    // On Unix, can use ulimit to set memory limits
    if (maxMemory && process.platform !== 'win32') {
      options.env = {
        ...process.env
      };
      // Would need to wrap in a shell with ulimit for true memory limiting
    }
    
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    const { stdout, stderr } = await execFilePromise(executable, args, options);
    
    const executionTime = Date.now() - startTime;
    const memoryUsed = process.memoryUsage().heapUsed - startMemory;
    
    console.log('✓ Execution completed successfully');
    console.log(`  Time: ${executionTime}ms`);
    console.log(`  Memory: ${(memoryUsed / 1024 / 1024).toFixed(2)} MB\n`);
    
    return { stdout, stderr, executionTime, memoryUsed };
  } catch (error) {
    if (error.killed && error.signal === 'SIGTERM') {
      console.error('✗ Execution timeout exceeded\n');
    } else {
      console.error(`✗ Execution failed: ${error.message}\n`);
    }
    throw error;
  }
}

// ============================================
// Helper: Create Sample Scripts
// ============================================
function createSampleScripts() {
  const scriptsDir = path.join(__dirname, 'scripts');
  
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
  }
  
  // Create a sample Node.js script
  const nodeScriptPath = path.join(scriptsDir, 'sample.js');
  if (!fs.existsSync(nodeScriptPath)) {
    const nodeScript = `#!/usr/bin/env node
const args = process.argv.slice(2);
console.log('Sample Node.js script executed');
console.log('Arguments:', args);
console.log('Environment:', process.env.NODE_ENV || 'development');
process.exit(0);
`;
    fs.writeFileSync(nodeScriptPath, nodeScript);
  }
  
  // Create a sample data file
  const dataPath = path.join(scriptsDir, 'sample_data.json');
  if (!fs.existsSync(dataPath)) {
    const sampleData = [
      { name: 'Item 1', value: 100 },
      { name: 'Item 2', value: 200 },
      { name: 'Item 3', value: 300 }
    ];
    fs.writeFileSync(dataPath, JSON.stringify(sampleData, null, 2));
  }
  
  return { scriptsDir, nodeScriptPath, dataPath };
}

// ============================================
// Main Execution (Demonstration)
// ============================================
async function main() {
  console.log('Node.js Child Process - execFile() Examples\n');
  
  try {
    // Create sample scripts
    const { nodeScriptPath, dataPath } = createSampleScripts();
    
    // Example 1: Run Node.js script
    await runNodeScript(nodeScriptPath, ['arg1', 'arg2', 'arg3']);
    
    // Example 2: Run Python data processor
    const outputPath = path.join(__dirname, 'scripts', 'processed_data.json');
    try {
      await runPythonDataProcessor(dataPath, outputPath);
    } catch (err) {
      console.log('Python example skipped (Python may not be installed)\n');
    }
    
    // Example 7: Safe execution
    await safeExecuteFile('node', ['--version']);
    
    // Example 9: Execute with limits
    await executeWithLimits('node', ['--version'], {
      timeout: 3000,
      maxBuffer: 512 * 1024
    });
    
    console.log('✓ All execFile() examples demonstrated!');
    console.log('\nKey Takeaways:');
    console.log('- execFile() is more secure than exec() (no shell)');
    console.log('- Better performance - no shell overhead');
    console.log('- Perfect for running specific binaries/scripts');
    console.log('- Always validate and sanitize user inputs');
    console.log('- Set appropriate timeouts and buffer limits');
    console.log('- Use for Python scripts, custom binaries, etc.');
    
  } catch (error) {
    console.error('Error in examples:', error.message);
  }
}

// Export for use in other modules
module.exports = {
  runPythonDataProcessor,
  runNodeScript,
  resizeImage,
  htmlToPdf,
  runCustomBinary,
  runShellScript,
  safeExecuteFile,
  batchProcessFiles,
  executeWithLimits,
  createSampleScripts
};

// Run examples if executed directly
if (require.main === module) {
  main();
}
