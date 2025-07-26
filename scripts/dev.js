import { context } from "esbuild";
import minimist from "minimist";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// 解析命令行参数，返回构建配置
function parseBuildOptions(args) {
  const packageName = args.pkg || "reactivity"; // 默认包名
  const formatArg = args.f || "global"; // 默认格式
  const packageJsonPath = path.resolve(
    __dirname,
    `../packages/${packageName}/package.json`
  );
  // const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const packageJson = require(packageJsonPath);
  // 规范化输出格式
  let outputFormat = "iife";
  if (formatArg.startsWith("esm")) outputFormat = "esm";
  else if (formatArg.startsWith("cjs")) outputFormat = "cjs";
  else if (formatArg.startsWith("umd")) outputFormat = "umd";
  // 输出文件路径
  const outputFile = path.resolve(
    __dirname,
    `../packages/${packageName}/dist/${packageName}.${formatArg}.js`
  );
  return {
    packageName,
    formatArg,
    packageJson,
    outputFormat,
    outputFile,
  };
}

// 执行单个包的构建并监听
async function buildAndWatch({
  packageName,
  packageJson,
  outputFormat,
  outputFile,
}) {
  const ctx = await context({
    entryPoints: [
      path.resolve(__dirname, `../packages/${packageName}/src/index.ts`),
    ],
    outfile: outputFile,
    bundle: true,
    sourcemap: true,
    minify: false,
    format: outputFormat,
    globalName: packageJson?.buildOptions?.name,
    platform: outputFormat === "cjs" ? "node" : "browser",
  });
  await ctx.watch();
  console.log(`watching ${packageName} (${outputFormat})...`);
}

// 获取所有 packages 目录下的包名
function getAllPackageNames() {
  return fs.readdirSync(path.resolve(__dirname, "../packages"));
}

// 主入口，解析参数并批量构建
async function main() {
  const args = minimist(process.argv.slice(2));
  const allPackages = getAllPackageNames();
  // 支持命令行指定包名（如 node dev.js reactivity runtime-core）
  const targetPackages = args._.length ? args._ : allPackages;
  // 支持多格式构建
  const formats =
    !args.f || args.f === "all" ? ["global", "esm", "cjs"] : [args.f || "esm"];
  // 遍历所有包和格式，执行构建
  for (const pkgName of targetPackages) {
    for (const format of formats) {
      const buildOptions = parseBuildOptions({ pkg: pkgName, f: format });
      await buildAndWatch(buildOptions);
    }
  }
}

main();
