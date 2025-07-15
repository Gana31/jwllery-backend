import path from 'path';

function formatDateTimeAMPM(date) {
  return new Date(date).toLocaleString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  });
}

const company = {
  _id: "6852e0a9b9be203c60cc470c",
  companyName: "Shreenath jewellers",
  companyAddress: "Near Marathi School, Manik chouk, Chakan, Pune, 410501",
  companyPhone: "(020)2728 0188",
  companyMobile: "9822 880996 / 9422 556662",
  companyEmail: "anandsangvi@gmail.com",
  splashScreenLogo: "https://ganeshtest2.s3.ap-south-1.amazonaws.com/appimages/9cc80050-817b-49d7-8710-d0fe550f1df0.png",
  splashScreenQuote: "Purity, Honesty, Trust and love.",
  s3BaseUrl: "https://ganeshtest2.s3.ap-south-1.amazonaws.com",
  createdAt: "2025-06-18T15:52:09.727Z",
  updatedAt: "2025-07-02T12:56:30.045Z",
  __v: 0,
  typeOfBusiness: "Goldsmith and Valuer",
  companyLogo: "appimages/4b538a0c-17ad-46ae-8a77-47dc4119c86e.png",
  membershipNo: "A641-5882-02",
  signature: "appimages/bb5d7411-9750-4952-a892-0af595186fbd.png",
  id: "6852e0a9b9be203c60cc470c"
};
const getFullUrl = (url) => url && !url.startsWith('http') ? `${company.s3BaseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}` : url;

export const renderUnionTest = (req, res) => {
  const now = new Date();
  const data = {
    bankName: 'Union Bank Of India',
    branchName: 'Main Branch',
    bankLogoUrl: 'https://dummyimage.com/60x60/000/fff.png&text=Bank',
    betiBachaoLogoUrl: 'https://dummyimage.com/100x100/ff69b4/fff.png&text=Beti+Bachao',
    jewellerLogoUrl: getFullUrl(company.companyLogo),
    jwellerDetails: {
      jewellerName: company.companyName,
      jewellerSubtitle: company.typeOfBusiness,
      jewellerAddress: company.companyAddress,
      jewellerPhone: company.companyPhone,
      jewellerMobile: company.companyMobile,
      jewellerEmail: company.companyEmail,
      jewellerUbiAc: '1234567890',
      membershipNo: company.membershipNo,
    },
    customerDetails: {
      customerName: 'Rahul Sharma',
      customerAddress: '123, MG Road, Pune',
      mobileNo: '9876543210',
      accountNo: '111122223333',
      custId: 'CUST123',
      bagNo: 'BAG001',
      fatherName: 'Amit Sharma',
      age: 35,
      address: '123, MG Road, Pune',
    },
    ornaments: [
      { description: 'Gold Ring', units: 2, grossWeight: 10.5, netWeight: 10.0, purity: 22, equivalentWeight: 10.0, ratePerGram: 5000, value: 50000 },
      { description: 'Gold Chain', units: 1, grossWeight: 20.0, netWeight: 19.5, purity: 22, equivalentWeight: 19.5, ratePerGram: 5000, value: 97500 },
    ],
    ornamentImage: 'https://dummyimage.com/150x100/cccccc/000.png&text=Jewellery',
    totalUnits: 3,
    totalGrossWeight: 30.5,
    totalNetWeight: 29.5,
    totalEquivalentWeight: 29.5,
    totalValue: 147500,
    bankCardRateWeight: 29.5,
    totalGoldPerGram: 5000,
    bankCardRate: 5000,
    bankCardValue: 147500,
    eligibleAmount: 147500,
    loanRequested: 100000,
    lessMargin: 51625,
    minimumOfAboveTwo: 95875,
    loanAmount: 95000,
    safetyGrant: 0,
    marketRateValue: 150000,
    verifierName: 'Verifier',
    verifierFatherName: 'Amit Sharma',
    verifierAge: 35,
    verifierAddress: '123, MG Road, Pune',
    certifiedWeight: 29.5,
    certifiedPurity: '22.00',
    certifiedLoanAmount: 95000,
    selectedTests: ['TouchStone test', 'Acid Test'],
    testDate: formatDateTimeAMPM(now),
    signatureUrl: getFullUrl(company.signature),
  };
  res.render(path.join(process.cwd(), 'views', 'uiniontest.ejs'), { data });
};

