import { func, argument, Directory, object, Container } from "@dagger.io/dagger";
import { logWithTimestamp, withTiming, getNodeContainerWithCache } from "@shepherdjerred/dagger-utils";

@object()
export class Webring {
  /**
   * Install dependencies
   * @param source The source directory
   * @returns A container with dependencies installed
   */
  @func()
  deps(
    @argument({
      ignore: ["node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
  ): Container {
    logWithTimestamp("📦 Installing dependencies");

    const container = getNodeContainerWithCache(source).withExec(["npm", "ci"]);

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

    const depsContainer = this.deps(source);

    const result = await withTiming("lint", async () => {
      return depsContainer.withExec(["npm", "run", "lint"]).stdout();
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

    const depsContainer = this.deps(source);

    const buildDir = await withTiming("build", () => {
      return depsContainer.withExec(["npm", "run", "build"]).directory("dist");
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
    const depsContainer = this.deps(source);

    const result = await withTiming("test", async () => {
      // Run unit tests
      const testResult = await depsContainer.withExec(["npm", "run", "test", "--", "--run"]).stdout();

      // Test example app - setup parent context with built dist
      const exampleContainer = getNodeContainerWithCache(source)
        .withDirectory("dist", buildDir)
        .withExec(["npm", "ci"]);

      await exampleContainer
        .withWorkdir("/workspace/example")
        .withExec(["npm", "ci"])
        .withExec(["npm", "run", "build"])
        .stdout();

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
    const [lintResult, _buildResult] = await withTiming("parallel lint and build", async () => {
      return Promise.all([this.lint(source), this.build(source)]);
    });

    // Run tests after build is complete
    const testResult = await withTiming("test", () => this.test(source));

    logWithTimestamp("🎉 CI pipeline completed successfully");
    return `CI pipeline completed successfully:\n- Lint: ${lintResult}\n- Build: completed\n- Test: ${testResult}`;
  }
}
