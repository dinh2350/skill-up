# What is the difference between `exec()` and `execFile()` in the child_process module?

## Short Answer

Both `exec()` and `execFile()` execute external commands and buffer the output, but they differ in how they execute commands:

**`exec()`**:

- Spawns a **shell** and runs the command in that shell
- Supports **shell syntax** (pipes, redirects, wildcards)
- Less secure (vulnerable to command injection)
- Slower (spawns shell first)

**`execFile()`**:

- Executes the file **directly** without spawning a shell
- Does NOT support shell syntax
- More secure (no shell interpretation)
- Faster (no shell overhead)

```javascript
const { exec, execFile } = require("child_process");

// exec - Runs command in shell
exec("ls -lh | grep node", (err, stdout, stderr) => {
  console.log(stdout); // Works! Shell supports pipes
});

// execFile - Executes file directly
execFile("ls", ["-lh"], (err, stdout, stderr) => {
  console.log(stdout); // Works! No shell needed
});

// This WON'T work with execFile:
execFile("ls -lh | grep node", (err, stdout) => {
  // Error! No shell to interpret the pipe
});
```

**Key difference:** `exec()` = shell + command, `execFile()` = direct execution

## Detailed Answer

### Understanding exec()

`exec()` spawns a shell (`/bin/sh` on Unix, `cmd.exe` on Windows) and runs the command inside it.

#### Basic exec() Usage

```javascript
const { exec } = require("child_process");

// Simple command
exec("ls -lh", (error, stdout, stderr) => {
  if (error) {
    console.error(`exec error: ${error}`);
    return;
  }

  console.log(`stdout: ${stdout}`);

  if (stderr) {
    console.error(`stderr: ${stderr}`);
  }
});
```

#### exec() with Shell Features

```javascript
const { exec } = require("child_process");

// Pipes (shell feature)
exec("cat package.json | grep name", (err, stdout) => {
  console.log(stdout);
});

// Redirects (shell feature)
exec("ls -lh > files.txt", (err, stdout) => {
  console.log("Files written to files.txt");
});

// Wildcards (shell feature)
exec("cat *.txt", (err, stdout) => {
  console.log(stdout);
});

// Multiple commands (shell feature)
exec("cd /tmp && ls -lh", (err, stdout) => {
  console.log(stdout);
});

// Environment variables (shell feature)
exec("echo $PATH", (err, stdout) => {
  console.log("PATH:", stdout);
});

// Command substitution (shell feature)
exec('echo "Today is $(date)"', (err, stdout) => {
  console.log(stdout);
});
```

#### exec() with Options

```javascript
const { exec } = require("child_process");

const options = {
  cwd: "/path/to/directory", // Working directory
  env: { NODE_ENV: "production" }, // Environment variables
  encoding: "utf8", // Output encoding
  timeout: 5000, // Kill after 5 seconds
  maxBuffer: 1024 * 1024, // Max buffer size (1MB)
  killSignal: "SIGTERM", // Signal to kill process
  shell: "/bin/bash", // Specify shell
  windowsHide: true, // Hide console window (Windows)
};

exec("your-command", options, (error, stdout, stderr) => {
  // Handle output
});
```

#### exec() Returns ChildProcess

```javascript
const { exec } = require("child_process");

const child = exec("long-running-command");

// Access stdin/stdout/stderr
child.stdout.on("data", (data) => {
  console.log(`stdout: ${data}`);
});

child.stderr.on("data", (data) => {
  console.error(`stderr: ${data}`);
});

// Kill process
setTimeout(() => {
  child.kill("SIGTERM");
}, 5000);

// Process events
child.on("exit", (code, signal) => {
  console.log(`Process exited with code ${code}`);
});
```

### Understanding execFile()

`execFile()` executes a file directly without spawning a shell, making it more secure and efficient.

#### Basic execFile() Usage

```javascript
const { execFile } = require("child_process");

// Execute binary directly
execFile("node", ["--version"], (error, stdout, stderr) => {
  if (error) {
    console.error(`execFile error: ${error}`);
    return;
  }

  console.log(`Node version: ${stdout}`);
});

// Execute script
execFile("/usr/bin/python3", ["script.py"], (err, stdout) => {
  console.log(`Python output: ${stdout}`);
});
```

#### execFile() with Arguments

