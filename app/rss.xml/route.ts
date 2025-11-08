import { getAllPosts } from '@/lib/posts'

export async function GET() {
  const posts = getAllPosts()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const rssItems = posts
    .map((post) => {
      const postUrl = `${siteUrl}/blog/${post.slug}`
      const pubDate = post.date
        ? new Date(post.date).toUTCString()
        : new Date().toUTCString()

      return `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${postUrl}</link>
      <guid>${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${post.title}]]></description>
    </item>`
    })
    .join('\n')

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Matt Site Blog</title>
    <link>${siteUrl}</link>
    <description>Personal blog posts and articles</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
${rssItems}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  })
}

