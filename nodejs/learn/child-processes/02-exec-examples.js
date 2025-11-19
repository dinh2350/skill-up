const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');

// Promisify exec for async/await usage
const execPromise = util.promisify(exec);

/**
 * EXEC() - Real World Examples
 * 
 * exec() is best for:
 * - Quick shell commands with small output
 * - Commands that need shell features (pipes, wildcards)
 * - Simple one-off operations
 * - Output fits in memory (default max 1MB)
 */

// ============================================
// Example 1: Git Operations
// ============================================
async function getGitInfo(repoPath = '.') {
  console.log('=== Example 1: Git Operations ===');
  
  try {
    // Get current branch
    const { stdout: branch } = await execPromise('git branch --show-current', {
      cwd: repoPath
    });
    
    // Get last commit
    const { stdout: lastCommit } = await execPromise(
      'git log -1 --pretty=format:"%h - %an, %ar : %s"',
      { cwd: repoPath }
    );
    
    // Get repository status
    const { stdout: status } = await execPromise('git status --short', {
      cwd: repoPath
    });
    
    // Get total commits
    const { stdout: commitCount } = await execPromise('git rev-list --count HEAD', {
      cwd: repoPath
    });
    
    const gitInfo = {
      branch: branch.trim(),
      lastCommit: lastCommit.trim(),
      status: status.trim() || 'No changes',
      totalCommits: parseInt(commitCount.trim())
    };
    
    console.log('Git Information:');
    console.log(`  Branch: ${gitInfo.branch}`);
    console.log(`  Last Commit: ${gitInfo.lastCommit}`);
    console.log(`  Status: ${gitInfo.status}`);
    console.log(`  Total Commits: ${gitInfo.totalCommits}`);
    console.log('✓ Git info retrieved successfully\n');
    
    return gitInfo;
  } catch (error) {
    console.error(`Git error: ${error.message}\n`);
    throw error;
  }
}

// ============================================
// Example 2: System Information
// ============================================
async function getSystemInfo() {
  console.log('=== Example 2: System Information ===');
  
  const isWindows = process.platform === 'win32';
  
  try {
    let cpuInfo, memoryInfo, diskInfo;
    
    if (isWindows) {
      // Windows commands
      const { stdout: cpu } = await execPromise('wmic cpu get name');
      const { stdout: mem } = await execPromise('wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /value');
      const { stdout: disk } = await execPromise('wmic logicaldisk get size,freespace,caption');
      
      cpuInfo = cpu.split('\n')[1]?.trim() || 'Unknown';
      memoryInfo = mem;
      diskInfo = disk;
    } else {
      // Unix/Linux/Mac commands
      const { stdout: cpu } = await execPromise('sysctl -n machdep.cpu.brand_string || cat /proc/cpuinfo | grep "model name" | head -1');
      const { stdout: mem } = await execPromise('free -h || vm_stat');
      const { stdout: disk } = await execPromise('df -h');
      
      cpuInfo = cpu.trim();
      memoryInfo = mem;
      diskInfo = disk;
    }
    
    console.log('System Information:');
    console.log('CPU:', cpuInfo);
    console.log('Memory:', memoryInfo.split('\n')[0]);
    console.log('Disk:', diskInfo.split('\n')[0]);
    console.log('✓ System info retrieved successfully\n');
    
    return { cpuInfo, memoryInfo, diskInfo };
  } catch (error) {
    console.error(`System info error: ${error.message}\n`);
    throw error;
  }
}

