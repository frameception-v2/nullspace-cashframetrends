import { NextResponse } from 'next/server';

// Mock data - replace with actual data fetching logic
const mockTags = {
  daily: ['$ETH', '$BTC', '$SOL', '$MATIC', '$OP'],
  weekly: ['$ETH', '$BTC', '$SOL', '$MATIC', '$OP'],
  monthly: ['$ETH', '$BTC', '$SOL', '$MATIC', '$OP']
};

export async function GET() {
  // TODO: Implement actual data fetching from Farcaster API
  // For now, return mock data
  return NextResponse.json(mockTags);
}
