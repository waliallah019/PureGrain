"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";
import { EyeIcon, EyeOffIcon } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        router.push("/admin-ahmza")
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 relative">
     {/* Back Button - Top Left */}
<div className="absolute top-4 left-4 z-10">
  <Button
    variant="outline"
    className="text-sm px-3 py-1 h-auto"
    onClick={() => router.push("/")}
  >
    Back
  </Button>
</div>

{/* Theme Toggler - Top Right */}
<div className="absolute top-4 right-4 z-10">
  <ThemeToggle />
</div>


      <Card className="w-full max-w-md border-none shadow-xl dark:bg-[#111] bg-white rounded-2xl">
  <CardHeader className="text-center space-y-2 py-4">
    <div className="flex justify-center">
      <Image src="/logo.png" alt="Pure Grain" width={120} height={50} className="dark:hidden" />
      <Image src="/logo-dark.png" alt="Pure Grain Dark" width={120} height={50} className="hidden dark:block" />
    </div>
    <div>
      <CardTitle className="text-xl font-semibold">Welcome Back</CardTitle>
      <CardDescription className="text-sm">Login to your admin dashboard</CardDescription>
    </div>
  </CardHeader>

  <form onSubmit={handleSubmit}>
    <CardContent className="space-y-3 px-6 pb-4">
      {error && <div className="p-2 text-sm text-white bg-red-500 rounded-md">{error}</div>}

      <div className="space-y-1">
        <Label htmlFor="email" className="text-sm">Username</Label>
        <Input
          id="email"
          type="text"
          placeholder="Enter username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="password" className="text-sm">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pr-10"
          />
          <button
            type="button"
            className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
          </button>
        </div>
      </div>
    </CardContent>

    <CardFooter className="flex flex-col gap-3 px-6 pb-6">
      <Button type="submit" className="w-full bg-amber-900 hover:bg-amber-800 text-white text-sm py-2" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </Button>
    </CardFooter>
  </form>
</Card>

    </div>
  );
}
