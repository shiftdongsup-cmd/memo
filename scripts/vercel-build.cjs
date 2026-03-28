/**
 * Vercel 빌드 실패 시 로그에 원인을 바로 보이게 합니다.
 */

const { execSync } = require("node:child_process");

const migrateFailHint = `
╔══════════════════════════════════════════════════════════════════════════════╗
║  prisma migrate deploy 실패 (위쪽에 Prisma 오류가 더 있습니다)                  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  • 비밀번호/호스트 오타, SSL (?sslmode=require)                                ║
║  • Neon: 마이그레이션은 "Direct" 연결 문자열이 필요한 경우가 많음               ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;

function run(label, cmd, { onFail } = {}) {
  console.log(`\n── ${label} ──\n`);
  try {
    execSync(cmd, { stdio: "inherit", env: process.env });
  } catch (e) {
    if (onFail) onFail();
    process.exit(typeof e.status === "number" ? e.status : 1);
  }
}

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║  memo-app Vercel build                                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

const dbUrl = process.env.DATABASE_URL?.trim();
if (!dbUrl) {
  console.error(`
╔══════════════════════════════════════════════════════════════════════════════╗
║  BUILD FAILED: DATABASE_URL 이 비어 있습니다                                  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Vercel → Project → Settings → Environment Variables                         ║
║                                                                              ║
║  • DATABASE_URL 추가 (PostgreSQL)                                            ║
║    예: postgresql://USER:PASS@HOST/db?sslmode=require                        ║
║                                                                              ║
║  • 변수가 빌드에도 적용되도록 Production(및 Preview)에 설정 후 Redeploy        ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
  process.exit(1);
}

if (!dbUrl.startsWith("postgres")) {
  console.error(`
╔══════════════════════════════════════════════════════════════════════════════╗
║  BUILD FAILED: DATABASE_URL 이 PostgreSQL 형식이 아닙니다                      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  URL은 postgresql:// 또는 postgres:// 로 시작해야 합니다.                     ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
  process.exit(1);
}

if (!process.env.AUTH_SECRET?.trim()) {
  console.warn(`
┌──────────────────────────────────────────────────────────────────────────────┐
│  WARNING: AUTH_SECRET 없음 → 로그인 시 "server configuration" 오류 가능       │
│  Environment Variables에 AUTH_SECRET 추가 후 재배포하세요.                    │
└──────────────────────────────────────────────────────────────────────────────┘
`);
}

run("prisma generate", "npx prisma generate");
run("prisma migrate deploy", "npx prisma migrate deploy", {
  onFail: () => console.error(migrateFailHint),
});
run("next build", "npx next build");
