const target = process.argv[2];

if (!target) {
  console.error("Usage: node scripts/deploy/deploy.mjs <staging|production|migration-staging|migration-production>");
  process.exit(1);
}

if (target.startsWith("migration-")) {
  console.log(`[migration] target=${target}`);
  console.log("[migration] TODO: 実DB migrationコマンドに差し替えてください。");
  process.exit(0);
}

console.log(`[deploy] target=${target}`);
console.log("[deploy] TODO: 実デプロイ先が未確定のため抽象化レイヤーで停止します。");
console.log("[deploy] 想定: container build -> registry push -> service rollout");
console.log("[deploy] rollback: 直前安定版のリビジョンへ切り戻し可能な状態を維持すること");
