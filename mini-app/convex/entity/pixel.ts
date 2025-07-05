import { mutation, query } from '../_generated/server'
import { v } from 'convex/values'
import { getAuthenticatedUser } from '../login'

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
  }
})

export const list = query({
  handler: async ctx => {
    return await ctx.db.query('pixels').collect()
  }
})