```javascript
const { execFile } = require("child_process");

// Arguments as array (NOT string)
execFile("ls", ["-lh", "/usr/local"], (err, stdout) => {
  console.log(stdout);
});

// Multiple arguments
execFile("grep", ["-r", "pattern", "/path/to/search"], (err, stdout) => {
  console.log(stdout);
});

// No arguments
execFile("date", [], (err, stdout) => {
  console.log("Current date:", stdout);
});
```

#### execFile() with Options

```javascript
const { execFile } = require("child_process");

const options = {
  cwd: "/path/to/directory",
  env: { NODE_ENV: "production" },
  encoding: "utf8",
  timeout: 5000,
  maxBuffer: 1024 * 1024,
  killSignal: "SIGTERM",
  windowsHide: true,
  shell: false, // Default is false (no shell)
};

execFile("command", ["arg1", "arg2"], options, (error, stdout, stderr) => {
  // Handle output
});
```

#### execFile() Cannot Use Shell Features

```javascript
const { execFile } = require("child_process");

// ❌ These WON'T work with execFile:

// Pipes
execFile("cat package.json | grep name", (err, stdout) => {
  // Error! No shell to interpret pipe
});

// Redirects
execFile("ls > files.txt", (err, stdout) => {
  // Error! No shell to interpret redirect
});

// Wildcards
execFile("cat *.txt", (err, stdout) => {
  // Error! No shell to expand wildcards
});

// Multiple commands
execFile("cd /tmp && ls", (err, stdout) => {
  // Error! No shell to interpret &&
});
```

### Key Differences

#### 1. Shell Spawning

```javascript
const { exec, execFile } = require("child_process");

// exec - Spawns shell first, then runs command
exec("ls -lh");
// Process: /bin/sh -c "ls -lh"

// execFile - Executes directly
execFile("ls", ["-lh"]);
// Process: /usr/bin/ls -lh (no shell)
```

#### 2. Command Syntax

```javascript
// exec - Command as string, shell interprets it
exec("ls -lh /usr | grep bin", (err, stdout) => {
  console.log(stdout); // Works!
});

// execFile - Command and args separate, no shell interpretation
execFile("ls", ["-lh", "/usr"], (err, stdout) => {
  console.log(stdout); // Works!
});

// execFile with pipe - DOESN'T WORK
execFile("ls -lh /usr | grep bin", [], (err, stdout) => {
  console.error(err); // Error! No shell to interpret pipe
});
```

#### 3. Security

```javascript
const { exec, execFile } = require("child_process");

// User input (potentially malicious)
const userInput = "; rm -rf /"; // Command injection!

// ❌ DANGEROUS with exec
exec(`ls ${userInput}`, (err, stdout) => {
  // This will execute: ls ; rm -rf /
  // Shell interprets the semicolon and runs rm -rf /
  // NEVER DO THIS!
});

// ✅ SAFE with execFile
execFile("ls", [userInput], (err, stdout) => {
  // This safely treats "; rm -rf /" as a filename argument
  // No shell to interpret special characters
  // Much safer!
});
```

#### 4. Performance

```javascript
const { exec, execFile } = require("child_process");

console.time("exec");
exec("node --version", (err, stdout) => {
  console.timeEnd("exec"); // ~50-100ms (spawns shell)
  console.log(stdout);
});

console.time("execFile");
execFile("node", ["--version"], (err, stdout) => {
  console.timeEnd("execFile"); // ~20-50ms (direct execution)
  console.log(stdout);
});
```

#### 5. Error Handling

```javascript
const { exec, execFile } = require("child_process");

// exec - Shell exit code
exec("exit 1", (err, stdout, stderr) => {
  console.log(err.code); // 1
  console.log(err.killed); // false
});

// execFile - Command exit code
execFile("node", ["-e", "process.exit(1)"], (err, stdout, stderr) => {
  console.log(err.code); // 1
  console.log(err.killed); // false
});

// Both handle errors similarly
// But exec can have shell-specific errors too
```

### Comparison Table

