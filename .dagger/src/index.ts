import { func, argument, Directory, object, Container, dag } from "@dagger.io/dagger";

// Helper function to log with timestamp
function logWithTimestamp(message: string): void {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// Helper function to measure execution time
async function withTiming<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  logWithTimestamp(`Starting ${operation}...`);
  try {
    const result = await fn();
    const duration = Date.now() - start;
    logWithTimestamp(`✅ ${operation} completed in ${duration.toString()}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logWithTimestamp(
      `❌ ${operation} failed after ${duration.toString()}ms: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
}

/**
 * Get a base Node.js container
 * @returns A Node.js container with basic setup
 */
function getNodeContainer(): Container {
  return dag.container().from("node:lts").withWorkdir("/workspace");
}

@object()
export class Webring {
  /**
   * Install dependencies
   * @param source The source directory
   * @returns A container with dependencies installed
   */
  @func()
  async deps(
    @argument({
      ignore: ["node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
  ): Promise<Container> {
    logWithTimestamp("📦 Installing dependencies");

    const container = getNodeContainer()
      .withFile("package.json", source.file("package.json"))
      .withFile("package-lock.json", source.file("package-lock.json"))
      .withExec(["npm", "ci"]);

    return container;
  }

  /**
   * Run linting
   * @param source The source directory
   * @returns A message indicating completion
   */
  @func()
  async lint(
    @argument({
      ignore: ["node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
  ): Promise<string> {
    logWithTimestamp("🔍 Running linting");

    const depsContainer = await this.deps(source);

    const result = await withTiming("lint", async () => {
      return depsContainer
        .withDirectory("src", source.directory("src"))
        .withFile("eslint.config.js", source.file("eslint.config.js"))
        .withFile("tsconfig.json", source.file("tsconfig.json"))
        .withExec(["npm", "run", "lint"])
        .stdout();
    });

    logWithTimestamp("✅ Linting completed successfully");
    return result;
  }

  /**
   * Build the project
   * @param source The source directory
   * @returns A directory containing the built artifacts
   */
  @func()
  async build(
    @argument({
      ignore: ["node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
  ): Promise<Directory> {
    logWithTimestamp("🔨 Building project");

    const depsContainer = await this.deps(source);

    const buildDir = await withTiming("build", async () => {
      return depsContainer
        .withDirectory("src", source.directory("src"))
        .withFile("tsconfig.json", source.file("tsconfig.json"))
        .withExec(["npm", "run", "build"])
        .directory("dist");
    });

    logWithTimestamp("✅ Build completed successfully");
    return buildDir;
  }

  /**
   * Run tests
   * @param source The source directory
   * @returns A message indicating completion
   */
  @func()
  async test(
    @argument({
      ignore: ["node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
  ): Promise<string> {
    logWithTimestamp("🧪 Running tests");

    // First build the project
    const buildDir = await this.build(source);
    const depsContainer = await this.deps(source);

    const result = await withTiming("test", async () => {
      // Run unit tests
      const testResult = await depsContainer
        .withDirectory("src", source.directory("src"))
        .withFile("vitest.config.ts", source.file("vitest.config.ts"))
        .withFile("tsconfig.json", source.file("tsconfig.json"))
        .withExec(["npm", "run", "test", "--", "--run"])
        .stdout();

      // Test example app - setup parent context with built dist and package.json
      const exampleContainer = getNodeContainer()
        .withDirectory("example", source.directory("example"))
        .withDirectory("dist", buildDir)
        .withFile("package.json", source.file("package.json"))
        .withFile("package-lock.json", source.file("package-lock.json"))
        .withExec(["npm", "ci"]);

      await exampleContainer.withWorkdir("example").withExec(["npm", "ci"]).withExec(["npm", "run", "build"]).stdout();

      return testResult;
    });

    logWithTimestamp("✅ Tests completed successfully");
    return result;
  }

  /**
   * Run the full CI pipeline
   * @param source The source directory
   * @returns A message indicating completion
   */
  @func()
  async ci(
    @argument({
      ignore: ["node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
  ): Promise<string> {
    logWithTimestamp("🚀 Starting CI pipeline");

    // Run all steps in parallel where possible
    const [lintResult, buildResult] = await withTiming("parallel lint and build", async () => {
      return Promise.all([this.lint(source), this.build(source)]);
    });

    // Run tests after build is complete
    const testResult = await withTiming("test", () => this.test(source));

    logWithTimestamp("🎉 CI pipeline completed successfully");
    return `CI pipeline completed successfully:\n- Lint: ${lintResult}\n- Build: completed\n- Test: ${testResult}`;
  }
}
