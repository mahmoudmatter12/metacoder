import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { QrCode, Users, Mail, FileCode, BarChart } from "lucide-react"

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">MetaCoder Organization</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Manage competition registrations, team data, and communications all in one place
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <QrCode className="h-12 w-12 mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Check Teams</h2>
            <p className="text-muted-foreground mb-4">Scan QR codes or enter team codes to verify registrations</p>
            <Link href="/check-team" className="mt-auto">
              <Button className="w-full">Go to Scanner</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <BarChart className="h-12 w-12 mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Attendance Dashboard</h2>
            <p className="text-muted-foreground mb-4">View and export attendance records</p>
            <Link href="/admin/attendance" className="mt-auto">
              <Button className="w-full">View Attendance</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Users className="h-12 w-12 mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Team Management</h2>
            <p className="text-muted-foreground mb-4">View and manage registered teams</p>
            <Button variant="outline" className="w-full mt-auto">
              Manage Teams
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Mail className="h-12 w-12 mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Email Campaigns</h2>
            <p className="text-muted-foreground mb-4">Send emails to participants and teams</p>
            <Button variant="outline" className="w-full mt-auto">
              Email Center
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <FileCode className="h-12 w-12 mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Scripts & Analytics</h2>
            <p className="text-muted-foreground mb-4">Run scripts and view competition analytics</p>
            <Button variant="outline" className="w-full mt-auto">
              Analytics Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
