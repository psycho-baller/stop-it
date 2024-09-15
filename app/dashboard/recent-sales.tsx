"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.substring(0, maxLength)}...`;
};

export function RecentSales() {

  const failures = useQuery(api.failures.getFailures, {});
  const badHabits = useQuery(api.badHabits.getBadHabits);

  if (!failures || !badHabits) {
    return <div>Loading...</div>;
  }

  // Create a map of bad habits for quick lookup
  const badHabitMap = new Map(badHabits.map((habit) => [habit._id, habit]));

  return (
    <div className="space-y-8 w-full">
      {failures?.map((failure) => {
        const badHabit = badHabitMap.get(failure.badHabitId);
        return (
      <div key={failure._id} className="flex items-center w-full">
        {/* <Avatar className="h-9 w-9">
          <AvatarImage src="/avatars/01.png" alt="Avatar" />
          <AvatarFallback>OM</AvatarFallback>
        </Avatar> */}
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">{badHabit?.name}</p>
          <p className="text-sm text-muted-foreground">
            {truncateText(failure.feedback, 50)}
          </p>
        </div>
        <div className="ml-auto font-medium">{failure.duration} seconds</div>
      </div>
)})}
    </div>
  )
}