function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }
    if (request.method !== 'GET') {
      return json({ error: 'Method not allowed' }, 405);
    }

    if (url.pathname === '/api/config') {
      return json({
        phone: env.BUSINESS_PHONE || '+91 7999981204',
        whatsapp: env.WHATSAPP_NUMBER || '917999981204',
        email: env.BUSINESS_EMAIL || '',
        cancellation: {
          freeHrs: 6,
          midHrs: 2,
          midPct: Number.parseInt(env.CANCEL_MID_PCT || '20', 10),
          lowPct: 80
        }
      });
    }

    if (url.pathname === '/api/vehicles') {
      const filters = [];
      const values = [];
      const category = url.searchParams.get('category');
      if (category) {
        filters.push('category = ?');
        values.push(category);
      }
      if (url.searchParams.get('selfDrive') === '1') {
        filters.push('self_drive = 1');
      }
      const where = filters.length ? ` WHERE ${filters.join(' AND ')}` : '';
      const { results } = await env.DB.prepare(
        `SELECT * FROM vehicles${where} ORDER BY id`
      ).bind(...values).all();
      return json(results);
    }

    if (url.pathname === '/api/routes') {
      const { results } = await env.DB.prepare(
        'SELECT * FROM routes ORDER BY id'
      ).all();
      return json(results);
    }

    return json({ error: 'Not found' }, 404);
  }
};
