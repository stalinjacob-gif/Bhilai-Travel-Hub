<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>Bhilai Travel Hub — Sitemap</title>
        <style>
          :root { color-scheme: light; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #173b39; background: #f5f8f6; }
          body { max-width: 760px; margin: 8vh auto; padding: 0 24px; }
          main { background: white; border: 1px solid #dfe8e4; border-radius: 18px; padding: 32px; box-shadow: 0 12px 40px #173b3912; }
          h1 { margin: 0 0 8px; font-size: clamp(1.7rem, 5vw, 2.4rem); }
          p { color: #5b706c; line-height: 1.6; }
          ul { list-style: none; padding: 0; margin: 24px 0 0; }
          li { border-top: 1px solid #e8efec; padding: 16px 0; }
          a { color: #087c68; font-weight: 650; overflow-wrap: anywhere; }
          small { display: block; color: #71817d; margin-top: 6px; }
        </style>
      </head>
      <body>
        <main>
          <h1>Bhilai Travel Hub sitemap</h1>
          <p>This sitemap lists the public pages search engines can crawl.</p>
          <ul>
            <xsl:for-each select="sitemap:urlset/sitemap:url">
              <li>
                <a>
                  <xsl:attribute name="href"><xsl:value-of select="sitemap:loc"/></xsl:attribute>
                  <xsl:value-of select="sitemap:loc"/>
                </a>
                <small>
                  <xsl:if test="sitemap:lastmod">Updated <xsl:value-of select="sitemap:lastmod"/></xsl:if>
                </small>
              </li>
            </xsl:for-each>
          </ul>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
