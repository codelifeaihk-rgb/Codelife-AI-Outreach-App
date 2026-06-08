"use client";

// src/components/campaigns/ContactDiscovery.tsx
// Client component — contact discovery form and results.
// Calls /api/campaigns/[id]/contacts to find public contacts.

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ExternalLink,
  Plus,
  Loader2,
  User,
} from "lucide-react";

interface Institution {
  id: string;
  name: string;
  country: string;
  websiteUrl: string;
}

interface Contact {
  fullName: string;
  email: string | null;
  role: string;
  department: string;
  institutionName: string;
  fitScore: number;
  fitExplanation: string;
  isDecisionMaker: boolean;
  sourceUrl: string;
  sourceType: string;
}

interface ContactDiscoveryProps {
  campaignId: string;
  audienceMode: string;
  institutions: Institution[];
}

export default function ContactDiscovery({
  campaignId,
  audienceMode,
  institutions,
}: ContactDiscoveryProps) {
  const isUniversity = audienceMode === "university";
  const [selectedInstitution, setSelectedInstitution] = useState(
    institutions[0]?.id ?? ""
  );
  const [results, setResults] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<string[]>([]);

  async function handleDiscover() {
    setLoading(true);
    setError("");
    setResults([]);

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institutionId: selectedInstitution,
          audienceMode,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Discovery failed. Please try again.");
        return;
      }

      const data = await res.json();
      setResults(data.contacts ?? []);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(contact: Contact) {
    try {
      const res = await fetch(
        `/api/campaigns/${campaignId}/contacts/save`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contact, institutionId: selectedInstitution }),
        }
      );

      if (res.ok) {
        setSaved((prev) => [...prev, contact.fullName]);
      }
    } catch {
      console.error("Failed to save contact");
    }
  }

  return (
    <div className="space-y-6">
      {/* Discovery form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isUniversity
              ? "Find Professors & Staff"
              : "Find School Leaders & Coordinators"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Institution selector */}
          <div className="space-y-1.5">
            <Label htmlFor="institution">Select Institution</Label>
            <select
              id="institution"
              value={selectedInstitution}
              onChange={(e) => setSelectedInstitution(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name} — {inst.country}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleDiscover}
            disabled={loading || !selectedInstitution}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Discovering contacts...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                {isUniversity
                  ? "Find Professors & Decision Makers"
                  : "Find School Leaders & Coordinators"}
              </>
            )}
          </Button>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-600">
            {results.length} contacts found
          </p>
          {results.map((contact, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
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

                    {/* Role + institution */}
                    <p className="text-sm text-slate-500">
                      <span className="font-medium">{contact.role}</span>
                      {contact.department && (
                        <span className="text-slate-400">
                          {" "}· {contact.department}
                        </span>
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
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(contact.fitScore, 100)}%`,
                          }}
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
                    variant={
                      saved.includes(contact.fullName) ? "outline" : "default"
                    }
                    disabled={saved.includes(contact.fullName)}
                    onClick={() => handleSave(contact)}
                    className="shrink-0"
                  >
                    {saved.includes(contact.fullName) ? (
                      "Saved"
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
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && results.length === 0 && (
        <div className="text-center py-8 text-slate-400 text-sm">
          Select an institution and click discover to find contacts.
        </div>
      )}
    </div>
  );
}