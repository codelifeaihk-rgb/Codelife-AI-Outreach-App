"use client";

// src/components/campaigns/FinderFilters.tsx
// Improved University/School Finder with:
// - Dropdowns with custom option support
// - Live step progress animation
// - Partial results shown even if search ends early
// - CodeLife.ai context injected into AI scoring

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ExternalLink,
  Plus,
  CheckCircle2,
  Circle,
  Loader2,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

// ==================== Dropdown Options ====================
const COUNTRIES = [
  "Malaysia", "Singapore", "Indonesia", "Thailand", "Philippines",
  "Vietnam", "United Kingdom", "Germany", "France", "Netherlands",
  "United States", "Canada", "Australia", "Japan", "South Korea",
  "China", "India", "Saudi Arabia", "UAE", "Egypt",
  "Nigeria", "South Africa", "Brazil", "Mexico", "Other",
];

const UNIVERSITY_DEPARTMENTS = [
  "Biomedical Engineering", "Life Sciences", "Biotechnology",
  "Bioinformatics", "Medicine / Medical School", "Pharmacy / Pharmacology",
  "Molecular Biology", "Computer Science / AI", "Innovation Centre", "Other",
];

const SCHOOL_PROGRAMME_FOCUS = [
  "Biology / Life Sciences", "STEM Programme", "Biotechnology",
  "Science Competition (iGEM)", "Science Olympiad", "Advanced Science Programme", "Other",
];

const UNIVERSITY_RESEARCH_FOCUS = [
  "AI in Healthcare", "Drug Discovery", "Genomics / Gene Editing",
  "Lab Automation", "Bioinformatics", "Cancer Research",
  "Neuroscience", "Synthetic Biology", "Other",
];

const SCHOOL_INNOVATION_FOCUS = [
  "iGEM Competition", "Science Olympiad", "Biotech Club",
  "STEM Innovation", "Digital Science Tools", "Other",
];

const RANKING_TIERS = [
  { label: "Any ranking", value: "" },
  { label: "Top 100 globally", value: "top 100" },
  { label: "Top 500 globally", value: "top 500" },
  { label: "Top 1000 globally", value: "top 1000" },
  { label: "Strong regionally", value: "regional" },
];

// ==================== Step Definitions ====================
const UNIVERSITY_STEPS = [
  { id: 1, label: "Searching universities in selected country" },
  { id: 2, label: "Filtering by department and research focus" },
  { id: 3, label: "Fetching public institution data" },
  { id: 4, label: "Analyzing research strength with AI" },
  { id: 5, label: "Scoring and ranking institutions" },
  { id: 6, label: "Finalizing top recommendations" },
];

const SCHOOL_STEPS = [
  { id: 1, label: "Searching schools in selected country" },
  { id: 2, label: "Filtering by STEM and innovation focus" },
  { id: 3, label: "Fetching public school data" },
  { id: 4, label: "Analyzing innovation strength with AI" },
  { id: 5, label: "Scoring and ranking schools" },
  { id: 6, label: "Finalizing top recommendations" },
];

// ==================== Types ====================
interface Institution {
  name: string;
  country: string;
  websiteUrl: string;
  sourceUrl: string;
  recommendationNote: string;
  institutionKind: string;
  ranking?: number | null;
  biomedicalStrength?: number;
  biotechActivity?: number;
  aiHealthtechFocus?: number;
  stemStrength?: number;
  innovationFocus?: number;
}

interface FinderFiltersProps {
  campaignId: string;
  audienceMode: string;
  defaultCountry: string;
  defaultDepartment: string;
}

