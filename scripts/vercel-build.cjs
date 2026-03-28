/**
 * Vercel 빌드 실패 시 로그에 원인을 바로 보이게 합니다.
 */

const { execSync } = require("node:child_process");

function applyDatabaseUrlAliases() {
  if (process.env.DATABASE_URL?.trim()) return;
  const fromProvider =
    process.env.POSTGRES_PRISMA_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.PRISMA_DATABASE_URL?.trim();
  if (fromProvider) {
    process.env.DATABASE_URL = fromProvider;
  }
}

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

applyDatabaseUrlAliases();
const dbUrl = process.env.DATABASE_URL?.trim();

if (!dbUrl) {
  console.error(`
╔══════════════════════════════════════════════════════════════════════════════╗
║  BUILD FAILED: PostgreSQL 연결 문자열이 없습니다                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Vercel → 이 프로젝트 → Settings → Environment Variables                     ║
║                                                                              ║
║  아래 중 하나를 추가하세요 (이름 그대로):                                      ║
║    • DATABASE_URL = postgresql://USER:PASS@HOST/db?sslmode=require          ║
║    또는 Vercel Storage → Postgres 연동 시 자동으로 생기는:                    ║
║    • POSTGRES_PRISMA_URL  또는  POSTGRES_URL                                 ║
║                                                                              ║
║  체크리스트:                                                                  ║
║    1) Environment: Production (및 Preview 쓰면 Preview도) 선택               ║
║    2) 저장 후 반드시 Redeploy (새 빌드에서만 변수가 주입됨)                    ║
║                                                                              ║
║  Neon 무료 DB: https://neon.tech → 연결 문자열 복사 → DATABASE_URL에 붙여넣기 ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
  process.exit(1);
}

if (!dbUrl.startsWith("postgres")) {
  console.error(`
╔══════════════════════════════════════════════════════════════════════════════╗
║  BUILD FAILED: DB URL이 PostgreSQL 형식이 아닙니다                            ║
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
