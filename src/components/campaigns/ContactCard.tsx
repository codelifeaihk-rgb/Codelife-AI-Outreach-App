// src/components/campaigns/ContactCard.tsx
// Displays a single contact result from Contact Discovery.
// Shows name, role, fit score, explanation, source URL, and save button.

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Plus, CheckCircle2, User } from "lucide-react";

interface Contact {
  fullName: string;
  email: string | null;
  role: string;
  department?: string;
  institutionName?: string;
  fitScore: number;
  fitExplanation?: string;
  isDecisionMaker: boolean;
  sourceUrl?: string;
  sourceType?: string;
}

interface ContactCardProps {
  contact: Contact;
  isSaved: boolean;
  onSave: (contact: Contact) => void;
}

export default function ContactCard({
  contact,
  isSaved,
  onSave,
}: ContactCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">

            {/* Name + decision maker badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <h3 className="font-semibold text-slate-900">
                {contact.fullName}
              </h3>
              {contact.isDecisionMaker && (
                <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                  Decision Maker
                </Badge>
              )}
            </div>

            {/* Role + department + institution */}
            <p className="text-sm text-slate-500">
              <span className="font-medium">{contact.role}</span>
              {contact.department && (
                <span className="text-slate-400"> · {contact.department}</span>
              )}
              {contact.institutionName && (
                <span> · {contact.institutionName}</span>
              )}
            </p>

            {/* Email */}
            {contact.email && (
              <p className="text-sm text-blue-600 font-mono">
                {contact.email}
              </p>
            )}

            {/* Fit score bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${
                    contact.fitScore >= 80
                      ? "bg-green-500"
                      : contact.fitScore >= 60
                      ? "bg-blue-500"
                      : "bg-amber-400"
                  }`}
                  style={{ width: `${Math.min(contact.fitScore, 100)}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 shrink-0">
                {contact.fitScore}/100
              </span>
            </div>

            {/* Why this fit */}
            {contact.fitExplanation && (
              <div className="bg-slate-50 rounded-lg p-2.5">
                <p className="text-xs text-slate-500 font-medium mb-1">
                  Why this fit?
                </p>
                <p className="text-xs text-slate-600">
                  {contact.fitExplanation}
                </p>
              </div>
            )}

            {/* Source URL */}
            {contact.sourceUrl && (
              
                <a href={contact.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-500 hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                {contact.sourceType ?? "Source"}
              </a>
            )}
          </div>

          {/* Save button */}
          <Button
            size="sm"
            variant={isSaved ? "outline" : "default"}
            disabled={isSaved}
            onClick={() => onSave(contact)}
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