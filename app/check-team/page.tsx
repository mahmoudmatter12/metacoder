"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { QrScanner } from "@/components/qr-scanner"
import { TeamCard } from "@/components/team-card"
import { ManualCodeEntry } from "@/components/manual-code-entry"
import { ArrowLeft, QrCode, Keyboard, AlertCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "sonner"
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
export default function CheckTeamPage() {
  const [scannedCode, setScannedCode] = useState<string | null>(null)
  const [teamData, setTeamData] = useState<Team | null>(null)
  const [, setIsScanning] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("scan")

  const supabase = createClientComponentClient()

  const handleScan = async (data: string | null) => {
    if (data) {
      setScannedCode(data)
      setIsScanning(false)
      await fetchTeamData(data)
    }
  }

  const handleManualEntry = async (code: string) => {
    setScannedCode(code)
    setIsScanning(false)
    await fetchTeamData(code)
  }

  const fetchTeamData = async (code: string) => {
    setIsLoading(true)
    setError(null)
    setTeamData(null) // Clear previous team data

    try {
      // Try to parse the code as a number
      const teamCode = Number.parseInt(code, 10)

      if (isNaN(teamCode)) {
        setError("Invalid code format. Please enter a valid team code.")
        setTeamData(null)
        setIsLoading(false)
        return
      }

      // Query the database for the team
      const { data: team, error: teamError } = await supabase.from("teams").select("*").eq("code", teamCode).single()

      if (teamError) {
        console.error("Error fetching team:", teamError)

        if (teamError.code === "PGRST116") {
          // This is the "not found" error from Supabase
          setError("No team found with this code")
        } else {
          setError("Error fetching team data. Please try again.")
        }

        setTeamData(null)
      } else if (!team) {
        setError("No team found with this code")
        setTeamData(null)
      } else {
        setTeamData(team)

        // Record attendance
        const { error: attendanceError } = await supabase.from("attendance").insert([
          {
            team_code: teamCode,
            location: "Check-in Station",
            notes: `Checked in via ${activeTab === "scan" ? "QR scan" : "manual entry"}`,
          },
        ])

        if (attendanceError) {
          console.error("Error recording attendance:", attendanceError)
          toast("Error recording attendance. Please try again.")
        } else {
          toast("Attendance recorded successfully!")
        }
      }
    } catch (err) {
      console.error("Error:", err)
      setError("An unexpected error occurred. Please try again.")
      setTeamData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const resetScanner = () => {
    setScannedCode(null)
    setTeamData(null)
    setError(null)
    setIsScanning(true)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // Reset error state when switching tabs
    setError(null)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" className="pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Team Verification</h1>
        <p className="text-muted-foreground mt-2">Scan a QR code or enter a team code to verify registration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Team Lookup</CardTitle>
            <CardDescription>Scan a QR code or manually enter a team code</CardDescription>
          </CardHeader>
          <CardContent>
            {!scannedCode ? (
              <Tabs defaultValue="scan" value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="scan" className="flex items-center">
                    <QrCode className="mr-2 h-4 w-4" />
                    Scan QR
                  </TabsTrigger>
                  <TabsTrigger value="manual" className="flex items-center">
                    <Keyboard className="mr-2 h-4 w-4" />
                    Manual Entry
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="scan">
                  <div className="w-full max-w-md mx-auto">
                    <QrScanner
                      onScan={handleScan}
                      onError={(err) => {
                        console.error("Scanner error:", err)
                        // Don't set error state for camera permission issues
                        if (!err.message.includes("Permission") && !err.message.includes("camera")) {
                          setError("Scanner error: " + err.message)
                        }
                      }}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="manual">
                  <div className="w-full max-w-md mx-auto">
                    <ManualCodeEntry onSubmit={handleManualEntry} isLoading={isLoading} />
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center">
                <p className="mb-4">
                  Team Code: <span className="font-mono font-bold">{scannedCode}</span>
                </p>
                <Button onClick={resetScanner}>Check Another Team</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
            <CardDescription>
              {teamData ? "Team found in the database" : "Lookup a team to see information"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : teamData ? (
              <TeamCard team={teamData} />
            ) : error ? (
              <Alert variant="destructive" className="my-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                <p>No team data to display yet</p>
                <p className="text-sm mt-2">Scan a QR code or enter a team code to view information</p>
              </div>
            )}
          </CardContent>
          {teamData && (
            <CardFooter className="flex justify-end">
              <Button variant="outline" onClick={resetScanner}>
                Check Another Team
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}
