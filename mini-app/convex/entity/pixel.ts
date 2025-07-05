import { mutation, query } from '../_generated/server'
import { v } from 'convex/values'
import { getAuthenticatedUser } from '../login'

const PIXEL_COOLDOWN = 5 * 1000 // 5 seconds

export const placePixel = mutation({
  args: {
    x: v.number(),
    y: v.number(),
    color: v.string(),
    sessionId: v.string()
  },
  handler: async (ctx, { x, y, color, sessionId }) => {
    const user = await getAuthenticatedUser(ctx, sessionId)

    if (!user) {
      throw new Error('You must be logged in to place a pixel.')
    }

    if (user.lastPlaced && Date.now() - user.lastPlaced < PIXEL_COOLDOWN) {
      throw new Error('You must wait 5 seconds between placing pixels.')
    }

    if (
      user.verification_level !== 'orb' &&
      user.verification_level !== 'device'
    ) {
      throw new Error('You must be verified to place a pixel.')
    }

    const existingPixel = await ctx.db
      .query('pixels')
      .withIndex('by_pos', q => q.eq('x', x).eq('y', y))
      .unique()

    if (existingPixel) {
      await ctx.db.patch(existingPixel._id, { color, userId: user._id })
    } else {
      await ctx.db.insert('pixels', {
        x,
        y,
        color,
        userId: user._id
      })
    }

    await ctx.db.patch(user._id, { lastPlaced: Date.now() })
  }
})

export const list = query({
  handler: async ctx => {
    const pixels = await ctx.db.query('pixels').collect()
    const userIds = [...new Set(pixels.map(p => p.userId))]
    const users = await Promise.all(userIds.map(userId => ctx.db.get(userId)))
    const userMap = new Map()
    users.forEach(user => {
      if (user) {
        userMap.set(user._id, user)
      }
    })

    return pixels.map(pixel => {
      const user = userMap.get(pixel.userId)
      return {
        ...pixel,
        user: user
          ? {
              username: user.username,
              profile_picture_url: user.profile_picture_url
            }
          : null
      }
    })
  }
})
