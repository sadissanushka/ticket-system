"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  MonitorCheck, 
  TicketPlus, 
  Wrench, 
  LayoutDashboard, 
  Paperclip, 
  ShieldCheck, 
  Clock,
  Mail,
  MapPin,
  Phone
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const sections = ["hero", "features", "how-it-works", "contact"];
    const observers = sections.map((sectionId) => {
      const element = document.getElementById(sectionId);
      if (!element) return null;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(sectionId);
          }
        },
        { threshold: 0.5 } // Trigger when 50% visible
      );

      observer.observe(element);
      return observer;
    });

    return () => {
      observers.forEach((observer) => observer?.disconnect());
    };
  }, []);

  const navLinks = [
    { name: "Features", href: "#features", id: "features" },
    { name: "How it Works", href: "#how-it-works", id: "how-it-works" },
    { name: "Contact", href: "#contact", id: "contact" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300">
      {/* Navbar */}
      <header className="px-6 lg:px-12 h-20 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Link href="#hero" className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <MonitorCheck className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground tracking-tight">UniTech Assist</span>
          </Link>
        </div>
        <nav className="hidden md:flex gap-8 font-medium">
          {navLinks.map((link) => (
            <Link 
              key={link.href}
              href={link.href} 
              className={cn(
                "relative py-1 transition-colors hover:text-primary",
                activeSection === link.id ? "text-primary" : "text-muted-foreground"
              )}
            >
              {link.name}
              {activeSection === link.id && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary animate-in fade-in slide-in-from-left-2 duration-300" />
              )}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="hidden sm:flex gap-4">
            <Link href="/login">
              <Button variant="ghost" className="font-medium text-foreground/80 hover:text-primary">
                Sign In
              </Button>
            </Link>
            <Link href="/login">
              <Button className="font-medium shadow-md group">
                Get Support <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center">
        <section id="hero" className="w-full py-20 lg:py-32 flex flex-col items-center justify-center text-center px-4 md:px-6 bg-gradient-to-b from-background to-muted/30 scroll-mt-20">
          <div className="max-w-4xl space-y-6">
            <div className="inline-block rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-sm font-semibold text-primary mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
              ✨ University IT Help Desk: Ticket Manager
            </div>
            <h1 className="text-5xl mt-4 md:text-7xl font-extrabold tracking-tight text-foreground drop-shadow-sm leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-700">
              Seamless IT Support for <br className="hidden md:block"/> Students & Staff
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl leading-relaxed mt-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Inquire, track, and resolve technical issues in real-time.<br></br>Experience a more efficient and transparent IT help desk.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
              <Link href="/login">
                <Button size="lg" className="px-8 h-14 text-lg shadow-lg hover:shadow-xl transition-all">
                  Report an Issue
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="px-8 h-14 text-lg bg-card/50 backdrop-blur-sm hover:bg-muted/50">
                  See How it Works
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-24 bg-background scroll-mt-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16 max-w-3xl mx-auto space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Powerful Features for Modern IT</h2>
              <p className="text-muted-foreground text-lg">Built with cutting-edge technology to streamline university technical support and communication.</p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="group p-8 rounded-2xl bg-card border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6 ring-4 ring-primary/5">
                  <LayoutDashboard className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Real-time Dashboard</h3>
                <p className="text-muted-foreground leading-relaxed">Stay updated with live ticket tracking, status changes, and technician comments in real-time.</p>
              </div>

              {/* Feature 2 */}
              <div className="group p-8 rounded-2xl bg-card border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="h-12 w-12 rounded-xl bg-blue-100/10 dark:bg-blue-900/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 ring-4 ring-blue-100/5">
                  <Paperclip className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">File Attachments</h3>
                <p className="text-muted-foreground leading-relaxed">Upload screenshots and logs directly to your tickets to help technicians diagnose issues faster.</p>
              </div>

              {/* Feature 3 */}
              <div className="group p-8 rounded-2xl bg-card border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="h-12 w-12 rounded-xl bg-purple-100/10 dark:bg-purple-900/10 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6 ring-4 ring-purple-100/5">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Role-based Access</h3>
                <p className="text-muted-foreground leading-relaxed">Secure access control for Students, Technicians, and Admins to ensure data privacy and workflow integrity.</p>
              </div>

              {/* Feature 4 */}
              <div className="group p-8 rounded-2xl bg-card border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="h-12 w-12 rounded-xl bg-orange-100/10 dark:bg-orange-900/10 flex items-center justify-center text-orange-500 dark:text-orange-400 mb-6 ring-4 ring-orange-100/5">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Efficiency Tracking</h3>
                <p className="text-muted-foreground leading-relaxed">Monitor ticket resolution times and service level trends to continuously improve IT support quality.</p>
              </div>

              {/* Feature 5 */}
              <div className="group p-8 rounded-2xl bg-card border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="h-12 w-12 rounded-xl bg-green-100/10 dark:bg-green-900/10 flex items-center justify-center text-green-600 dark:text-green-400 mb-6 ring-4 ring-green-100/5">
                  <TicketPlus className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Smart Categorization</h3>
                <p className="text-muted-foreground leading-relaxed">Automatically route tickets to the right technical department based on user-defined priority and category.</p>
              </div>

              {/* Feature 6 */}
              <div className="group p-8 rounded-2xl bg-card border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="h-12 w-12 rounded-xl bg-red-100/10 dark:bg-red-900/10 flex items-center justify-center text-red-600 dark:text-red-400 mb-6 ring-4 ring-red-100/5">
                  <MonitorCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Admin Panel</h3>
                <p className="text-muted-foreground leading-relaxed">A central command center for admins to manage users, monitor analytics, and oversee the entire IT ecosystem.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="w-full py-24 bg-card border-y bg-gradient-to-b from-card to-background scroll-mt-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">A Simple, Transparent Workflow</h2>
              <p className="text-muted-foreground text-lg">Our system ensures everyone stays informed every step of the way, from submission to resolution.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto relative">
              {/* Connector lines (Desktop) */}
              <div className="hidden md:block absolute top-[90px] left-[25%] right-[25%] h-px bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
              
              {/* Step 1 */}
              <div className="group flex flex-col items-center text-center space-y-4 relative z-10">
                <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center mb-4 ring-8 ring-primary/10 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                  <TicketPlus className="h-9 w-9 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold">1. Submit a Ticket</h3>
                <p className="text-muted-foreground">Easily describe your issue, attach screenshots, and categorize the problem in seconds.</p>
              </div>

              {/* Step 2 */}
              <div className="group flex flex-col items-center text-center space-y-4 relative z-10">
                <div className="h-20 w-20 rounded-full bg-purple-600 flex items-center justify-center mb-4 ring-8 ring-purple-600/10 shadow-lg shadow-purple-600/20 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-9 w-9 text-white" />
                </div>
                <h3 className="text-xl font-bold">2. Support Team Assigned</h3>
                <p className="text-muted-foreground">
                  Admins review your ticket and assign it to the right technician using our smart&nbsp;
                  <Link href="https://en.wikipedia.org/wiki/Kanban%20board" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium decoration-primary/30 underline-offset-4">
                    Kanban board
                  </Link>
                  .
                </p>
              </div>

              {/* Step 3 */}
              <div className="group flex flex-col items-center text-center space-y-4 relative z-10">
                <div className="h-20 w-20 rounded-full bg-orange-500 flex items-center justify-center mb-4 ring-8 ring-orange-500/10 shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                  <Wrench className="h-9 w-9 text-white" />
                </div>
                <h3 className="text-xl font-bold">3. Technician Resolves</h3>
                <p className="text-muted-foreground">Technicians work on the issue, updating progress along the way until it is fully resolved.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="w-full py-24 bg-background scroll-mt-20">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Need Immediate Assistance?</h2>
                  <p className="text-muted-foreground text-lg">Our IT Support team is ready to help you with any technical hurdles during university hours.</p>
                </div>
                
                <div className="grid gap-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-primary border border-border">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Email Us</p>
                      <p className="text-lg font-semibold">support@univ-it.edu</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-primary border border-border">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Call Help Desk</p>
                      <p className="text-lg font-semibold">+94 (70) 234-5678</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-primary border border-border">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Visit IT Center</p>
                      <p className="text-lg font-semibold">Main Library, Room 402</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/40 border border-border rounded-3xl p-8 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Support Hours</h3>
                  <p className="text-muted-foreground">We are available during standard university business hours.</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="font-medium">Monday - Friday</span>
                    <span className="text-primary font-bold">8:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="font-medium">Saturday</span>
                    <span className="text-primary font-bold">9:00 AM - 1:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium">Sunday</span>
                    <span className="text-muted-foreground">Closed</span>
                  </div>
                </div>
                
                <Link href="/login" className="block">
                  <Button className="w-full h-12 rounded-xl shadow-lg hover:shadow-primary/20 transition-all font-bold">
                    Go to Support Portal
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 bg-card border-t border-border text-center">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 opacity-80 mb-2">
              <div className="bg-primary p-1.5 rounded-md">
                <MonitorCheck className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-foreground tracking-tight">UniTech Assist</span>
            </div>
            <nav className="flex gap-6 mb-6">
              <Link href="#features" className="text-sm text-muted-foreground hover:text-primary">Features</Link>
              <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-primary">How it Works</Link>
              <Link href="#contact" className="text-sm text-muted-foreground hover:text-primary">Contact</Link>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-primary">Login</Link>
            </nav>
            <p className="text-muted-foreground text-sm opacity-60">
              © {new Date().getFullYear()} UniTech Assist. Empowering university IT support.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