// ============================================
// Example 3: Database Backup
// ============================================
async function backupDatabase(config) {
  console.log('=== Example 3: Database Backup ===');
  
  const {
    host = 'localhost',
    port = 5432,
    database,
    username,
    password,
    outputFile
  } = config;
  
  try {
    // PostgreSQL backup example
    const backupCommand = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -F c -f ${outputFile}`;
    
    console.log(`Creating backup of database: ${database}`);
    console.log(`Output file: ${outputFile}`);
    
    // Set password via environment variable for security
    const { stdout, stderr } = await execPromise(backupCommand, {
      env: { ...process.env, PGPASSWORD: password },
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    
    if (stderr && !stderr.includes('Password')) {
      console.log('Backup warnings:', stderr);
    }
    
    // Verify backup file exists
    if (fs.existsSync(outputFile)) {
      const stats = fs.statSync(outputFile);
      console.log(`✓ Backup completed successfully`);
      console.log(`  File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB\n`);
    }
    
    return outputFile;
  } catch (error) {
    console.error(`Backup error: ${error.message}\n`);
    throw error;
  }
}

// ============================================
// Example 4: File Search with Wildcards
// ============================================
async function findFiles(pattern, directory = '.') {
  console.log('=== Example 4: File Search ===');
  
  const isWindows = process.platform === 'win32';
  
  try {
    let command;
    if (isWindows) {
      // Windows dir command
      command = `dir /s /b "${directory}\\${pattern}"`;
    } else {
      // Unix find command
      command = `find "${directory}" -name "${pattern}"`;
    }
    
    console.log(`Searching for: ${pattern} in ${directory}`);
    
    const { stdout } = await execPromise(command, {
      maxBuffer: 5 * 1024 * 1024 // 5MB buffer
    });
    
    const files = stdout.trim().split('\n').filter(f => f);
    
    console.log(`Found ${files.length} files:`);
    files.slice(0, 10).forEach(file => console.log(`  - ${file}`));
    if (files.length > 10) {
      console.log(`  ... and ${files.length - 10} more`);
    }
    console.log('✓ File search completed\n');
    
    return files;
  } catch (error) {
    // No files found or error
    console.log('No files found or error occurred\n');
    return [];
  }
}

// ============================================
// Example 5: Image Optimization
// ============================================
async function optimizeImages(inputDir, outputDir) {
  console.log('=== Example 5: Image Optimization ===');
  
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Find all images
    const isWindows = process.platform === 'win32';
    const findCmd = isWindows 
      ? `dir /s /b "${inputDir}\\*.jpg" "${inputDir}\\*.png"`
      : `find "${inputDir}" -type f \\( -name "*.jpg" -o -name "*.png" \\)`;
    
    const { stdout } = await execPromise(findCmd);
    const images = stdout.trim().split('\n').filter(f => f);
    
    console.log(`Found ${images.length} images to optimize`);
    
    // Optimize each image using ImageMagick (if available)
    const results = [];
    for (const imagePath of images.slice(0, 5)) { // Limit to 5 for demo
      const fileName = imagePath.split(/[/\\]/).pop();
      const outputPath = `${outputDir}/${fileName}`;
      
      try {
        // Convert and optimize using ImageMagick
        const optimizeCmd = `magick "${imagePath}" -quality 85 -strip "${outputPath}"`;
        await execPromise(optimizeCmd);
        
        const originalSize = fs.statSync(imagePath).size;
        const optimizedSize = fs.statSync(outputPath).size;
        const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
        
        console.log(`  ✓ ${fileName}: ${savings}% smaller`);
        results.push({ fileName, savings });
      } catch (err) {
        console.log(`  ✗ ${fileName}: Optimization failed (ImageMagick may not be installed)`);
      }
    }
    
    console.log('✓ Image optimization completed\n');
    return results;
  } catch (error) {
    console.error(`Image optimization error: ${error.message}\n`);
    return [];
  }
}

// ============================================
// Example 6: Running NPM Scripts
// ============================================
async function runNpmScript(scriptName, projectPath = '.') {
  console.log('=== Example 6: Running NPM Script ===');
  
  try {
    console.log(`Running npm script: ${scriptName}`);
    
    const { stdout, stderr } = await execPromise(`npm run ${scriptName}`, {
      cwd: projectPath,
      maxBuffer: 5 * 1024 * 1024
    });
    
    if (stdout) {
      console.log('Output:', stdout.substring(0, 200));
      if (stdout.length > 200) console.log('...');
    }
    
    console.log('✓ NPM script completed successfully\n');
    return stdout;
  } catch (error) {
    console.error(`NPM script error: ${error.message}\n`);
    throw error;
  }
}

// ============================================
// Example 7: Complex Shell Pipeline
// ============================================
async function analyzeLogFile(logFile) {
  console.log('=== Example 7: Log File Analysis ===');
  
  const isWindows = process.platform === 'win32';
  
  try {
    let errorCount, warningCount, topErrors;
    
    if (isWindows) {
      // PowerShell commands
      const { stdout: errors } = await execPromise(
        `powershell -Command "(Get-Content '${logFile}' | Select-String 'ERROR').Count"`
      );
      errorCount = parseInt(errors.trim()) || 0;
      
      const { stdout: warnings } = await execPromise(
        `powershell -Command "(Get-Content '${logFile}' | Select-String 'WARN').Count"`
      );
      warningCount = parseInt(warnings.trim()) || 0;
      
      const { stdout: top } = await execPromise(
        `powershell -Command "Get-Content '${logFile}' | Select-String 'ERROR' | Select-Object -First 5"`
      );
      topErrors = top.trim();
    } else {
      // Unix shell pipeline
      const { stdout: errors } = await execPromise(
        `grep -c "ERROR" "${logFile}" || echo 0`
      );
      errorCount = parseInt(errors.trim());
      
      const { stdout: warnings } = await execPromise(
        `grep -c "WARN" "${logFile}" || echo 0`
      );
      warningCount = parseInt(warnings.trim());
      
      // Get top 5 most common errors
      const { stdout: top } = await execPromise(
        `grep "ERROR" "${logFile}" | sort | uniq -c | sort -rn | head -5 || echo "No errors found"`
      );
      topErrors = top.trim();
    }
    
    console.log('Log Analysis Results:');
    console.log(`  Total Errors: ${errorCount}`);
    console.log(`  Total Warnings: ${warningCount}`);
    console.log('  Top Errors:');
    console.log(topErrors);
    console.log('✓ Log analysis completed\n');
    
    return { errorCount, warningCount, topErrors };
  } catch (error) {
    console.error(`Log analysis error: ${error.message}\n`);
    throw error;
  }
}

// ============================================
// Example 8: Environment Setup Check
// ============================================
async function checkDevEnvironment() {
  console.log('=== Example 8: Development Environment Check ===');
  
  const tools = [
    { name: 'Node.js', command: 'node --version' },
    { name: 'NPM', command: 'npm --version' },
    { name: 'Git', command: 'git --version' },
    { name: 'Docker', command: 'docker --version' },
    { name: 'Python', command: 'python --version' }
  ];
  
  const results = [];
  
  for (const tool of tools) {
    try {
      const { stdout } = await execPromise(tool.command);
      const version = stdout.trim();
      console.log(`✓ ${tool.name}: ${version}`);
      results.push({ name: tool.name, installed: true, version });
    } catch (error) {
      console.log(`✗ ${tool.name}: Not installed`);
      results.push({ name: tool.name, installed: false });
    }
  }
  
  console.log('✓ Environment check completed\n');
  return results;
}

// ============================================
// Example 9: Execute with Timeout and Retry
// ============================================
async function executeWithRetry(command, options = {}) {
  console.log('=== Example 9: Execute with Retry ===');
  
  const {
    maxRetries = 3,
    timeout = 5000,
    retryDelay = 1000
  } = options;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}: ${command}`);
      
      const { stdout, stderr } = await execPromise(command, {
        timeout,
        maxBuffer: 1024 * 1024
      });
      
      console.log('✓ Command succeeded');
      console.log(`Output: ${stdout.substring(0, 100)}\n`);
      return stdout;
    } catch (error) {
      console.log(`✗ Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt < maxRetries) {
        console.log(`Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        console.log('All attempts failed\n');
        throw error;
      }
    }
  }
}

