'use client';

import { ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function StandingIntentConfig() {
  return (
    <Card className="bg-[#1a1a2e] border-gray-700 text-gray-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-100">Session Management</CardTitle>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Kite Passport
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-3 p-3 bg-[#16162a] rounded-lg border border-gray-700">
          <ShieldCheck className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-gray-200">
              Session management is handled by Kite Passport.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Payment authorization and spending limits are managed through the gokite-aa x402 protocol
              with Pieverse facilitator. No manual configuration required.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
