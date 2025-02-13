"use client"

import * as React from "react"
import {
  CaretSortIcon,
  CheckIcon,
  PlusCircledIcon,
} from "@radix-ui/react-icons"

import { cn } from "@/lib/utils"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api" // Adjust the import path as needed
import { selectedTeamAtom } from "@/lib/atoms"
import { useAtom } from "jotai/react"
type Team = {
  label: string;
  value: string;
}

type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>

interface TeamSwitcherProps extends PopoverTriggerProps {}

export default function TeamSwitcher({ className }: TeamSwitcherProps) {
  const [open, setOpen] = React.useState(false)
  const [showNewTeamDialog, setShowNewTeamDialog] = React.useState(false)
  const [selectedTeam, setSelectedTeam] = useAtom(selectedTeamAtom)
  const badHabits = useQuery(api.badHabits.getBadHabits)
  const addBadHabit = useMutation(api.badHabits.add)

  React.useEffect(() => {
    if (badHabits && badHabits.length > 0) {
      setSelectedTeam({
        label: badHabits[0].name,
        value: badHabits[0]._id,
      })
    }
  }, [badHabits])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const formData = new FormData(event.target as HTMLFormElement)
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const detectionType = formData.get("detectionType") as string
    const isCustom = formData.get("isCustom") === "on"
    const notifyEnabled = formData.get("notifyEnabled") === "on"
    const notifyEmails = (formData.get("notifyEmails") as string).split(",")

    await addBadHabit({
      name,
      description,
      detectionType,
      isCustom,
      notifyEnabled,
      notifyEmails,
    })

    setShowNewTeamDialog(false)
  }

  if (!badHabits) {
    return <div>Loading...</div>
  }

  return (
    <Dialog open={showNewTeamDialog} onOpenChange={setShowNewTeamDialog}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select a team"
            className={cn("w-[200px] justify-between", className)}
          >
            <Avatar className="mr-2 h-5 w-5">
              <AvatarImage
                src={`https://avatar.vercel.sh/${selectedTeam?.value}.png`}
                alt={selectedTeam?.label}
                className="grayscale"
              />
              <AvatarFallback>SC</AvatarFallback>
            </Avatar>
            {selectedTeam?.label}
            <CaretSortIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search team..." />
            <CommandList>
              <CommandEmpty>No team found.</CommandEmpty>
              {badHabits.map((badHabit) => (
                // <CommandGroup key={group._id} heading={group.name}>
                  // {group.map((team: Team) => (
                    <CommandItem
                      key={badHabit._id}
                      onSelect={() => {
                        setSelectedTeam({
                          label: badHabit.name,
                          value: badHabit._id,
                        })
                        setOpen(false)
                      }}
                      className="text-sm"
                    >
                      <Avatar className="mr-2 h-5 w-5">
                        <AvatarImage
                          src={`https://avatar.vercel.sh/${badHabit.name}.png`}
                          alt={badHabit.name}
                          className="grayscale"
                        />
                        <AvatarFallback>SC</AvatarFallback>
                      </Avatar>
                      {badHabit.name}
                      <CheckIcon
                        className={cn(
                          "ml-auto h-4 w-4",
                          selectedTeam?.value === badHabit._id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                //   ))}
                // </CommandGroup>
              ))}
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <DialogTrigger asChild>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false)
                      setShowNewTeamDialog(true)
                    }}
                  >
                    <PlusCircledIcon className="mr-2 h-5 w-5" />
                    Create Team
                  </CommandItem>
                </DialogTrigger>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create team</DialogTitle>
          <DialogDescription>
            Add a new team to manage products and customers.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2 pb-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team name</Label>
              <Input id="name" name="name" placeholder="Acme Inc." required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" placeholder="Description" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="detectionType">Detection Type</Label>
              <Input id="detectionType" name="detectionType" placeholder="Detection Type" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="isCustom">Is Custom</Label>
              <Input id="isCustom" name="isCustom" type="checkbox" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notifyEnabled">Notify Enabled</Label>
              <Input id="notifyEnabled" name="notifyEnabled" type="checkbox" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notifyEmails">Notify Emails</Label>
              <Input id="notifyEmails" name="notifyEmails" placeholder="email1@example.com,email2@example.com" required />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTeamDialog(false)}>
              Cancel
            </Button>
            <Button type="submit">Continue</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}