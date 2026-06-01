"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Award, Shield, CheckCircle } from "lucide-react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CarouselSection() {
  const [currentSlide, setCurrentSlide] = React.useState(0)

  const testimonials = [
    {
      name: "Maria Rodriguez",
      company: "Artisan Leather Co. (Spain)",
      role: "Purchasing Director",
      content:
        "Pure Grain has been our trusted leather supplier for 3 years. Their quality is consistently excellent and their international shipping is reliable.",
      rating: 5,
      image: "/placeholder.svg?height=60&width=60",
    },
    {
      name: "James Mitchell",
      company: "Premium Goods Ltd. (UK)",
      role: "CEO",
      content:
        "The custom manufacturing service exceeded our expectations. They perfectly executed our designs and delivered on time.",
      rating: 5,
      image: "/placeholder.svg?height=60&width=60",
    },
    {
      name: "Yuki Tanaka",
      company: "Tokyo Leather Works (Japan)",
      role: "Sourcing Manager",
      content: "Excellent variety of leather types and finishes. The sample service helped us make informed decisions.",
      rating: 5,
      image: "/placeholder.svg?height=60&width=60",
    },
  ]

  const certificates = [
    {
      name: "ISO 9001:2015",
      description: "Quality Management System",
      icon: Award,
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      name: "OEKO-TEX Standard",
      description: "Textile Safety Certification",
      icon: Shield,
      image: "/placeholder.svg?height=100&width=100",
    },
    {
      name: "LWG Certified",
      description: "Leather Working Group",
      icon: CheckCircle,
      image: "/placeholder.svg?height=100&width=100",
    },
  ]

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % testimonials.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [testimonials.length])

  return (
    <section className="py-20 bg-gradient-to-br from-amber-50 via-background to-amber-50/50 dark:from-amber-950/20 dark:via-background dark:to-amber-950/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Trusted & Certified</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our commitment to quality is backed by international certifications and trusted by wholesalers worldwide
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Testimonials Carousel */}
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-center">What Our Partners Say</h3>
            <div className="relative">
              <Card className="border-0 shadow-lg bg-white dark:bg-card">
                <CardContent className="p-8">
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(testimonials[currentSlide].rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <blockquote className="text-lg text-muted-foreground mb-6 leading-relaxed">
                    "{testimonials[currentSlide].content}"
                  </blockquote>
                  <div className="flex items-center space-x-4">
                    <Image
                      src={testimonials[currentSlide].image || "/placeholder.svg"}
                      alt={testimonials[currentSlide].name}
                      width={60}
                      height={60}
                      className="rounded-full"
                    />
                    <div>
                      <p className="font-semibold text-foreground">{testimonials[currentSlide].name}</p>
                      <p className="text-sm text-muted-foreground">{testimonials[currentSlide].role}</p>
                      <p className="text-sm text-amber-600 dark:text-amber-400">{testimonials[currentSlide].company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Arrow Navigation */}
              <Button
                variant="outline"
                size="icon"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-card shadow-lg hover:scale-110 transition-transform"
                onClick={prevSlide}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-card shadow-lg hover:scale-110 transition-transform"
                onClick={nextSlide}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

              {/* Carousel Indicators */}
              <div className="flex justify-center space-x-2 mt-6">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentSlide ? "bg-amber-600 dark:bg-amber-400" : "bg-amber-200 dark:bg-amber-800"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Certificates */}
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold text-center">Our Certifications</h3>
            <div className="grid gap-6">
              {certificates.map((cert, index) => (
                <Card
                  key={cert.name}
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
                        <cert.icon className="w-8 h-8 text-amber-700 dark:text-amber-300" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{cert.name}</h4>
                        <p className="text-sm text-muted-foreground">{cert.description}</p>
                        <Badge
                          variant="secondary"
                          className="mt-2 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
                        >
                          Certified
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
