import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Users, Calendar, Trophy, Mail, Phone } from "lucide-react"

interface Team {
  id: number
  team_name: string
  full_name1: string
  phone_num1: string
  email1: string
  full_name2: string
  phone_num2: string
  email2: string
  code: number
  round: number
  round_time: string
  created_at?: string
}

interface TeamCardProps {
  team: Team
}

export function TeamCard({ team }: TeamCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const getRoundStatus = (round: number) => {
    const currentDate = new Date()
    const hour = currentDate.getHours()

    // Simple logic - this would need to be adjusted based on your actual schedule
    if (round === 1 && hour < 12) return "upcoming"
    if (round === 1) return "completed"
    if (round === 2 && hour < 14) return "upcoming"
    return "completed"
  }

  const roundStatus = getRoundStatus(team.round)

  return (
    <Card className="overflow-hidden border-2">
      <div className={`h-2 ${roundStatus === "upcoming" ? "bg-blue-500" : "bg-green-500"}`} />
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold">{team.team_name}</h3>
            <p className="text-sm text-muted-foreground">Team Code: {team.code}</p>
          </div>
          <Badge variant={roundStatus === "upcoming" ? "outline" : "default"}>
            Round {team.round} - {team.round_time}
          </Badge>
        </div>

        <Separator className="my-4" />

        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium flex items-center mb-2">
              <Users className="mr-2 h-4 w-4 text-muted-foreground" />
              Team Members
            </h4>

            <div className="space-y-4">
              {/* First team member */}
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar>
                    <AvatarFallback>{getInitials(team.full_name1)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{team.full_name1}</p>
                    <p className="text-xs text-muted-foreground">Member 1</p>
                  </div>
                </div>
                <div className="space-y-1 pl-12">
                  <div className="flex items-center text-sm">
                    <Mail className="mr-2 h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{team.email1}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Phone className="mr-2 h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{team.phone_num1}</span>
                  </div>
                </div>
              </div>

              {/* Second team member */}
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar>
                    <AvatarFallback>{getInitials(team.full_name2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{team.full_name2}</p>
                    <p className="text-xs text-muted-foreground">Member 2</p>
                  </div>
                </div>
                <div className="space-y-1 pl-12">
                  <div className="flex items-center text-sm">
                    <Mail className="mr-2 h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{team.email2}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Phone className="mr-2 h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{team.phone_num2}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <div className="flex items-center text-sm">
              <Trophy className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>
                Round {team.round} - {team.round_time}
              </span>
            </div>
            <div className="flex items-center text-sm">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Registered on {new Date(team.created_at || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
