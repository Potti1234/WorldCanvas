import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "../convex/_generated/dataModel";

export const list = query({
  handler: async (ctx) => {
    const messages = await ctx.db.query("messages").order("desc").take(100);
    
    const messagesWithUsers = await Promise.all(
      (await messages).map(async (message: Doc<"messages">) => {
        const user = await ctx.db.get(message.userId);
        return {
          ...message,
          user: user,
        };
      })
    );
    return messagesWithUsers.reverse();
  },
});

export const send = mutation({
  args: { text: v.string(), sessionId: v.string() },
  handler: async (ctx, { text, sessionId }) => {
    if (!sessionId) {
      throw new Error("Not logged in");
    }

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .unique();

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.expiration < Date.now()) {
      throw new Error("Session expired");
    }

    const user = await ctx.db.get(session.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    if (text.trim().length === 0) {
        throw new Error("Message text cannot be empty.");
    }

    await ctx.db.insert("messages", {
      userId: user._id,
      text: text,
    });
  },
}); 