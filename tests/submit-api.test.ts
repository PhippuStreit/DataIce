import { describe, expect, it } from 'vitest';
import { POST } from '@/app/api/submit/route';

describe('submit API', () => {
  it('rejects incomplete required form data', async () => {
    const response = await POST(
      new Request('http://localhost:3000/api/submit', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'session-123',
          correlationId: 'corr-123',
          data: {},
        }),
      }),
    );

    expect(response.status).toBe(400);
  });
});
