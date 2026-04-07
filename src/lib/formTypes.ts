export type BusinessType = 'service' | 'product' | 'hybrid';

export interface FormData {
  // Industry selection
  selectedIndustryId: string;
  selectedIndustrySlug: string;

  // Section 1
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  businessName: string;
  industry: string;
  businessType: BusinessType;
  numberOfStaff: string;
  staffFullTime: string;
  staffPartTime: string;
  staffCasual: string;
  staffSubcontractors: string;
  monthlyRevenue: string;

  // Section 2
  monthlyVisitors: string;
  monthlyLeads: string;
  conversionRate: string;
  monthlyNewCustomers: string;
  avgPurchaseValue: string;
  avgPurchasesPerYear: string;
  avgRetentionYears: string;

  // Section 2b – new accuracy fields
  noShowRate: string;           // % of bookings that no-show (service/hybrid)
  monthlyMarketingSpend: string;
  customerAcquisitionCost: string;
  upsellRevenuePercent: string; // % of revenue from upsells/cross-sells (product/hybrid)
  avgDealCycleWeeks: string;    // avg weeks from first contact to closed deal

  // Section 3
  hoursAdmin: string;
  hoursBooking: string;
  hoursFollowUps: string;
  hoursInvoicing: string;
  hourlyStaffCost: string;
  lostSalesReasons: string[];

  // Section 4 – Growth & Context
  currentFeatures: string[];
  conversionImpactAnswer: string;
  currentWebsite: string;
  primaryGoals: string[];
  additionalNotes: string;

  // Industry-specific Reality Check responses
  industryResponses: Record<string, string>;
}

export interface PricingTier {
  minROI: number;
  maxROI: number;
  percentage: number;
  label: string;
}

export const PRICING_TIERS: PricingTier[] = [
  { minROI: 0, maxROI: 10000, percentage: 0, label: 'Not Viable' },
  { minROI: 10000, maxROI: 25000, percentage: 20, label: 'Entry' },
  { minROI: 25000, maxROI: 50000, percentage: 25, label: 'Standard' },
  { minROI: 50000, maxROI: 100000, percentage: 30, label: 'Premium' },
  { minROI: 100000, maxROI: Infinity, percentage: 25, label: 'Enterprise' },
];

export const PRICE_FLOOR = 5000;
export const PRICE_CAP = 40000;
export const MAINTENANCE_UPLIFT = 0.15; // 15% of build cost annually

export interface PaymentPlan {
  type: 'upfront' | 'deposit-subscription' | 'subscription-only';
  label: string;
  description: string;
  depositPercent: number;
  monthlyPayments: number; // 0 = one-off remainder
  subscriptionEndless: boolean;
}

export const PAYMENT_PLANS: PaymentPlan[] = [
  {
    type: 'upfront',
    label: 'Deposit + Completion',
    description: '50% deposit upfront, 50% on build completion',
    depositPercent: 50,
    monthlyPayments: 0,
    subscriptionEndless: false,
  },
  {
    type: 'deposit-subscription',
    label: 'Deposit + Monthly (Fixed Term)',
    description: '30% deposit, remainder over 12 monthly payments',
    depositPercent: 30,
    monthlyPayments: 12,
    subscriptionEndless: false,
  },
  {
    type: 'subscription-only',
    label: 'Monthly Subscription',
    description: 'No deposit — ongoing monthly subscription (includes maintenance)',
    depositPercent: 0,
    monthlyPayments: 0,
    subscriptionEndless: true,
  },
];

export interface DynamicPricing {
  buildCost: number;
  buildCostLow: number;
  buildCostHigh: number;
  tierLabel: string;
  tierPercentage: number;
  annualMaintenance: number;
  isViable: boolean;
  isQualified: boolean; // lower bound > $10K
  plans: {
    type: PaymentPlan['type'];
    label: string;
    description: string;
    deposit: number;
    monthlyAmount: number;
    totalCost: number;
    includesMaintenance: boolean;
  }[];
}

export interface ROIResults {
  revenueLift: number;
  operationalSavings: number;
  retentionImprovement: number;
  noShowRecovery: number;
  upsellLift: number;
  marketingEfficiency: number;
  totalAnnualImpact: number;
  roiPercentage: number;
  breakEvenMonths: number;
  currentMonthlyRevenue: number;
  newMonthlyRevenue: number;
  currentConversion: number;
  newConversion: number;
  weeklyAdminHours: number;
  weeklySavingsHours: number;
  activeCustomers: number;
  clv: number;
  pricing: DynamicPricing;
}

