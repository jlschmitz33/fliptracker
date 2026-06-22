import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await getDb().execute({ sql: 'DELETE FROM expenses WHERE id = ?', args: [parseInt(params.id)] });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
