import { rmdir, mkdir } from "node:fs/promises";

async function build() {
  const outDir = "./.fullstack";
  
  try {
    await rmdir(outDir, { recursive: true });
  } catch (e) {}
  
  await mkdir(`${outDir}/client`, { recursive: true });
  await mkdir(`${outDir}/server`, { recursive: true });

  console.log("Building client bundle...");
  const clientBuild = await Bun.build({
    entrypoints: ["./src/framework/client.ts"],
    outdir: `${outDir}/client`,
    target: "browser",
    minify: true,
    sourcemap: "external",
    naming: "client.js",
  });

  if (!clientBuild.success) {
    console.error("Client build failed:");
    console.error(clientBuild.logs);
    process.exit(1);
  }

  console.log("Building server bundle...");
  const serverBuild = await Bun.build({
    entrypoints: ["./src/framework/server.ts"],
    outdir: `${outDir}/server`,
    target: "bun",
    naming: "server.js",
  });

  if (!serverBuild.success) {
    console.error("Server build failed:");
    console.error(serverBuild.logs);
    process.exit(1);
  }

  console.log("Build complete! 🚀");
}

build();
