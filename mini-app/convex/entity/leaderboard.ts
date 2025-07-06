import { query } from '../_generated/server'
import { Id } from '../_generated/dataModel'

export const getLeaderboard = query({
  handler: async ctx => {
    const pixels = await ctx.db.query('pixels').collect()
    const users = await ctx.db.query('users').collect()

    const userMap = new Map(users.map(user => [user._id, user]))
    const pixelCounts = new Map<Id<'users'>, number>()

    for (const pixel of pixels) {
      pixelCounts.set(pixel.userId, (pixelCounts.get(pixel.userId) || 0) + 1)
    }

    const leaderboard = Array.from(pixelCounts.entries()).map(
      ([userId, count]) => {
        const user = userMap.get(userId)
        return {
          username: user?.username ?? user?.walletAddress ?? 'Anonymous',
          pixelCount: count,
          userId: userId
        }
      }
    )

    leaderboard.sort((a, b) => b.pixelCount - a.pixelCount)

    return leaderboard
  }
}) 