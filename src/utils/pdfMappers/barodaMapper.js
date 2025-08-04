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


function calculateDueDate() {
  const today = new Date();
  const nextYear = new Date(today);
  nextYear.setFullYear(today.getFullYear() + 1);
  nextYear.setDate(nextYear.getDate() - 1); // subtract 1 day
  return nextYear.toLocaleDateString('en-GB'); // format as DD/MM/YYYY
}

export function barodaRenderData({ data, appConfig, bankDetails, jewelleryImagePath, selectedTests, selectedValuation, customerDetails, ornaments, bankFields }) {
  // console.log('barodaRenderData called with data: ', ornaments, ' ornaments, ', bankFields, ' bankFields');
  console.log("selectedValuation: ", selectedValuation);
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
  
  // Map ornaments to table content format
  const tableContent = ornaments.map(item => {
    const grossWeight = parseFloat(item['Gross Weight in Grams'] || item['grossWeight'] || '0') || 0;
    const netWeight = parseFloat(item['Net Weight (Gross Weight less Vaux, Stones, dust etc) Grams'] || item['netWeight'] || '0') || 0;
    const carat = parseFloat(item['Purity in Carat'] || item['carat'] || '0') || 0;
    const marketValue = parseFloat(item['Market Value per gram'] || item['caratRate'] || '0') || 0;
    const caratRate = parseFloat(item['Carat Rate per gram'] || item['CaratRatePerGm'] || '0') || 0;
    const approxValue = parseFloat(item['Approx Value In Rupees'] || item['approxValue'] || '0') || 0;
    
    // New: Calculate approx value as per carat rate
    const approxValueCarat = netWeight * caratRate;
    // Placeholder for Marathi words (replace with actual utility if available)
    const approxValueCaratMarathi = `₹${formatIndianCurrency(approxValueCarat)} (मराठीत: ${approxValueCarat})`;
    
    return {
      description: item['Description of Gold Ornaments'] || item['description'] || '',
      grossWeight: `${formatToThreeDecimals(grossWeight)}g`,
      netWeight: `${formatToThreeDecimals(netWeight)}g`,
      carat: formatToTwoDecimals(carat),
      marketValue: `₹${formatIndianCurrency(marketValue)}`,
      caratRate: `₹${formatIndianCurrency(caratRate)}`,
      remarks: item['Remarks'] || item['remarks'] || '',
      approxValue: `₹${formatIndianCurrency(approxValue)}`,
      approxValueCarat: `₹${formatIndianCurrency(approxValueCarat)}`,
      approxValueCaratMarathi
    };
  });

  // Calculate totals
  let totalGrossWeight = 0, totalNetWeight = 0, totalApproxValue = 0, totalApproxValueCarat = 0;
  ornaments.forEach(item => {
    totalGrossWeight += parseFloat(item['Gross Weight in Grams'] || item['grossWeight'] || '0') || 0;
    totalNetWeight += parseFloat(item['Net Weight (Gross Weight less Vaux, Stones, dust etc) Grams'] || item['netWeight'] || '0') || 0;
    totalApproxValue += parseFloat(item['Approx Value In Rupees'] || item['approxValue'] || '0') || 0;
    // Add for approxValueCarat
    const netWeight = parseFloat(item['Net Weight (Gross Weight less Vaux, Stones, dust etc) Grams'] || item['netWeight'] || '0') || 0;
    const caratRate = parseFloat(item['Carat Rate per gram'] || item['CaratRatePerGm'] || '0') || 0;
    totalApproxValueCarat += netWeight * caratRate;
  });

  // Format photo URL
  let photoUrl = '';
  if (
    jewelleryImagePath &&
    typeof jewelleryImagePath === 'string' &&
    jewelleryImagePath.trim() !== '' &&
    jewelleryImagePath !== 'null' &&
    jewelleryImagePath !== 'undefined' &&
    !jewelleryImagePath.includes('placeholder') &&
    !jewelleryImagePath.includes('default')
  ) {
    photoUrl = `${appConfig?.s3BaseUrl?.replace(/\/$/, '')}/${jewelleryImagePath.replace(/^\//, '')}`;
  }

  // Parse bank details
  const parsedBankDetails = typeof data.bankDetails === 'string' ? JSON.parse(data.bankDetails) : data.bankDetails || {};
  const dueDate = calculateDueDate();

  // Format tests - only show if bank model has tests enabled
  const tests = (bankDetails?.tests === true && selectedTests && selectedTests.length > 0) ? selectedTests : [];

  // Signature URL
  const signatureUrl = appConfig?.signature ? `${appConfig.s3BaseUrl?.replace(/\/$/, '')}/${appConfig.signature.replace(/^\//, '')}` : '';
  
  // Format phone numbers conditionally
  const formattedPhoneNumbers = formatPhoneNumbers(appConfig?.companyPhone, appConfig?.companyMobile);

  return {
    bankDetails: {
      bankName: bankDetails?.bankName || '',
      branch: data.selectedBranch,
      logoUrl: bankDetails?.logoPath ? `${appConfig?.s3BaseUrl?.replace(/\/$/, '')}/${bankDetails.logoPath.replace(/^\//, '')}` : ''
    },
    customerDetails: {
      name: customerDetails?.customerName || '',
      accountNumber: customerDetails?.accountNumber || '',
      address: customerDetails?.address || '',
      phone:customerDetails?.phone || '',
      pouchNo:customerDetails?.pouchNo || '',
    },
    apprenticeType: data.apprenticeType || 'apprentice',
    jewellerDetails: {
      logoName: appConfig?.companyName || '',
      logoUrl: appConfig?.companyLogo ? `${appConfig?.s3BaseUrl?.replace(/\/$/, '')}/${appConfig.companyLogo.replace(/^\//, '')}` : '',
      typeOfBusiness: appConfig?.typeOfBusiness || 'Goldsmith and Valuer',
      address: appConfig?.companyAddress || '',
      phone: formattedPhoneNumbers,
      email: appConfig?.companyEmail || '',
      accountNumber: bankDetails?.accountNo || '',
      iovMembershipNumber: appConfig?.membershipNo || ''
    },
    photoDetails: {
      photoUrl: photoUrl
    },
    tableContent: tableContent,
    totalDetails: {
      totalGrossWeight: `${formatToThreeDecimals(totalGrossWeight)}g`,
      totalNetWeight: `${formatToThreeDecimals(totalNetWeight)}g`,
      totalApproxValue: `₹${formatIndianCurrency(totalApproxValue)}`,
      totalApproxValueCarat: `₹${formatIndianCurrency(totalApproxValueCarat)}`
    },
    loanDetails: {
      amount: `₹${formatIndianCurrency(totalApproxValue)}`,
      dueDate: dueDate,
      tests: tests,
      date: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, day: '2-digit', month: '2-digit', year: 'numeric' })
    },
    signatureUrl: signatureUrl,
    analytics: {
      bankName: bankDetails?.bankName || 'Baroda',
      branchName: data.selectedBranch || '',
      bankLogo: bankDetails?.logoPath ? `${appConfig?.s3BaseUrl?.replace(/\/$/, '')}/${bankDetails.logoPath.replace(/^\//, '')}` : '',
      customerName: customerDetails?.customerName || '',
      phone: customerDetails?.phone || '',
      accountNumber: customerDetails?.accountNumber || '',
      punchNo: customerDetails?.pouchNo || '',
      items: (ornaments || []).map(item => ({
        description: item['Description of Gold Ornaments'] || item['description'] || '',
        units: item['No Of Units'] || item['units'] || '',
        grossWeight: item['Gross Weight in Grams'] || item['grossWeight'] || '',
        netWeight: item['Net Weight (Gross Weight less Vaux, Stones, dust etc) Grams'] || item['netWeight'] || '',
        approxValue: item['Approx Value In Rupees'] || item['approxValue'] || ''
      })),
      totalUnits: (ornaments || []).reduce((sum, item) => sum + (parseFloat(item['No Of Units'] || item['units'] || 0) || 0), 0).toFixed(2),
      totalGrossWeight: totalGrossWeight.toString(),
      totalNetWeight: totalNetWeight.toString(),
      totalValue: formatIndianCurrency(totalApproxValue),
      jewelleryImage: photoUrl,
      date: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, day: '2-digit', month: '2-digit', year: 'numeric' })
    }
  };
} 