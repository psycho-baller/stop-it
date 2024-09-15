import { Chat } from "@/app/dashboard/Chat/Chat";
import { ChatIntro } from "@/app/dashboard/Chat/ChatIntro";
import { UserMenu } from "@/components/UserMenu";
import { api } from "@/convex/_generated/api";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import BadHabitSelector from "./BadHabitSelector";
import Camera from "./Camera";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { RecentSales } from "./recent-sales";
export default async function ProductPage() {
  const viewer = await fetchQuery(
    api.users.viewer,
    {},
    { token: convexAuthNextjsToken() },
  );
  return (
    <main className="flex grow flex-col overflow-hidden">
      <div className="flex items-start justify-between border-b p-4">
        {/* <ChatIntro /> */}
        <BadHabitSelector />
        <UserMenu>{viewer.name}</UserMenu>
      </div>
        <Camera />
        <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Recent Failures</CardTitle>
                    <CardDescription>
                      You repeated the same bad habit 26 times in the last 7 days.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RecentSales />
                  </CardContent>
                </Card>
      {/* <Chat viewer={viewer._id} /> */}
    </main>
  );
}