// ============================================
// Main Execution (Demonstration)
// ============================================
async function main() {
  console.log('Node.js Child Process - exec() Examples\n');
  
  try {
    // Example: Check development environment
    await checkDevEnvironment();
    
    // Example: System information
    await getSystemInfo();
    
    // Example: Find JavaScript files
    // await findFiles('*.js', '.');
    
    // Example: Execute with retry (using a simple command)
    await executeWithRetry('node --version', { maxRetries: 2, timeout: 3000 });
    
    console.log('✓ All exec() examples demonstrated!');
    console.log('\nKey Takeaways:');
    console.log('- exec() is perfect for simple shell commands');
    console.log('- Automatically uses shell (supports pipes, wildcards, etc.)');
    console.log('- Output is buffered (limited to maxBuffer size)');
    console.log('- Great for quick operations with small output');
    console.log('- Use execPromise with async/await for cleaner code');
    
  } catch (error) {
    console.error('Error in examples:', error.message);
  }
}

// Export for use in other modules
module.exports = {
  getGitInfo,
  getSystemInfo,
  backupDatabase,
  findFiles,
  optimizeImages,
  runNpmScript,
  analyzeLogFile,
  checkDevEnvironment,
  executeWithRetry
};

// Run examples if executed directly
if (require.main === module) {
  main();
}
