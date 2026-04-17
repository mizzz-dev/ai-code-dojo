const env = process.argv[2];
if (!env) {
  console.error("Usage: node scripts/deploy/deploy.mjs <staging|production>");
  process.exit(1);
}

console.log(`[deploy] target=${env}`);
console.log("[deploy] TODO: 実デプロイ先が未確定のため抽象化レイヤーで停止します。");
console.log("[deploy] 想定: container build -> registry push -> service rollout");
