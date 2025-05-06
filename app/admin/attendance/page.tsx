"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Download, Search, Filter } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface AttendanceRecord {
  id: number
  team_code: number
  check_in_time: string
  location: string
  notes: string
  created_by: string
  teams: {
    team_name: string
    round: number
    round_time: string
  }
}

export default function AttendancePage() {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [filteredData, setFilteredData] = useState<AttendanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roundFilter, setRoundFilter] = useState<string>("all")

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchAttendanceData()
  }, [])

  useEffect(() => {
    filterData()
  }, [searchTerm, roundFilter, attendanceData])

  const fetchAttendanceData = async () => {
    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          *,
          teams:team_code (
            team_name,
            round,
            round_time
          )
        `)
        .order("check_in_time", { ascending: false })

      if (error) {
        console.error("Error fetching attendance data:", error)
      } else {
        setAttendanceData(data || [])
        setFilteredData(data || [])
      }
    } catch (err) {
      console.error("Unexpected error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const filterData = () => {
    let filtered = [...attendanceData]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (record) => record.teams?.team_name.toLowerCase().includes(term) || record.team_code.toString().includes(term),
      )
    }

    // Apply round filter
    if (roundFilter !== "all") {
      const round = Number.parseInt(roundFilter, 10)
      filtered = filtered.filter((record) => record.teams?.round === round)
    }

    setFilteredData(filtered)
  }

  const exportToExcel = () => {
    // Format data for CSV
    const csvData = filteredData.map((record) => ({
      "Team Code": record.team_code,
      "Team Name": record.teams?.team_name || "Unknown",
      Round: record.teams?.round || "N/A",
      "Round Time": record.teams?.round_time || "N/A",
      "Check-in Time": new Date(record.check_in_time).toLocaleString(),
      Location: record.location || "N/A",
      Notes: record.notes || "",
    }))

    // Convert to CSV
    const headers = Object.keys(csvData[0] || {}).join(",")
    const rows = csvData.map((row) =>
      Object.values(row)
        .map((value) => (typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : value))
        .join(","),
    )
    const csv = [headers, ...rows].join("\n")

    // Create download link
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `attendance_export_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Attendance Records</h1>
        <p className="text-muted-foreground mt-2">View and export team attendance data</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Attendance Dashboard</CardTitle>
          <CardDescription>{filteredData.length} records found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by team name or code..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={roundFilter} onValueChange={setRoundFilter}>
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by round" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rounds</SelectItem>
                  <SelectItem value="1">Round 1</SelectItem>
                  <SelectItem value="2">Round 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={exportToExcel} className="md:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Export to Excel
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredData.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Round</TableHead>
                    <TableHead>Check-in Time</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.teams?.team_name || "Unknown"}</TableCell>
                      <TableCell>{record.team_code}</TableCell>
                      <TableCell>
                        Round {record.teams?.round} - {record.teams?.round_time}
                      </TableCell>
                      <TableCell>{new Date(record.check_in_time).toLocaleString()}</TableCell>
                      <TableCell>{record.location || "N/A"}</TableCell>
                      <TableCell>{record.notes || ""}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              <p>No attendance records found</p>
              <p className="text-sm mt-2">Try adjusting your search or filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
