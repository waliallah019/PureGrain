import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CarouselSection } from "@/components/carousel-section"
import { ArrowRight, CheckCircle, Package, Award, Upload, FileText, Truck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
export default function PureGrainLanding() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Hero Section */}
      <section className="min-h-screen flex items-center bg-gradient-to-br from-amber-50 via-background to-amber-50/50 dark:from-amber-950/20 dark:via-background dark:to-amber-950/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-slide-up">
              <div className="space-y-4">
                <p className="text-puregrain-brown font-semibold text-sm tracking-wide uppercase relative inline-block pb-1 after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-puregrain-gold after:transition-all after:duration-300 dark:text-puregrain-light-gold dark:after:bg-puregrain-brown">
                  International B2B Wholesale
                </p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                  Where Grain Meets
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-700 to-amber-900 dark:from-amber-400 dark:to-amber-600 animate-gradient">
                    {" "}
                    Greatness
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  A premium leather wholesale platform. Source premium leather hides and finished leather
                  products directly from trusted manufacturers. Serving international wholesalers and boutique retailers
                  worldwide.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="text-lg px-8 py-6 bg-amber-800 hover:bg-amber-900 dark:bg-amber-700 dark:hover:bg-amber-800 hover:scale-105 transition-all animate-fade-in-delay-1"
                  asChild
                >
                  <Link href="/request-sample/pay">
                    Sample Request
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6 border-amber-800 text-amber-800 hover:bg-amber-50 dark:border-amber-400 dark:text-amber-400 dark:hover:bg-amber-950/20 hover:scale-105 transition-all animate-fade-in-delay-2 bg-transparent"
                  asChild
                >
                  <Link href="/request-sample/pay">Sample Request</Link>
                </Button>
              </div>

              <div className="flex items-center space-x-6 text-sm text-muted-foreground animate-fade-in-delay-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>International shipping</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Quality guaranteed</span>
                </div>
              </div>
            </div>

            <div className="relative animate-slide-up-delay">
              <div className="relative z-10">
                <Image
                  src="/raw-leather.png"
                  alt="Premium Leather Products"
                  width={800}
                  height={600}
                  className="rounded-2xl shadow-2xl w-full h-auto max-w-full hover:scale-105 transition-transform duration-500"
                  priority
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 to-amber-800/20 rounded-2xl blur-3xl transform scale-105 animate-pulse-subtle"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Categories */}
      <section id="catalog" className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Our Product Categories</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From premium leather hides to expertly crafted finished products, we serve all your wholesale
              needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-50 to-background dark:from-amber-950/10 dark:to-background hover:scale-105 animate-fade-in-stagger-1">
              <CardHeader>
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center mb-4 hover:rotate-12 transition-transform">
                  <Package className="w-6 h-6 text-amber-700 dark:text-amber-300" />
                </div>
                <CardTitle>Leather Hides</CardTitle>
                <CardDescription>
                  Premium full-grain cowhide, suede, buffalo leather, and goat leather in various finishes and
                  thicknesses.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li>• Full-grain & Top-grain leather</li>
                  <li>• Multiple animal types</li>
                  <li>• Various finishes available</li>
                  <li>• Custom thickness options</li>
                </ul>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/catalog/raw-leather">View Raw Materials</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-50 to-background dark:from-amber-950/10 dark:to-background hover:scale-105 animate-fade-in-stagger-2">
              <CardHeader>
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center mb-4 hover:rotate-12 transition-transform">
                  <Award className="w-6 h-6 text-amber-700 dark:text-amber-300" />
                </div>
                <CardTitle>Finished Leather Products</CardTitle>
                <CardDescription>
                  Expertly crafted wallets, belts, purses, and custom leather goods ready for retail distribution.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li>• Wallets & Accessories</li>
                  <li>• Belts & Straps</li>
                  <li>• Bags & Purses</li>
                  <li>• Custom designs welcome</li>
                </ul>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/catalog/finished-products">View Products</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-50 to-background dark:from-amber-950/10 dark:to-background hover:scale-105 animate-fade-in-stagger-3">
              <CardHeader>
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center mb-4 hover:rotate-12 transition-transform">
                  <Upload className="w-6 h-6 text-amber-700 dark:text-amber-300" />
                </div>
                <CardTitle>Custom Manufacturing</CardTitle>
                <CardDescription>
                  Upload your designs and specifications for custom leather products tailored to your brand
                  requirements.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li>• Design upload service</li>
                  <li>• Brand customization</li>
                  <li>• Flexible MOQ options</li>
                  <li>• Quality assurance</li>
                </ul>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/custom-manufacturing">Start Custom Order</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="process" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">How It Works</h2>
            <p className="text-xl text-muted-foreground">Simple, streamlined process for B2B wholesale orders</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center space-y-4 animate-fade-in-stagger-1 hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mx-auto hover:rotate-12 transition-transform">
                <FileText className="w-8 h-8 text-amber-700 dark:text-amber-300" />
              </div>
              <h3 className="text-xl font-semibold">1. Browse & Quote</h3>
              <p className="text-muted-foreground">
                Explore our catalog and request detailed quotes for your desired products.
              </p>
            </div>

            <div className="text-center space-y-4 animate-fade-in-stagger-2 hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mx-auto hover:rotate-12 transition-transform">
                <Package className="w-8 h-8 text-amber-700 dark:text-amber-300" />
              </div>
              <h3 className="text-xl font-semibold">2. Request Sample</h3>
              <p className="text-muted-foreground">
                Order samples to verify quality and specifications before bulk purchase.
              </p>
            </div>

            <div className="text-center space-y-4 animate-fade-in-stagger-3 hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mx-auto hover:rotate-12 transition-transform">
                <CheckCircle className="w-8 h-8 text-amber-700 dark:text-amber-300" />
              </div>
              <h3 className="text-xl font-semibold">3. Place Order</h3>
              <p className="text-muted-foreground">
                Confirm your order with our team and receive detailed production timeline.
              </p>
            </div>

            <div className="text-center space-y-4 animate-fade-in-stagger-4 hover:scale-105 transition-transform">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center mx-auto hover:rotate-12 transition-transform">
                <Truck className="w-8 h-8 text-amber-700 dark:text-amber-300" />
              </div>
              <h3 className="text-xl font-semibold">4. Global Shipping</h3>
              <p className="text-muted-foreground">
                Secure international shipping with tracking and insurance coverage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Carousel Section - Testimonials & Certificates */}
      <CarouselSection />

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-[#835127] to-[#40280f] dark:from-[#40280f] dark:to-black">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Ready to Source Premium Leather?</h2>
            <p className="text-xl text-amber-100">
              Join hundreds of international wholesalers who trust Pure Grain for their leather sourcing needs. Request
              a quote today and experience where grain meets greatness.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-6 bg-white text-amber-900 hover:bg-amber-50 hover:scale-105 transition-all"
                asChild
              >
                <Link href="/quote-request">
                  Request Quote
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 bg-transparent border-white text-white hover:bg-white hover:text-amber-900 hover:scale-105 transition-all"
                asChild
              >
                <Link href="/catalog">Browse Catalog</Link>
              </Button>
            </div>
            <p className="text-sm text-amber-100">
              International shipping available • Custom designs welcome • Quality guaranteed
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