export const renderPnbTest = (req, res) => {
  const now = new Date();
  const data = {
    companyName: company.companyName,
    companyTagline: company.typeOfBusiness,
    shopAddress: company.companyAddress,
    phoneNumbers: company.companyPhone,
    mobileNumbers: company.companyMobile,
    emailAddress: company.companyEmail,
    membershipNo: company.membershipNo,
    accountNo: '1234567890',
    customerName: 'Rahul Sharma',
    customerAddress: '123, MG Road, Pune',
    customerMobile: '9876543210',
    accountNoCustomer: '111122223333',
    punchNo: 'BAG001',
    goldRate: 5000,
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
    ornaments: [
      { description: 'Gold Ring', hallmark: 'Yes', units: 2, purity: 22, grossWeight: 10.5, netWeight: 10.0, goldperGram: 10.0, value: 50000 },
      { description: 'Gold Chain', hallmark: 'No', units: 1, purity: 22, grossWeight: 20.0, netWeight: 19.5, goldperGram: 19.5, value: 97500 },
    ],
    totalWeight: 30.5,
    totalNetWeight: 29.5,
    totalGoldPerGram: 29.5,
    totalValue: '₹ 147500',
    summaryHeaders: {
      srNo: 'Sr No',
      goldType: 'Gold Type',
      rate: 'Rate/Grm',
      valuation: 'Valuation',
      eligibility: 'Eligibility'
    },
    summaryData: [
      { goldType: 'Swarna Loan 65%', rate: 3250, valuation: '₹ 147500', eligibility: '₹ 95875' },
      { goldType: 'Swarna Loan 70%', rate: 3500, valuation: '₹ 147500', eligibility: '₹ 103250' },
    ],
    placeName: 'Main Branch',
    certificateDate: formatDateTimeAMPM(now),
    jewelleryImage: 'https://dummyimage.com/150x100/cccccc/000.png&text=Jewellery',
    jewelleryImageAlt: 'Jewellery Image',
    signatureUrl: getFullUrl(company.signature),
  };
  res.render(path.join(process.cwd(), 'views', 'pnbTemplate.ejs'), { data });
};

export const renderSbiTest = (req, res) => {
  const now = new Date();
  const data = {
    branchCode: 'Main Branch',
    customerName: 'Rahul Sharma',
    address: '123, MG Road, Pune',
    mobile: '9876543210',
    accountNumber: '111122223333',
    pouchNumber: 'BAG001',
    appraisalDate: formatDateTimeAMPM(now),
    apprenticeType: 'apprentice',
    reApprenticeName: '',
    purityTestMethod: 'TouchStone test, Acid Test',
    place: 'Main Branch',
    date: formatDateTimeAMPM(now),
    jewelryImage: 'https://dummyimage.com/150x100/cccccc/000.png&text=Jewellery',
    jewellerPhoto: getFullUrl(company.companyLogo),
    jewellerName: company.companyName,
    jewellerSubtitle: company.typeOfBusiness,
    jewellerPhone: company.companyPhone,
    jewellerMobile: company.companyMobile,
    jewellerAddress: company.companyAddress,
    jewellerEmail: company.companyEmail,
    jewellerAccount: 'A/c no: 1234567890',
    jewellerMembership: `IOV membership No. : ${company.membershipNo}`,
    goldRateDate: formatDateTimeAMPM(now),
    goldItems: [
      { description: 'Gold Ring', units: 2, purity: 22, grossWeight: 10.5, netWeight: 10.0, goldRate: 5000, approxValue: 50000 },
      { description: 'Gold Chain', units: 1, purity: 22, grossWeight: 20.0, netWeight: 19.5, goldRate: 5000, approxValue: 97500 },
    ],
    totalUnits: 3,
    totalGrossWeight: 30.5,
    totalNetWeight: 29.5,
    totalValue: 147500,
    valuations: [
      { percentage: 65, amount: 95875 },
      { percentage: 70, amount: 103250 },
    ],
    bankManagerName: '',
    signatureUrl: getFullUrl(company.signature),
  };
  res.render(path.join(process.cwd(), 'views', 'sbiTemplate.ejs'), data);
};

