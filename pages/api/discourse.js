/* eslint max-len:0 */

import fetch from 'isomorphic-fetch'
import NodeCache from 'node-cache'

const cache = new NodeCache({ stdTTL: 900 })

export default async (_, res) => {
  if (cache.get('topics')) {
    console.log(`Using cache for 'topics'`)
    res.status(200).json(cache.get('topics'))

    return
  }

  try {
    const response = await fetch(
      'https://discuss.dvc.org/latest.json?order=created'
    )

    if (response.status !== 200) {
      res.status(502).json({ error: 'Unexpected response from Forum' })

      return
    }

    const data = await response.text()

    const {
      topic_list: { topics: original_topics }
    } = JSON.parse(data)

    const topics = original_topics.slice(0, 3).map(item => ({
      title: item.title,
      comments: item.posts_count - 1,
      date: item.last_posted_at,
      url: `https://discuss.dvc.org/t/${item.slug}/${item.id}`
    }))

    cache.set('topics', { topics })
    console.log(`Not using cache for 'topics'`)

    res.status(200).json({ topics })
  } catch {
    res.status(404)
  }
}
