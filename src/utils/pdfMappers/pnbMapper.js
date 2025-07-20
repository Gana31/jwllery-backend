import path from 'path';

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

export function pnbRenderData({ data, appConfig, bankDetails, jewelleryImagePath, selectedTests, selectedValuation, customerDetails, ornaments, bankFields }) {
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
  const s3BaseUrl = appConfig?.s3BaseUrl?.replace(/\/$/, '') || '';
  // Compose full S3 URLs for logos
  const pnbLogo = bankDetails?.logoPath ? `${s3BaseUrl}/${bankDetails.logoPath.replace(/^\//, '')}` : '';
  const rateLogo = bankDetails?.extralogoPath ? `${s3BaseUrl}/${bankDetails.extralogoPath.replace(/^\//, '')}` : '';
  const companyLogo = appConfig?.companyLogo ? `${s3BaseUrl}/${appConfig.companyLogo.replace(/^\//, '')}` : '';

  // Ornaments mapping
  const goldItems = (ornaments || []).map(item => ({
    description: item.description,
    hallmark: item.hallmark,
    units: item.units,
    purity: item.purity,
    grossWeight: item.grossWeight,
    netWeight: item.netWeight,
    goldperGram: item.goldperGram,
    value: item.ApproxValue || item.value
  }));

  // Totals and calculations
  let totalUnits = 0, totalGrossWeight = 0, totalNetWeight = 0, totalGoldPerGram = 0, totalValue = 0;
  goldItems.forEach(item => {
    totalUnits += parseFloat(item.units || 0) || 0;
    totalGrossWeight += parseFloat(item.grossWeight || 0) || 0;
    totalNetWeight += parseFloat(item.netWeight || 0) || 0;
      totalGoldPerGram += parseFloat(item.goldperGram || 0) || 0;
    totalValue += parseFloat(item.value || 0) || 0;
  });

  // Calculate rate/gram for summary table (total value / sum of 22 carat gold content in grams)


  // Jewellery image logic (blank if not present or invalid)
  let jewelleryImage = '';
  if (
    jewelleryImagePath &&
    typeof jewelleryImagePath === 'string' &&
    jewelleryImagePath.trim() !== '' &&
    jewelleryImagePath !== 'null' &&
    jewelleryImagePath !== 'undefined' &&
    !jewelleryImagePath.includes('placeholder') &&
    !jewelleryImagePath.includes('default')
  ) {
    jewelleryImage = `${s3BaseUrl}/${jewelleryImagePath.replace(/^\//, '')}`;
  } else {
    jewelleryImage = '';
  }

  // Date and place
  const now = new Date();
  const placeName = data.selectedBranch || '';
  const certificateDate = now.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, day: '2-digit', month: '2-digit', year: 'numeric' });

  // Signature URL
  const signatureUrl = appConfig?.signature ? `${s3BaseUrl}/${appConfig.signature.replace(/^\//, '')}` : '';

  // Summary table data
  const summaryData = (Array.isArray(selectedValuation) ? selectedValuation : []).map(percentage => {
    const eligibility = totalValue * (percentage / 100);
    const ratePerGram = totalGoldPerGram > 0 ? formatToTwoDecimals(eligibility / totalGoldPerGram) : '';
    return {
      goldType: `Swarna Loan ${percentage}%`,
      rate: ratePerGram,
      valuation: `₹ ${formatIndianCurrency(totalValue)}`,
      eligibility: `₹ ${formatIndianCurrency(eligibility)}`
    };
  });

  // Format phone numbers conditionally
  const formattedPhoneNumbers = formatPhoneNumbers(appConfig?.companyPhone, appConfig?.companyMobile);

  return {
    pnbLogo,
    rateLogo,
    companyLogo,
    branchName: data.selectedBranch || '',
    companyName: appConfig?.companyName || '',
    companyTagline: appConfig?.typeOfBusiness || '',
    shopAddress: appConfig?.companyAddress || '',
    phoneNumbers: formattedPhoneNumbers,
    mobileNumbers: '', // This field is now handled by phoneNumbers
    emailAddress: appConfig?.companyEmail || '',
    membershipNo: appConfig?.membershipNo || '',
    accountNo: bankDetails?.accountNo || '',
    customerName: customerDetails?.customerName || '',
    customerAddress: customerDetails?.address || '',
    customerMobile: customerDetails?.phone || '',
    accountNoCustomer: customerDetails?.accountNumber || '',
    punchNo: customerDetails?.pouchNo || '',
    apprenticeType: data.apprenticeType,
    goldRate: bankFields.goldRate || '',
    tableHeaders: {
      srNo: 'Sr No',
      description: 'Description of Jewels/Ornaments assorted',
      hallmark: 'Hallmark',
      units: 'No Of Units',
      purity: 'Purity in Karat',
      grossWeight: 'Gross Weight in Grams',
      netWeight: 'Net weight (Gross weight less Vaux,Stone,dust ete) Grams',
      goldperGram: '22 carat Gold content in Grams',
      ApproxValue: 'Approx Value in Rupees'
    },
    ornaments: goldItems,
    maxTableRows: 10,
    emptyWeight: '0.000',
    emptyDeduction: '0.000',
    emptyNetWeight: '0.000',
    emptyValue: '0.00',
    totalLabel: 'TOTAL',
    totalWeight: formatToThreeDecimals(totalGrossWeight),
    totalNetWeight: formatToThreeDecimals(totalNetWeight),
    totalGoldPerGram: formatToThreeDecimals(totalGoldPerGram),
    totalValue: `₹ ${formatIndianCurrency(totalValue)}`,
    declarationTitle: 'Declaration of the Borrower',
    declarationParagraph1: 'I have not been handed over the above ornaments to the bank without any pressure and in good state of mind for the purpose of obtaining loan from Punjab National Bank. These ornaments are my own and I take full responsibility for it.',
    declarationParagraph2: 'If the above ornaments i also fully agree the above certificate given by Anand Jewellers.',
    summaryHeaders: {
      srNo: 'Sr No',
      goldType: 'Gold Type',
      rate: 'Rate/Grm',
      valuation: 'Valuation',
      eligibility: 'Eligibility'
    },
    summaryData,
    placeLabel: 'Place',
    placeName,
    dateLabel: 'Date',
    certificateDate,
    jewelleryImage,
    jewelleryImageText: 'JEWELLERY IMAGE',
    jewelleryImageAlt: 'Jewellery Image',
    signatureUrl,
    analytics: {
      bankName: bankDetails?.bankName || 'PNB',
      branchName: data.selectedBranch || '',
      bankLogo: bankDetails?.logoPath ? `${s3BaseUrl}/${bankDetails.logoPath.replace(/^\//, '')}` : '',
      customerName: customerDetails?.customerName || '',
      phone: customerDetails?.phone || '',
      accountNumber: customerDetails?.accountNumber || '',
      punchNo: customerDetails?.pouchNo || '',
      items: goldItems.map(item => ({
        description: item.description,
        units: item.units,
        grossWeight: item.grossWeight,
        netWeight: item.netWeight,
        approxValue: item.value
      })),
      totalUnits: formatToTwoDecimals(totalUnits),
      totalGrossWeight: formatToThreeDecimals(totalGrossWeight),
      totalNetWeight: formatToThreeDecimals(totalNetWeight),
      totalValue: formatIndianCurrency(totalValue),
      jewelleryImage: jewelleryImage,
      date: now.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, day: '2-digit', month: '2-digit', year: 'numeric' })
    }
  };
} 