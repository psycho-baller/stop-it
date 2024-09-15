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
import { Overview } from "./Chart";
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <Overview />
                  </CardContent>
                </Card>
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Recent Failures</CardTitle>
                    <CardDescription>
                      A list of your recent failures
                    </CardDescription>
                    {/* on the right corner */}
                    <div className="flex ml-auto">
                      time spent doing it
                    </div>
                  </CardHeader>
                  <CardContent>
                    <RecentSales />
                  </CardContent>
                </Card>
                </div>
      {/* <Chat viewer={viewer._id} /> */}
    </main>
  );
}
