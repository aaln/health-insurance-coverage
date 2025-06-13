import axios from 'axios';
import * as dotenv from 'dotenv';
import { writeFileSync } from 'node:fs';

// For Node.js environments, we'll use a simple XML parsing approach
// You may want to install xml2js or fast-xml-parser for more robust XML parsing
// npm install xml2js @types/xml2js

dotenv.config({ path: '.env.local' });

const API_KEY = process.env.GOV_FINDER_API_KEY || "3qMQFSkda9pLQD7p73PtaWvAW7F8U0d3";
const BASE_URL = 'https://api.finder.healthcare.gov/v3.0';
const OUTPUT_PATH = './data/finder-plans.json';

if (!API_KEY) {
  throw new Error('GOV_FINDER_API_KEY is not set');
}

interface HealthcareFinderPlan {
  PlanID: string;
  PlanNameText: string;
  ProductID: string;
  ProductNameText: string;
  IssuerID: string;
  IssuerNameText: string;
  BaseRateAmount: number;
  MetalTierType: string;
  ProviderType: string;
  HSAEligibleIndicator: boolean;
  IndividualAnnualDeductibleAmount?: number | string;
  FamilyAnnualDeductibleAmount?: number | string;
  IndividualAnnualOOPLimitAmount?: number | string;
  FamilyAnnualOOPLimitAmount?: number | string;
}

const createXMLRequest = (pageNumber: number = 1, pageSize: number = 20): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<p:PlanQuoteRequest xmlns:p="http://hios.cms.org/api" xmlns:p1="http://hios.cms.org/api-types" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://hios.cms.org/api hios-api-11.0.xsd">
  <p:Enrollees>
    <p1:DateOfBirth>1994-01-01</p1:DateOfBirth>
    <p1:Gender>Male</p1:Gender>
    <p1:TobaccoLastUsedMonths>0</p1:TobaccoLastUsedMonths>
    <p1:Relation>SELF</p1:Relation>
    <p1:InHouseholdIndicator>true</p1:InHouseholdIndicator>
  </p:Enrollees>
  <p:Location>
    <p1:ZipCode>27360</p1:ZipCode>
    <p1:County>
      <p1:FipsCode>37057</p1:FipsCode>
      <p1:CountyName>Davidson</p1:CountyName>
      <p1:StateCode>NC</p1:StateCode>
    </p1:County>
  </p:Location>
  <p:InsuranceEffectiveDate>2025-01-01</p:InsuranceEffectiveDate>
  <p:Market>Individual</p:Market>
  <p:IsFilterAnalysisRequiredIndicator>false</p:IsFilterAnalysisRequiredIndicator>
  <p:PaginationInformation>
    <p1:PageNumber>${pageNumber}</p1:PageNumber>
    <p1:PageSize>${pageSize}</p1:PageSize>
  </p:PaginationInformation>
  <p:SortOrder>
    <p1:SortField>BASE RATE</p1:SortField>
    <p1:SortDirection>ASC</p1:SortDirection>
  </p:SortOrder>