| Feature            | exec()                          | execFile()               |
| ------------------ | ------------------------------- | ------------------------ |
| **Spawns shell**   | ✅ Yes (`/bin/sh` or `cmd.exe`) | ❌ No (direct execution) |
| **Shell syntax**   | ✅ Pipes, redirects, wildcards  | ❌ Not supported         |
| **Command format** | String with arguments           | File + arguments array   |
| **Security**       | ❌ Less secure (injection risk) | ✅ More secure           |
| **Performance**    | Slower (shell overhead)         | ✅ Faster                |
| **Use case**       | Shell commands, scripts         | Binaries, executables    |
| **Buffer output**  | ✅ Yes                          | ✅ Yes                   |
| **Max buffer**     | 1MB (default)                   | 1MB (default)            |
| **Async**          | ✅ Yes                          | ✅ Yes                   |
| **Returns**        | ChildProcess                    | ChildProcess             |

### When to Use Each

#### Use exec() when:

```javascript
const { exec } = require("child_process");

// 1. Need shell features (pipes, redirects)
exec("cat file.txt | grep pattern | wc -l", (err, stdout) => {
  console.log("Matching lines:", stdout);
});

// 2. Running shell scripts
exec("bash script.sh", (err, stdout) => {
  console.log(stdout);
});

// 3. Need environment variable expansion
exec("echo $HOME", (err, stdout) => {
  console.log("Home:", stdout);
});

// 4. Quick one-liners
exec("npm install && npm test", (err, stdout) => {
  console.log(stdout);
});

// 5. Working with wildcards
exec("rm *.log", (err) => {
  console.log("Log files deleted");
});
```

#### Use execFile() when:

```javascript
const { execFile } = require("child_process");

// 1. Security is important (user input)
function listFiles(directory) {
  execFile("ls", ["-lh", directory], (err, stdout) => {
    console.log(stdout);
  });
}

// 2. Running binary executables
execFile("ffmpeg", ["-i", "input.mp4", "output.avi"], (err) => {
  console.log("Video converted");
});

// 3. Performance matters
execFile("node", ["script.js"], (err, stdout) => {
  console.log(stdout);
});

// 4. Don't need shell features
execFile("python3", ["script.py", "--arg", "value"], (err, stdout) => {
  console.log(stdout);
});

// 5. Cross-platform consistency
execFile("node", ["--version"], (err, stdout) => {
  console.log(stdout);
});
```

### Real-World Examples

#### Example 1: Safe User Input Handling

```javascript
const { execFile } = require("child_process");

// ❌ DANGEROUS - Command injection vulnerability
function searchFilesDangerous(pattern) {
  const { exec } = require("child_process");

  // If pattern is "; rm -rf /", this executes rm -rf /!
  exec(`grep -r "${pattern}" .`, (err, stdout) => {
    console.log(stdout);
  });
}

// ✅ SAFE - No command injection
function searchFilesSafe(pattern) {
  // Pattern treated as literal string, not interpreted
  execFile("grep", ["-r", pattern, "."], (err, stdout) => {
    console.log(stdout);
  });
}

// Usage
searchFilesSafe("; rm -rf /"); // Safe! Searches for literal string
```

#### Example 2: Promisified Versions

```javascript
const util = require("util");
const { exec, execFile } = require("child_process");

const execPromise = util.promisify(exec);
const execFilePromise = util.promisify(execFile);

// Using exec with async/await
async function getSystemInfo() {
  try {
    const { stdout } = await execPromise("uname -a");
    return stdout.trim();
  } catch (err) {
    console.error("Error:", err);
    throw err;
  }
}

// Using execFile with async/await
async function getNodeVersion() {
  try {
    const { stdout } = await execFilePromise("node", ["--version"]);
    return stdout.trim();
  } catch (err) {
    console.error("Error:", err);
    throw err;
  }
}

// Usage
async function main() {
  const systemInfo = await getSystemInfo();
  const nodeVersion = await getNodeVersion();

  console.log("System:", systemInfo);
  console.log("Node:", nodeVersion);
}

main();
```

#### Example 3: File Processing with execFile

```javascript
const { execFile } = require("child_process");
const fs = require("fs").promises;

async function optimizeImage(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    execFile(
      "convert",
      [inputPath, "-quality", "85", "-resize", "1920x1080", outputPath],
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(outputPath);
        }
      }
    );
  });
}

// Usage
async function processImages() {
  const files = await fs.readdir("./images");

  for (const file of files) {
    if (file.endsWith(".jpg")) {
      const input = `./images/${file}`;
      const output = `./optimized/${file}`;

      try {
        await optimizeImage(input, output);
        console.log(`Optimized: ${file}`);
      } catch (err) {
        console.error(`Failed: ${file}`, err.message);
      }
    }
  }
}

processImages();
```

