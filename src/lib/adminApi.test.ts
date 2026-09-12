import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { listAllProjects, listPendingProjects, rejectProject } from './adminApi';

const ADMIN_ADDRESS = 'G' + 'A'.repeat(55);
const FIXED_NOW = 1_700_000_000_000;

const mockSignMessage = vi.fn();
const mockFetch = vi.fn();

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('adminApi request signing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    mockSignMessage.mockReset().mockResolvedValue('sig-abc');
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('signs GET requests as method:path:timestamp and sends the three admin headers', async () => {
    mockFetch.mockResolvedValue(jsonResponse([]));

    await listPendingProjects(ADMIN_ADDRESS, mockSignMessage);

    expect(mockSignMessage).toHaveBeenCalledWith(`GET:/projects/pending:${FIXED_NOW}`);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('http://localhost:3000/projects/pending');
    expect(init.method).toBe('GET');
    expect(init.headers).toMatchObject({
      'x-admin-address': ADMIN_ADDRESS,
      'x-admin-signature': 'sig-abc',
      'x-admin-timestamp': String(FIXED_NOW),
    });
    expect(init.body).toBeUndefined();
  });

  it('builds the same payload shape for a different path', async () => {
    mockFetch.mockResolvedValue(jsonResponse([]));

    await listAllProjects(ADMIN_ADDRESS, mockSignMessage);

    expect(mockSignMessage).toHaveBeenCalledWith(`GET:/projects/all:${FIXED_NOW}`);
    expect(mockFetch.mock.calls[0][0]).toBe('http://localhost:3000/projects/all');
  });

  it('signs POST requests with the target path and sends the body as JSON', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ id: 'p1' }));

    await rejectProject(ADMIN_ADDRESS, mockSignMessage, 'p1', 'boundary overlaps another plot');

    expect(mockSignMessage).toHaveBeenCalledWith(`POST:/projects/p1/reject:${FIXED_NOW}`);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('http://localhost:3000/projects/p1/reject');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      'content-type': 'application/json',
      'x-admin-address': ADMIN_ADDRESS,
      'x-admin-signature': 'sig-abc',
      'x-admin-timestamp': String(FIXED_NOW),
    });
    expect(JSON.parse(init.body)).toEqual({ reviewNote: 'boundary overlaps another plot' });
  });

  it('throws when the backend rejects the signature', async () => {
    mockFetch.mockResolvedValue(jsonResponse(null, 401));

    await expect(listPendingProjects(ADMIN_ADDRESS, mockSignMessage)).rejects.toThrow('401');
  });
});
