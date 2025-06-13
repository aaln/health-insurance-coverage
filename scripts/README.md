# Health Insurance Plan Fetching Scripts

This directory contains scripts to fetch health insurance plan data from different government APIs.

## Available Scripts

### 1. Healthcare.gov Marketplace API (`fetchPlans.ts`)

Fetches individual health insurance plans from the Healthcare.gov Marketplace API.

**Usage:**
```bash
npm run fetch:plans
```

**Configuration:**
- API Key: Set `GOV_MARKETPLACE_API_KEY` in `.env.local` or uses default fallback
- Output: `./data/plans.json`
- Location: North Carolina (27360, Davidson County)
- Household: Single 30-year-old male, $50,000 income

### 2. Healthcare Finder API (`fetchHealthcareFinderPlans.ts`)

Fetches private health insurance plans from the Healthcare Finder API (outside the marketplace).

**Usage:**
```bash
npm run fetch:finder-plans
```

**Configuration:**
- API Key: Set `GOV_FINDER_API_KEY` in `.env.local` (default: `3qMQFSkda9pLQD7p73PtaWvAW7F8U0d3`)
- Output: `./data/finder-plans.json`
- Location: North Carolina (27360, Davidson County)
- Enrollee: Single person born 1994-01-01, Male, Non-tobacco user
- **Endpoint Used:** `getIFPPlanQuotes` (Individual and Family Plan quotes)

## Available Healthcare Finder API Endpoints

According to the [Healthcare Finder API documentation](https://finder.healthcare.gov/#services/version_3_0), the following endpoints are available:

- `getCountiesForZip` - Get counties for a ZIP code
- `getIFPPlanQuotes` - Get Individual and Family Plan quotes *(used by our script)*
- `getIFPPlanBenefits` - Get Individual and Family Plan benefits
- `getSMGPlanQuotes` - Get Small Group Plan quotes  
- `getSMGPlanBenefits` - Get Small Group Plan benefits

## Environment Variables

Create a `.env.local` file in the project root with:

```env
# Healthcare.gov Marketplace API
GOV_MARKETPLACE_API_KEY=your_marketplace_api_key_here

# Healthcare Finder API
GOV_FINDER_API_KEY=3qMQFSkda9pLQD7p73PtaWvAW7F8U0d3
```

## API Differences

| Feature | Marketplace API | Finder API |
|---------|----------------|------------|
| Format | JSON | XML |
| Scope | Marketplace plans | Private plans outside marketplace |
| Request Format | JSON POST | XML POST |
| Response Format | JSON | XML |
| Pagination | Offset/limit | Page number/size |
| Base URL | `marketplace.api.healthcare.gov` | `api.finder.healthcare.gov` |

## Output Format

Both scripts save results as JSON arrays with plan information including:
- Plan IDs and names
- Issuer information
- Base rates/premiums
- Metal tier levels
- Provider types (HMO, PPO, etc.)
- Deductibles and out-of-pocket limits
- Coverage indicators (HSA eligible, coverage types)

## Data Location

The fetched data is saved to:
- Marketplace plans: `./data/plans.json`
- Finder plans: `./data/finder-plans.json`

## Notes

- Both scripts implement pagination to fetch all available plans
- Rate limiting delays are included to avoid API throttling
- The Finder API script uses regex-based XML parsing for simplicity
- For production use, consider installing a proper XML parser like `xml2js`
- The Healthcare Finder API provides access to private insurance plans outside the marketplace

## Error Handling

Scripts include comprehensive error handling for:
- API authentication errors
- Network failures
- Invalid responses
- XML/JSON parsing errors
- Rate limiting

## Extending the Healthcare Finder Script

To use other Healthcare Finder API endpoints:

1. **For plan benefits**: Change endpoint to `getIFPPlanBenefits` and adjust request/response parsing
2. **For small group plans**: Change endpoint to `getSMGPlanQuotes` and modify the request structure
3. **For county lookup**: Use `getCountiesForZip` endpoint for ZIP code validation

## Customization

To modify location, enrollee information, or filtering criteria:

1. **Marketplace API**: Edit the `household`, `place`, and `body` objects in `fetchPlans.ts`
2. **Finder API**: Edit the XML request template in `createXMLRequest()` function in `fetchHealthcareFinderPlans.ts` 