#### Example 4: Running Scripts with exec

```javascript
const { exec } = require("child_process");

function runBuildScript() {
  return new Promise((resolve, reject) => {
    // Shell features: && to chain commands
    const command = "npm run build && npm run test";

    const child = exec(command, {
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    // Stream output
    child.stdout.on("data", (data) => {
      process.stdout.write(data);
    });

    child.stderr.on("data", (data) => {
      process.stderr.write(data);
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Build failed with code ${code}`));
      }
    });
  });
}

// Usage
runBuildScript()
  .then(() => console.log("Build successful"))
  .catch((err) => console.error("Build failed:", err));
```

#### Example 5: Command Injection Prevention

```javascript
const { execFile } = require("child_process");

class FileManager {
  // ❌ VULNERABLE to command injection
  deleteFileDangerous(filename) {
    const { exec } = require("child_process");

    exec(`rm ${filename}`, (err) => {
      if (err) console.error(err);
    });
  }

  // ✅ SAFE from command injection
  deleteFileSafe(filename) {
    execFile("rm", [filename], (err) => {
      if (err) console.error(err);
    });
  }
}

const fm = new FileManager();

// Malicious input
const maliciousInput = "test.txt; cat /etc/passwd";

// With exec - DANGEROUS!
// Executes: rm test.txt; cat /etc/passwd
// This will delete test.txt AND expose /etc/passwd
fm.deleteFileDangerous(maliciousInput);

// With execFile - SAFE!
// Treats entire string as filename
// Will fail because file doesn't exist, but won't execute cat command
fm.deleteFileSafe(maliciousInput);
```

#### Example 6: Performance Comparison

```javascript
const { exec, execFile } = require("child_process");

async function benchmark(iterations = 100) {
  // Benchmark exec
  console.time("exec");
  for (let i = 0; i < iterations; i++) {
    await new Promise((resolve) => {
      exec("node --version", resolve);
    });
  }
  console.timeEnd("exec");

  // Benchmark execFile
  console.time("execFile");
  for (let i = 0; i < iterations; i++) {
    await new Promise((resolve) => {
      execFile("node", ["--version"], resolve);
    });
  }
  console.timeEnd("execFile");
}

benchmark(100);
// Output example:
// exec: 8234ms (slower, spawns shell each time)
// execFile: 4567ms (faster, direct execution)
```

#### Example 7: Database Backup

```javascript
const { exec } = require("child_process");
const path = require("path");

function backupDatabase(config) {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const filename = `backup-${timestamp}.sql`;
    const outputPath = path.join(config.backupDir, filename);

    // Using exec because we need shell features (pipe, redirect)
    const command = `mysqldump -u ${config.user} -p${config.password} ${config.database} > ${outputPath}`;

    exec(command, { maxBuffer: 50 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve(outputPath);
      }
    });
  });
}

// Usage
backupDatabase({
  user: "root",
  password: "secret",
  database: "myapp",
  backupDir: "/backups",
})
  .then((file) => console.log("Backup created:", file))
  .catch((err) => console.error("Backup failed:", err));
```

#### Example 8: Validation Helper

```javascript
const { execFile } = require("child_process");
const util = require("util");

const execFilePromise = util.promisify(execFile);

async function validateInput(input, allowedCommands) {
  // Whitelist approach for commands
  const [command, ...args] = input.split(" ");

  if (!allowedCommands.includes(command)) {
    throw new Error(`Command not allowed: ${command}`);
  }

  try {
    const { stdout, stderr } = await execFilePromise(command, args, {
      timeout: 5000,
      maxBuffer: 1024 * 1024,
    });

    return stdout;
  } catch (err) {
    throw new Error(`Command failed: ${err.message}`);
  }
}

// Usage
const allowedCommands = ["ls", "cat", "grep", "find"];

validateInput("ls -lh", allowedCommands)
  .then((output) => console.log(output))
  .catch((err) => console.error(err.message));

