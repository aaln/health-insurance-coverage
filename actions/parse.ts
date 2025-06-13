"use server";
import type { ParsedPolicy, ServiceYouMayNeed } from "@/components/policy-context";
import { generateObjectWithAIRetry } from "@/lib/ai-retry";
import { processFileWithUnstructured } from "@/lib/unstructured";
import { anthropic } from "@ai-sdk/anthropic";
import { tasks } from "@trigger.dev/sdk/v3";
import { put } from '@vercel/blob';
import { z } from "zod";

const CommonMedicalEventSericeTypes = {
    PrimaryCareVisit: "primary_care_visit",
    SpecialistVisit: "specialist_visit",
    PreventiveCare: "preventive_care",
    DiagnosticTest: "diagnostic_test",
    Imaging: "imaging",
    GenericDrugs: "generic_drugs",
    PreferredBrandDrugs: "preferred_brand_drugs",
    NonPreferredBrandDrugs: "non_preferred_brand_drugs",
    SpecialtyDrugs: "specialty_drugs",
    OutpatientFacilityFee: "outpatient_facility_fee",
    OutpatientPhysicianFee: "outpatient_physician_fee",
    EmergencyRoom: "emergency_room",
    EmergencyTransport: "emergency_transport",
    UrgentCare: "urgent_care",
    HospitalFacilityFee: "hospital_facility_fee",
    HospitalPhysicianFee: "hospital_physician_fee",
    MentalHealthOutpatient: "mental_health_outpatient",
    MentalHealthInpatient: "mental_health_inpatient",
    PregnancyOfficeVisits: "pregnancy_office_visits",
    ChildbirthProfessional: "childbirth_professional",
    ChildbirthFacility: "childbirth_facility",
    HomeHealthCare: "home_health_care",
    RehabilitationServices: "rehabilitation_services",
    HabilitationServices: "habilitation_services",
    SkilledNursing: "skilled_nursing",
    DurableMedicalEquipment: "durable_medical_equipment",
    HospiceServices: "hospice_services",
    ChildrensEyeExam: "childrens_eye_exam",
    ChildrensGlasses: "childrens_glasses",
    ChildrensDentalCheckup: "childrens_dental_checkup"
};

// const EventServiceSchema = z.object({
//     what_you_will_pay: z.object({
//         network_provider: z.object({
//             covered: z.boolean(),
//             copayment: z.number().optional(),
//             subject_to_deductible: z.boolean().optional(),
//             details: z.string().optional()
//         }),
//         out_of_network: z.object({
//             covered: z.boolean(),
//             copayment: z.number().optional(),
//             subject_to_deductible: z.boolean().optional(),
//             details: z.string().optional()
//         }),
//         limitations_exceptions_and_other_important_information: z.string().describe("Important limitations or exclusions that apply. This is on the right most column of the table.")
//     })
// });

export const parseSBCFile = async (formData: FormData) => {
    const file = formData.get("file");
    if (!(file instanceof File)) {
        throw new Error("No file uploaded");
    }
    const { url: file_url } = await put(file.name, file, {
        access: 'public',
        addRandomSuffix: true,
    });
    

    if (!(file instanceof File)) {
        throw new Error("No file uploaded");
    }
    const file_buffer = await file.arrayBuffer();
    const file_name = file.name;

    const [pages_text, { output: image_urls }] = await Promise.all([
        processFileWithUnstructured(file_buffer, file_name),
        tasks.triggerAndPoll("pdf-to-images", { file_url })
    ]);
    if (!pages_text) throw new Error("Could not extract text from PDF");

    const page_indexes_with_services = pages_text
        .map((text, idx) => ({ text: text.toLowerCase(), idx }))
        .filter(({ text }) => text.includes("what you will pay"))
        .map(({ idx }) => idx);
    console.log("page_indexes_with_services", page_indexes_with_services);
    const page1 = await structurePage1(pages_text[0], image_urls[0]);
    console.log("page1", page1);
    const services_data = await Promise.all(page_indexes_with_services.map(index => structurePageWithServices(pages_text[index], image_urls[index])));
    console.log("services_data", services_data);
    const services_data_combined = services_data.reduce<ServiceYouMayNeed[]>((acc, data) => {
        if (data && Array.isArray(data.services_you_may_need)) {
            return [...acc, ...data.services_you_may_need];
        }
        return acc;
    }, []);
    console.log("services_data_combined", services_data_combined);

    const page_index_with_excluded_services = pages_text.findIndex(text => text.toLowerCase().includes("services your plan generally does not cover"));
    const page_index_with_other_covered_services = pages_text.findIndex(text => text.toLowerCase().includes("other covered services (limitations may apply to these services"));
    const pages_text_for_excluded_and_other_covered_services = Array.from(new Set([
        pages_text[page_index_with_excluded_services],
        pages_text[page_index_with_other_covered_services]
    ].filter(Boolean)));
    console.log("pages_text_for_excluded_and_other_covered_services", pages_text_for_excluded_and_other_covered_services);
    const excluded_and_other_covered_services = await structureExcludedAndOtherCoveredServices({
        pages_text: pages_text_for_excluded_and_other_covered_services,
        file
    });

    return {
        file_url,
        image_urls,
        ...(typeof page1 === 'object' && page1 !== null ? page1 : {}),
        services_you_may_need: services_data_combined,
        excluded_and_other_covered_services
    };
}