export const renderBarodaTemplateTest = (req, res) => {
  const data = {
    bankDetails: { 
      branch: "Hal chinchwad",
      logoUrl: "https://ganeshtest2.s3.ap-south-1.amazonaws.com/banklogos/bankofbaroda/1b7506ae-b7f7-4ca7-b386-72f1d7c3715e.png"
    },
    customerDetails: { name: "John Doe", accountNumber: "123456789", address: "Sample Address" },
    apprenticeType: "apprentice", // This will come from frontend
    jewellerDetails: { 
      logoName: "ABC Jewellers", 
      logoUrl: "https://.com/40x40/000/fff.png&text=Logo", 
      typeOfBusiness: "Goldsmith and Valuer",
      address: "123 Main St", 
      phone: "9876543210",
      email: "abc@jewellers.com",
      accountNumber: "ACC123456",
      iovMembershipNumber: "IOV789"
    },
    photoDetails: { photoUrl: "path/to/photo.jpg" },
    tableContent: [
      { description: "Gold Ring", grossWeight: "10g", netWeight: "9.5g", carat: "22", marketValue: "₹5,000", caratRate: "₹4,800", remarks: "Good", approxValue: "₹4,900" },
      { description: "Gold Chain", grossWeight: "20g", netWeight: "19g", carat: "22", marketValue: "₹10,000", caratRate: "₹9,800", remarks: "Excellent", approxValue: "₹9,700" }
    ],
    totalDetails: { totalGrossWeight: "30g", totalNetWeight: "28.5g", totalValue: "₹15,000", totalApproxValue: "₹14,600" },
    loanDetails: { amount: "₹12,000", dueDate: "31/12/2024", tests: ["Touchstone Test", "Acid Test", "XRF Test"] }
  };
  res.render('barodaTemplate', data);
}; 

export const renderBankOfMaharastraTest = (req, res) => {
  const now = new Date();
  const appraisalType = 'Appraised'; // or 'Reappraised' for testing
  // Only appraisalType comes from frontend, so set disclaimerAppraisalType based on that
  const disclaimerAppraisalType = appraisalType === 'Reappraised' ? 'reassessed/reappraised' : 'assessed/appraised';
  const data = {
    companyName: company.companyName,
    secondLineText: 'Gold Loan Appraisal Report',
    appraisalDate: now.toLocaleDateString('en-GB'),
    jewellerName: company.companyName,
    jewellerPhone: company.companyPhone,
    jewellerAddress: company.companyAddress,
    jewellerEmail: company.companyEmail,
    jewellerAccountNumber: 'GL123456789',
    iovMembershipNo: company.membershipNo,
    branchName: 'Pune Main',
    borrowerName: 'Rahul Sharma',
    cifNumber: 'CIF67890',
    requestedAmount: '9000',
    appraisalType,
    partyDetails: 'Rahul Sharma, 123, MG Road, Pune, for Gold Loan ' ,
    jewelryItems: [
      {
        description: 'Gold Ring',
        grossWeight: '10.5',
        netWeightExcludingStones: '10.0',
        purity: '22K',
        marketValue1: '50000',
        marketValue2: '51000',
      },
      {
        description: 'Gold Chain',
        grossWeight: '20.0',
        netWeightExcludingStones: '19.5',
        purity: '22K',
        marketValue1: '97500',
        marketValue2: '98000',
      },
    ],
    appraiserSignature: 'Amit Valuer',
    goldLoanAccountNo: 'GL123456789',
    officeCifNo: 'CIFOFF123',
    status: {
      sanctioned: true,
      rejected: false,
      sanctionedAmount: '95000',
    },
    totalGrossWeight: '30.5',
    eligibleNetWeight: '29.5',
    sanctionedAmount: '95000',
    sanctionDate: now.toLocaleDateString('en-GB'),
    loanTenure: '12 months',
    disclaimerAppraisalType,
    appraisalCharges: '500',
    jewellerSignatureUrl: getFullUrl(company.signature),
    officeDate: now.toLocaleDateString('en-GB'),
    bankLogoUrl: 'https://ganeshtest2.s3.ap-south-1.amazonaws.com/385-3856570_sbi-logo-%5Bstate-bank-of-india-group%5D-vector-eps-free-sbi-logo+(1).png',
    requestedBy: 'Rahul Sharma', // Always matches borrowerName
    jewellerPhotoUrl: getFullUrl(company.companyLogo),
  };
  // Calculate totals for the table
  const totalGrossWeight = data.jewelryItems.reduce((sum, item) => sum + parseFloat(item.grossWeight), 0).toFixed(2);
  const totalNetWeightExcludingStones = data.jewelryItems.reduce((sum, item) => sum + parseFloat(item.netWeightExcludingStones), 0).toFixed(2);
  const totalMarketValue1 = data.jewelryItems.reduce((sum, item) => sum + parseFloat(item.marketValue1), 0).toFixed(2);
  const totalMarketValue2 = data.jewelryItems.reduce((sum, item) => sum + parseFloat(item.marketValue2), 0).toFixed(2);
  data.totalGrossWeight = totalGrossWeight;
  data.totalNetWeightExcludingStones = totalNetWeightExcludingStones;
  data.totalMarketValue1 = totalMarketValue1;
  data.totalMarketValue2 = totalMarketValue2;
  res.render(path.join(process.cwd(), 'views', 'bankOfMaharastra.ejs'), data);
}; 

