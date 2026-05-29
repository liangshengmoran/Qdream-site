import { NextRequest, NextResponse } from 'next/server'

import { initDb, incrementVisitCount } from '@/lib/db'
import { responseMessage } from '@/lib/utils'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDb()
    const { id } = await params
    incrementVisitCount(id)
    return NextResponse.json(responseMessage({ id }))
  } catch (err) {
    return NextResponse.json(responseMessage(null, (err as Error).message, -1))
  }
}
