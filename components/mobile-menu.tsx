"use client"

import * as React from "react"
import { Menu, Package, Upload, FileText, Globe, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import Link from "next/link"

export function MobileMenu() {
  const [open, setOpen] = React.useState(false)

  const menuItems = [
    {
      icon: Package,
      title: "Leather Hides",
      href: "/catalog/raw-leather",
    },
    {
      icon: Upload,
      title: "Custom Manufacturing",
      href: "/custom-manufacturing",
    },
    {
      icon: FileText,
      title: "How It Works",
      href: "/#process",
    },
    {
      icon: Globe,
      title: "About Us",
      href: "/about",
    },
    {
      icon: Phone,
      title: "Contact",
      href: "/contact",
    },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-foreground/80 hover:text-foreground"
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col justify-between py-8 px-6 bg-background border-border">
        <div className="flex flex-col space-y-8">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold text-foreground text-left">Menu</SheetTitle>
          </SheetHeader>

          <nav className="space-y-2">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-all duration-200 group"
              >
                <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-accent-foreground" />
                <span className="font-medium text-lg text-foreground group-hover:text-accent-foreground">
                  {item.title}
                </span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col space-y-3 pt-6 border-t border-border">
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setOpen(false)}
            asChild
          >
            <Link href="/request-sample/pay">Get Samples</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
