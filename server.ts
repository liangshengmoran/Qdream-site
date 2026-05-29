import { config } from 'dotenv'
import { resolve } from 'path'

// 加载 .env（生产环境下 next start 默认不会自动加载）
config({ path: resolve(process.cwd(), '.env') })
config({ path: resolve(process.cwd(), '.env.local') })
// .env.production 会覆盖上面
config({ path: resolve(process.cwd(), '.env.production') })

const PORT = parseInt(process.env.PORT || '5173')

const { startServer } = await import('next/dist/server/lib/start-server.js')
await startServer({
  dir: process.cwd(),
  port: PORT,
  hostname: '0.0.0.0',
})
