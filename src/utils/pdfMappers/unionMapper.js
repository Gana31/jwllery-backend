// Helper function to conditionally format phone numbers
const formatPhoneNumbers = (phone, mobile) => {
  const hasPhone = phone && phone.trim() !== '' && phone !== 'null' && phone !== 'undefined';
  const hasMobile = mobile && mobile.trim() !== '' && mobile !== 'null' && mobile !== 'undefined';
  
  if (hasPhone && hasMobile) {
    return `Phone: ${phone}, Mobile: ${mobile}`;
  } else if (hasPhone) {
    return `Phone: ${phone}`;
  } else if (hasMobile) {
    return `Mobile: ${mobile}`;
  } else {
    return '';
  }
};

export function unionRenderData({ data, appConfig, bankDetails, jewelleryImagePath, selectedTests, selectedValuation, customerDetails, bankFields, ornaments, reqUser }) {
  const formatToTwoDecimals = value => (parseFloat(value) || 0).toFixed(2);
  const formatToThreeDecimals = value => (parseFloat(value) || 0).toFixed(3);
 
  // Indian currency formatter
  const formatIndianCurrency = (value) => {
    const num = parseFloat(value) || 0;
    return num.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    });
  };
  function getBankFieldValue(bankFields, fieldName) {
    const field = Array.isArray(bankFields) ? bankFields.find(f => f.name === fieldName) : undefined;
    return field && field.value !== undefined ? field.value : '';
  }
  const goldItems = ornaments.map(item => ({
    description: item.description,
    units: formatToTwoDecimals(item.units || 0),
    grossWeight: formatToThreeDecimals(item.grossWeight || 0),
    netWeight: formatToThreeDecimals(item.netWeight || 0),
    netWeightGrams: formatToTwoDecimals(item.purity || 0),
    purity: formatToTwoDecimals(item.purity || 0),
    equivalentWeight: formatToThreeDecimals(item.equivalentWeight || 0),
    ratePerGram: formatToTwoDecimals(item.ratePerGram || 0),
    value: formatToTwoDecimals(parseFloat(item['Value Of the Gold Ornaments']?.replace(/,/g, '') || 0))
  }));
  let totalUnits = 0, totalGrossWeight = 0, totalNetWeight = 0, totalEquivalentWeight = 0, totalValue = 0;
  let ratePerGramValues = [];
  for (const item of goldItems) {
    totalUnits += parseFloat(item.units || 0);
    totalGrossWeight += parseFloat(item.grossWeight || 0);
    totalNetWeight += parseFloat(item.netWeight || 0);
    totalEquivalentWeight += parseFloat(item.equivalentWeight || 0);
    totalValue += parseFloat(item.value || 0);
    ratePerGramValues.push(parseFloat(item.ratePerGram || 0));
  }
  
  // Get common rate per gram (most frequent value)
  const getCommonRatePerGram = (values) => {
    if (values.length === 0) return 0;
    const frequency = {};
    values.forEach(val => {
      frequency[val] = (frequency[val] || 0) + 1;
    });
    let maxFreq = 0;
    let commonValue = values[0];
    Object.keys(frequency).forEach(val => {
      if (frequency[val] > maxFreq) {
        maxFreq = frequency[val];
        commonValue = parseFloat(val);
      }
    });
    return commonValue;
  };
  
  const commonRatePerGram = getCommonRatePerGram(ratePerGramValues);
  const now = new Date();
  // Signature URL
  const signatureUrl = appConfig?.signature ? `${appConfig.s3BaseUrl?.replace(/\/$/, '')}/${appConfig.signature.replace(/^\//, '')}` : '';
  
  // Format phone numbers conditionally
  const formattedPhoneNumbers = formatPhoneNumbers(appConfig?.companyPhone, appConfig?.companyMobile);
  // console.log(appConfig);
  // Helper to calculate age from date of birth
  function calculateAge(dob) {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
  return {
    bankName: data.selectedBank,
    branchName: data.selectedBranch,
    bankLogoUrl: `${appConfig?.s3BaseUrl?.replace(/\/$/, '')}/${bankDetails?.logoPath?.replace(/^\//, '')}`|| "",
    betiBachaoLogoUrl: `${appConfig?.s3BaseUrl?.replace(/\/$/, '')}/${ bankDetails?.extralogoPath?.replace(/^\//, '')}` || "",
    jewellerLogoUrl: `${appConfig?.s3BaseUrl?.replace(/\/$/, '')}/${appConfig?.companyLogo?.replace(/^\//, '')}`,
    jwellerDetails: {
      jewellerName: appConfig?.companyName || '',
      jewellerSubtitle: appConfig?.typeOfBusiness || '',
      jewellerAddress: appConfig?.companyAddress || '',
      jewellerPhone: formattedPhoneNumbers,
      jewellerMobile: '', // This field is now handled by jewellerPhone
      jewellerEmail: appConfig?.companyEmail || '',
      jewellerUbiAc: bankDetails?.accountNo || '000000000',
      membershipNo: appConfig?.membershipNo || '',
    },
    customerDetails: {
      customerName: customerDetails.customerName,
      customerAddress: customerDetails.address,
      mobileNo: customerDetails.phone,
      accountNo: customerDetails.accountNumber,
      custId: customerDetails.customerId,
      bagNo: customerDetails.begNo,
      ownerName: appConfig.ownerName,
      fatherName: appConfig.fatherName,
      age: calculateAge(appConfig.fatherDateOfBirth),
      address: customerDetails.address
    },
    ornaments: goldItems,
    ornamentImage:  jewelleryImagePath && jewelleryImagePath.trim() !== '' && jewelleryImagePath.trim() !== 'null' && jewelleryImagePath.trim() !== 'undefined' && jewelleryImagePath.trim() !== '' && !jewelleryImagePath.includes('placeholder') && !jewelleryImagePath.includes('default') ? `${appConfig?.s3BaseUrl?.replace(/\/$/, '')}/${jewelleryImagePath?.replace(/^\//, '')}` : undefined ,
    totalUnits: formatToTwoDecimals(totalUnits),
    totalGrossWeight: formatToThreeDecimals(totalGrossWeight),
    totalNetWeight: formatToThreeDecimals(totalNetWeight),
    totalEquivalentWeight: formatToThreeDecimals(totalEquivalentWeight),
    totalValue: formatIndianCurrency(totalValue),
    bankCardRateWeight: formatToThreeDecimals(totalEquivalentWeight),
    totalGoldPerGram: formatToTwoDecimals(commonRatePerGram),
    bankCardRate: formatToTwoDecimals(commonRatePerGram),
    apprenticeType: data.apprenticeType,
    bankCardValue: formatIndianCurrency(totalValue),
    valuation: selectedValuation[0],
    eligibleAmount: formatIndianCurrency(selectedValuation && selectedValuation.length > 0 ? (totalValue * selectedValuation[0] / 100) : totalValue),
    loanRequested: formatIndianCurrency(bankFields.loanRequestedByBorrower),
    lessMargin: formatIndianCurrency(bankFields.lessMargin35),
    minimumOfAboveTwo: formatIndianCurrency(bankFields.minimumOfAboveTwo),
    loanAmount: formatIndianCurrency(bankFields.loanToBeSanctioned),
    safetyGrant: formatIndianCurrency(bankFields.safetyGrant),
    marketRateValue: formatIndianCurrency(bankFields.goldAsPerMarketRate),
    verifierName: reqUser?.username || '',
    verifierFatherName: customerDetails.fatherName || '',
    verifierAge: customerDetails.age || '',
    verifierAddress: customerDetails.address || '',
    certifiedWeight: formatToThreeDecimals(totalEquivalentWeight),
    certifiedPurity: '22.00',
    certifiedLoanAmount: formatIndianCurrency(getBankFieldValue(bankFields, 'loanToBeSanctioned')),
    selectedTests: selectedTests,
    testDate: now.toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }),
    signatureUrl,
  };
} 