export const initialFormData: FormData = {
  selectedIndustryId: '',
  selectedIndustrySlug: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  businessName: '',
  industry: '',
  businessType: 'service',
  numberOfStaff: '',
  staffFullTime: '',
  staffPartTime: '',
  staffCasual: '',
  staffSubcontractors: '',
  monthlyRevenue: '',
  monthlyVisitors: '',
  monthlyLeads: '',
  conversionRate: '',
  monthlyNewCustomers: '',
  avgPurchaseValue: '',
  avgPurchasesPerYear: '',
  avgRetentionYears: '',
  noShowRate: '',
  monthlyMarketingSpend: '',
  customerAcquisitionCost: '',
  upsellRevenuePercent: '',
  hoursAdmin: '',
  hoursBooking: '',
  hoursFollowUps: '',
  hoursInvoicing: '',
  hourlyStaffCost: '',
  lostSalesReasons: [],
  currentFeatures: [],
  conversionImpactAnswer: '',
  currentWebsite: '',
  primaryGoals: [],
  additionalNotes: '',
  industryResponses: {},
};

export const REVENUE_OPTIONS = [
  'Under $20k',
  '$20k–$50k',
  '$50k–$100k',
  '$100k+',
];

export const LOST_SALES_REASONS = [
  'Slow response time',
  'No online booking',
  'No automated follow-up',
  'Poor mobile experience',
  'Manual quoting delays',
  'No online payments',
  'Complex or lengthy checkout',
  'No loyalty or rewards program',
  'Lack of social proof / reviews',
];

export const CURRENT_FEATURES = [
  'Online booking',
  'Customer portal',
  'Push notifications',
  'Loyalty system',
  'Automated upsell flows',
  'CRM automation',
];

export const GOAL_OPTIONS = [
  'Increase revenue / sales',
  'Reduce manual admin work',
  'Improve customer retention',
  'Better booking / scheduling',
  'Automate follow-ups & reminders',
  'Launch loyalty / rewards program',
  'Mobile app for customers',
  'Internal staff tools',
  'E-commerce / online sales',
  'Data & analytics dashboard',
];

export const BUSINESS_TYPES: { value: BusinessType; label: string; description: string }[] = [
  { value: 'service', label: 'Service', description: 'Hairdresser, plumber, consultant, gym' },
  { value: 'product', label: 'Product', description: 'Retail, e-commerce, wholesale' },
  { value: 'hybrid', label: 'Both', description: 'Service + product sales (e.g. salon selling haircare)' },
];

function calculateDynamicPricing(totalAnnualImpact: number): DynamicPricing {
  const tier = PRICING_TIERS.find(
    (t) => totalAnnualImpact >= t.minROI && totalAnnualImpact < t.maxROI
  ) || PRICING_TIERS[0];

  const isViable = tier.percentage > 0;
  let rawCost = totalAnnualImpact * (tier.percentage / 100);
  
  // Apply floor and cap
  if (isViable) {
    rawCost = Math.max(rawCost, PRICE_FLOOR);
    rawCost = Math.min(rawCost, PRICE_CAP);
  }
  
  const buildCost = Math.round(rawCost);
  const annualMaintenance = Math.round(buildCost * MAINTENANCE_UPLIFT);
  const monthlyMaintenance = Math.round(annualMaintenance / 12);

  const plans = PAYMENT_PLANS.map((plan) => {
    if (plan.type === 'upfront') {
      const deposit = Math.round(buildCost * (plan.depositPercent / 100));
      return {
        type: plan.type,
        label: plan.label,
        description: plan.description,
        deposit,
        monthlyAmount: 0,
        totalCost: buildCost,
        includesMaintenance: false,
      };
    }
    if (plan.type === 'deposit-subscription') {
      const deposit = Math.round(buildCost * (plan.depositPercent / 100));
      const remainder = buildCost - deposit;
      const monthlyAmount = Math.round(remainder / plan.monthlyPayments);
      return {
        type: plan.type,
        label: plan.label,
        description: plan.description,
        deposit,
        monthlyAmount,
        totalCost: buildCost,
        includesMaintenance: false,
      };
    }
    // subscription-only: spread build cost over 24 months + maintenance
    const monthlyBuild = Math.round(buildCost / 24);
    const monthlyAmount = monthlyBuild + monthlyMaintenance;
    return {
      type: plan.type,
      label: plan.label,
      description: plan.description,
      deposit: 0,
      monthlyAmount,
      totalCost: 0, // ongoing
      includesMaintenance: true,
    };
  });

  const buildCostLow = Math.round(buildCost * 0.75);
  const buildCostHigh = Math.round(buildCost * 1.25);
  const isQualified = isViable && buildCostLow > 10000;

  return {
    buildCost,
    buildCostLow,
    buildCostHigh,
    tierLabel: tier.label,
    tierPercentage: tier.percentage,
    annualMaintenance,
    isViable,
    isQualified,
    plans,
  };
}

