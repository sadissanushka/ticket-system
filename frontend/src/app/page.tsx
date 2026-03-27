import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, MonitorCheck, TicketPlus, Wrench } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-900 to-green-900 text-foreground flex flex-col font-sans">
      {/* Navbar */}
      <header className="px-6 lg:px-12 h-20 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg">
            <MonitorCheck className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl text-foreground tracking-tight">UniTech Assist</span>
        </div>
        <nav className="hidden md:flex gap-8 font-medium text-muted-foreground">
          <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-primary transition-colors">How it Works</Link>
          <Link href="#contact" className="hover:text-primary transition-colors">Contact</Link>
        </nav>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost" className="font-medium text-foreground/80 hover:text-primary">
              Sign In
            </Button>
          </Link>
          <Link href="/login">
            <Button className="font-medium shadow-md">
              Get Support <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center">
        <section className="w-full py-20 lg:py-32 flex flex-col items-center justify-center text-center px-4 md:px-6 bg-gradient-to-b from-background to-muted/30">
          <div className="max-w-4xl space-y-6">
            <div className="inline-block rounded-full bg-blue-100 px-3 py-1 text-md font-semibold text-primary mb-4">
              ✨ University IT Help Desk: Ticket Manager
            </div>
            <h1 className="text-5xl mt-4 md:text-7xl font-extrabold tracking-tight text-foreground drop-shadow-sm">
              Seamless IT Support for <br className="hidden md:block"/> Students & Staff
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl leading-relaxed mt-6">
              Inquire, track, and resolve technical issues in real-time.<br></br>Experience a more efficient and transparent IT help desk.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              <Link href="/login">
                <Button size="lg" className="px-8 h-14 text-lg shadow-lg hover:shadow-xl transition-all">
                  Report an Issue
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="px-8 h-14 text-lg bg-card">
                  See How it Works
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features / Workflow overview */}
        <section id="how-it-works" className="w-full py-20 bg-card-90 border-y bg-gradient-to-b from-background to-muted/60">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">A Simple, Transparent Workflow</h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">From logging the issue to resolution, our system ensures everyone stays informed every step of the way.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center p-6 space-y-4 rounded-2xl bg-muted/40 border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <TicketPlus className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">1. Submit a Ticket</h3>
                <p className="text-muted-foreground">Easily describe your issue, attach screenshots, and categorize the problem in seconds.</p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center p-6 space-y-4 rounded-2xl bg-muted/40 border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                  <MonitorCheck className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold">2. Support Team Assigned</h3>
                <p className="text-muted-foreground">
                  Admins review your ticket and assign it to the right technician using our smart&nbsp;
                  {/*Link added to a definition of "Kanban board" because many might not be familiar with that term"*/}
                  <Link href="https://en.wikipedia.org/wiki/Kanban%20board" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 font-medium cursor-pointer no-underline">
                    Kanban board
                  </Link>
                  .
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center p-6 space-y-4 rounded-2xl bg-muted/40 border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                  <Wrench className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold">3. Technician Resolves</h3>
                <p className="text-muted-foreground">Technicians work on the issue, updating progress along the way until it is fully resolved.</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="py-8 bg-slate-900 text-slate-400 dark:bg-slate-950 text-center text-sm">
        <p>© {new Date().getFullYear()} UniTech Assist. All rights reserved.</p>
      </footer>
    </div>
  );
}
