import { usePolicy } from "./policy-context";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown, Download } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import React from "react";

export function PolicySelector() {
  const { policy, setPolicy } = usePolicy();
  const [removing, setRemoving] = React.useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    setPolicy(null);
    toast.success("Policy removed");
    setRemoving(false);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="ml-4 flex items-center gap-2">
          {policy?.plan_summary?.plan_name || "No policy uploaded"}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        {policy ? (
          <div className="space-y-2">
            {/* {policy.image_urls?.[0] && (
              <img
                src={policy.image_urls[0]}
                alt="Policy preview"
                className="rounded border mb-2 max-w-full"
              />
            )} */}
           
            <div className="font-semibold text-lg">{policy.plan_summary.plan_name}</div>
            <div className="text-sm text-muted-foreground">
              <div><span className="font-medium">Coverage Period:</span> {policy.plan_summary.coverage_period.start_date} - {policy.plan_summary.coverage_period.end_date}</div>
              <div><span className="font-medium">Plan Type:</span> {policy.plan_summary.plan_type}</div>
              <div><span className="font-medium">Coverage For:</span> {policy.plan_summary.coverage_for}</div>
              <div><span className="font-medium">Issuer:</span> {policy.plan_summary.issuer_name}</div>
              <div><span className="font-medium">Issuer Contact:</span> {policy.plan_summary.issuer_contact_info.phone} / {policy.plan_summary.issuer_contact_info.website}</div>
            </div>
            <Link
              href={policy.file_url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button variant="secondary" className="w-full mb-2 flex items-center gap-2">
                <Download className="w-4 h-4" />
                View PDF Policy
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full flex items-center gap-2 mt-1"
              onClick={handleRemove}
              disabled={removing}
            >
              {removing && (
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              )}
              Remove Policy
            </Button>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No policy loaded. Upload a policy to view details.</div>
        )}
      </PopoverContent>
    </Popover>
  );
}