export async function structurePage1(text: string, image_url: string): Promise<ParsedPolicy["plan_summary"] & { important_questions: ParsedPolicy["important_questions"] }> {
    return await generateObjectWithAIRetry({
        model: anthropic("claude-sonnet-4-20250514", { cacheControl: true, }),
        system: `You are a helpful assistant that extracts structured data from page 1 of a Summary of Benefits and Coverage (SBC) document. Return JSON ONLY.`,
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: `Given this first page of a Summary of Benefits and Coverage (SBC) document, please extract and structure all the relevant details.\nText content:\n${text}`
                    },
                    {
                        type: 'image',
                        image: new URL(image_url)
                    }
                ]
            }
        ],
        schema: z.object({
            plan_summary: z.object({
                plan_name: z.string(),
                coverage_period: z.object({
                    start_date: z.string(),
                    end_date: z.string()
                }),
                coverage_for: z.union([z.enum(["individual", "family", "individual_and_family"]), z.string()]),
                plan_type: z.union([z.enum(["HMO", "PPO", "EPO", "POS", "HMO-POS", "HMO-EPO", "PPO-EPO", "PPO-POS"]), z.string()]),
                issuer_name: z.string(),
                issuer_contact_info: z.object({
                    phone: z.string(),
                    website: z.string()
                })
            }),
            important_questions: z.object({
                overall_deductible: z.object({
                    individual: z.number(),
                    family: z.number(),
                    details: z.string().optional()
                }),
                services_covered_before_deductible: z.object({
                    covered: z.boolean(),
                    services: z.array(z.string()),
                    details: z.string().optional()
                }),
                deductibles_for_specific_services: z.object({
                    exists: z.boolean(),
                    details: z.string().optional()
                }),
                out_of_pocket_limit_for_plan: z.object({
                    individual: z.number(),
                    family: z.number(),
                    details: z.string().optional()
                }),
                not_included_in_out_of_pocket_limit: z.object({
                    services: z.array(z.string()),
                    details: z.string().optional()
                }),
                network_provider_savings: z.object({
                    lower_costs: z.boolean(),
                    website: z.string(),
                    phone: z.string(),
                    details: z.string().optional()
                }),
                need_referral_for_specialist_care: z.object({
                    required: z.boolean(),
                    details: z.string().optional()
                })
            })
        })
    });
}

export async function structurePageWithServices(text: string, image_url: string): Promise<{ services_you_may_need: ServiceYouMayNeed[] }> {
    return await generateObjectWithAIRetry({
        model: anthropic("claude-sonnet-4-20250514"),
        system: `You are a helpful assistant that extracts structured data from a Summary of Benefits and Coverage (SBC) document. Return JSON ONLY.`,
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: `Given this page of a Summary of Benefits and Coverage (SBC) document, please extract and structure all the relevant details.\nText content:\n${text}`
                    },
                    {
                        type: 'image',
                        image: new URL(image_url)
                    }
                ]
            }
        ],
        schema: z.object({
            services_you_may_need: z.array(z.object({
                name: z.union([z.enum(Object.values(CommonMedicalEventSericeTypes) as [string, ...string[]]), z.string()]),
                what_you_will_pay: z.object({
                    network_provider: z.string(),
                    out_of_network_provider: z.string(),
                    limitations_exceptions_and_other_important_information: z.string().describe("This is on the right most column of the table. Duplicate this for each row it applies to in the table.")
                })
            }))
        })
    });
}

export async function structureExcludedAndOtherCoveredServices({
    pages_text,
    file
}: {
    pages_text: string[],
    file: File
}) {
    const file_buffer = await file.arrayBuffer();
    const combined_text = pages_text.join('\n');
    return await generateObjectWithAIRetry({
        model: anthropic("claude-sonnet-4-20250514"),
        system: `You are a helpful assistant that extracts structured data from a Summary of Benefits and Coverage (SBC) document. Return JSON ONLY.`,
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: `Given this part of a Summary of Benefits and Coverage (SBC) document, please extract and structure all the relevant details.\nText content:\n${combined_text}`
                    },
                    {
                        type: "file",
                        data: file_buffer,
                        mimeType: "application/pdf"
                    }
                ]
            }
        ],
        schema: z.object({
            excluded_services: z.array(z.string()),
            other_covered_services: z.array(z.string())
        })
    }); 
}

