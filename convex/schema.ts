import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
const {...restOfAuthTables } = authTables;
export default defineSchema({
  ...restOfAuthTables,
  // users: defineTable({
  //   // ...users,
  //   name: v.string(),
  //   username: v.string(),
  //   tokenIdentifier: v.string(),
  //   email: v.string(),
  //   // preferences: v.object({
  //   //   voiceType: v.string(),
  //   //   personality: v.string(),
  //   //   notificationsEnabled: v.boolean(),
  //   //   notificationEmails: v.array(v.string()),
  //   // }),
  // }).index("by_token", ["tokenIdentifier"])
  //   .index("by_username", ["username"]),
  badHabits: defineTable({
    userId: v.id('users'), // Reference to the user
    name: v.string(),
    description: v.string(), // Optional description for custom habits
    enabled: v.optional(v.boolean()), // True if the habit is enabled
    notifyEnabled: v.optional(v.boolean()), // True if notifications are enabled
    detectionType: v.string(), // 'nailBiting', 'faceTouching', etc.
    isCustom: v.boolean(), // True if it's a custom habit
    notifyEmails: v.array(v.string())
  }),
  failures: defineTable({
    userId: v.id('users'),
    badHabitId: v.id('badHabits'),
    duration: v.number(),
    feedback: v.string(),
  }),
  settings: defineTable({
    userId: v.id('users'),
    voiceType: v.string(),
    personality: v.string(),
    notificationsEnabled: v.boolean(),
    notificationEmails: v.array(v.string()),
  }),
});