// ==================== Smart Select Component ====================
function SmartSelect({
  id,
  label,
  options,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  id: string;
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const isOther = value !== "" && !options.includes(value);
  const [showCustom, setShowCustom] = useState(isOther);

  function handleSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    if (v === "Other") {
      setShowCustom(true);
      onChange("");
    } else {
      setShowCustom(false);
      onChange(v);
    }
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={showCustom ? "Other" : value}
        onChange={handleSelect}
        disabled={disabled}
        className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
      >
        <option value="">{placeholder ?? `Select ${label}`}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      {showCustom && (
        <Input
          placeholder={`Type custom ${label.toLowerCase()}...`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoFocus
        />
      )}
    </div>
  );
}

// ==================== Main Component ====================
export default function FinderFilters({
  campaignId,
  audienceMode,
  defaultCountry,
  defaultDepartment,
}: FinderFiltersProps) {
  const router = useRouter();
  const isUniversity = audienceMode === "university";
  const steps = isUniversity ? UNIVERSITY_STEPS : SCHOOL_STEPS;

  const [country, setCountry] = useState(defaultCountry);
  const [department, setDepartment] = useState(defaultDepartment);
  const [focus, setFocus] = useState("");
  const [rankingTier, setRankingTier] = useState("");
  const [results, setResults] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [partialNote, setPartialNote] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const stepTimers = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    return () => stepTimers.current.forEach(clearTimeout);
  }, []);

  // ==================== Step Animation ====================
  function startStepAnimation() {
    setCurrentStep(1);
    setCompletedSteps([]);
    [0, 1, 2, 3].forEach((i) => {
      const delays = [0, 700, 1600, 2800];
      const t = setTimeout(() => {
        setCompletedSteps((prev) => [...prev, i + 1]);
        setCurrentStep(i + 2);
      }, delays[i] + 700);
      stepTimers.current.push(t);
    });
  }

  function completeStepAnimation() {
    setCompletedSteps((prev) => [...prev, 5]);
    setCurrentStep(6);
    const t = setTimeout(() => {
      setCompletedSteps((prev) => [...prev, 6]);
      setCurrentStep(0);
      setLoading(false);
    }, 400);
    stepTimers.current.push(t);
  }

  // ==================== Search Handler ====================
  async function handleSearch() {
    stepTimers.current.forEach(clearTimeout);
    stepTimers.current = [];

    setLoading(true);
    setError("");
    setPartialNote("");
    setResults([]);

    startStepAnimation();

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/finder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country,
          department,
          focus,
          rankingTier,
          audienceMode,
        }),
      });

      const data = await res.json();

      if (data.institutions && data.institutions.length > 0) {
        setResults(data.institutions);
        if (data.partialNote) setPartialNote(data.partialNote);
        completeStepAnimation();
      } else {
        setError(data.error || "No institutions found. Try broadening your search.");
        setLoading(false);
        setCurrentStep(0);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
      setCurrentStep(0);
    }
  }

  async function handleSave(institution: Institution) {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/finder/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institution }),
      });
      if (res.ok) {
        setSaved((prev) => [...prev, institution.name]);
      }
    } catch {
      console.error("Failed to save institution");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/campaigns");
        router.refresh();
      }
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {isUniversity ? "Search Universities" : "Search Schools"}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-600 hover:bg-red-50"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete Campaign
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
              <p className="text-sm text-red-700 font-medium">
                Delete this campaign? All saved institutions and contacts will be lost.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                  Yes, Delete
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SmartSelect
              id="country"
              label="Country"
              options={COUNTRIES}
              value={country}
              onChange={setCountry}
              disabled={loading}
              placeholder="Select country"
            />

            <SmartSelect
              id="department"
              label={isUniversity ? "Department Focus" : "Programme Focus"}
              options={isUniversity ? UNIVERSITY_DEPARTMENTS : SCHOOL_PROGRAMME_FOCUS}
              value={department}
              onChange={setDepartment}
              disabled={loading}
              placeholder="Select focus area"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SmartSelect
              id="focus"
              label={isUniversity ? "Research Focus (optional)" : "Innovation Focus (optional)"}
              options={isUniversity ? UNIVERSITY_RESEARCH_FOCUS : SCHOOL_INNOVATION_FOCUS}
              value={focus}
              onChange={setFocus}
              disabled={loading}
              placeholder="Select focus"
            />

            {isUniversity && (
              <div className="space-y-1.5">
                <Label htmlFor="ranking">Ranking Preference</Label>
                <select
                  id="ranking"
                  value={rankingTier}
                  onChange={(e) => setRankingTier(e.target.value)}
                  disabled={loading}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {RANKING_TIERS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <Button onClick={handleSearch} disabled={loading || !country} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                {isUniversity ? "Find Universities" : "Find Schools"}
              </>
            )}
          </Button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Progress Steps */}
      {loading && (
        <Card className="border-blue-100 bg-blue-50">
          <CardContent className="py-5">
            <p className="text-sm font-semibold text-blue-800 mb-4">
              {isUniversity
                ? "Finding the best universities for CodeLife.ai outreach..."
                : "Finding the best schools for CodeLife.ai outreach..."}
            </p>
            <div className="space-y-3">
              {steps.map((step) => {
                const isCompleted = completedSteps.includes(step.id);
                const isCurrent = currentStep === step.id;
                return (
                  <div key={step.id} className="flex items-center gap-3">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        isCompleted
                          ? "text-green-700 line-through"
                          : isCurrent
                          ? "text-blue-700 font-medium"
                          : "text-slate-400"
                      }`}
                    >
                      {step.label}
                      {isCurrent && <span className="ml-1 animate-pulse">...</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {!loading && results.length > 0 && (
        <div className="space-y-4">
          {partialNote && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-700">
                <strong>Note:</strong> {partialNote}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600">
              {results.length} {isUniversity ? "universities" : "schools"} found
            </p>
            <Badge variant="outline" className="text-xs text-green-600 border-green-200">
              AI Ranked for CodeLife.ai
            </Badge>
          </div>

          {results.map((inst, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-300">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Name + Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                      <h3 className="font-semibold text-slate-900">{inst.name}</h3>
                      <Badge variant="outline" className="text-xs">{inst.country}</Badge>
                      {inst.ranking && (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
                          Rank #{inst.ranking}
                        </Badge>
                      )}
                    </div>

                    {/* Why Recommended */}
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-slate-500 mb-1.5">
                        Why recommended for CodeLife.ai
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {inst.recommendationNote}
                      </p>
                    </div>

                    {/* Scores */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      {inst.biomedicalStrength && (
                        <span>Biomedical: <strong>{inst.biomedicalStrength}/10</strong></span>
                      )}
                      {inst.biotechActivity && (
                        <span>Biotech: <strong>{inst.biotechActivity}/10</strong></span>
                      )}
                      {inst.aiHealthtechFocus && (
                        <span>AI/Healthtech: <strong>{inst.aiHealthtechFocus}/10</strong></span>
                      )}
                      {inst.stemStrength && (
                        <span>STEM: <strong>{inst.stemStrength}/10</strong></span>
                      )}
                      {inst.innovationFocus && (
                        <span>Innovation: <strong>{inst.innovationFocus}/10</strong></span>
                      )}
                    </div>

                    {/* Source Link */}
                    {inst.sourceUrl && (
                      <a
                        href={inst.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View source
                      </a>
                    )}
                  </div>

                  {/* Save Button */}
                  <Button
                    size="sm"
                    variant={saved.includes(inst.name) ? "outline" : "default"}
                    disabled={saved.includes(inst.name)}
                    onClick={() => handleSave(inst)}
                    className="shrink-0"
                  >
                    {saved.includes(inst.name) ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" /> Saved
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3 mr-1" /> Save
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Next Step CTA */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Ready to discover contacts?</p>
                <p className="text-xs text-green-600 mt-0.5">
                  Save institutions above, then find professors and staff.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-100"
                onClick={() => router.push(`/campaigns/${campaignId}/contacts`)}
              >
                Find Contacts →
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!loading && results.length === 0 && !error && (
        <div className="text-center py-8 text-slate-400 text-sm">
          Select a country and click search to find institutions.
        </div>
      )}
    </div>
  );
}