</p:PlanQuoteRequest>`;
};

// Simple XML parsing using regex (for basic use cases)
// For production, consider using xml2js or fast-xml-parser
const parseXMLResponse = (xmlString: string): { plans: HealthcareFinderPlan[], totalPlans: number } => {
  try {
    // Check for errors in response
    const errorMatch = xmlString.match(/<ReturnCode>(.*?)<\/ReturnCode>/);
    if (errorMatch && errorMatch[1] === 'Error') {
      const errorMessages = xmlString.match(/<ErrorMessage>(.*?)<\/ErrorMessage>/g);
      const errors = errorMessages ? errorMessages.map(msg => msg.replace(/<\/?ErrorMessage>/g, '')).join(', ') : 'Unknown error';
      throw new Error(`API Error: ${errors}`);
    }

    const plans: HealthcareFinderPlan[] = [];
    
    // Extract plan elements using regex
    const planMatches = xmlString.match(/<Plan>([\s\S]*?)<\/Plan>/g);
    
    if (planMatches) {
      for (const planMatch of planMatches) {
        const getElementText = (tagName: string, content: string): string => {
          const match = content.match(new RegExp(`<${tagName}>([\s\S]*?)<\/${tagName}>`));
          return match ? match[1].trim() : '';
        };

        const getElementNumber = (tagName: string, content: string): number => {
          const text = getElementText(tagName, content);
          return text ? parseFloat(text) : 0;
        };

        const getElementBoolean = (tagName: string, content: string): boolean => {
          const text = getElementText(tagName, content);
          return text === 'true';
        };

        const getDeductibleAmount = (tagName: string, content: string): number | string => {
          const elementMatch = content.match(new RegExp(`<${tagName}>([\s\S]*?)<\/${tagName}>`));
          if (!elementMatch) return 'Not Applicable';
          
          const elementContent = elementMatch[1];
          const amountMatch = elementContent.match(/<Amount>(.*?)<\/Amount>/);
          const notApplicableMatch = elementContent.match(/<NotApplicable>/);
          
          if (amountMatch) {
            return parseFloat(amountMatch[1]);
          } else if (notApplicableMatch) {
            return 'Not Applicable';
          }
          return 'Not Applicable';
        };

        const plan: HealthcareFinderPlan = {
          PlanID: getElementText('PlanID', planMatch),
          PlanNameText: getElementText('PlanNameText', planMatch),
          ProductID: getElementText('ProductID', planMatch),
          ProductNameText: getElementText('ProductNameText', planMatch),
          IssuerID: getElementText('IssuerID', planMatch),
          IssuerNameText: getElementText('IssuerNameText', planMatch),
          BaseRateAmount: getElementNumber('BaseRateAmount', planMatch),
          MetalTierType: getElementText('MetalTierType', planMatch),
          ProviderType: getElementText('ProviderType', planMatch),
          HSAEligibleIndicator: getElementBoolean('HSAEligibleIndicator', planMatch),
          IndividualAnnualDeductibleAmount: getDeductibleAmount('IndividualAnnualDeductibleAmount', planMatch),
          FamilyAnnualDeductibleAmount: getDeductibleAmount('FamilyAnnualDeductibleAmount', planMatch),
          IndividualAnnualOOPLimitAmount: getDeductibleAmount('IndividualAnnualOOPLimitAmount', planMatch),
          FamilyAnnualOOPLimitAmount: getDeductibleAmount('FamilyAnnualOOPLimitAmount', planMatch),
        };

        if (plan.PlanID) {
          plans.push(plan);
        }
      }
    }

    // Try to get total count from response metadata
    const totalMatch = xmlString.match(/<(?:TotalCount|Total)>(.*?)<\/(?:TotalCount|Total)>/);
    const totalPlans = totalMatch ? parseInt(totalMatch[1]) : plans.length;

    return { plans, totalPlans };
  } catch (error) {
    console.error('Error parsing XML response:', error);
    throw error;
  }
};

const fetchHealthcareFinderPlans = async () => {
  try {
    let allPlans: HealthcareFinderPlan[] = [];
    let currentPage = 1;
    const pageSize = 20;
    let totalPlans = 0;

    console.log('Starting to fetch plans from Healthcare Finder API...');

    while (true) {
      console.log(`Requesting page ${currentPage} with ${pageSize} plans per page...`);
      
      const xmlRequest = createXMLRequest(currentPage, pageSize);
      
      const response = await axios.post(
        `${BASE_URL}/getIFPPlanQuotes`,
        xmlRequest,
        {
          headers: {
            'Content-Type': 'application/xml',
            'apikey': API_KEY
          },
        }
      );

      console.log(response.data)

      const { plans, totalPlans: responseTotalPlans } = parseXMLResponse(response.data);
      
      if (currentPage === 1) {
        totalPlans = responseTotalPlans;
        console.log(`Total plans available: ${totalPlans}`);
      }

      if (!plans || plans.length === 0) {
        console.log(`No plans returned on page ${currentPage}. Stopping.`);
        break;
      }

      allPlans = allPlans.concat(plans);
      console.log(`Fetched ${allPlans.length}/${totalPlans} plans (page ${currentPage}, batch size: ${plans.length})`);

      // Check if we've fetched all plans
      if (allPlans.length >= totalPlans || plans.length < pageSize) {
        console.log('All plans fetched.');
        break;
      }

      currentPage++;
      
      // Add a delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (allPlans.length > 0) {
      writeFileSync(OUTPUT_PATH, JSON.stringify(allPlans, null, 2));
      console.log(`Saved ${allPlans.length} plans to ${OUTPUT_PATH}`);
      
      // Print summary statistics
      const metalTiers = allPlans.reduce((acc, plan) => {
        acc[plan.MetalTierType] = (acc[plan.MetalTierType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const providerTypes = allPlans.reduce((acc, plan) => {
        acc[plan.ProviderType] = (acc[plan.ProviderType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('\nPlan Summary:');
      console.log('Metal Tiers:', metalTiers);
      console.log('Provider Types:', providerTypes);
      console.log(`Average Base Rate: $${(allPlans.reduce((sum, plan) => sum + plan.BaseRateAmount, 0) / allPlans.length).toFixed(2)}`);
    } else {
      console.error('No plans were fetched. Something went wrong.');
    }
  } catch (err) {
    const error = err as Error;
    console.error('Error fetching Healthcare Finder plans:', error.message);
    if (axios.isAxiosError(err)) {
      console.error('Response status:', err.response?.status);
      console.error('Response headers:', err.response?.headers);
      console.error('Response data:', err.response?.data);
    }
  }
};

fetchHealthcareFinderPlans(); 