validateInput("rm -rf /", allowedCommands).catch((err) =>
  console.error(err.message)
); // Command not allowed: rm
```

### Best Practices

```javascript
// ✅ 1. Prefer execFile for security
const { execFile } = require("child_process");
execFile("command", [userInput]); // Safe

// ❌ Don't use exec with user input
const { exec } = require("child_process");
exec(`command ${userInput}`); // Dangerous!

// ✅ 2. Always handle errors
execFile("command", ["arg"], (err, stdout, stderr) => {
  if (err) {
    console.error("Error:", err);
    return;
  }
  console.log(stdout);
});

// ✅ 3. Set timeouts for long-running commands
execFile("command", ["arg"], { timeout: 5000 }, (err, stdout) => {
  // Will be killed after 5 seconds
});

// ✅ 4. Handle large output with maxBuffer
execFile(
  "command",
  ["arg"],
  {
    maxBuffer: 10 * 1024 * 1024, // 10MB
  },
  (err, stdout) => {
    // Can handle larger output
  }
);

// ✅ 5. Use spawn for streaming (if needed)
const { spawn } = require("child_process");
const child = spawn("command", ["arg"]);
child.stdout.on("data", (data) => {
  // Process data as it arrives
});

// ✅ 6. Validate and sanitize user input
function validateCommand(command) {
  const allowed = ["ls", "cat", "grep"];
  if (!allowed.includes(command)) {
    throw new Error("Command not allowed");
  }
}

// ✅ 7. Use promisify for async/await
const util = require("util");
const execFilePromise = util.promisify(execFile);

// ✅ 8. Specify full path for executables
execFile("/usr/bin/python3", ["script.py"]);

// ✅ 9. Handle both stdout and stderr
execFile("command", ["arg"], (err, stdout, stderr) => {
  if (stderr) console.error("stderr:", stderr);
  if (stdout) console.log("stdout:", stdout);
});

// ✅ 10. Clean up on process exit
const child = execFile("command", ["arg"]);
process.on("exit", () => {
  child.kill();
});
```

### Common Mistakes

```javascript
// ❌ 1. Using exec with user input
const userInput = req.query.file;
exec(`cat ${userInput}`, callback); // Command injection!

// ✅ Fix
execFile("cat", [userInput], callback);

// ❌ 2. Not handling errors
execFile("command", ["arg"], (err, stdout) => {
  console.log(stdout); // Will crash if error!
});

// ✅ Fix
execFile("command", ["arg"], (err, stdout) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(stdout);
});

// ❌ 3. Using shell syntax with execFile
execFile("ls | grep node", [], callback); // Won't work!

// ✅ Fix - Use exec or spawn with piping
exec("ls | grep node", callback);

// ❌ 4. Forgetting maxBuffer for large output
execFile("command", ["arg"], callback); // Might fail with large output

// ✅ Fix
execFile("command", ["arg"], { maxBuffer: 10 * 1024 * 1024 }, callback);

// ❌ 5. Not setting timeout
execFile("long-running-command", ["arg"], callback); // Might hang forever

// ✅ Fix
execFile("long-running-command", ["arg"], { timeout: 30000 }, callback);
```

### Key Takeaways

- ✅ **exec()** spawns a **shell**, **execFile()** executes **directly**
- ✅ **exec()** supports **shell syntax** (pipes, redirects, wildcards)
- ✅ **execFile()** is **more secure** (no command injection)
- ✅ **execFile()** is **faster** (no shell overhead)
- ✅ Use **execFile()** for **user input** to prevent injection
- ✅ Use **exec()** when you **need shell features**
- ✅ Both **buffer output** (not ideal for large data)
- ✅ Both return **ChildProcess** object
- ✅ Set **timeout** and **maxBuffer** for safety
- ✅ Always **handle errors** properly
- ✅ **execFile()** takes arguments as **array**
- ✅ **exec()** takes command as **string**
- ✅ For **streaming**, use **spawn()** instead
- ✅ Prefer **execFile()** by default for security

### Further Reading

- [Node.js child_process.exec() documentation](https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback)
- [Node.js child_process.execFile() documentation](https://nodejs.org/api/child_process.html#child_process_child_process_execfile_file_args_options_callback)
- [Command Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html)
- [Child Process Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Difference between spawn and exec](https://nodejs.org/api/child_process.html#child_process_asynchronous_process_creation)
