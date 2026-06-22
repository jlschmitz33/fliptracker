import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    await getDb().execute({ sql: 'DELETE FROM expenses WHERE id = ?', args: [parseInt(paramId)] });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
