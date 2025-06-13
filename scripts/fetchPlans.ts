// scripts/fetchPlans.ts
import axios from 'axios';
import * as dotenv from 'dotenv';
import { writeFileSync } from 'node:fs';

dotenv.config();

const API_KEY = process.env.GOV_MARKETPLACE_API_KEY || "fLQvglz885TUJMYR6OOUjBV0JojbxXcl"
const BASE_URL = 'https://marketplace.api.healthcare.gov/api/v1';
const OUTPUT_PATH = './data/plans.json';

if (!API_KEY) {
  throw new Error('API_KEY is not set');
}

const fetchPlans = async () => {
  const household = {
    income: 50000,
    people: [
      {
        age: 30,
        aptc_eligible: true,
        gender: 'Male',
        uses_tobacco: false,
      },
    ],
  };

  const place = {
    zipcode: '27360',
    state: 'NC',
    countyfips: '37057',
  };

  const body = {
    household,
    market: 'Individual',
    place,
    year: 2025,
  };

  try {
    let allPlans: any[] = [];
    let offset = 0;
    const limit = 20; // Set a smaller limit per request
    let total = 112; // Initial total, will be updated from first response

    while (offset < total) {
      console.log(`Requesting plans with offset ${offset} and limit ${limit}...`);
      const res = await axios.post(`${BASE_URL}/plans/search?apikey=${API_KEY}`, {
        ...body,
        offset,
        limit,
      });

      // Update total from response in case it changes
      total = res.data.total;
      
      if (!res.data.plans || res.data.plans.length === 0) {
        console.log(`No plans returned in batch (offset: ${offset}). Response data:`, JSON.stringify(res.data, null, 2));
        break;
      }

      allPlans = allPlans.concat(res.data.plans);
      console.log(`Fetched ${allPlans.length}/${total} plans (batch size: ${res.data.plans.length})`);
      
      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      offset += res.data.plans.length; // Use actual number of plans received
    }

    if (allPlans.length > 0) {
      writeFileSync(OUTPUT_PATH, JSON.stringify(allPlans, null, 2));
      console.log(`Saved ${allPlans.length} plans to ${OUTPUT_PATH}`);
    } else {
      console.error('No plans were fetched. Something went wrong.');
    }
  } catch (err: any) {
    console.error('Error fetching plans:', err.response?.data || err.message);
    if (err.response?.data) {
      console.error('Full error response:', JSON.stringify(err.response.data, null, 2));
    }
  }
};

fetchPlans();
