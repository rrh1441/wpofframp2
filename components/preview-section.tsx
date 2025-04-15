"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, ExternalLink, Loader2 } from "lucide-react"
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Image from "next/image"

export default function PreviewSection() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isPreviewReady, setIsPreviewReady] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const handlePreview = () => {
    if (!url) return

    setIsLoading(true)
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false)
      setIsPreviewReady(true)
    }, 1500)
  }

  const handleMigrate = () => {
    setIsAuthOpen(true)
  }

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    setIsAuthOpen(false)
    setIsProcessing(true)

    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false)
      setIsComplete(true)
    }, 2000)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>WordPress Site Preview</CardTitle>
        <CardDescription>Enter your WordPress site URL to see how it will look after migration</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="flex items-end gap-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="wordpress-url">WordPress URL</Label>
              <Input 
                id="wordpress-url" 
                placeholder="https://your-wordpress-site.com" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <Button onClick={handlePreview} disabled={!url || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading
                </>
              ) : (
                "Preview"
              )}
            </Button>
          </div>

          {isPreviewReady && (
            <div className="space-y-6">
              <Tabs defaultValue="original">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="original">Original WordPress</TabsTrigger>
                  <TabsTrigger value="migrated">Migrated Next.js</TabsTrigger>
                </TabsList>
                <TabsContent value="original" className="space-y-4">
                  <div className="rounded-md border p-4 h-[400px] overflow-auto">
                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold">WordPress Sample Post</h2>
                      <p>This is how your content currently looks on WordPress. Notice the slower loading times and cluttered interface.</p>
                      <Image 
                        src="/placeholder.svg?height=200&width=600" 
                        width={600}
                        height={200}
                        alt="WordPress content sample"
                        className="rounded-md"
                      />
                      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor.</p>
                      <div className="flex gap-2 flex-wrap">
                        <span className="bg-gray-200 px-2 py-1 rounded text-sm">WordPress</span>
                        <span className="bg-gray-200 px-2 py-1 rounded text-sm">Slow</span>
                        <span className="bg-gray-200 px-2 py-1 rounded text-sm">Plugins</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="migrated" className="space-y-4">
                  <div className="rounded-md border p-4 h-[400px] overflow-auto bg-white">
                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold">Next.js Transformed Post</h2>
                      <p>Here's how your content will look after migration. Clean, fast, and modern.</p>
                      <Image 
                        src="/placeholder.svg?height=200&width=600" 
                        width={600}
                        height={200}
                        alt="Next.js content sample"
                        className="rounded-md"
                      />
                      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor.</p>
                      <div className="flex gap-2 flex-wrap">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">Next.js</span>
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">Fast</span>
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm">Modern</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex flex-col gap-4">
                <Button size="lg" onClick={handleMigrate}>
                  Migrate This Page (Free)
                </Button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" disabled>
                    Migrate Entire Site (Coming Soon)
                  </Button>
                  <Button variant="outline" disabled>
                    Custom Migration Options (Coming Soon)
                  </Button>
                </div>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center">
                <h3 className="font-medium">Transforming Your WordPress Content</h3>
                <p className="text-sm text-muted-foreground">This will only take a moment...</p>
              </div>
            </div>
          )}

          {isComplete && (
            <div className="space-y-4">
              <Alert>
                <AlertTitle>Migration Complete!</AlertTitle>
                <AlertDescription>
                  Your WordPress content has been successfully transformed into a Next.js project.
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col gap-4">
                <Button size="lg">
                  <Download className="mr-2 h-4 w-4" /> Download Project ZIP
                </Button>
                <Button variant="outline" size="lg">
                  <ExternalLink className="mr-2 h-4 w-4" /> Deploy to Vercel
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  \
    <Dialog open=
  isAuthOpen
  onOpenChange={(open) => setIsAuthOpen(open)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign Up to Continue</DialogTitle>
          <DialogDescription>
            Create a free account to migrate your WordPress content to Next.js.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="your@email.com" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required />
          </div>
          <DialogFooter>
            <Button type="submit">Create Account & Continue</Button>
          </DialogFooter>
        </form>
      </DialogContent>
  </Dialog>
  )
}