export const renderShivkrupaTest = (req, res) => {
  const dummyData = {
    companyName: "शिवकृपा सहकारी पतपेढी लि., मुंबई",
    certificateNumber: "001/2024",
    appraisalDate: "15/07/2024",
    managerName: "श्री. राजेश शर्मा",
    branchName: "पुणे मुख्य",
    evaluationDate: "15/07/2024",
    evaluatorDate: "15/07/2024",
    customerName: "श्रीमती सुनिता पाटील",
    customerAddress: "सदाशिव पेठ, पुणे",
    accountNumber: "1234567890",
    pouchNumber: "PCH001",
    additionalInfo: "सोने तारण कर्ज योजना",
    finalDate: "15/07/2024",
    place: "पुणे",
    jewellerLogo: "https://dummyimage.com/80x40/cccccc/000.png&text=Logo",
    jewellerName: "Shreenath Jewellers",
    jewellerAddress: "Near Marathi School, Manik chouk, Chakan, Pune, 410501",
    jewellerPhone: "(020)2728 0188",
    jewellerEmail: "anandsangvi@gmail.com",
    jewellerMembershipNo: "A641-5882-02",
    apprenticeType: "मूल्यांकन", // or 'पुनर्मूल्यांकन' for reappraisal
    jewellerPhoto: "https://ganeshtest2.s3.ap-south-1.amazonaws.com/banklogos/bankofmaharashtra/780fd568-672b-4881-9e0f-f284f0e0a977.png",
    jewellerSignature: "https://ganeshtest2.s3.ap-south-1.amazonaws.com/appimages/bb5d7411-9750-4952-a892-0af595186fbd.png",
    items: [
      {
        description: "सोन्याची साखळी (22 कॅरेट)",
        count: 1,
        totalWeight: "45.50",
        pureWeight: "42.30",
        marketRate: "₹5,600",
        estimatedValue: "₹2,53,800",
        sanctionedValue: "₹2,00,000"
      },
      {
        description: "सोन्याचे कानातले (22 कॅरेट)",
        count: 2,
        totalWeight: "12.25",
        pureWeight: "11.50",
        marketRate: "₹6,000",
        estimatedValue: "₹69,000",
        sanctionedValue: "₹55,000"
      },
      {
        description: "सोन्याचे बांगडे (जोडी)",
        count: 2,
        totalWeight: "28.75",
        pureWeight: "26.80",
        marketRate: "₹5,900",
        estimatedValue: "₹1,60,800",
        sanctionedValue: "₹1,30,000"
      },
      {
        description: "सोन्याची अंगठी (18 कॅरेट)",
        count: 1,
        totalWeight: "8.50",
        pureWeight: "6.40",
        marketRate: "₹5,500",
        estimatedValue: "₹35,200",
        sanctionedValue: "₹28,000"
      },
      {
        description: "सोन्याचा हार (22 कॅरेट)",
        count: 1,
        totalWeight: "65.30",
        pureWeight: "62.15",
        marketRate: "₹6,000",
        estimatedValue: "₹3,72,900",
        sanctionedValue: "₹3,00,000"
      }
    ]
  };

  // Calculate totals in the controller
  const totalCount = dummyData.items.reduce((sum, item) => sum + (Number(item.count) || 0), 0);
  const totalWeight = dummyData.items.reduce((sum, item) => sum + (Number(item.totalWeight) || 0), 0);
  const totalPureWeight = dummyData.items.reduce((sum, item) => sum + (Number(item.pureWeight) || 0), 0);
  const totalEstimated = dummyData.items.reduce((sum, item) => sum + (Number((item.estimatedValue||'').replace(/[^\d.]/g, '')) || 0), 0);
  const totalSanctioned = dummyData.items.reduce((sum, item) => sum + (Number((item.sanctionedValue||'').replace(/[^\d.]/g, '')) || 0), 0);

  dummyData.totalCount = totalCount;
  dummyData.totalWeight = totalWeight;
  dummyData.totalPureWeight = totalPureWeight;
  dummyData.totalEstimated = totalEstimated;
  dummyData.totalSanctioned = totalSanctioned;

  res.render(path.join(process.cwd(), 'views', 'shivkrupa.ejs'), dummyData);
}; 