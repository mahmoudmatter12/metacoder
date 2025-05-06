"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface ManualCodeEntryProps {
  onSubmit: (code: string) => void
  isLoading: boolean
}

export function ManualCodeEntry({ onSubmit, isLoading }: ManualCodeEntryProps) {
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!code.trim()) {
      setError("Please enter a team code")
      return
    }

    // Check if the code is numeric
    if (!/^\d+$/.test(code.trim())) {
      setError("Team code must be numeric")
      return
    }

    setError(null)
    onSubmit(code.trim())
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-code">Team Code</Label>
            <Input
              id="team-code"
              type="text"
              placeholder="Enter 4-digit team code (e.g., 1001)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="text-center text-lg font-mono"
              autoFocus
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              "Find Team"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
