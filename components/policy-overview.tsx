"use client";
import { ChevronDown, ChevronUp } from "lucide-react";
import React, { useState } from "react";
import FileUpload from "./file-upload";
import { usePolicy } from "./policy-context";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

export const PolicyOverview: React.FC = () => {
  const { policy } = usePolicy();
  console.log("policy", policy);
  const [isOpen, setIsOpen] = useState(false);

  if (!policy) {
    return <FileUpload />;
  }
  const { plan_summary, services_you_may_need, excluded_and_other_covered_services } = policy;
  const {
    coverage_period,
    coverage_for,
    plan_type,
    issuer_name,
  } = plan_summary;


  return (
    <>
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <section className="w-full">
          <div className="text-sm flex flex-col md:flex-row gap-2 w-full bg-gray-50 rounded-lg p-3 border items-center justify-between">
            <div className="flex-1 min-w-[100px]">
              <div className="text-xs uppercase mb-1">Coverage Period</div>
              <div>
                {coverage_period.end_date === '<UNKNOWN>' 
                  ? coverage_period.start_date 
                  : `${coverage_period.start_date} - ${coverage_period.end_date}`
                }
              </div>
            </div>
            <div className="flex-1 min-w-[100px]">
              <div className="text-xs uppercase mb-1">Coverage For</div>
              <div>{coverage_for.replaceAll('_', ' ')}</div>
            </div>
            <div className="flex-1 min-w-[100px]">
              <div className="text-xs uppercase mb-1">Issuer</div>
              <div>{issuer_name} ({plan_type})</div>
            </div>
            <div className="flex items-center">
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </div>
        </section>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="rounded border p-6 bg-white shadow-sm mx-auto space-y-8">
          {/* Cost of Common Services */}
          <section>
            <h3 className="text-xl font-semibold mb-2">What You&apos;ll Pay for Common Services</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-2 py-1 text-left">Service</th>
                    <th className="border px-2 py-1 text-left">In-Network</th>
                    <th className="border px-2 py-1 text-left">Out-of-Network</th>
                    <th className="border px-2 py-1 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {services_you_may_need.map((service) => (
                    <tr key={service.name}>
                      <td className="border px-2 py-1 capitalize">{service.name.replaceAll('_', ' ')}</td>
                      <td className="border px-2 py-1">{service.what_you_will_pay.network_provider}</td>
                      <td className="border px-2 py-1">{service.what_you_will_pay.out_of_network_provider}</td>
                      <td className="border px-2 py-1">{service.what_you_will_pay.limitations_exceptions_and_other_important_information}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Excluded & Other Covered Services */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Services This Plan Doesn&apos;t Cover</h3>
              <ul className="list-disc list-inside text-red-700">
                {excluded_and_other_covered_services.excluded_services.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Other Covered Services</h3>
              <ul className="list-disc list-inside text-green-700">
                {excluded_and_other_covered_services.other_covered_services.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </CollapsibleContent>
    </Collapsible>
      
    
    
    </>
  );
};
