// src/components/campaigns/InstitutionCard.tsx
// Displays a single institution result from the University/School Finder.
// Shows name, country, scores, recommendation note, and save button.

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Plus, CheckCircle2 } from "lucide-react";

interface Institution {
  name: string;
  country: string;
  websiteUrl?: string;
  sourceUrl?: string;
  institutionKind: string;
  recommendationNote?: string;
  ranking?: number | null;
  biomedicalStrength?: number;
  biotechActivity?: number;
  aiHealthtechFocus?: number;
  stemStrength?: number;
  innovationFocus?: number;
  competitionReady?: number;
}

interface InstitutionCardProps {
  institution: Institution;
  index: number;
  isSaved: boolean;
  onSave: (institution: Institution) => void;
}

export default function InstitutionCard({
  institution,
  index,
  isSaved,
  onSave,
}: InstitutionCardProps) {
  const isUniversity = institution.institutionKind === "university";

  const scores = [
    { label: "Biomedical", value: institution.biomedicalStrength, color: "bg-blue-400" },
    { label: "Biotech", value: institution.biotechActivity, color: "bg-green-400" },
    { label: "AI/Healthtech", value: institution.aiHealthtechFocus, color: "bg-purple-400" },
    { label: "STEM", value: institution.stemStrength, color: "bg-orange-400" },
    { label: "Innovation", value: institution.innovationFocus, color: "bg-pink-400" },
    { label: "Competition", value: institution.competitionReady, color: "bg-amber-400" },
  ].filter((s) => s.value !== undefined && s.value !== null);

  return (
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-200">
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">

            {/* Rank + name + badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400">
                #{index + 1}
              </span>
              <h3 className="font-semibold text-slate-900">{institution.name}</h3>
              <Badge variant="outline" className="text-xs">
                {institution.country}
              </Badge>
              {institution.ranking && (
                <Badge
                  variant="outline"
                  className="text-xs text-amber-600 border-amber-200"
                >
                  Rank #{institution.ranking}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={
                  isUniversity
                    ? "text-xs text-blue-600 border-blue-200"
                    : "text-xs text-green-600 border-green-200"
                }
              >
                {isUniversity ? "University" : "School"}
              </Badge>
            </div>

            {/* Why recommended */}
            {institution.recommendationNote && (
              <div className="bg-slate-50 rounded-lg p-2.5">
                <p className="text-xs text-slate-500 font-medium mb-1">
                  Why recommended for CodeLife.ai
                </p>
                <p className="text-sm text-slate-700">
                  {institution.recommendationNote}
                </p>
              </div>
            )}

            {/* Scores */}
            {scores.length > 0 && (
              <div className="flex gap-3 flex-wrap">
                {scores.map((score) => (
                  <div key={score.label} className="flex items-center gap-1">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${score.color}`}
                    />
                    <span className="text-xs text-slate-400">
                      {score.label} {score.value}/10
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Source URL */}
            {institution.sourceUrl && (
              
                <a href={institution.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-500 hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                View source
              </a>
            )}
          </div>

          {/* Save button */}
          <Button
            size="sm"
            variant={isSaved ? "outline" : "default"}
            disabled={isSaved}
            onClick={() => onSave(institution)}
            className="shrink-0"
          >
            {isSaved ? (
              <>
                <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                Saved
              </>
            ) : (
              <>
                <Plus className="w-3 h-3 mr-1" />
                Save
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}