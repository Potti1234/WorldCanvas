import { v } from "convex/values";
import { query, internalMutation, internalQuery, mutation } from "./_generated/server";
import { ConvexError } from 'convex/values'
import { internal } from './_generated/api'

// Write your Convex functions in any file inside this directory (`convex`).
// See https://docs.convex.dev/functions for more.

// You can read data from the database via a query:
export async function getAuthenticatedUser(ctx: { db: any }, sessionId: string) {
  const session = await ctx.db
    .query('sessions')
    .withIndex('by_sessionId', (q: any) => q.eq('sessionId', sessionId))
    .unique()

  if (!session) {
    return null
  }

  if (session.expiration < Date.now()) {
    return null
  }

  const user = await ctx.db.get(session.userId)
  if (!user) {
    return null
  }
  return user
}

export const getCurrentUser = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await getAuthenticatedUser(ctx, args.sessionId)
  }
})

export const storeNonce = internalMutation({
  args: { nonce: v.string(), expiration: v.number() },
  handler: async (ctx, { nonce, expiration }) => {
    await ctx.db.insert('siweNonces', { nonce, expiration })
  },
})

export const getNonce = internalQuery({
  args: { nonce: v.string() },
  handler: async (ctx, { nonce }) => {
    const nonceDoc = await ctx.db
      .query('siweNonces')
      .withIndex('nonce', (q) => q.eq('nonce', nonce))
      .unique()
    return nonceDoc
  },
})

export const deleteNonce = internalMutation({
  args: { id: v.id('siweNonces') },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id)
  },
})

export const getOrCreateUser = internalMutation({
  args: {
    address: v.string(),
    chain: v.union(v.literal('World'), v.literal('Ronin'))
  },
  handler: async (ctx, { address, chain }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_walletAddress', q => q.eq('walletAddress', address))
      .unique()

    if (user) {
      if (!user.chain) {
        await ctx.db.patch(user._id, { chain: chain })
      }
      return await ctx.db.get(user._id)
    }

    const newUserId = await ctx.db.insert('users', {
      walletAddress: address,
      verification_level: 'none',
      chain: chain
    })

    return await ctx.db.get(newUserId)
  }
})

export const createSession = internalMutation({
  args: {
    userId: v.id('users'),
    sessionId: v.string(),
    expiration: v.number(),
  },
  handler: async (ctx, { userId, sessionId, expiration }) => {
    await ctx.db.insert('sessions', {
      userId,
      sessionId,
      expiration,
    })
  },
})

export const getSession = internalQuery({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', sessionId))
      .unique()
    return session
  },
})

export const getUser = internalQuery({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId)
    return user
  },
})

export const updateUserProfile = mutation({
  args: {
    sessionId: v.string(),
    username: v.optional(v.string()),
    profile_picture_url: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx, args.sessionId)
    if (!user) {
      throw new ConvexError('User not authenticated for updateUserProfile.')
    }

    const dataToUpdate: {
      username?: string
      profile_picture_url?: string
    } = {}

    if (args.username !== undefined) {
      dataToUpdate.username = args.username
    }

    if (args.profile_picture_url !== undefined) {
      dataToUpdate.profile_picture_url = args.profile_picture_url
    }

    if (Object.keys(dataToUpdate).length > 0) {
      await ctx.db.patch(user._id, dataToUpdate)
    }
  }
})

export const updateUserVerificationLevelToDevice = mutation({
  args: {
    sessionId: v.string()
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx, args.sessionId)
    if (!user) {
      throw new ConvexError(
        'User not authenticated for updating verification level.'
      )
    }

    await ctx.db.patch(user._id, {
      verification_level: 'device'
    })
  }
})

export const clearExpiredSessions = internalMutation({
  handler: async (ctx) => {
    const now = Date.now()
    const expiredSessions = await ctx.db
      .query('sessions')
      .withIndex('by_expiration', (q) => q.lt('expiration', now))
      .collect()

    for (const session of expiredSessions) {
      await ctx.db.delete(session._id)
    }
  }
})

export const signInRonin = mutation({
  args: { address: v.string() },
  handler: async (ctx, { address }) => {
    const user = await ctx.runMutation(internal.login.getOrCreateUser, {
      address,
      chain: 'Ronin'
    })

    if (!user) {
      throw new ConvexError('Could not get or create user for Ronin login')
    }

    const sessionId = crypto.randomUUID()
    await ctx.runMutation(internal.login.createSession, {
      userId: user._id,
      sessionId: sessionId,
      expiration: Date.now() + 24 * 60 * 60 * 1000 // 1 day
    })

    return { sessionId }
  }
})
