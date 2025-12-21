import { func, argument, Directory, object, Container, dag, Secret } from "@dagger.io/dagger";
import { logWithTimestamp, withTiming, getBunContainerWithCache } from "@shepherdjerred/dagger-utils";

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

    const container = getBunContainerWithCache(source, "latest").withExec(["bun", "install", "--frozen-lockfile"]);

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
      return depsContainer.withExec(["bun", "run", "lint"]).stdout();
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
      return depsContainer.withExec(["bun", "run", "build"]).directory("dist");
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
      const testResult = await depsContainer.withExec(["bun", "run", "test", "--", "--run"]).stdout();

      // Test example app - setup parent context with built dist
      const exampleContainer = getBunContainerWithCache(source, "latest")
        .withDirectory("dist", buildDir)
        .withExec(["bun", "install", "--frozen-lockfile"]);

      await exampleContainer
        .withWorkdir("/workspace/example")
        .withExec(["bun", "install", "--frozen-lockfile"])
        .withExec(["bun", "run", "build"])
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

  /**
   * Build TypeDoc documentation
   * @param source The source directory
   * @returns A directory containing the TypeDoc documentation
   */
  @func()
  async buildDocs(
    @argument({
      ignore: ["node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
  ): Promise<Directory> {
    logWithTimestamp("📚 Building TypeDoc documentation");

    const depsContainer = this.deps(source);

    const docsDir = await withTiming("typedoc", () => {
      return depsContainer.withExec(["bun", "run", "typedoc"]).directory("docs");
    });

    logWithTimestamp("✅ TypeDoc documentation built successfully");
    return docsDir;
  }

  /**
   * Build a container with the TypeDoc documentation
   * @param source The source directory
   * @returns A container with nginx serving the documentation
   */
  @func()
  async buildDocsContainer(
    @argument({
      ignore: ["node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
  ): Promise<Container> {
    logWithTimestamp("🐳 Building docs container");

    const docsDir = await this.buildDocs(source);

    const container = dag
      .container()
      .from("nginx:alpine")
      .withDirectory("/usr/share/nginx/html", docsDir)
      .withExposedPort(80);

    logWithTimestamp("✅ Docs container built successfully");
    return container;
  }

  /**
   * Publish the docs container to GHCR
   * @param source The source directory
   * @param imageName The full image name (e.g., ghcr.io/shepherdjerred/webring-docs:latest)
   * @param ghcrUsername The GHCR username
   * @param ghcrPassword The GHCR password/token
   * @returns The published image reference
   */
  @func()
  async publishDocs(
    @argument({
      ignore: ["node_modules", "dist", "build", ".cache", "*.log", ".env*", "!.env.example", ".dagger", "generated"],
      defaultPath: ".",
    })
    source: Directory,
    @argument() imageName: string,
    @argument() ghcrUsername: string,
    ghcrPassword: Secret,
  ): Promise<string> {
    logWithTimestamp(`📦 Publishing docs container to ${imageName}`);

    const container = await this.buildDocsContainer(source);

    const publishedRef = await withTiming("publish to GHCR", async () => {
      return container.withRegistryAuth("ghcr.io", ghcrUsername, ghcrPassword).publish(imageName);
    });

    logWithTimestamp(`✅ Docs container published: ${publishedRef}`);
    return publishedRef;
  }
}