export function calculateROI(data: FormData): ROIResults {
  const visitors = parseFloat(data.monthlyVisitors) || 0;
  const conversionRate = parseFloat(data.conversionRate) || 0;
  const avgSaleValue = parseFloat(data.avgPurchaseValue) || 0;
  const isService = data.businessType === 'service' || data.businessType === 'hybrid';
  const isProduct = data.businessType === 'product' || data.businessType === 'hybrid';

  // Revenue Lift — factor in purchase frequency so high-value / low-frequency
  // businesses don't get wildly inflated projections.
  const purchasesPerYearForLift = parseFloat(data.avgPurchasesPerYear) || 1;
  const monthlyRevenuePerCustomer = avgSaleValue * Math.min(purchasesPerYearForLift, 12) / 12;
  const currentConversion = conversionRate / 100;
  const currentMonthlySales = visitors * currentConversion * monthlyRevenuePerCustomer;
  const improvedConversion = currentConversion * 1.15;
  const newMonthlySales = visitors * improvedConversion * monthlyRevenuePerCustomer;
  const monthlyRevenueLift = newMonthlySales - currentMonthlySales;
  const annualRevenueLift = monthlyRevenueLift * 12;

  // No-show recovery (service & hybrid)
  const noShowRate = parseFloat(data.noShowRate) || 0;
  let noShowRecovery = 0;
  if (isService && noShowRate > 0) {
    const monthlyBookings = parseFloat(data.monthlyNewCustomers) || 0;
    const avgValue = avgSaleValue;
    // App reminders typically recover 50% of no-shows
    const monthlyNoShows = monthlyBookings * (noShowRate / 100);
    const recoveredPerMonth = monthlyNoShows * 0.5 * avgValue;
    noShowRecovery = recoveredPerMonth * 12;
  }

  // Upsell/cross-sell lift (product & hybrid)
  const upsellPercent = parseFloat(data.upsellRevenuePercent) || 0;
  let upsellLift = 0;
  if (isProduct && upsellPercent > 0) {
    // App with smart recommendations can lift upsell revenue by 15%
    const monthlyRevenue = currentMonthlySales;
    const currentUpsellRevenue = monthlyRevenue * (upsellPercent / 100);
    upsellLift = currentUpsellRevenue * 0.15 * 12;
  }

  // Marketing efficiency
  const marketingSpend = parseFloat(data.monthlyMarketingSpend) || 0;
  const cac = parseFloat(data.customerAcquisitionCost) || 0;
  let marketingEfficiency = 0;
  if (marketingSpend > 0 && cac > 0) {
    // Better conversion = lower effective CAC, saving ~20% of marketing spend
    marketingEfficiency = marketingSpend * 0.2 * 12;
  }

  // Operational Savings
  const totalWeeklyHours =
    (parseFloat(data.hoursAdmin) || 0) +
    (parseFloat(data.hoursBooking) || 0) +
    (parseFloat(data.hoursFollowUps) || 0) +
    (parseFloat(data.hoursInvoicing) || 0);
  const hourlyRate = parseFloat(data.hourlyStaffCost) || 0;
  const annualAdminCost = totalWeeklyHours * hourlyRate * 52;
  const annualSavings = annualAdminCost * 0.4;

  // Retention & Upsell
  const monthlyCustomers = parseFloat(data.monthlyNewCustomers) || 0;
  const avgPurchaseValue = parseFloat(data.avgPurchaseValue) || avgSaleValue;
  const purchasesPerYear = parseFloat(data.avgPurchasesPerYear) || 1;
  const retentionYears = parseFloat(data.avgRetentionYears) || 1;
  const clv = avgPurchaseValue * purchasesPerYear * retentionYears;
  const activeCustomers = monthlyCustomers * 12;
  const retainedCustomers = activeCustomers * 0.1;
  const retentionValue = retainedCustomers * clv;

  const totalAnnualImpact =
    annualRevenueLift +
    annualSavings +
    retentionValue +
    noShowRecovery +
    upsellLift +
    marketingEfficiency;

  // Dynamic pricing
  const pricing = calculateDynamicPricing(totalAnnualImpact);
  const buildCost = pricing.buildCost;

  const roiPercentage = buildCost > 0 ? ((totalAnnualImpact - buildCost) / buildCost) * 100 : 0;
  const breakEvenMonths = totalAnnualImpact > 0 ? (buildCost / (totalAnnualImpact / 12)) : 0;

  return {
    revenueLift: annualRevenueLift,
    operationalSavings: annualSavings,
    retentionImprovement: retentionValue,
    noShowRecovery,
    upsellLift,
    marketingEfficiency,
    totalAnnualImpact,
    roiPercentage,
    breakEvenMonths,
    currentMonthlyRevenue: currentMonthlySales,
    newMonthlyRevenue: newMonthlySales,
    currentConversion: conversionRate,
    newConversion: conversionRate * 1.15,
    weeklyAdminHours: totalWeeklyHours,
    weeklySavingsHours: totalWeeklyHours * 0.4,
    activeCustomers,
    clv,
    pricing,
  };
}
