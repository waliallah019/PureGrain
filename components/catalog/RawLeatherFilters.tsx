// my-leather-platform/components/catalog/RawLeatherFilters.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter as FilterIcon } from "lucide-react"; // Renamed to avoid conflict

// These should match the enums/expected values in your backend RawLeather model and validator
const leatherTypes = ["Full-grain", "Top-grain", "Corrected Grain", "Suede", "Nubuck", "Patent"];
const animals = ["Cow", "Buffalo", "Goat", "Sheep", "Exotic"];
const finishes = ["Aniline", "Semi-Aniline", "Pigmented", "Pull-up", "Crazy Horse", "Waxed", "Nappa", "Embossed"];
// Thickness is more free-form, so a search filter might be better, or define specific ranges.
// For now, let's use some example values as categories.
const thicknessRanges = ["0.6-1.0mm", "1.0-1.5mm", "1.5-2.0mm+"]; // Example custom ranges
const commonColors = ["Black", "Brown", "Tan", "Red", "Blue", "Green", "Grey", "White"];


export default function RawLeatherFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [leatherType, setLeatherType] = useState(searchParams.get("leatherType") || "all");
  const [animal, setAnimal] = useState(searchParams.get("animal") || "all");
  const [finish, setFinish] = useState(searchParams.get("finish") || "all");
  const [color, setColor] = useState(searchParams.get("color") || "all"); // Filter by color

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    // Maintain existing params unless overwritten
    searchParams.forEach((value, key) => {
        if (!['search', 'leatherType', 'animal', 'finish', 'color', 'page'].includes(key)) {
            params.set(key, value);
        }
    });

    if (search.trim()) {
      params.set("search", search.trim());
    }

    if (leatherType !== "all") {
      params.set("leatherType", leatherType);
    }

    if (animal !== "all") {
      params.set("animal", animal);
    }

    if (finish !== "all") {
      params.set("finish", finish);
    }

    if (color !== "all") {
      params.set("color", color);
    }

    // Reset page to 1 on new filters
    params.delete("page");

    router.push(`/catalog/raw-leather?${params.toString()}`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="border-0 shadow-lg p-6 rounded-xl bg-white dark:bg-card">
        <div className="grid md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search leather types..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleApplyFilters(); }}
              />
            </div>
          </div>
          <Select value={leatherType} onValueChange={setLeatherType}>
            <SelectTrigger>
              <SelectValue placeholder="Leather Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {leatherTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={animal} onValueChange={setAnimal}>
            <SelectTrigger>
              <SelectValue placeholder="Animal Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Animals</SelectItem>
              {animals.map(a => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={finish} onValueChange={setFinish}>
            <SelectTrigger>
              <SelectValue placeholder="Finish" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Finishes</SelectItem>
              {finishes.map(f => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={color} onValueChange={setColor}>
            <SelectTrigger>
              <SelectValue placeholder="Color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Colors</SelectItem>
              {commonColors.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleApplyFilters} className="bg-amber-800 hover:bg-amber-900">
            <FilterIcon className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>
    </div>
  );
}