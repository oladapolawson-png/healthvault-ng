import { useState, useEffect, useRef } from "react";

// ── Storage ───────────────────────────────────────────────────────
const DB = {
  get:(k)=>{ try{return JSON.parse(localStorage.getItem(k));}catch{return null;} },
  set:(k,v)=>{ try{localStorage.setItem(k,JSON.stringify(v));}catch{} },
};

// ── Offline queue ─────────────────────────────────────────────────
const Q = {
  push:(action)=>{ const q=DB.get("hvng_queue")||[]; DB.set("hvng_queue",[...q,{...action,id:Date.now()}]); },
  flush:()=>{ const q=DB.get("hvng_queue")||[]; q.forEach(a=>{ if(a.type==="addRecord"){ const recs=DB.get(`hvng_records_${a.phone}`)||[]; if(!recs.find(r=>r.id===a.rec.id)) DB.set(`hvng_records_${a.phone}`,[...recs,a.rec]); } }); DB.set("hvng_queue",[]); },
  count:()=>(DB.get("hvng_queue")||[]).length,
};

// ── Notifications ─────────────────────────────────────────────────
function pushNotif(phone,message,type="result",from=""){
  if(!phone) return;
  const all=DB.get(`hvng_notif_${phone}`)||[];
  DB.set(`hvng_notif_${phone}`,[{id:Date.now(),message,type,from,date:new Date().toISOString().split("T")[0],read:false},...all.slice(0,49)]);
}

// ── Seed ─────────────────────────────────────────────────────────
function seedDemo(){
  if(DB.get("hvng_seeded")) return;
  const patients=[
    {phone:"08012345678",name:"Adaeze Okonkwo",dob:"1990-03-15",gender:"F",bloodGroup:"O+",genotype:"AA",nhia:"NHIA/2024/001234",nokName:"Chukwuemeka Okonkwo",nokPhone:"08098765432",nokRelation:"Husband",address:"14 Bode Thomas St, Surulere, Lagos",occupation:"Teacher",allergies:"Penicillin",hmo:{provider:"Hygeia HMO",plan:"Silver",memberId:"HYG/2024/0089234",employerGroup:"Lagos State Civil Service",expiry:"2025-12-31",dependants:"Chukwuemeka Okonkwo (Spouse)"},vaccinations:[{id:1,name:"Yellow Fever",date:"2023-06-01",facility:"LUTH",batchNo:"YF2023A",nextDue:"2033-06-01"},{id:2,name:"Hepatitis B",date:"2022-03-15",facility:"Medicare Clinic",batchNo:"HB22B",nextDue:""},{id:3,name:"Tetanus Toxoid",date:"2024-01-10",facility:"Lagos Island General",batchNo:"TT24C",nextDue:"2029-01-10"}]},
    {phone:"08023456789",name:"Babatunde Fashola",dob:"1978-07-22",gender:"M",bloodGroup:"A+",genotype:"AS",nhia:"NHIA/2023/005678",nokName:"Kemi Fashola",nokPhone:"08111234567",nokRelation:"Wife",address:"22 Allen Ave, Ikeja, Lagos",occupation:"Civil Servant",allergies:"None known",hmo:{provider:"Reliance HMO",plan:"Reli-Health Plus",memberId:"REL/2023/0045678",employerGroup:"Federal Civil Service Commission",expiry:"2026-03-31",dependants:"Kemi Fashola (Spouse), Tolu Fashola (Child)"},vaccinations:[{id:1,name:"COVID-19 (AZ)",date:"2022-05-10",facility:"LASUTH",batchNo:"COV22A",nextDue:""}]},
    {phone:"08034567890",name:"Ngozi Eze",dob:"1995-11-08",gender:"F",bloodGroup:"B+",genotype:"AA",nhia:"NHIA/2024/009012",nokName:"Chidi Eze",nokPhone:"08155566778",nokRelation:"Brother",address:"5 Obi St, Enugu",occupation:"Nurse",allergies:"Sulfonamides",vaccinations:[{id:1,name:"Hepatitis B",date:"2021-09-01",facility:"UNTH Enugu",batchNo:"HB21C",nextDue:""}]},
    {phone:"08045678901",name:"Ibrahim Musa",dob:"1965-02-14",gender:"M",bloodGroup:"AB+",genotype:"AA",nhia:"NHIA/2022/003456",nokName:"Hauwa Musa",nokPhone:"08033344556",nokRelation:"Wife",address:"Block 7, Gwarinpa Estate, Abuja",occupation:"Retired",allergies:"Aspirin",vaccinations:[]},
    {phone:"08056789012",name:"Chidinma Okafor",dob:"2001-06-30",gender:"F",bloodGroup:"O-",genotype:"SC",nhia:"NHIA/2025/011234",nokName:"Mrs. Grace Okafor",nokPhone:"08077788990",nokRelation:"Mother",address:"3 University Rd, Nsukka",occupation:"Student",allergies:"None known",vaccinations:[{id:1,name:"Meningitis",date:"2023-08-15",facility:"University Clinic",batchNo:"MEN23D",nextDue:"2028-08-15"}]},
  ];
  DB.set("hvng_users",patients);
  DB.set("hvng_records_08012345678",[
    {id:1,date:"2026-01-28",careType:"MATERNITY",title:"ANC Visit - 28 Weeks",facility:"Lagos Island General",addedBy:"doctor",docEmail:"dr.emeka@hospital.ng",attachments:[],fields:{gestationalAge:"28 weeks",bp:"118/76",weight:"68",fundalHeight:"28",fetalHeartRate:"144",nextANC:"2026-02-25",complaint:"Mild ankle swelling",diagnosis:"Normal pregnancy - mild oedema",notes:"Iron supplements continued. Advised on birth preparedness."}},
    {id:2,date:"2026-01-10",careType:"GENERAL",title:"GP Visit - Malaria",facility:"Medicare Clinic, Surulere",addedBy:"doctor",docEmail:"dr.emeka@hospital.ng",attachments:[],fields:{complaint:"3-day fever, chills, headache",diagnosis:"Malaria (uncomplicated)",malariaRDT:"Positive",treatment:"Artemether-Lumefantrine 80/480mg BD x3 days",temp:"38.5",bp:"110/72",weight:"66",nextAppt:"2026-01-17",notes:"Advised hydration and rest."}},
    {id:3,date:"2026-01-02",careType:"LAB",title:"Malaria Parasite Test",facility:"Medilab Diagnostics, Ikeja",addedBy:"lab",labName:"Medilab Diagnostics",attachments:[],fields:{testCategory:"Malaria Test",testType:"Malaria Parasite (MP)",result:"Positive",parasiteDensity:"2+",method:"Microscopy",resultStatus:"Positive",notes:"Referred for treatment."}},
    {id:4,date:"2025-12-10",careType:"LAB",title:"HbA1c",facility:"MedCare Diagnostics",addedBy:"lab",labName:"MedCare Diagnostics",attachments:[],fields:{testCategory:"Blood Sugar",testType:"HbA1c",value:"7.8",unit:"%",resultStatus:"High",referenceRange:"<6.5%",interpretation:"Elevated - poor glycaemic control",notes:"Review in 3 months."}},
    {id:5,date:"2025-11-15",careType:"CHRONIC",title:"Hypertension Review",facility:"UNILAG Teaching Hospital",addedBy:"doctor",docEmail:"dr.emeka@hospital.ng",attachments:[],fields:{condition:"Hypertension (Stage 1)",complaint:"Persistent headaches",diagnosis:"Uncontrolled hypertension",bp:"148/94",weight:"67",bloodGlucose:"5.4",currentMeds:"Amlodipine 5mg OD",medsChange:"Increase to 10mg OD",nextReview:"2026-02-15",notes:"Encouraged salt reduction and exercise."}},
    {id:6,date:"2025-09-03",careType:"EMERGENCY",title:"Road Traffic Accident",facility:"General Hospital Lagos A&E",addedBy:"doctor",docEmail:"dr.emeka@hospital.ng",attachments:[],fields:{complaint:"Brought in after RTA. Laceration to left arm, bruised ribs.",bp:"100/68",temp:"36.8",pulse:"102",o2sat:"98",actionTaken:"Wound sutured. Chest X-ray - no fracture. Tetanus given.",referral:"Discharged - surgical OPD in 5 days",notes:"Conscious on arrival. No head injury."}},
    {id:7,date:"2025-08-01",careType:"CHRONIC",title:"Hypertension Review",facility:"UNILAG Teaching Hospital",addedBy:"doctor",docEmail:"dr.emeka@hospital.ng",attachments:[],fields:{condition:"Hypertension (Stage 1)",bp:"140/92",weight:"68",bloodGlucose:"5.2",notes:"Patient reports compliance with medication."}},
    {id:8,date:"2025-12-28",careType:"PHARMACY",title:"Prescription - Amlodipine",facility:"HealthPlus Pharmacy, Surulere",addedBy:"patient",attachments:[],fields:{brandName:"Norvasc",genericName:"Amlodipine",dose:"10mg",frequency:"Once daily",quantity:"30 tablets",nafdac:"A4-0056",prescribedBy:"Dr. Emeka Nwosu",dispensedBy:"PharmD. Sola Adeyemi",indication:"Hypertension management",notes:"Take in the morning with or without food."}},
  ]);
  DB.set("hvng_records_08023456789",[
    {id:1,date:"2026-02-10",careType:"CHRONIC",title:"Type 2 Diabetes Review",facility:"Ikeja General Hospital",addedBy:"doctor",docEmail:"dr.emeka@hospital.ng",attachments:[],fields:{condition:"Type 2 Diabetes Mellitus",complaint:"Increased thirst, polyuria",diagnosis:"Poorly controlled T2DM",bp:"136/88",weight:"89",bloodGlucose:"12.4",hba1c:"9.2%",currentMeds:"Metformin 500mg BD",medsChange:"Add Glibenclamide 5mg BD",nextReview:"2026-05-10",notes:"Dietary education given. Referral to dietician arranged."}},
    {id:2,date:"2026-01-20",careType:"LAB",title:"Fasting Blood Sugar",facility:"Medilab Diagnostics, Ikeja",addedBy:"lab",labName:"Medilab Diagnostics",attachments:[],fields:{testCategory:"Blood Sugar",testType:"Fasting Blood Sugar (FBS)",value:"12.4",unit:"mmol/L",resultStatus:"High",referenceRange:"3.9-5.5 mmol/L",interpretation:"Significantly elevated. Poor diabetic control.",notes:"Urgent review recommended."}},
    {id:3,date:"2025-12-01",careType:"LAB",title:"Lipid Profile",facility:"Medilab Diagnostics",addedBy:"lab",labName:"Medilab Diagnostics",attachments:[],fields:{testCategory:"Lipid Profile",testType:"Lipid Profile",totalCholesterol:"6.2",hdl:"0.9",ldl:"4.8",triglycerides:"3.1",resultStatus:"High",notes:"LDL significantly elevated. Start statin therapy."}},
    {id:4,date:"2025-11-05",careType:"GENERAL",title:"GP Visit - Foot Ulcer",facility:"Ikeja General Hospital",addedBy:"doctor",docEmail:"dr.emeka@hospital.ng",attachments:[],fields:{complaint:"Non-healing wound on right foot - 3 weeks",diagnosis:"Diabetic foot ulcer (Grade 2)",treatment:"Wound debridement, Amoxicillin-Clavulanate 625mg BD x10 days",notes:"Podiatry referral given. Patient counselled on foot care."}},
    {id:5,date:"2025-11-05",careType:"PHARMACY",title:"Prescription - Metformin",facility:"HealthPlus Pharmacy, Ikeja",addedBy:"patient",attachments:[],fields:{brandName:"Glucophage",genericName:"Metformin",dose:"500mg",frequency:"Twice daily with meals",quantity:"60 tablets",nafdac:"A4-1122",prescribedBy:"Dr. Emeka Nwosu",dispensedBy:"PharmD. Kemi Adebayo",indication:"Type 2 Diabetes Mellitus",notes:"Monitor blood glucose weekly."}},
  ]);
  DB.set("hvng_records_08034567890",[
    {id:1,date:"2026-03-05",careType:"MATERNITY",title:"ANC Visit - 20 Weeks",facility:"University of Nigeria Teaching Hospital",addedBy:"doctor",docEmail:"dr.fatima@hospital.ng",attachments:[],fields:{gestationalAge:"20 weeks",bp:"112/70",weight:"65",fundalHeight:"20",fetalHeartRate:"148",nextANC:"2026-04-02",complaint:"None - routine visit",diagnosis:"Normal pregnancy",notes:"Anomaly scan done - normal. Folic acid and iron continued."}},
    {id:2,date:"2026-02-15",careType:"LAB",title:"Antenatal Blood Panel",facility:"UNTH Enugu Lab",addedBy:"lab",labName:"UNEC Lab",attachments:[],fields:{testCategory:"Pregnancy / Antenatal",testType:"PCV / Haemoglobin",hb:"11.2",resultStatus:"Normal",notes:"HIV negative. Hepatitis B negative. Blood group B+."}},
    {id:3,date:"2026-01-10",careType:"GENERAL",title:"GP Visit - UTI",facility:"UNTH Enugu OPD",addedBy:"doctor",docEmail:"dr.fatima@hospital.ng",attachments:[],fields:{complaint:"Burning urination, frequency, lower abdominal pain",diagnosis:"Urinary Tract Infection (UTI)",treatment:"Nitrofurantoin 100mg BD x5 days",notes:"Urine M/C/S sent. Advised increased fluid intake."}},
    {id:4,date:"2026-01-08",careType:"LAB",title:"Urinalysis",facility:"UNTH Enugu Lab",addedBy:"lab",labName:"UNEC Lab",attachments:[],fields:{testCategory:"Urine / Infection / STI",testType:"Urinalysis",colour:"Yellow",appearance:"Turbid",protein:"Negative",glucose:"Negative",leukocytes:"Positive",nitrites:"Positive",resultStatus:"Abnormal",notes:"E. coli isolated on culture. Sensitive to Nitrofurantoin."}},
    {id:5,date:"2025-12-20",careType:"PHARMACY",title:"Prescription - Folic Acid",facility:"UNTH Pharmacy",addedBy:"patient",attachments:[],fields:{brandName:"Folate",genericName:"Folic Acid",dose:"5mg",frequency:"Once daily",quantity:"90 tablets",nafdac:"A4-2233",prescribedBy:"Dr. Fatima Bello",dispensedBy:"UNTH Pharmacy",indication:"Antenatal supplementation",notes:"Continue throughout pregnancy."}},
  ]);
  DB.set("hvng_records_08045678901",[
    {id:1,date:"2026-02-20",careType:"CHRONIC",title:"Hypertension + Diabetes Review",facility:"National Hospital Abuja",addedBy:"doctor",docEmail:"dr.emeka@hospital.ng",attachments:[],fields:{condition:"Hypertension (Stage 2) + Type 2 Diabetes",complaint:"Dizziness, blurred vision",diagnosis:"Uncontrolled hypertension and diabetes",bp:"165/102",weight:"94",bloodGlucose:"14.2",hba1c:"10.1%",currentMeds:"Lisinopril 10mg OD, Metformin 1g BD",medsChange:"Add Amlodipine 5mg OD",nextReview:"2026-04-20",notes:"Ophthalmology referral for diabetic retinopathy screen."}},
    {id:2,date:"2026-01-15",careType:"LAB",title:"HbA1c + Kidney Function",facility:"National Hospital Lab",addedBy:"lab",labName:"National Hospital Lab",attachments:[],fields:{testCategory:"Diabetes / Sugar",testType:"HbA1c",value:"10.1",unit:"%",resultStatus:"High",referenceRange:"<6.5%",interpretation:"Very poor glycaemic control.",notes:"Renal function - eGFR slightly reduced at 58 mL/min."}},
    {id:3,date:"2025-10-12",careType:"EMERGENCY",title:"Hypertensive Crisis",facility:"National Hospital Abuja A&E",addedBy:"doctor",docEmail:"dr.emeka@hospital.ng",attachments:[],fields:{complaint:"Sudden severe headache, nausea, BP 190/120 on arrival",bp:"190/120",temp:"37.1",pulse:"96",o2sat:"97",actionTaken:"IV Labetalol given. BP reduced to 155/95 over 2 hours.",referral:"Admitted 48hrs then discharged with medication adjustment.",notes:"Medication non-compliance identified. Counselled on adherence."}},
    {id:4,date:"2025-09-01",careType:"LAB",title:"Full Blood Count",facility:"National Hospital Lab",addedBy:"lab",labName:"National Hospital Lab",attachments:[],fields:{testCategory:"Full Blood Count",testType:"FBC",hb:"13.8",pcv:"42",wbc:"7.2",platelets:"210",neutrophils:"65",lymphocytes:"28",resultStatus:"Normal",notes:"All parameters within normal range."}},
    {id:5,date:"2026-02-20",careType:"PHARMACY",title:"Prescription - Lisinopril",facility:"National Hospital Pharmacy",addedBy:"patient",attachments:[],fields:{brandName:"Zestril",genericName:"Lisinopril",dose:"10mg",frequency:"Once daily in morning",quantity:"30 tablets",nafdac:"A4-0341",prescribedBy:"Dr. Emeka Nwosu",dispensedBy:"PharmD. Amina Sule",indication:"Hypertension + Diabetic nephroprotection",notes:"Avoid potassium supplements. Monitor renal function in 3 months."}},
  ]);
  DB.set("hvng_records_08056789012",[
    {id:1,date:"2026-03-01",careType:"EMERGENCY",title:"Sickle Cell Crisis - VOC",facility:"UNEC Teaching Hospital",addedBy:"doctor",docEmail:"dr.fatima@hospital.ng",attachments:[],fields:{complaint:"Severe bilateral leg pain, back pain - 2 days duration",bp:"108/70",temp:"38.2",pulse:"114",o2sat:"93",actionTaken:"IV morphine 5mg, IV fluids 3L, O2 therapy 4L/min, IV antibiotics started.",referral:"Admitted to haematology ward.",notes:"Known HbSC. Hydroxyurea therapy ongoing."}},
    {id:2,date:"2026-01-20",careType:"CHRONIC",title:"Sickle Cell Disease Review",facility:"UNEC Teaching Hospital",addedBy:"doctor",docEmail:"dr.fatima@hospital.ng",attachments:[],fields:{condition:"Sickle Cell Disease (HbSC)",complaint:"Mild fatigue, occasional joint pains",diagnosis:"Sickle cell disease - stable",bp:"104/68",weight:"52",currentMeds:"Hydroxyurea 500mg OD, Folic Acid 5mg OD, Penicillin V 250mg BD",nextReview:"2026-04-20",notes:"Advised hydration, avoid cold and over-exertion."}},
    {id:3,date:"2025-12-10",careType:"LAB",title:"Full Blood Count",facility:"UNEC Lab",addedBy:"lab",labName:"UNEC Lab",attachments:[],fields:{testCategory:"Full Blood Count",testType:"FBC",hb:"8.2",pcv:"25",wbc:"11.4",platelets:"320",neutrophils:"70",lymphocytes:"22",resultStatus:"Abnormal",notes:"Anaemia consistent with sickle cell disease."}},
    {id:4,date:"2025-11-01",careType:"LAB",title:"Malaria Screen",facility:"UNEC Lab",addedBy:"lab",labName:"UNEC Lab",attachments:[],fields:{testCategory:"Malaria Test",testType:"Malaria RDT",result:"Negative",parasiteDensity:"N/A",method:"RDT",resultStatus:"Negative",notes:"Malaria ruled out."}},
    {id:5,date:"2026-01-20",careType:"PHARMACY",title:"Prescription - Hydroxyurea",facility:"UNEC Teaching Hospital Pharmacy",addedBy:"patient",attachments:[],fields:{brandName:"Hydrea",genericName:"Hydroxyurea",dose:"500mg",frequency:"Once daily",quantity:"30 capsules",nafdac:"A4-3344",prescribedBy:"Dr. Fatima Bello",dispensedBy:"UNEC Pharmacy",indication:"Sickle cell disease - reduce painful crises",notes:"Blood count monitoring every 4 weeks."}},
  ]);
  DB.set("hvng_doctors",[
    {email:"dr.emeka@hospital.ng",password:"doctor123",name:"Dr. Emeka Nwosu",specialty:"General Practice",subSpecialty:"",hospitals:"Lagos Island General Hospital, Medicare Clinic",mdcn:"MDCN/2015/00123",qualification:"MBBS (Lagos)",phone:"08034567890",bio:"Experienced GP with 11 years of practice across Lagos.",verified:true},
    {email:"dr.fatima@hospital.ng",password:"doctor456",name:"Dr. Fatima Bello",specialty:"Obstetrics & Gynaecology",subSpecialty:"Maternal-Fetal Medicine",hospitals:"UNEC Teaching Hospital, National Hospital Abuja",mdcn:"MDCN/2018/00456",qualification:"MBBS (Abuja), FWACS",phone:"08077654321",bio:"Consultant obstetrician with focus on high-risk pregnancies.",verified:true},
  ]);
  DB.set("hvng_labs",[
    {email:"medilab@diagnostics.ng",password:"lab123",name:"Medilab Diagnostics",location:"Ikeja, Lagos",cacNumber:"CAC/BN/2021/123456"},
    {email:"unec@lab.ng",password:"lab456",name:"UNEC Lab",location:"Enugu, Enugu State",cacNumber:"CAC/BN/2019/654321"},
  ]);
  DB.set("hvng_dr_patients_dr.emeka@hospital.ng",[
    {phone:"08012345678",name:"Adaeze Okonkwo",dob:"1990-03-15",bloodGroup:"O+",genotype:"AA",gender:"F"},
    {phone:"08023456789",name:"Babatunde Fashola",dob:"1978-07-22",bloodGroup:"A+",genotype:"AS",gender:"M"},
    {phone:"08045678901",name:"Ibrahim Musa",dob:"1965-02-14",bloodGroup:"AB+",genotype:"AA",gender:"M"},
  ]);
  DB.set("hvng_dr_patients_dr.fatima@hospital.ng",[
    {phone:"08034567890",name:"Ngozi Eze",dob:"1995-11-08",bloodGroup:"B+",genotype:"AA",gender:"F"},
    {phone:"08056789012",name:"Chidinma Okafor",dob:"2001-06-30",bloodGroup:"O-",genotype:"SC",gender:"F"},
  ]);
  DB.set("hvng_lab_patients_medilab@diagnostics.ng",[
    {phone:"08012345678",name:"Adaeze Okonkwo",dob:"1990-03-15",bloodGroup:"O+",genotype:"AA"},
    {phone:"08023456789",name:"Babatunde Fashola",dob:"1978-07-22",bloodGroup:"A+",genotype:"AS"},
  ]);
  DB.set("hvng_lab_patients_unec@lab.ng",[
    {phone:"08034567890",name:"Ngozi Eze",dob:"1995-11-08",bloodGroup:"B+",genotype:"AA"},
    {phone:"08056789012",name:"Chidinma Okafor",dob:"2001-06-30",bloodGroup:"O-",genotype:"SC"},
  ]);
  DB.set("hvng_access_codes",[]);
  DB.set("hvng_notif_08012345678",[
    {id:1,message:"Medilab Diagnostics posted your Malaria Parasite Test result.",type:"result",from:"Medilab Diagnostics",date:"2026-01-02",read:false},
    {id:2,message:"Dr. Emeka Nwosu added a visit note from your GP appointment.",type:"visit",from:"Dr. Emeka Nwosu",date:"2026-01-10",read:true},
  ]);
  DB.set("hvng_seeded",true);
}

// ── Helpers ───────────────────────────────────────────────────────
const genOTP=()=>String(Math.floor(100000+Math.random()*900000));
const genCode=()=>Array.from({length:6},()=>"0123456789"[Math.floor(Math.random()*10)]).join("");
const getAge=dob=>Math.floor((Date.now()-new Date(dob))/(365.25*24*60*60*1000));
const fmt=ym=>{if(!ym||ym==="Unknown")return"Unknown";const[y,m]=ym.split("-");return new Date(y,m-1).toLocaleDateString("en-NG",{month:"long",year:"numeric"});};
const today=()=>new Date().toISOString().split("T")[0];
const LIMIT={notes:1000,short:300};

// ── Care config ───────────────────────────────────────────────────
const CARE={
  GENERAL:  {color:"#1D4ED8",bg:"#DBEAFE",icon:"🏥",label:"General",  desc:"GP, fever, infections"},
  MATERNITY:{color:"#7C3AED",bg:"#EDE9FE",icon:"🤱",label:"Maternity",desc:"ANC, delivery, postnatal"},
  LAB:      {color:"#D97706",bg:"#FEF3C7",icon:"🔬",label:"Lab",      desc:"Blood tests, diagnostics"},
  CHRONIC:  {color:"#059669",bg:"#D1FAE5",icon:"💊",label:"Chronic",  desc:"Hypertension, diabetes, sickle cell"},
  EMERGENCY:{color:"#DC2626",bg:"#FEE2E2",icon:"🚨",label:"Emergency",desc:"Accidents, acute illness"},
  PHARMACY: {color:"#0891B2",bg:"#CFFAFE",icon:"💊",label:"Pharmacy", desc:"Prescriptions, dispensing, NAFDAC"},
};
const CARE_TYPES=Object.keys(CARE);

// ── Nigerian HMO Data ─────────────────────────────────────────────
const HMO_PROVIDERS = {
  "Hygeia HMO": {
    plans: ["Basic","Bronze","Silver","Gold","Platinum","Executive"],
    phone: "0700-HYGEIA (0700-494342)",
    website: "hygeiahmo.com",
    email: "customercare@hygeiahmo.com",
    color: "#0047AB",
  },
  "Reliance HMO": {
    plans: ["Reli-Health Basic","Reli-Health Plus","Reli-Health Premium","Reli-Health Executive"],
    phone: "0700-RELIANCE (0700-7354262)",
    website: "reliancehmo.com",
    email: "hello@reliancehmo.com",
    color: "#E63946",
  },
  "AXA Mansard Health": {
    plans: ["SmartCare","ValueCare","StandardCare","PreferredCare","EliteCare"],
    phone: "01-279-4100",
    website: "axamansard.com",
    email: "health@axamansard.com",
    color: "#00539C",
  },
  "Aiico Multishield": {
    plans: ["Coral","Sapphire","Emerald","Ruby","Diamond"],
    phone: "01-279-5000",
    website: "aiicohmo.com",
    email: "info@aiicohmo.com",
    color: "#006400",
  },
  "Leadway Health": {
    plans: ["Bronze","Silver","Gold","Platinum"],
    phone: "0700-LEADWAY (0700-5323929)",
    website: "leadwayhealth.com",
    email: "health@leadway.com",
    color: "#C8102E",
  },
  "Avon HMO": {
    plans: ["Avon Flexi","Avon Essential","Avon Classic","Avon Premier","Avon Executive"],
    phone: "01-270-1000",
    website: "avonhmo.com",
    email: "info@avonhmo.com",
    color: "#FF6B00",
  },
  "Total Health Trust (THT)": {
    plans: ["THT Value","THT Essential","THT Classic","THT Premium","THT Diamond"],
    phone: "01-462-7777",
    website: "totalhealthtrust.com",
    email: "info@totalhealthtrust.com",
    color: "#003087",
  },
  "Clearline HMO": {
    plans: ["Basic","Standard","Premium","Executive"],
    phone: "0700-CLEARLINE",
    website: "clearlinehmo.com",
    email: "info@clearlinehmo.com",
    color: "#008080",
  },
  "Bastion Health": {
    plans: ["Bronze","Silver","Gold","Platinum"],
    phone: "01-279-8000",
    website: "bastionhmo.com",
    email: "info@bastionhmo.com",
    color: "#8B0000",
  },
  "Marina Medical": {
    plans: ["Classic","Premium","Executive"],
    phone: "01-270-5000",
    website: "marinamedical.com",
    email: "info@marinamedical.com",
    color: "#2E4057",
  },
  "Integrated Healthcare": {
    plans: ["Basic","Standard","Enhanced","Premium"],
    phone: "01-271-3000",
    website: "integratedhealthcareng.com",
    email: "info@integratedhealthcareng.com",
    color: "#4B0082",
  },
  "Sterling Health": {
    plans: ["Bronze","Silver","Gold","Platinum"],
    phone: "01-279-6000",
    website: "sterlinghmo.com",
    email: "info@sterlinghmo.com",
    color: "#B8860B",
  },
};
const HMO_NAMES = ["-- Select HMO Provider --",...Object.keys(HMO_PROVIDERS)];

const STATUS_OPTS=["Normal","High","Low","Positive","Negative","Pending","Unknown"];
const STATUS_COLOR={Normal:"#16A34A",High:"#DC2626",Low:"#D97706",Positive:"#DC2626",Negative:"#16A34A",Pending:"#78716C",Unknown:"#A8A29E"};

// ── Lab test definitions ──────────────────────────────────────────
const LAB_TESTS={
  "Malaria Test":{icon:"🦟",formatResult:(f)=>`Test: ${f.testType||"Malaria Parasite"}\nResult: ${f.result||"—"}\nParasite Density: ${f.parasiteDensity||"N/A"}\nMethod: ${f.method||"—"}`},
  "Full Blood Count":{icon:"🩸",formatResult:(f)=>`Hb: ${f.hb||"—"} g/dL  |  PCV: ${f.pcv||"—"}%  |  WBC: ${f.wbc||"—"} ×10⁹/L\nPlatelets: ${f.platelets||"—"} ×10⁹/L  |  Neutrophils: ${f.neutrophils||"—"}%  |  Lymphocytes: ${f.lymphocytes||"—"}%`},
  "Blood Sugar":{icon:"🍬",formatResult:(f)=>`Test: ${f.testType||"Blood Sugar"}\nResult: ${f.value||"—"} ${f.unit||"mg/dL"}\nReference: ${f.referenceRange||"—"}\nInterpretation: ${f.interpretation||"—"}`},
  "Urinalysis":{icon:"🧪",formatResult:(f)=>`Colour: ${f.colour||"—"}  |  Appearance: ${f.appearance||"—"}\nProtein: ${f.protein||"—"}  |  Glucose: ${f.glucose||"—"}  |  Leukocytes: ${f.leukocytes||"—"}\nKetones: ${f.ketones||"—"}  |  Blood: ${f.blood||"—"}  |  Nitrites: ${f.nitrites||"—"}\npH: ${f.ph||"—"}  |  Specific Gravity: ${f.specificGravity||"—"}`},
  "Lipid Profile":{icon:"💉",formatResult:(f)=>`Total Cholesterol: ${f.totalCholesterol||"—"} mg/dL\nHDL: ${f.hdl||"—"} mg/dL  |  LDL: ${f.ldl||"—"} mg/dL\nTriglycerides: ${f.triglycerides||"—"} mg/dL`},
  "Typhoid (Widal)":{icon:"🌡️",formatResult:(f)=>`S. Typhi O: ${f.salmonellaTyphi_O||"—"}  |  S. Typhi H: ${f.salmonellaTyphi_H||"—"}\nS. Paratyphi A: ${f.salmonellaParaTyphi_A||"—"}  |  S. Paratyphi B: ${f.salmonellaParaTyphi_B||"—"}\nInterpretation: ${f.interpretation||"—"}`},
  "Faecal Analysis":{icon:"🧫",formatResult:(f)=>"Colour: "+(f.faecalColour||"--")+"  |  Consistency: "+(f.faecalConsistency||"--")+"\nBlood: "+(f.faecalBlood||"--")+"  |  Mucus: "+(f.faecalMucus||"--")+"\nOva/Parasites: "+(f.ovaParasites||"--")+"  |  Occult Blood: "+(f.occultBlood||"--")+"\nMicroscopy: "+(f.faecalMicroscopy||"--")},
  "Other":{icon:"📋",formatResult:(f)=>"Test: "+(f.testName||"--")+"\n"+(f.results||"--")},
};
const LAB_TEST_KEYS=Object.keys(LAB_TESTS);

// ── Quick presets ─────────────────────────────────────────────────
const QUICK={
  GENERAL:[
    {label:"Malaria",icon:"🦟",fields:{diagnosis:"Malaria (uncomplicated)",malariaRDT:"Positive",treatment:"Artemether-Lumefantrine 80/480mg BD x3 days"}},
    {label:"Typhoid Fever",icon:"🌡️",fields:{diagnosis:"Typhoid Fever",treatment:"Ciprofloxacin 500mg BD x7 days"}},
    {label:"URTI / Cold",icon:"🤧",fields:{diagnosis:"Upper Respiratory Tract Infection",treatment:"Paracetamol 1g TDS + rest"}},
    {label:"Hypertension",icon:"❤️",fields:{diagnosis:"Hypertension — new presentation",treatment:"Amlodipine 5mg OD started"}},
    {label:"PUD / Gastritis",icon:"🫃",fields:{diagnosis:"Peptic Ulcer Disease",treatment:"Omeprazole 20mg BD + Metronidazole 400mg TDS x7 days"}},
  ],
  MATERNITY:[
    {label:"ANC Visit",icon:"🤱",fields:{diagnosis:"Normal pregnancy",title:"ANC Visit"}},
    {label:"Labour",icon:"🏥",fields:{diagnosis:"Active labour",title:"Labour / Delivery"}},
    {label:"Postnatal",icon:"👶",fields:{diagnosis:"Postnatal review",title:"Postnatal Visit"}},
    {label:"Pre-eclampsia",icon:"⚠️",fields:{diagnosis:"Pre-eclampsia",complaint:"High BP, headache, facial oedema",title:"Pre-eclampsia Review"}},
    {label:"Threatened Abortion",icon:"💔",fields:{diagnosis:"Threatened abortion",complaint:"PV bleeding, lower abdominal pain",title:"Threatened Abortion"}},
  ],
  CHRONIC:[
    {label:"Hypertension",icon:"❤️",fields:{condition:"Hypertension",diagnosis:"Hypertension follow-up"}},
    {label:"Diabetes",icon:"🩸",fields:{condition:"Type 2 Diabetes Mellitus",diagnosis:"Diabetes mellitus follow-up"}},
    {label:"Sickle Cell",icon:"🔴",fields:{condition:"Sickle Cell Disease (HbSS)",diagnosis:"Sickle cell disease review"}},
    {label:"Asthma",icon:"💨",fields:{condition:"Bronchial Asthma",currentMeds:"Salbutamol inhaler PRN"}},
    {label:"HIV / ARV",icon:"💊",fields:{condition:"HIV — on ARV therapy",diagnosis:"HIV/ARV monitoring visit"}},
  ],
  EMERGENCY:[
    {label:"RTA",icon:"🚗",fields:{title:"Road Traffic Accident",complaint:"Trauma following road traffic accident."}},
    {label:"Severe Malaria",icon:"🦟",fields:{title:"Severe Malaria",complaint:"High fever, rigors, altered consciousness."}},
    {label:"Chest Pain",icon:"💔",fields:{title:"Acute Chest Pain",complaint:"Sudden onset severe chest pain."}},
    {label:"Stroke / LOC",icon:"🧠",fields:{title:"Stroke / Loss of Consciousness",complaint:"Sudden weakness or loss of consciousness."}},
    {label:"Burns / Trauma",icon:"🔥",fields:{title:"Burns / Trauma",complaint:"Burns / blunt trauma injury."}},
  ],
  PHARMACY:[
    {label:"Artemether-Lume",icon:"🦟",fields:{genericName:"Artemether-Lumefantrine",dose:"80/480mg",frequency:"BD x3 days",indication:"Malaria treatment",nafdac:"A4-0234"}},
    {label:"Amoxicillin",icon:"💊",fields:{genericName:"Amoxicillin",dose:"500mg",frequency:"TDS x7 days",indication:"Bacterial infection",nafdac:"A4-0112"}},
    {label:"Amlodipine",icon:"❤️",fields:{genericName:"Amlodipine",dose:"5mg",frequency:"Once daily",indication:"Hypertension",nafdac:"A4-0056"}},
    {label:"Metformin",icon:"🩸",fields:{genericName:"Metformin",dose:"500mg",frequency:"BD with meals",indication:"Type 2 Diabetes",nafdac:"A4-1122"}},
    {label:"Ciprofloxacin",icon:"🌡️",fields:{genericName:"Ciprofloxacin",dose:"500mg",frequency:"BD x5-7 days",indication:"Bacterial infection",nafdac:"A4-0789"}},
  ],
};

// ── Styles ────────────────────────────────────────────────────────
const G="#14532D",GB="#1D4ED8",GL="#B45309",GP="#0891B2",GA="#EAB308";
const S={
  page:{minHeight:"100vh",background:"#F5F4F0",fontFamily:"'DM Sans',system-ui,sans-serif",color:"#1C1917"},
  card:{background:"#fff",borderRadius:16,padding:"20px 22px",border:"1px solid #EAE8E3",boxShadow:"0 2px 8px rgba(0,0,0,.05),0 0 1px rgba(0,0,0,.06)"},
  inp:{width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid #D6D3CE",fontSize:15,background:"#FAFAF9",outline:"none",boxSizing:"border-box",fontFamily:"inherit",transition:"border .15s"},
  lbl:{fontSize:11,fontWeight:700,color:"#6B6862",marginBottom:5,display:"block",textTransform:"uppercase",letterSpacing:.6},
  btnG:{width:"100%",padding:14,borderRadius:12,background:G,color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:"pointer",boxShadow:"0 2px 8px rgba(20,83,45,.25)"},
  btnB:{width:"100%",padding:14,borderRadius:12,background:GB,color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:"pointer",boxShadow:"0 2px 8px rgba(29,78,216,.2)"},
  btnL:{width:"100%",padding:14,borderRadius:12,background:GL,color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:"pointer",boxShadow:"0 2px 8px rgba(180,83,9,.2)"},
  sm:(v="g")=>({padding:"9px 16px",borderRadius:10,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,
    background:v==="g"?G:v==="b"?GB:v==="l"?GL:v==="r"?"#DC2626":"transparent",
    color:v==="ghost"?G:"#fff",border:v==="ghost"?`1.5px solid ${G}`:"none"}),
  topBar:(c=G)=>({background:c,color:"#fff",padding:"15px 20px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 2px 12px rgba(0,0,0,.12)"}),
  toast:(t)=>({position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",background:t==="err"?"#DC2626":t==="info"?"#1D4ED8":G,color:"#fff",padding:"13px 24px",borderRadius:99,fontSize:14,fontWeight:600,zIndex:9999,whiteSpace:"nowrap",boxShadow:"0 8px 30px rgba(0,0,0,.2)"}),
};

// ── Root ──────────────────────────────────────────────────────────
export default function App(){
  const [scr,setScr]=useState("landing");
  const [user,setUser]=useState(null);
  const [doc,setDoc]=useState(null);
  const [lab,setLab]=useState(null);
  const [vp,setVp]=useState(null);
  const [phone,setPhone]=useState("");
  const [otp,setOtp]=useState("");
  const [sub,setSub]=useState("dashboard");
  const [toast,setToast]=useState(null);
  const [detail,setDetail]=useState(null);
  const [modal,setModal]=useState(null); // "emergency"|"referral"|"vaccinations"|"maternal"|"vitals"|"notif"
  const [online,setOnline]=useState(navigator.onLine);
  const [qCount,setQCount]=useState(Q.count());
  const blank=()=>({careType:"GENERAL",title:"",facility:"",date:"",fields:{},attachments:[]});
  const [form,setForm]=useState(blank());

  useEffect(()=>{
    seedDemo();
    if(!document.getElementById("hvng-fonts")){
      const l=document.createElement("link");l.id="hvng-fonts";l.rel="stylesheet";
      l.href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700;900&family=DM+Sans:wght@400;500;600;700&display=swap";
      document.head.appendChild(l);
    }
    const on=()=>{setOnline(true);Q.flush();setQCount(0);};
    const off=()=>setOnline(false);
    window.addEventListener("online",on);window.addEventListener("offline",off);
    return()=>{window.removeEventListener("online",on);window.removeEventListener("offline",off);};
  },[]);

  const flash=(msg,type="ok",ms=3500)=>{setToast({msg,type});setTimeout(()=>setToast(null),ms);};
  const go=(s,sp)=>{setScr(s);if(sp)setSub(sp);};
  const ctx={go,user,setUser,doc,setDoc,lab,setLab,vp,setVp,phone,setPhone,otp,setOtp,sub,setSub,flash,setDetail,modal,setModal,online,qCount,setQCount,form,setForm,blank};

  const MAP={
    landing:       <Landing ctx={ctx}/>,
    "pt-login":    <PtLogin ctx={ctx}/>,
    "pt-otp":      <PtOTP ctx={ctx}/>,
    "pt-register": <PtRegister ctx={ctx}/>,
    "pt-app":      <PtApp ctx={ctx}/>,
    "dr-login":    <DrLogin ctx={ctx}/>,
    "dr-register": <DrRegister ctx={ctx}/>,
    "dr-app":      <DrApp ctx={ctx}/>,
    "dr-view":     <DrView ctx={ctx}/>,
    "dr-newvisit": <DrNewVisit ctx={ctx}/>,
    "lab-login":   <LabLogin ctx={ctx}/>,
    "lab-app":     <LabApp ctx={ctx}/>,
  };

  return(<>
    <style>{`*{margin:0;padding:0;box-sizing:border-box} input:focus,select:focus,textarea:focus{border-color:#14532D!important;box-shadow:0 0 0 3px rgba(20,83,45,.1)!important} @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} @keyframes sheetIn{from{transform:translateY(100%)}to{transform:translateY(0)}} .fade{animation:slideUp .2s ease} .sheet-anim{animation:sheetIn .28s ease} ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#D0CEC9;border-radius:99px} @media(min-width:768px){.dsbar{display:flex!important}}`}</style>
    {/* Desktop shell */}
    <div style={{minHeight:"100vh",background:"#0F3D23",display:"flex"}}>
      <div className="dsbar" style={{display:"none",width:340,flexDirection:"column",justifyContent:"center",padding:"60px 44px",color:"#fff",flexShrink:0}}>
        <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:40,fontWeight:900,lineHeight:1.1,marginBottom:14}}>HealthVault<br/><span style={{color:"#86EFAC"}}>NG</span></div>
        <div style={{fontSize:13,opacity:.5,letterSpacing:2,marginBottom:24}}>NIGERIA'S PATIENT HEALTH RECORD PLATFORM</div>
        <div style={{fontSize:14,opacity:.7,lineHeight:1.9,marginBottom:36}}>Secure health records shared seamlessly between patients, doctors and labs across Nigeria.</div>
        {[["👤","Patients","Phone + OTP · Full record control"],["🩺","Clinicians","MDCN registration · AI summaries"],["🔬","Labs","Structured results · AI auto-fill"]].map(([icon,t,d])=>(
          <div key={t} style={{display:"flex",gap:12,padding:"12px 14px",background:"rgba(255,255,255,.07)",borderRadius:12,marginBottom:10}}>
            <span style={{fontSize:20}}>{icon}</span>
            <div><div style={{fontWeight:700,fontSize:13}}>{t}</div><div style={{fontSize:11,opacity:.6,marginTop:2}}>{d}</div></div>
          </div>
        ))}
        <div style={{marginTop:36,fontSize:11,opacity:.35}}>🔒 Offline-first · No ads · Data stays on your device</div>
      </div>
      <div style={{flex:1,background:"#F5F4F0",display:"flex",justifyContent:"center"}}>
        <div style={{width:"100%",maxWidth:480,position:"relative"}}>
          <div style={S.page} className="fade">
            {!online&&<div style={{background:"#FEF3C7",color:"#92400E",padding:"8px 16px",fontSize:12,fontWeight:600,textAlign:"center",borderBottom:"1px solid #FCD34D"}}>⚡ Offline — changes will sync when you reconnect{qCount>0?` (${qCount} queued)`:""}</div>}
            {MAP[scr]??MAP.landing}
            {toast&&<div style={S.toast(toast.type)}>{toast.type==="ok"?"✓ ":toast.type==="err"?"✗ ":"ℹ "}{toast.msg}</div>}
            {detail&&<RecordDetail rec={detail} ctx={ctx} onClose={()=>setDetail(null)}/>}
            {modal==="notif"&&user&&<NotifSheet phone={user.phone} onClose={()=>setModal(null)}/>}
            {modal==="emergency"&&(user||vp)&&<EmergencyCard person={user||vp} recs={DB.get(`hvng_records_${(user||vp).phone}`)||[]} onClose={()=>setModal(null)}/>}
            {modal==="referral"&&vp&&<ReferralLetter pt={vp} doc={doc} recs={DB.get(`hvng_records_${vp.phone}`)||[]} onClose={()=>setModal(null)} flash={flash}/>}
            {modal==="vaccinations"&&user&&<VaccinationSheet user={user} setUser={setUser} onClose={()=>setModal(null)} flash={flash}/>}
            {modal==="maternal"&&(user||vp)&&<MaternalDashboard recs={DB.get(`hvng_records_${(user||vp).phone}`)||[]} user={user||vp} onClose={()=>setModal(null)}/>}
            {modal==="vitals"&&(user||vp)&&<VitalTrends recs={DB.get(`hvng_records_${(user||vp).phone}`)||[]} onClose={()=>setModal(null)}/>}
            {modal==="hmo"&&user&&<HMOCardModal user={user} onClose={()=>setModal(null)} flash={flash} onSave={(hmo)=>{const users=DB.get("hvng_users")||[];const updated=users.map(u=>u.phone===user.phone?{...u,hmo}:u);DB.set("hvng_users",updated);setUser({...user,hmo});setModal(null);}}/>}
            {modal==="summary"&&(user||vp)&&<AISummaryModal patient={user||vp} recs={DB.get(`hvng_records_${(user||vp).phone}`)||[]} onClose={()=>setModal(null)} flash={flash}/>}
          </div>
        </div>
      </div>
    </div>
  </>);
}

// ── NOTIFICATION SHEET ────────────────────────────────────────────
function NotifSheet({phone,onClose}){
  const [notifs]=useState(()=>{const all=DB.get(`hvng_notif_${phone}`)||[];DB.set(`hvng_notif_${phone}`,all.map(n=>({...n,read:true})));return all;});
  return(<Sheet onClose={onClose} title="Notifications">
    {!notifs.length&&<Empty msg="No notifications yet."/>}
    {notifs.map(n=>(
      <div key={n.id} style={{display:"flex",gap:12,padding:"12px 14px",borderRadius:12,background:n.read?"#FAFAF9":"#F0FDF4",border:`1px solid ${n.read?"#E5E2DB":"#BBF7D0"}`,marginBottom:8}}>
        <span style={{fontSize:20}}>{n.type==="result"?"🔬":n.type==="visit"?"🏥":"🔐"}</span>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:n.read?400:600,lineHeight:1.55}}>{n.message}</div>{n.from&&<div style={{fontSize:11,color:"#78716C",marginTop:2}}>From: {n.from}</div>}<div style={{fontSize:11,color:"#A8A29E",marginTop:1}}>{n.date}</div></div>
      </div>
    ))}
    <button style={{...S.btnG,marginTop:16}} onClick={onClose}>Close</button>
  </Sheet>);
}

// ── EMERGENCY CARD ────────────────────────────────────────────────
function EmergencyCard({person,recs,onClose}){
  const p=person;
  const recent=recs.sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,3);
  const meds=[...new Set(recs.filter(r=>r.fields?.currentMeds).map(r=>r.fields.currentMeds))].slice(0,3);
  const share=()=>{
    const text=`🚨 EMERGENCY HEALTH CARD — ${p.name}\nBlood Group: ${p.bloodGroup} | Genotype: ${p.genotype} | DOB: ${p.dob}\nAllergies: ${p.allergies||"None known"}\nNext of Kin: ${p.nokName||"—"} (${p.nokRelation||"—"}) — ${p.nokPhone||"—"}\nCurrent Medications: ${meds.join(", ")||"None listed"}\nRecent conditions: ${recent.map(r=>r.fields?.diagnosis||r.title).join(", ")}\nNHIA: ${p.nhia||"N/A"}`;
    if(navigator.share){navigator.share({title:"Emergency Health Card",text});}
    else{navigator.clipboard.writeText(text).catch(()=>{});alert("Copied to clipboard!");}
  };
  return(<Sheet onClose={onClose} title="🚨 Emergency Card">
    <div style={{background:"linear-gradient(135deg,#DC2626,#EF4444)",borderRadius:16,padding:"20px",color:"#fff",marginBottom:16}}>
      <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:22,fontWeight:900}}>{p.name}</div>
      <div style={{fontSize:13,opacity:.85,marginTop:4}}>{p.dob} · {p.gender==="F"?"Female":"Male"}</div>
      <div style={{display:"flex",gap:16,marginTop:14,flexWrap:"wrap"}}>
        {[["Blood Group",p.bloodGroup],["Genotype",p.genotype],["NHIA",p.nhia||"N/A"]].map(([l,v])=>(<div key={l}><div style={{fontSize:10,opacity:.7,fontWeight:700}}>{l}</div><div style={{fontSize:18,fontWeight:900}}>{v}</div></div>))}
      </div>
    </div>
    {[["⚠️ Allergies",p.allergies||"None known"],["💊 Current Meds",meds.join(", ")||"None listed"],["👤 Next of Kin",`${p.nokName||"—"} (${p.nokRelation||"—"}) · ${p.nokPhone||"—"}`]].map(([l,v])=>(
      <div key={l} style={{marginBottom:12}}><div style={S.lbl}>{l}</div><div style={{fontSize:14,background:"#F9F7F4",padding:"10px 13px",borderRadius:10,lineHeight:1.5}}>{v}</div></div>
    ))}
    {recent.length>0&&(<div style={{marginBottom:12}}><div style={S.lbl}>Recent Conditions</div>
      {recent.map((r,i)=><div key={i} style={{fontSize:13,padding:"6px 12px",background:"#FEE2E2",borderRadius:8,marginBottom:5,color:"#991B1B",fontWeight:600}}>{r.fields?.diagnosis||r.title} · {r.date}</div>)}
    </div>)}
    <button style={{...S.sm("r"),width:"100%",padding:13,fontSize:14,background:"#DC2626",color:"#fff",border:"none",borderRadius:12,cursor:"pointer",marginBottom:10,fontWeight:700}} onClick={share}>📤 Share Emergency Card</button>
    <button style={{...S.btnG}} onClick={onClose}>Close</button>
  </Sheet>);
}

// ── VACCINATION SHEET ─────────────────────────────────────────────
function VaccinationSheet({user,setUser,onClose,flash}){
  const [vaccs,setVaccs]=useState(user.vaccinations||[]);
  const [showForm,setShowForm]=useState(false);
  const [f,setF]=useState({name:"",date:"",facility:"",batchNo:"",nextDue:""});
  const upd=(k,v)=>setF(p=>({...p,[k]:v}));
  const save=()=>{
    if(!f.name||!f.date) return flash("Vaccine name and date required","err");
    const nv=[...vaccs,{...f,id:Date.now()}];
    setVaccs(nv);
    const users=DB.get("hvng_users")||[];
    const updated={...user,vaccinations:nv};
    DB.set("hvng_users",users.map(u=>u.phone===user.phone?updated:u));
    setUser(updated);
    setF({name:"",date:"",facility:"",batchNo:"",nextDue:""});
    setShowForm(false);flash("Vaccination record saved");
  };
  return(<Sheet onClose={onClose} title="💉 Vaccination Records">
    <button onClick={()=>setShowForm(!showForm)} style={{...S.sm("g"),marginBottom:16,padding:"9px 16px"}}>＋ Add Vaccination</button>
    {showForm&&(<div style={{...S.card,marginBottom:16,border:`1.5px solid ${G}`}}>
      <Fl label="Vaccine Name *"><input style={S.inp} placeholder="e.g. Yellow Fever, Hepatitis B" value={f.name} onChange={e=>upd("name",e.target.value)}/></Fl>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Fl label="Date Given *"><input type="date" style={S.inp} value={f.date} onChange={e=>upd("date",e.target.value)}/></Fl>
        <Fl label="Next Due (optional)"><input type="date" style={S.inp} value={f.nextDue} onChange={e=>upd("nextDue",e.target.value)}/></Fl>
        <Fl label="Facility"><input style={S.inp} value={f.facility} onChange={e=>upd("facility",e.target.value)}/></Fl>
        <Fl label="Batch No."><input style={S.inp} value={f.batchNo} onChange={e=>upd("batchNo",e.target.value)}/></Fl>
      </div>
      <button style={S.btnG} onClick={save}>Save</button>
    </div>)}
    {!vaccs.length&&<Empty msg="No vaccination records yet."/>}
    {vaccs.map(v=>(
      <div key={v.id} style={{...S.card,marginBottom:10,borderLeft:"4px solid #16A34A"}}>
        <div style={{fontWeight:700,fontSize:15}}>{v.name}</div>
        <div style={{fontSize:12,color:"#78716C",marginTop:4}}>📅 {v.date}{v.facility?` · 🏥 ${v.facility}`:""}</div>
        {v.batchNo&&<div style={{fontSize:12,color:"#78716C"}}>Batch: {v.batchNo}</div>}
        {v.nextDue&&<div style={{marginTop:6,background:"#DCFCE7",color:"#15803D",fontSize:12,fontWeight:600,padding:"4px 10px",borderRadius:8,display:"inline-block"}}>Next due: {v.nextDue}</div>}
      </div>
    ))}
    <button style={{...S.btnG,marginTop:8}} onClick={onClose}>Close</button>
  </Sheet>);
}

// ── MATERNAL DASHBOARD ────────────────────────────────────────────
function MaternalDashboard({recs,user,onClose}){
  const ancRecs=recs.filter(r=>r.careType==="MATERNITY").sort((a,b)=>new Date(b.date)-new Date(a.date));
  const latest=ancRecs[0];
  const ga=latest?.fields?.gestationalAge||"";
  const weeksMatch=ga.match(/(\d+)/);
  const weeksNow=weeksMatch?parseInt(weeksMatch[1]):null;
  const edd=weeksNow?new Date(Date.now()+(40-weeksNow)*7*24*60*60*1000).toISOString().split("T")[0]:null;
  const daysToEDD=edd?Math.round((new Date(edd)-Date.now())/(24*60*60*1000)):null;
  return(<Sheet onClose={onClose} title="🤱 Maternal Dashboard">
    {edd&&(<div style={{background:"linear-gradient(135deg,#7C3AED,#9333EA)",borderRadius:16,padding:"20px",color:"#fff",marginBottom:16,textAlign:"center"}}>
      <div style={{fontSize:12,opacity:.8,marginBottom:6}}>ESTIMATED DATE OF DELIVERY</div>
      <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:28,fontWeight:900}}>{edd}</div>
      <div style={{fontSize:14,opacity:.85,marginTop:6}}>{daysToEDD>0?`${daysToEDD} days to go`:"Due date reached!"}</div>
      <div style={{marginTop:12,background:"rgba(255,255,255,.15)",borderRadius:10,padding:"8px",fontSize:13}}>Current GA: {ga}</div>
    </div>)}
    <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:16,fontWeight:700,marginBottom:12,color:"#7C3AED"}}>ANC Visit Timeline</div>
    {!ancRecs.length&&<Empty msg="No maternity records found."/>}
    {ancRecs.map((r,i)=>(
      <div key={r.id} style={{display:"flex",gap:12,marginBottom:12}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",flex:"none"}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:i===0?"#7C3AED":"#E5E2DB",color:i===0?"#fff":"#78716C",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13}}>{ancRecs.length-i}</div>
          {i<ancRecs.length-1&&<div style={{width:2,flex:1,background:"#E5E2DB",margin:"4px 0"}}/>}
        </div>
        <div style={{...S.card,flex:1,padding:"12px 14px",marginBottom:0}}>
          <div style={{fontWeight:600,fontSize:14}}>{r.title}</div>
          <div style={{fontSize:12,color:"#78716C",marginTop:2}}>{r.date} · {r.facility}</div>
          {r.fields?.bp&&<div style={{fontSize:12,color:"#7C3AED",marginTop:4,fontWeight:600}}>BP: {r.fields.bp} · Weight: {r.fields.weight}kg{r.fields.gestationalAge?` · GA: ${r.fields.gestationalAge}`:""}</div>}
          {r.fields?.diagnosis&&<div style={{fontSize:12,color:"#57534E",marginTop:3}}>{r.fields.diagnosis}</div>}
          {r.fields?.nextANC&&<div style={{fontSize:11,color:"#15803D",fontWeight:600,marginTop:4}}>Next ANC: {r.fields.nextANC}</div>}
        </div>
      </div>
    ))}
    <button style={{...S.btnG,marginTop:8}} onClick={onClose}>Close</button>
  </Sheet>);
}

// ── VITAL TRENDS ──────────────────────────────────────────────────
function VitalTrends({recs,onClose}){
  const bpRecs=recs.filter(r=>r.fields?.bp).map(r=>({date:r.date,bp:r.fields.bp,label:r.title})).sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(-8);
  const parseBP=str=>{const m=(str||"").match(/(\d+)[\/](\d+)/);return m?{s:parseInt(m[1]),d:parseInt(m[2])}:null;};
  const bpData=bpRecs.map(r=>({...r,parsed:parseBP(r.bp)})).filter(r=>r.parsed);
  const maxS=Math.max(...bpData.map(r=>r.parsed.s),140);
  const minS=Math.min(...bpData.map(r=>r.parsed.s),80);
  const range=maxS-minS||40;
  const H=120,W_total=280;
  const pts=bpData.map((r,i)=>({x:i*(W_total/(bpData.length-1||1)),ys:H-(r.parsed.s-minS)/range*H,yd:H-(r.parsed.d-minS)/range*H}));
  const polyS=pts.map(p=>`${p.x},${p.ys}`).join(" ");
  const polyD=pts.map(p=>`${p.x},${p.yd}`).join(" ");

  const wRecs=recs.filter(r=>r.fields?.weight).map(r=>({date:r.date,w:parseFloat(r.fields.weight)||0})).sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(-8);
  const bgRecs=recs.filter(r=>r.fields?.bloodGlucose).map(r=>({date:r.date,bg:r.fields.bloodGlucose})).sort((a,b)=>new Date(a.date)-new Date(b.date));

  return(<Sheet onClose={onClose} title="📈 Vital Trends">
    {/* BP Chart */}
    <div style={{...S.card,marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:14,marginBottom:12,color:"#DC2626"}}>❤️ Blood Pressure Trend</div>
      {bpData.length<2?<Empty msg="Need at least 2 BP readings to show trend."/>:(
        <>
          <svg viewBox={`0 0 ${W_total} ${H+20}`} style={{width:"100%",overflow:"visible"}}>
            <polyline points={polyS} fill="none" stroke="#DC2626" strokeWidth={2.5} strokeLinejoin="round"/>
            <polyline points={polyD} fill="none" stroke="#1D4ED8" strokeWidth={2} strokeLinejoin="round" strokeDasharray="5,3"/>
            {pts.map((p,i)=>(
              <g key={i}>
                <circle cx={p.x} cy={p.ys} r={4} fill="#DC2626"/>
                <circle cx={p.x} cy={p.yd} r={3} fill="#1D4ED8"/>
                <text x={p.x} y={H+14} textAnchor="middle" fontSize={8} fill="#A8A29E">{bpData[i].date.slice(5)}</text>
              </g>
            ))}
            <line x1={0} y1={H*(1-(120-minS)/range)} x2={W_total} y2={H*(1-(120-minS)/range)} stroke="#DC262622" strokeWidth={1} strokeDasharray="4,4"/>
          </svg>
          <div style={{display:"flex",gap:16,marginTop:6}}>
            <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#DC2626",fontWeight:600}}><div style={{width:16,height:2,background:"#DC2626",borderRadius:1}}/> Systolic</div>
            <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#1D4ED8",fontWeight:600}}><div style={{width:16,height:2,background:"#1D4ED8",borderRadius:1}}/> Diastolic</div>
          </div>
          <div style={{marginTop:8,display:"flex",gap:8,flexWrap:"wrap"}}>
            {bpData.slice(-3).reverse().map((r,i)=>(
              <div key={i} style={{background:"#F9F7F4",borderRadius:8,padding:"6px 10px",fontSize:12}}><div style={{fontWeight:700,color:"#DC2626"}}>{r.bp}</div><div style={{color:"#78716C",fontSize:10,marginTop:1}}>{r.date}</div></div>
            ))}
          </div>
        </>
      )}
    </div>
    {/* Weight */}
    {wRecs.length>0&&(<div style={{...S.card,marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:14,marginBottom:10,color:G}}>⚖️ Weight History</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {wRecs.map((r,i)=>(
          <div key={i} style={{background:"#F0FDF4",borderRadius:10,padding:"8px 12px",textAlign:"center"}}>
            <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:18,fontWeight:900,color:G}}>{r.w}</div>
            <div style={{fontSize:10,color:"#78716C",fontWeight:600}}>kg</div>
            <div style={{fontSize:10,color:"#A8A29E"}}>{r.date.slice(5)}</div>
          </div>
        ))}
      </div>
    </div>)}
    {/* Blood glucose */}
    {bgRecs.length>0&&(<div style={S.card}>
      <div style={{fontWeight:700,fontSize:14,marginBottom:10,color:"#D97706"}}>🍬 Blood Glucose</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {bgRecs.map((r,i)=>(
          <div key={i} style={{background:"#FEF3C7",borderRadius:10,padding:"8px 12px",textAlign:"center"}}>
            <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:16,fontWeight:900,color:"#B45309"}}>{r.bg}</div>
            <div style={{fontSize:10,color:"#A8A29E"}}>{r.date.slice(5)}</div>
          </div>
        ))}
      </div>
    </div>)}
    <button style={{...S.btnG,marginTop:14}} onClick={onClose}>Close</button>
  </Sheet>);
}

// ── REFERRAL LETTER ───────────────────────────────────────────────
function ReferralLetter({pt,doc,recs,onClose,flash}){
  const [to,setTo]=useState("");const [reason,setReason]=useState("");const [urgency,setUrgency]=useState("Routine");
  const sorted=recs.sort((a,b)=>new Date(b.date)-new Date(a.date));
  const recent=sorted.slice(0,5);
  const conditions=[...new Set(recs.filter(r=>r.fields?.diagnosis||r.fields?.condition).map(r=>r.fields?.diagnosis||r.fields?.condition))].slice(0,4);
  const meds=[...new Set(recs.filter(r=>r.fields?.currentMeds).map(r=>r.fields.currentMeds))].join(", ")||"Nil";
  const lastBP=recs.find(r=>r.fields?.bp)?.fields?.bp||"Not recorded";
  const dateStr=new Date().toLocaleDateString("en-NG",{day:"numeric",month:"long",year:"numeric"});

  const letterText=`MEDICAL REFERRAL LETTER

Date: ${dateStr}
Urgency: ${urgency}

FROM:
${doc?.name||"Clinician"}
${doc?.qualification||""} · ${doc?.specialty||""}
${doc?.hospitals||""}
MDCN No: ${doc?.mdcn||"N/A"}

TO: ${to||"[Receiving Clinician / Specialist]"}

RE: ${pt.name} — ${urgency.toUpperCase()} REFERRAL

Dear Colleague,

I am writing to refer my patient, ${pt.name}, for your kind assessment and management.

PATIENT DETAILS
Name: ${pt.name}
Date of Birth: ${pt.dob} (Age ${getAge(pt.dob)})
Sex: ${pt.gender==="F"?"Female":"Male"}
Blood Group: ${pt.bloodGroup} | Genotype: ${pt.genotype}
Phone: ${pt.phone}
NHIA Number: ${pt.nhia||"N/A"}
Allergies: ${pt.allergies||"None known"}
Next of Kin: ${pt.nokName||"Not provided"} (${pt.nokRelation||"—"}) — ${pt.nokPhone||"—"}

REASON FOR REFERRAL
${reason||"[Please complete reason for referral]"}

KNOWN CONDITIONS
${conditions.length?conditions.map(c=>"\u2022 "+c).join("\n"):"None documented"}

CURRENT MEDICATIONS
${meds}

LAST BLOOD PRESSURE: ${lastBP}

RECENT CLINICAL HISTORY
${recent.map(r=>""+(r.date)+" | "+(CARE[r.careType]?.label||r.careType)+" | "+(r.title)+"${r.fields?.diagnosis?" — Dx: ${r.fields.diagnosis}`:""}`).join("\n")}

I would be grateful for your expert opinion and management. Please do not hesitate to contact me should you require any further information.

Yours sincerely,

${doc?.name||""}
${doc?.qualification||""} | ${doc?.specialty||""}
${doc?.hospitals||""}
Tel: ${doc?.phone||"N/A"} | Email: ${doc?.email||"N/A"}
MDCN: ${doc?.mdcn||"N/A"}`;

  const share=async()=>{
    if(!reason.trim()) return flash("Please add the reason for referral","err");
    if(navigator.share){
      try{await navigator.share({title:`Referral — ${pt.name}`,text:letterText});}
      catch(e){}
    } else {
      navigator.clipboard.writeText(letterText).catch(()=>{});
      flash("Letter copied to clipboard — paste into WhatsApp or email","info",5000);
    }
  };

  const print=()=>{
    if(!reason.trim()) return flash("Please add the reason for referral","err");
    const _blob=new Blob(["<html><head><title>Referral — "+pt.name+"</title><style>body{font-family:Arial,sans-serif;padding:40px;font-size:13px;line-height:1.8;color:#1C1917;max-width:700px;margin:0 auto}h1{font-size:16px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #14532D;padding-bottom:8px;color:#14532D}pre{white-space:pre-wrap;font-family:inherit;font-size:13px;line-height:1.8}@media print{@page{margin:2cm}}</style></head><body><pre>${letterText}</pre></body></html>`);
    w.document.close();w.print(],{type:"text/html"});const _url=URL.createObjectURL(_blob);const _a=document.createElement("a");_a.href=_url;_a.download="Referral-"+pt.name.replace(/[^a-zA-Z]/g,"-")+".html";document.body.appendChild(_a);_a.click();setTimeout(()=>{document.body.removeChild(_a);URL.revokeObjectURL(_url);},2000);
  };

  return(<Sheet onClose={onClose} title="📋 Referral Letter">
    <div style={{...S.card,background:"#F0FDF4",border:`1.5px solid ${G}22`,marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:13,color:G,marginBottom:8}}>Patient: {pt.name} · Age {getAge(pt.dob)} · {pt.bloodGroup}</div>
      <div style={{fontSize:12,color:"#57534E"}}>Referring: {doc?.name||"Clinician"} · {doc?.specialty}</div>
    </div>
    <Fl label="Refer To (Specialist / Hospital)"><input style={S.inp} placeholder="e.g. Cardiologist, LUTH" value={to} onChange={e=>setTo(e.target.value)}/></Fl>
    <Fl label="Urgency">
      <select style={S.inp} value={urgency} onChange={e=>setUrgency(e.target.value)}>
        {["Routine","Semi-Urgent","Urgent","Emergency"].map(u=><option key={u}>{u}</option>)}
      </select>
    </Fl>
    <Fl label="Reason for Referral *">
      <textarea style={{...S.inp,height:80,resize:"vertical"}} placeholder="Clinical reason, specific concern, what you need from the specialist…" value={reason} onChange={e=>setReason(e.target.value)} maxLength={500}/>
      <CharCount val={reason} max={500}/>
    </Fl>
    <div style={{...S.card,background:"#F9F7F4",marginBottom:14,padding:"12px 14px"}}>
      <div style={{fontSize:11,fontWeight:700,color:"#57534E",marginBottom:6}}>LETTER PREVIEW</div>
      <div style={{fontSize:11,color:"#78716C",lineHeight:1.8,fontFamily:"monospace",maxHeight:160,overflowY:"auto",whiteSpace:"pre-wrap"}}>{letterText.slice(0,600)}…</div>
    </div>
    <button onClick={share} style={{...S.btnG,marginBottom:10}}>📤 Share via WhatsApp / Email</button>
    <button onClick={print} style={{...S.btnB,marginBottom:10}}>🖨️ Print / Save as PDF</button>
    <button style={{...S.btnG,background:"#F3F1EC",color:"#57534E",boxShadow:"none"}} onClick={onClose}>Cancel</button>
  </Sheet>);
}

// ── SHARE RECORD AS PDF / TEXT ────────────────────────────────────
function generatePDFBlob(title, bodyText){
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;padding:40px;font-size:13px;line-height:1.8;max-width:680px;margin:0 auto;color:#1C1917}h2{color:#14532D;font-size:16px;border-bottom:2px solid #14532D;padding-bottom:6px}pre{white-space:pre-wrap;font-family:Arial,sans-serif;font-size:13px;line-height:1.8}@media print{@page{margin:2cm}}</style></head><body><h2>${title}</h2><pre>${bodyText}</pre></body></html>`;
  const blob = new Blob([html], {type:"text/html"});
  return URL.createObjectURL(blob);
}

function shareRecord(rec, patient){
  const ct = CARE[rec.careType]||{label:rec.careType};
  const f  = rec.fields||{};
  const labTest = f.testCategory ? LAB_TESTS[f.testCategory] : null;
  const result  = labTest ? labTest.formatResult(f) : null;

  const lines = [
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `HealthVault NG — Health Record`,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Patient:  ${patient?.name||"—"}`,
    `DOB:      ${patient?.dob||"—"}  Blood Group: ${patient?.bloodGroup||"—"}  Genotype: ${patient?.genotype||"—"}`,
    `NHIA:     ${patient?.nhia||"N/A"}`,
    ``,
    `Record Type: ${ct.label.toUpperCase()}`,
    `Title:       ${rec.title}`,
    `Date:        ${rec.date}`,
    `Facility:    ${rec.facility||"—"}`,
    `Added by:    ${rec.addedBy==="doctor"?"Clinician":rec.addedBy==="lab"?"Lab ("+(rec.labName||"—")+")":"Patient"}`,
    ``,
  ];

  if(result){
    lines.push(`RESULT`);
    lines.push(result);
    lines.push(``);
  }

  Object.entries(f).forEach(([k,v])=>{
    if(!v||["testCategory","resultSummary"].includes(k)) return;
    if(labTest?.formatResult && !["notes","testType","labName"].includes(k)) return;
    const label = FIELD_LABELS_SHARE[k]||k;
    lines.push(`${label}: ${v}`);
  });

  lines.push(``, `━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Generated by HealthVault NG — ${new Date().toLocaleDateString("en-NG")}`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━`);

  const text = lines.join("\n");

  // Try Web Share API (WhatsApp, Messages, etc.)
  if(navigator.share){
    navigator.share({title:`Health Record — ${rec.title}`, text}).catch(()=>{});
    } else {
    const url = generatePDFBlob("HealthVault NG - "+rec.title, text);
    const a = document.createElement("a");
    a.href = url;
    a.download = "HealthVault-Record.html";
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);}, 2000);
  }}

const FIELD_LABELS_SHARE = {
  complaint:"Complaint",diagnosis:"Diagnosis",treatment:"Treatment",malariaRDT:"Malaria RDT",
  temp:"Temperature",bp:"Blood Pressure",weight:"Weight",pulse:"Pulse",o2sat:"O2 Saturation",
  nextAppt:"Next Appointment",notes:"Notes",gestationalAge:"Gestational Age",
  fundalHeight:"Fundal Height",fetalHeartRate:"Fetal Heart Rate",nextANC:"Next ANC",
  condition:"Condition",bloodGlucose:"Blood Glucose",hba1c:"HbA1c",
  currentMeds:"Current Medications",medsChange:"Medication Change",nextReview:"Next Review",
  actionTaken:"Action Taken",referral:"Referral/Discharge",testType:"Test Type",
  result:"Result",parasiteDensity:"Parasite Density",method:"Method",resultStatus:"Status",
  hb:"Hb",pcv:"PCV",wbc:"WBC",platelets:"Platelets",neutrophils:"Neutrophils",lymphocytes:"Lymphocytes",
  value:"Value",unit:"Unit",referenceRange:"Reference Range",interpretation:"Interpretation",
  colour:"Colour",appearance:"Appearance",protein:"Protein",glucose:"Glucose",ketones:"Ketones",
  blood:"Blood",ph:"pH",specificGravity:"Specific Gravity",leukocytes:"Leukocytes",nitrites:"Nitrites",
  totalCholesterol:"Total Cholesterol",hdl:"HDL",ldl:"LDL",triglycerides:"Triglycerides",
  labName:"Lab Name",testName:"Test Name",results:"Results",testsRun:"Tests Run",
};

// ── RECORD DETAIL SHEET ───────────────────────────────────────────
function RecordDetail({rec,ctx,onClose}){
  const ct=CARE[rec.careType]||{color:"#555",bg:"#eee",icon:"📄",label:rec.careType};
  const f=rec.fields||{};
  const skip=new Set(["quickLabel","title","testCategory"]);
  const labTest=f.testCategory?LAB_TESTS[f.testCategory]:null;
  const formattedResult=labTest?labTest.formatResult(f):null;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:500,display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div className="sheet-anim" style={{background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",maxHeight:"90vh",overflowY:"auto",padding:"20px 20px 48px"}} onClick={e=>e.stopPropagation()}>
        <div style={{width:40,height:4,background:"#D6D3CE",borderRadius:99,margin:"0 auto 20px"}}/>
        <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:16}}>
          <div style={{background:ct.bg,borderRadius:12,padding:"10px 12px",fontSize:22,flex:"none"}}>{ct.icon}</div>
          <div style={{flex:1}}>
            <div style={{background:ct.bg,color:ct.color,fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:99,display:"inline-block",marginBottom:5}}>{ct.label.toUpperCase()}</div>
            <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:17,fontWeight:700,lineHeight:1.3}}>{rec.title}</div>
            <div style={{fontSize:12,color:"#78716C",marginTop:4}}>📅 {rec.date}{rec.facility?` · 🏥 ${rec.facility}`:""}</div>
            {rec.addedBy==="doctor"&&<div style={{fontSize:11,color:"#7C3AED",fontWeight:700,marginTop:3}}>✍️ Added by clinician</div>}
            {rec.addedBy==="lab"&&<div style={{fontSize:11,color:GL,fontWeight:700,marginTop:3}}>🔬 Posted by {rec.labName||"lab"}</div>}
          </div>
          {f.resultStatus&&<div style={{background:STATUS_COLOR[f.resultStatus]||"#78716C",color:"#fff",fontSize:12,fontWeight:700,padding:"5px 12px",borderRadius:99,flex:"none"}}>{f.resultStatus}</div>}
        </div>
        <div style={{height:1,background:"#E5E2DB",marginBottom:16}}/>
        {formattedResult&&(<div style={{marginBottom:16}}><div style={S.lbl}>Result</div><div style={{fontFamily:"monospace",fontSize:13,lineHeight:1.9,background:"#FEF3C7",border:"1.5px solid #FCD34D",padding:"14px 16px",borderRadius:12,whiteSpace:"pre-wrap"}}>{formattedResult}</div></div>)}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {Object.entries(f).filter(([k,v])=>v&&!skip.has(k)&&(!labTest?.formatResult||["notes","testType"].includes(k))).map(([k,v])=>(
            <div key={k}><div style={S.lbl}>{k}</div><div style={{fontSize:14,lineHeight:1.65,background:"#F9F7F4",padding:"10px 13px",borderRadius:10,whiteSpace:"pre-wrap"}}>{v}</div></div>
          ))}
        </div>
        {(rec.attachments||[]).length>0&&(<div style={{marginTop:18}}>
          <div style={S.lbl}>Attached Files ({rec.attachments.length})</div>
          {rec.attachments.map((a,i)=>(
            <div key={i} style={{border:"1.5px solid #E5E2DB",borderRadius:12,overflow:"hidden",marginBottom:8}}>
              {a.type?.startsWith("image/")&&<img src={a.dataUrl} alt={a.name} style={{width:"100%",maxHeight:220,objectFit:"contain",background:"#F9F7F4"}}/>}
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:"#FAFAF9"}}>
                <span style={{fontSize:18}}>{a.type?.startsWith("image/")?"🖼️":"📄"}</span>
                <div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name}</div><div style={{fontSize:11,color:"#78716C"}}>{a.size?(a.size/1024).toFixed(1)+" KB":""}</div></div>
                <a href={a.dataUrl} download={a.name} style={{...S.sm("g"),textDecoration:"none",fontSize:12,padding:"6px 12px"}}>Save</a>
              </div>
            </div>
          ))}
        </div>)}
        <button style={{...S.sm("g"),width:"100%",padding:12,fontSize:14,marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:G,color:"#fff",border:"none",borderRadius:12,cursor:"pointer",fontWeight:700}} onClick={()=>shareRecord(rec, ctx?.user||ctx?.vp)}>📤 Share / Save as PDF</button>
        <button style={{...S.btnG,background:"#F3F1EC",color:"#57534E",boxShadow:"none"}} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

// ── FULL HISTORY ──────────────────────────────────────────────────
function FullHistory({recs,title="Full Medical History"}){
  const [search,setSearch]=useState("");
  const [detail,setDetail]=useState(null);
  const filtered=search?recs.filter(r=>r.title?.toLowerCase().includes(search.toLowerCase())||r.fields?.diagnosis?.toLowerCase().includes(search.toLowerCase())||r.facility?.toLowerCase().includes(search.toLowerCase())):recs;
  const summary=CARE_TYPES.map(ct=>({ct,count:recs.filter(r=>r.careType===ct).length,last:recs.find(r=>r.careType===ct)?.date})).filter(s=>s.count>0);
  const grouped={};
  filtered.forEach(r=>{const key=r.date?.slice(0,7)||"Unknown";if(!grouped[key])grouped[key]=[];grouped[key].push(r);});
  return(<div>
    <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:20,fontWeight:700,color:G,marginBottom:14}}>{title}</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:18}}>
      {summary.map(({ct,count,last})=>{const c=CARE[ct];return(
        <div key={ct} style={{background:c.bg,borderRadius:12,padding:"12px 14px",border:`1.5px solid ${c.color}22`}}>
          <div style={{fontSize:18,marginBottom:3}}>{c.icon}</div>
          <div style={{fontWeight:700,fontSize:12,color:c.color}}>{c.label}</div>
          <div style={{fontSize:24,fontWeight:900,fontFamily:"'Fraunces',Georgia,serif",color:c.color}}>{count}</div>
          <div style={{fontSize:10,color:c.color,opacity:.7}}>Last: {last}</div>
        </div>
      );})}
      <div style={{background:"#F9F7F4",borderRadius:12,padding:"12px 14px",border:"1.5px solid #E5E2DB",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <div style={{fontSize:26,fontFamily:"'Fraunces',Georgia,serif",fontWeight:900,color:G}}>{recs.length}</div>
        <div style={{fontSize:10,color:"#78716C",fontWeight:700}}>TOTAL RECORDS</div>
      </div>
    </div>
    <div style={{marginBottom:14,position:"relative"}}>
      <input style={{...S.inp,paddingLeft:36}} placeholder="Search records, diagnoses, facilities…" value={search} onChange={e=>setSearch(e.target.value)}/>
      <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:16,opacity:.4}}>🔍</span>
    </div>
    {!filtered.length&&<Empty msg="No records match your search."/>}
    {Object.keys(grouped).sort((a,b)=>b.localeCompare(a)).map(month=>(
      <div key={month}>
        <div style={{fontSize:11,fontWeight:700,color:"#78716C",textTransform:"uppercase",letterSpacing:1,margin:"16px 0 8px"}}>{fmt(month)}</div>
        <RecordList recs={grouped[month]} onOpen={r=>setDetail(r)}/>
      </div>
    ))}
    {detail&&<RecordDetail rec={detail} onClose={()=>setDetail(null)}/>}
  </div>);
}

// ── AI PATIENT SUMMARY GENERATOR ─────────────────────────────────
function AISummaryModal({patient,recs,onClose,flash}){
  const [summary,setSummary]=useState(null);
  const [loading,setLoading]=useState(false);
  const p = patient||{};

  const generate = async()=>{
    setLoading(true);setSummary(null);
    const sorted = (recs||[]).sort((a,b)=>new Date(b.date)-new Date(a.date));
    const episodes = sorted.slice(0,8).map(r=>{
      const f=r.fields||{};
      return {date:r.date,type:CARE[r.careType]?.label||r.careType,title:r.title,
        diagnosis:f.diagnosis||f.condition||null,treatment:f.treatment||null,
        bp:f.bp||null,weight:f.weight||null,glucose:f.bloodGlucose||null,
        labs:f.testCategory?{test:f.testType||f.testCategory,result:f.result||f.value,status:f.resultStatus}:null,
        pharmacy:r.careType==="PHARMACY"?{drug:f.genericName,dose:f.dose,freq:f.frequency,indication:f.indication}:null,
        notes:f.notes||null};
    });
    const conditions=[...new Set(sorted.filter(r=>r.fields?.condition||r.fields?.diagnosis).map(r=>r.fields?.condition||r.fields?.diagnosis))].slice(0,5);
    const meds=[...new Set(sorted.filter(r=>r.careType==="PHARMACY"&&r.fields?.genericName).map(r=>r.fields.genericName+" "+r.fields.dose))].slice(0,6);
    const prompt = "You are a clinical assistant in Nigeria. Generate a comprehensive, intelligent patient summary suitable for a new clinician who has never met this patient.\n\nPatient: "+p.name+", Age "+getAge(p.dob)+", "+(p.gender==="F"?"Female":"Male")+"\nBlood Group: "+p.bloodGroup+" | Genotype: "+p.genotype+"\nNHIA: "+(p.nhia||"N/A")+" | Allergies: "+(p.allergies||"None known")+"\n\nKnown Conditions: "+conditions.join(", ")+"\nCurrent Medications: "+(meds.join(", ")||"None listed")+"\n\nRecent Medical Episodes:\n"+JSON.stringify(episodes,null,2)+"\n\nWrite a structured summary with these sections:\n1. PATIENT OVERVIEW (2-3 sentences: who they are, key diagnoses)\n2. ACTIVE CONDITIONS (bullet list)\n3. CURRENT MEDICATIONS (bullet list with doses)\n4. RECENT CLINICAL EVENTS (last 3-4 significant episodes)\n5. KEY INVESTIGATIONS (notable lab results)\n6. ALERTS & WATCH POINTS (allergies, poorly controlled conditions, anything a clinician must know immediately)\n7. SUGGESTED FOLLOW-UP (what should happen at the next visit)\n\nBe factual, clinical, and concise. This summary may be shared via WhatsApp.";
    try{
      const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,messages:[{role:"user",content:prompt}]})});
      const data = await res.json();
      const text = data.content?.map(b=>b.text||"").join("")||"Summary unavailable.";
      setSummary(text);
    }catch(e){setSummary("Could not generate summary - please check your connection.");}
    setLoading(false);
  };

  const share = ()=>{
    if(!summary) return;
    const text = "PATIENT SUMMARY - HealthVault NG\n\nPatient: "+p.name+" | "+p.bloodGroup+" | Genotype: "+p.genotype+"\n\n"+summary+"\n\n---\nGenerated by HealthVault NG on "+new Date().toLocaleDateString("en-NG");
    if(navigator.share){navigator.share({title:"Patient Summary - "+p.name,text}).catch(()=>{});}
    else{navigator.clipboard.writeText(text).then(()=>flash("Summary copied - paste into WhatsApp!","info",4000)).catch(()=>flash("Use the text above to copy","info"));}
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:700,display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div className="sheet-anim" style={{background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",maxHeight:"90vh",overflowY:"auto",padding:"20px 20px 48px"}} onClick={e=>e.stopPropagation()}>
        <div style={{width:40,height:4,background:"#D6D3CE",borderRadius:99,margin:"0 auto 20px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:18,fontWeight:700}}>AI Patient Summary</div>
          <div style={{fontSize:12,color:"#78716C"}}>{p.name}</div>
        </div>
        {!summary&&!loading&&(
          <div style={{textAlign:"center",padding:"24px 0"}}>
            <div style={{fontSize:40,marginBottom:12}}>✨</div>
            <div style={{fontSize:14,color:"#57534E",lineHeight:1.7,marginBottom:20}}>Generate an intelligent clinical summary covering all episodes, medications, labs and alerts - formatted for WhatsApp sharing.</div>
            <button style={{...S.btnG,maxWidth:300,margin:"0 auto"}} onClick={generate}>Create My Health Summary</button>
          </div>
        )}
        {loading&&(
          <div style={{textAlign:"center",padding:"32px 0"}}>
            <div style={{fontSize:14,color:"#78716C"}}>Analysing {recs.length} records...</div>
            <div style={{marginTop:12,height:4,background:"#E5E2DB",borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",background:G,borderRadius:99,animation:"slideUp 1.5s ease infinite",width:"60%"}}/></div>
          </div>
        )}
        {summary&&!loading&&(<>
          <div style={{background:"#F0FDF4",border:"1.5px solid #86EFAC",borderRadius:12,padding:"14px 16px",marginBottom:14,fontSize:13,lineHeight:1.8,whiteSpace:"pre-wrap",color:"#1C1917",maxHeight:400,overflowY:"auto",fontFamily:"monospace"}}>{summary}</div>
          <button style={{...S.btnG,marginBottom:10}} onClick={share}>📤 Share via WhatsApp / Copy</button>
          <button style={{...S.btnG,background:"#EFF6FF",color:"#1D4ED8",boxShadow:"none",marginBottom:10}} onClick={generate}>🔄 Regenerate</button>
        </>)}
        <button style={{...S.btnG,background:"#F3F1EC",color:"#57534E",boxShadow:"none"}} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}


// ── TERMS & CONDITIONS ────────────────────────────────────────────
const TandC_TEXT = `HEALTHVAULT NG — TERMS AND CONDITIONS OF USE
Version 1.0 | Effective: January 2026

1. ACCEPTANCE OF TERMS
By registering on HealthVault NG, you agree to these Terms and Conditions. If you do not agree, do not use this platform.

2. PURPOSE OF THE PLATFORM
HealthVault NG is a patient-controlled health records platform that enables patients, clinicians, and laboratories to securely store, access, and share medical records in Nigeria. This platform does NOT replace professional medical advice, diagnosis, or treatment.

3. USER RESPONSIBILITIES
a) Patients: You are responsible for the accuracy of information you submit. You control who accesses your records.
b) Clinicians: You must be a licensed medical practitioner registered with the MDCN. You must only access records for which you have received patient consent.
c) Laboratories: You must be a registered diagnostic facility with a valid CAC number. You may only post results for patients who have provided consent.

4. DATA PRIVACY AND CONFIDENTIALITY
All health data is stored locally on your device (offline-first). You grant explicit permission before any third party can access your records. We do not sell or share your data with advertisers.

5. PATIENT CONSENT
Every access to patient records requires an explicit access code generated by the patient. Codes expire within 24 hours. Patients may revoke access at any time.

6. LIMITATION OF LIABILITY
HealthVault NG is a record management tool. We are not liable for clinical decisions made based on information stored on the platform.

7. APPLICABLE LAW
These Terms are governed by the laws of the Federal Republic of Nigeria, including the Nigeria Data Protection Act 2023 (NDPA) and guidelines of the Federal Ministry of Health.

8. CONTACT
For support or complaints: support@healthvaultng.com`;

function TandCModal({onAccept,onDecline}){
  const [scrolled,setScrolled]=useState(false);
  const textRef=useRef();
  const handleScroll=()=>{
    if(textRef.current){
      const {scrollTop,scrollHeight,clientHeight}=textRef.current;
      if(scrollTop+clientHeight>=scrollHeight-20) setScrolled(true);
    }
  };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:800,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:480,maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"20px 24px 14px",borderBottom:"1px solid #EAE8E3"}}>
          <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:18,fontWeight:700,color:G}}>Terms and Conditions</div>
          <div style={{fontSize:12,color:"#78716C",marginTop:4}}>Please read and scroll to the bottom to accept</div>
        </div>
        <div ref={textRef} onScroll={handleScroll} style={{flex:1,overflowY:"auto",padding:"16px 24px",fontSize:12,color:"#57534E",lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:"monospace"}}>
          {TandC_TEXT}
        </div>
        <div style={{padding:"14px 24px 20px",borderTop:"1px solid #EAE8E3"}}>
          {!scrolled&&<div style={{fontSize:11,color:"#D97706",fontWeight:600,marginBottom:10,textAlign:"center"}}>Scroll to the bottom to enable acceptance</div>}
          <button disabled={!scrolled} onClick={onAccept} style={{...S.btnG,marginBottom:10,opacity:scrolled?1:.5,cursor:scrolled?"pointer":"not-allowed"}}>I Accept the Terms and Conditions</button>
          <button onClick={onDecline} style={{width:"100%",padding:12,borderRadius:12,background:"#F3F1EC",color:"#57534E",border:"none",cursor:"pointer",fontWeight:600,fontSize:14}}>Decline</button>
        </div>
      </div>
    </div>
  );
}


// ── HMO CARD MODAL ────────────────────────────────────────────────
function HMOCardModal({user,onClose,onSave,flash}){
  const existing = user.hmo||{};
  const [provider,setProvider] = useState(existing.provider||"");
  const [plan,setPlan] = useState(existing.plan||"");
  const [memberId,setMemberId] = useState(existing.memberId||"");
  const [employerGroup,setEmployerGroup] = useState(existing.employerGroup||"");
  const [expiry,setExpiry] = useState(existing.expiry||"");
  const [dependants,setDependants] = useState(existing.dependants||"");
  const [editing,setEditing] = useState(!existing.provider);
  const [sharing,setSharing] = useState(false);

  const hmoInfo = HMO_PROVIDERS[provider]||null;
  const plans = hmoInfo?.plans||[];

  const handleProviderChange = (val)=>{
    setProvider(val);
    setPlan("");
  };

  const save = ()=>{
    if(!provider||provider==="-- Select HMO Provider --") return flash("Please select your HMO provider","err");
    if(!memberId.trim()) return flash("Please enter your Member ID","err");
    const hmo = {provider,plan,memberId,employerGroup,expiry,dependants};
    onSave(hmo);
    setEditing(false);
    flash("HMO card saved!");
  };

  const shareCard = ()=>{
    const text = "HMO CARD - HealthVault NG\n\nPatient: "+user.name+"\nHMO Provider: "+provider+"\nPlan: "+plan+"\nMember ID: "+memberId+"\nEmployer/Group: "+(employerGroup||"N/A")+"\nExpiry: "+(expiry||"N/A")+"\nDependants: "+(dependants||"None listed")+"\n\nNHIA No: "+(user.nhia||"N/A")+"\nBlood Group: "+user.bloodGroup+" | Genotype: "+user.genotype+"\n\nShared via HealthVault NG";
    if(navigator.share){navigator.share({title:"HMO Card — "+user.name,text}).catch(()=>{});}
    else{navigator.clipboard.writeText(text).then(()=>flash("HMO card details copied — paste into WhatsApp!","info")).catch(()=>{});}
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:700,display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",maxHeight:"92vh",overflowY:"auto",padding:"20px 18px 48px"}} onClick={e=>e.stopPropagation()}>
        <div style={{width:40,height:4,background:"#D6D3CE",borderRadius:99,margin:"0 auto 18px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:18,fontWeight:700}}>My HMO Card</div>
          {!editing&&provider&&<button onClick={()=>setEditing(true)} style={{background:"#EFF6FF",color:"#1D4ED8",border:"1.5px solid #BFDBFE",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer"}}>Edit</button>}
        </div>

        {/* Card Display (when not editing) */}
        {!editing&&provider&&(<>
          <div style={{background:hmoInfo?.color||G,borderRadius:18,padding:"22px 22px 18px",marginBottom:16,color:"#fff",position:"relative",overflow:"hidden",boxShadow:"0 8px 32px rgba(0,0,0,.2)"}}>
            <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,.08)"}}/>
            <div style={{position:"absolute",bottom:-20,left:-20,width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,.06)"}}/>
            <div style={{position:"relative",zIndex:1}}>
              <div style={{fontSize:10,opacity:.7,letterSpacing:1.5,textTransform:"uppercase",marginBottom:2}}>Health Insurance</div>
              <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:20,fontWeight:900,marginBottom:14}}>{provider}</div>
              <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>{user.name}</div>
              <div style={{fontSize:11,opacity:.8,marginBottom:14}}>NHIA: {user.nhia||"N/A"}</div>
              <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
                <div><div style={{fontSize:9,opacity:.6,textTransform:"uppercase",letterSpacing:.8}}>Member ID</div><div style={{fontSize:15,fontWeight:800,letterSpacing:1,marginTop:2}}>{memberId}</div></div>
                <div><div style={{fontSize:9,opacity:.6,textTransform:"uppercase",letterSpacing:.8}}>Plan</div><div style={{fontSize:13,fontWeight:700,marginTop:2}}>{plan||"—"}</div></div>
                {expiry&&<div><div style={{fontSize:9,opacity:.6,textTransform:"uppercase",letterSpacing:.8}}>Valid Until</div><div style={{fontSize:13,fontWeight:700,marginTop:2}}>{expiry}</div></div>}
              </div>
              {employerGroup&&<div style={{marginTop:12,fontSize:11,opacity:.75}}>Group: {employerGroup}</div>}
            </div>
          </div>

          {/* Provider contact info */}
          {hmoInfo&&<div style={{...S.card,marginBottom:14,background:"#F9F7F4"}}>
            <div style={{fontWeight:700,fontSize:12,marginBottom:8,color:"#57534E"}}>Provider Contact</div>
            <div style={{fontSize:12,color:"#57534E",lineHeight:2}}>
              📞 {hmoInfo.phone}<br/>
              🌐 {hmoInfo.website}<br/>
              ✉️ {hmoInfo.email}
            </div>
          </div>}

          {/* Dependants */}
          {dependants&&<div style={{...S.card,marginBottom:14}}>
            <div style={{fontWeight:700,fontSize:12,marginBottom:4}}>👨‍👩‍👧 Dependants Covered</div>
            <div style={{fontSize:13,color:"#57534E"}}>{dependants}</div>
          </div>}

          <button onClick={shareCard} style={{...S.btnG,marginBottom:10}}>📤 Share HMO Details</button>
          <button onClick={onClose} style={{width:"100%",padding:12,borderRadius:12,background:"#F3F1EC",color:"#57534E",border:"none",cursor:"pointer",fontWeight:600,fontSize:14}}>Close</button>
        </>)}

        {/* Edit / Add Form */}
        {editing&&(<>
          <div style={{...S.card,marginBottom:14,background:"#EFF6FF",border:"1px solid #BFDBFE",fontSize:12,color:"#1E40AF",lineHeight:1.7}}>
            💡 Select your HMO provider and most details will fill in automatically. Just add your Member ID from your physical HMO card.
          </div>

          <Fl label="HMO Provider *">
            <select style={S.inp} value={provider} onChange={e=>handleProviderChange(e.target.value)}>
              {HMO_NAMES.map(n=><option key={n} value={n==="-- Select HMO Provider --"?"":n}>{n}</option>)}
            </select>
          </Fl>

          {provider&&hmoInfo&&(<>
            {/* Auto-populated provider card preview */}
            <div style={{background:hmoInfo.color,borderRadius:14,padding:"14px 16px",marginBottom:14,color:"#fff"}}>
              <div style={{fontSize:10,opacity:.7,letterSpacing:1,textTransform:"uppercase"}}>Selected Provider</div>
              <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:17,fontWeight:800,marginTop:2,marginBottom:8}}>{provider}</div>
              <div style={{display:"flex",gap:14,fontSize:11,opacity:.85,flexWrap:"wrap"}}>
                <span>📞 {hmoInfo.phone}</span>
                <span>🌐 {hmoInfo.website}</span>
              </div>
            </div>

            <Fl label="Plan / Package">
              <select style={S.inp} value={plan} onChange={e=>setPlan(e.target.value)}>
                <option value="">-- Select your plan --</option>
                {plans.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </Fl>

            <Fl label="Member ID / Card Number *">
              <input style={S.inp} placeholder="e.g. HYG/2024/0089234" value={memberId} onChange={e=>setMemberId(e.target.value)} maxLength={40}/>
            </Fl>

            <Fl label="Employer / Group (if employer-based HMO)">
              <input style={S.inp} placeholder="e.g. Lagos State Civil Service, Dangote Group" value={employerGroup} onChange={e=>setEmployerGroup(e.target.value)} maxLength={80}/>
            </Fl>

            <Fl label="Expiry Date">
              <input type="date" style={S.inp} value={expiry} onChange={e=>setExpiry(e.target.value)}/>
            </Fl>

            <Fl label="Dependants Covered">
              <input style={S.inp} placeholder="e.g. Kemi Fashola (Spouse), Tolu Fashola (Child)" value={dependants} onChange={e=>setDependants(e.target.value)} maxLength={200}/>
            </Fl>

            <button style={{...S.btnG,marginTop:6}} onClick={save}>Save HMO Card</button>
          </>)}

          {!provider&&<div style={{textAlign:"center",padding:"20px",color:"#A8A29E",fontSize:13}}>Select a provider above to continue</div>}

          <button onClick={onClose} style={{width:"100%",padding:12,borderRadius:12,background:"#F3F1EC",color:"#57534E",border:"none",cursor:"pointer",fontWeight:600,fontSize:14,marginTop:10}}>Cancel</button>
        </>)}
      </div>
    </div>
  );
}


// ── LANDING ───────────────────────────────────────────────────────
function Landing({ctx}){
  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:"#FAFAF7",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      {/* Hero */}
      <div style={{background:"linear-gradient(160deg,#0A3320 0%,#14532D 60%,#1a5c35 100%)",padding:"52px 24px 44px",textAlign:"center",color:"#fff",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-60,right:-60,width:220,height:220,borderRadius:"50%",background:"rgba(255,255,255,.04)"}}/>
        <div style={{position:"absolute",bottom:-40,left:-40,width:160,height:160,borderRadius:"50%",background:"rgba(255,255,255,.03)"}}/>
        <div style={{position:"absolute",top:30,left:20,width:60,height:60,borderRadius:"50%",background:"rgba(234,179,8,.08)"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(234,179,8,.15)",border:"1px solid rgba(234,179,8,.3)",borderRadius:99,padding:"5px 14px",marginBottom:20}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:"#EAB308"}}/>
            <span style={{fontSize:11,fontWeight:700,color:"#FEF08A",letterSpacing:1}}>YOUR HEALTH STORY, ALWAYS WITH YOU</span>
          </div>
          <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:48,fontWeight:900,lineHeight:1.05,marginBottom:12,letterSpacing:-1}}>Health<span style={{color:"#EAB308"}}>Vault</span><br/><span style={{color:"#86EFAC"}}>NG</span></div>
          <div style={{fontSize:15,opacity:.85,maxWidth:300,margin:"0 auto 24px",lineHeight:1.8,fontWeight:400}}>
            Your health story, always with you.<br/>Share with any doctor, anywhere in Nigeria.
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
            {Object.values(CARE).map(c=><div key={c.label} style={{background:"rgba(255,255,255,.1)",color:"rgba(255,255,255,.85)",fontSize:11,fontWeight:600,padding:"5px 13px",borderRadius:99,border:"1px solid rgba(255,255,255,.12)"}}>{c.icon} {c.label}</div>)}
          </div>
        </div>
      </div>

      {/* Portal cards */}
      <div style={{flex:1,padding:"24px 18px 36px",maxWidth:480,margin:"0 auto",width:"100%"}}>
        <div style={{fontSize:11,fontWeight:700,color:"#A8A29E",letterSpacing:1.5,textAlign:"center",marginBottom:18,textTransform:"uppercase"}}>Who are you?</div>
        {[
          {
            icon:"👤",title:"I am a Patient",sub:"Your health story",
            desc:"See your full health history, medications and test results — all in one place.",
            color:G,gradient:"linear-gradient(135deg,#14532D,#16A34A)",
            action:()=>ctx.go("pt-login"),cta:"Open my health folder →"
          },
          {
            icon:"🩺",title:"I am a Doctor",sub:"Clinician Dashboard",
            desc:"Access your patients' records, write visit notes and generate referral letters.",
            color:GB,gradient:"linear-gradient(135deg,#1D4ED8,#3B82F6)",
            action:()=>ctx.go("dr-login"),cta:"Go to clinician portal →"
          },
          {
            icon:"🔬",title:"I am a Lab",sub:"Laboratory Dashboard",
            desc:"Post test results directly into patient records. Fast, paperless and accurate.",
            color:GL,gradient:"linear-gradient(135deg,#B45309,#D97706)",
            action:()=>ctx.go("lab-login"),cta:"Go to lab portal →"
          },
        ].map(item=>(
          <div key={item.title} style={{background:"#fff",borderRadius:18,cursor:"pointer",marginBottom:14,overflow:"hidden",boxShadow:"0 2px 16px rgba(0,0,0,.06)",border:"1px solid #F0EDE8",transition:"transform .1s"}} onClick={item.action}>
            <div style={{background:item.gradient,padding:"18px 20px 16px",display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:46,height:46,borderRadius:13,background:"rgba(255,255,255,.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flex:"none"}}>{item.icon}</div>
              <div>
                <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:19,fontWeight:700,color:"#fff",lineHeight:1.1}}>{item.title}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,.65)",fontWeight:600,marginTop:3,letterSpacing:.3}}>{item.sub}</div>
              </div>
            </div>
            <div style={{padding:"13px 20px 6px",fontSize:13,color:"#57534E",lineHeight:1.7}}>{item.desc}</div>
            <div style={{padding:"4px 20px 16px",color:item.color,fontSize:13,fontWeight:700}}>{item.cta}</div>
          </div>
        ))}

        {/* Trust bar - short and visual, not wordy */}
        <div style={{background:"#fff",borderRadius:16,border:"1px solid #EAE8E3",padding:"14px 20px",display:"flex",justifyContent:"space-around",textAlign:"center"}}>
          {[
            {icon:"🔒",label:"Private"},
            {icon:"📵",label:"No adverts"},
            {icon:"📱",label:"Works offline"},
            {icon:"🔗",label:"You control access"},
          ].map(({icon,label})=>(
            <div key={label} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <div style={{fontSize:20}}>{icon}</div>
              <div style={{fontSize:10,color:"#78716C",fontWeight:600}}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{textAlign:"center",marginTop:18,fontSize:11,color:"#A8A29E",lineHeight:1.8}}>
          Built for Nigeria · Compliant with NDPA 2023<br/>
          Your data stays on your device
        </div>
      </div>
    </div>
  );
}


// ── PATIENT AUTH ──────────────────────────────────────────────────
function PtLogin({ctx}){
  const [ph,setPh]=useState("");const [busy,setBusy]=useState(false);
  const send=()=>{
    if(ph.trim().length<11) return ctx.flash("Enter an 11-digit phone number","err");
    setBusy(true);
    setTimeout(()=>{setBusy(false);const c=genOTP();ctx.setOtp(c);ctx.setPhone(ph.trim());ctx.flash(`Demo OTP: ${c}`,"info",8000);ctx.go("pt-otp");},900);
  };
  return(<Centered><PageTitle title="My Health Folder" sub="Enter your phone number to open your health folder"/>
    <div style={S.card}>
      <label style={S.lbl}>Phone Number</label>
      <div style={{display:"flex",gap:8,marginBottom:18}}>
        <div style={{...S.inp,width:68,textAlign:"center",fontWeight:700,background:"#F0F0EC",flex:"none"}}>+234</div>
        <input style={{...S.inp,flex:1}} placeholder="08012345678" value={ph} onChange={e=>setPh(e.target.value)} maxLength={11} onKeyDown={e=>e.key==="Enter"&&send()}/>
      </div>
      <button style={{...S.btnG,opacity:busy?.7:1}} onClick={send} disabled={busy}>{busy?"Sending…":"SEND OTP"}</button>
      <div style={{textAlign:"center",marginTop:16,fontSize:13,color:"#78716C"}}>New user? <span style={{color:G,fontWeight:700,cursor:"pointer"}} onClick={()=>{ctx.setPhone(ph);ctx.go("pt-register");}}>Register here</span></div>
    </div>
    <Hint color="green">Use <strong>08012345678</strong> — OTP appears as a blue notification.</Hint>
    <Back onClick={()=>ctx.go("landing")}/></Centered>);
}

function PtOTP({ctx}){
  const [val,setVal]=useState("");const [err,setErr]=useState("");
  const verify=()=>{
    if(val!==ctx.otp){setErr("Incorrect OTP");return;}
    const u=(DB.get("hvng_users")||[]).find(u=>u.phone===ctx.phone);
    if(u){ctx.setUser(u);ctx.flash(`Welcome back, ${u.name.split(" ")[0]}!`);ctx.go("pt-app","dashboard");}
    else ctx.go("pt-register");
  };
  return(<Centered><PageTitle title="Enter OTP" sub={`Sent to +234 ${ctx.phone}`}/>
    <div style={S.card}>
      <label style={S.lbl}>6-Digit Code</label>
      <input style={{...S.inp,fontSize:28,fontWeight:700,letterSpacing:10,textAlign:"center"}} placeholder="——————" maxLength={6} value={val} onChange={e=>{setVal(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&verify()}/>
      {err&&<div style={{color:"#DC2626",fontSize:13,marginTop:8}}>{err}</div>}
      <button style={{...S.btnG,marginTop:18}} onClick={verify}>Confirm Code</button>
    </div><Back onClick={()=>ctx.go("pt-login")}/></Centered>);
}

function PtRegister({ctx}){
  const [f,setF]=useState({name:"",dob:"",gender:"F",bloodGroup:"O+",genotype:"AA",nhia:"",allergies:"",nokName:"",nokPhone:"",nokRelation:"",address:"",occupation:""});
  const upd=(k,v)=>setF(p=>({...p,[k]:v}));
  const [showTandC,setShowTandC]=useState(false);
  const submit=()=>{
    if(!f.name||!f.dob) return ctx.flash("Full name and DOB required","err");
    if(!f.nokName||!f.nokPhone) return ctx.flash("Next of kin name and phone are required","err");
    setShowTandC(true);
  };
  const doRegister=()=>{
    const hmo=f.hmoProvider&&f.hmoMemberId?{provider:f.hmoProvider,plan:f.hmoPlan||"",memberId:f.hmoMemberId,employerGroup:f.hmoEmployer||"",expiry:"",dependants:""}:null;
    const nu={...f,phone:ctx.phone,vaccinations:[],hmo};
    DB.set("hvng_users",[...(DB.get("hvng_users")||[]),nu]);
    DB.set(`hvng_records_${ctx.phone}`,[]);
    ctx.setUser(nu);ctx.flash("Welcome, "+f.name.split(" ")[0]+"!");ctx.go("pt-app","dashboard");
  };
  return(<div style={{maxWidth:480,margin:"0 auto",padding:"0 20px 60px"}}>
    <PageTitle title="Create Your Profile" sub="Complete all sections to get started"/>
    <div style={S.card}>
      <SectionHead>👤 Personal Details</SectionHead>
      <Fl label="Full Name *"><input style={S.inp} placeholder="e.g. Adaeze Okonkwo" value={f.name} onChange={e=>upd("name",e.target.value)}/></Fl>
      <Fl label="Date of Birth *"><input type="date" style={S.inp} value={f.dob} onChange={e=>upd("dob",e.target.value)}/></Fl>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Fl label="Gender"><select style={S.inp} value={f.gender} onChange={e=>upd("gender",e.target.value)}><option value="F">Female</option><option value="M">Male</option></select></Fl>
        <Fl label="Blood Group"><select style={S.inp} value={f.bloodGroup} onChange={e=>upd("bloodGroup",e.target.value)}>{["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(g=><option key={g}>{g}</option>)}</select></Fl>
        <Fl label="Genotype"><select style={S.inp} value={f.genotype} onChange={e=>upd("genotype",e.target.value)}>{["AA","AS","SS","AC","SC"].map(g=><option key={g}>{g}</option>)}</select></Fl>
        <Fl label="NHIA No."><input style={S.inp} placeholder="Optional" value={f.nhia} onChange={e=>upd("nhia",e.target.value)}/></Fl>
      </div>
      <Fl label="Known Allergies"><input style={S.inp} placeholder="e.g. Penicillin, Sulfa drugs — or 'None'" value={f.allergies} onChange={e=>upd("allergies",e.target.value)}/></Fl>
      <Fl label="Address"><input style={S.inp} placeholder="Home address" value={f.address} onChange={e=>upd("address",e.target.value)}/></Fl>
      <Fl label="Occupation"><input style={S.inp} placeholder="e.g. Teacher, Trader, Civil Servant" value={f.occupation} onChange={e=>upd("occupation",e.target.value)}/></Fl>

      <SectionHead>🆘 Next of Kin (Mandatory)</SectionHead>
      <Fl label="Full Name *"><input style={S.inp} placeholder="e.g. Emeka Okonkwo" value={f.nokName} onChange={e=>upd("nokName",e.target.value)}/></Fl>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Fl label="Relationship *"><input style={S.inp} placeholder="e.g. Husband, Mother" value={f.nokRelation} onChange={e=>upd("nokRelation",e.target.value)}/></Fl>
        <Fl label="Phone Number *"><input style={S.inp} placeholder="080..." value={f.nokPhone} onChange={e=>upd("nokPhone",e.target.value)} maxLength={11}/></Fl>
      </div>

      <div style={{background:"#FEF3C7",border:"1.5px solid #FCD34D",borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#92400E"}}>
        ⚠️ Next of kin information is required for emergency situations and is shown on your Emergency Card.
      </div>
      </div>

      {/* HMO Section */}
      <div style={{...S.card,marginBottom:14}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:4,color:G}}>🏥 Health Insurance (Optional)</div>
        <div style={{fontSize:12,color:"#78716C",marginBottom:12,lineHeight:1.6}}>Add your HMO details now to speed up hospital registration. You can add this later too.</div>
        <Fl label="HMO Provider">
          <select style={S.inp} value={f.hmoProvider||""} onChange={e=>setF(p=>({...p,hmoProvider:e.target.value,hmoPlan:""}))}>
            {HMO_NAMES.map(n=><option key={n} value={n==="-- Select HMO Provider --"?"":n}>{n}</option>)}
          </select>
        </Fl>
        {f.hmoProvider&&HMO_PROVIDERS[f.hmoProvider]&&(<>
          <div style={{background:HMO_PROVIDERS[f.hmoProvider].color,borderRadius:10,padding:"10px 14px",color:"#fff",fontSize:12,marginBottom:12}}>
            <div style={{fontWeight:700}}>{f.hmoProvider}</div>
            <div style={{opacity:.8,marginTop:2}}>📞 {HMO_PROVIDERS[f.hmoProvider].phone}</div>
          </div>
          <Fl label="Plan / Package">
            <select style={S.inp} value={f.hmoPlan||""} onChange={e=>setF(p=>({...p,hmoPlan:e.target.value}))}>
              <option value="">-- Select your plan --</option>
              {HMO_PROVIDERS[f.hmoProvider].plans.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </Fl>
          <Fl label="Member ID / Card Number">
            <input style={S.inp} placeholder="e.g. HYG/2024/0089234" value={f.hmoMemberId||""} onChange={e=>setF(p=>({...p,hmoMemberId:e.target.value}))} maxLength={40}/>
          </Fl>
          <Fl label="Employer / Group">
            <input style={S.inp} placeholder="e.g. Lagos State Civil Service" value={f.hmoEmployer||""} onChange={e=>setF(p=>({...p,hmoEmployer:e.target.value}))} maxLength={80}/>
          </Fl>
        </>)}
      </div>

      <div style={{display:"none"}}><!-- placeholder --></div>
      <button style={{...S.btnG,marginTop:4}} onClick={submit}>Create My Health Folder</button>
    </div>
    <Back onClick={()=>ctx.go("pt-login")}/>
  </div>);
}

// ── PATIENT APP ───────────────────────────────────────────────────
function PtApp({ctx}){
  const u=ctx.user;
  const notifs=DB.get(`hvng_notif_${u?.phone}`)||[];
  const unread=notifs.filter(n=>!n.read).length;
  const allRecs=(DB.get(`hvng_records_${u?.phone}`)||[]).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const TABS=[{id:"dashboard",icon:"🏠",label:"Dashboard"},{id:"history",icon:"📋",label:"History"},{id:"documents",icon:"📄",label:"Documents"},{id:"access",icon:"🔐",label:"Share"}];
  const PAGES={dashboard:<PatientDashboard ctx={ctx} recs={allRecs}/>,history:<PatientHistory ctx={ctx} recs={allRecs}/>,documents:<PatientDocuments ctx={ctx}/>,access:<AccessManager ctx={ctx}/>};
  return(
    <div style={{maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column",minHeight:"100vh"}}>
      <div style={S.topBar(G)}>
        <div style={{width:36,height:36,borderRadius:10,background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,flex:"none"}}>{u?.name?.split(" ").map(w=>w[0]).join("").slice(0,2)}</div>
        <div style={{flex:1}}><div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:15,fontWeight:700}}>{u?.name}</div><div style={{fontSize:11,opacity:.7}}>My Health Folder</div></div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div title="AI Summary" style={{cursor:"pointer",fontSize:18}} onClick={()=>ctx.setModal("summary")}>📊</div>
          <div title="Emergency Card" style={{cursor:"pointer",fontSize:18}} onClick={()=>ctx.setModal("emergency")}>🆘</div>
          <div style={{position:"relative",cursor:"pointer"}} onClick={()=>ctx.setModal("notif")}>
            <span style={{fontSize:20}}>🔔</span>
            {unread>0&&<div style={{position:"absolute",top:-2,right:-2,background:"#DC2626",color:"#fff",fontSize:9,fontWeight:700,width:15,height:15,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>{unread}</div>}
          </div>
          <span style={{fontSize:12,cursor:"pointer",opacity:.8}} onClick={()=>{ctx.setUser(null);ctx.go("landing");}}>Out</span>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px 14px 90px"}}>{PAGES[ctx.sub]??PAGES.dashboard}</div>
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"#fff",borderTop:"1.5px solid #F0EDE8",display:"flex",zIndex:50,boxShadow:"0 -4px 20px rgba(0,0,0,.06)"}}>
        {TABS.map(t=><div key={t.id} style={{flex:1,padding:"10px 0",textAlign:"center",cursor:"pointer",borderTop:ctx.sub===t.id?"3px solid "+G:"3px solid transparent"}} onClick={()=>ctx.setSub(t.id)}><div style={{fontSize:18}}>{t.icon}</div><div style={{fontSize:10,color:ctx.sub===t.id?G:"#78716C",fontWeight:ctx.sub===t.id?700:400,marginTop:1}}>{t.label}</div></div>)}
      </div>
    </div>
  );
}

// ── PATIENT DASHBOARD ─────────────────────────────────────────────
function PatientDashboard({ctx,recs}){
  const u=ctx.user;
  const age=Math.floor((Date.now()-new Date(u.dob))/(365.25*24*60*60*1000));
  const chronic=[...new Set(recs.filter(r=>r.careType==="CHRONIC"||r.fields?.condition).map(r=>r.fields?.condition||r.fields?.diagnosis).filter(Boolean))].slice(0,4);
  const isPregnant=recs.some(r=>r.careType==="MATERNITY"&&new Date(r.date)>new Date(Date.now()-280*24*60*60*1000));
  const latestBP=recs.find(r=>r.fields?.bp)?.fields?.bp;
  const latestWeight=recs.find(r=>r.fields?.weight)?.fields?.weight;
  const meds=recs.filter(r=>r.careType==="PHARMACY"&&r.fields?.genericName).slice(0,5);
  const labRecs=recs.filter(r=>r.careType==="LAB").slice(0,4);
  const visits=recs.filter(r=>r.careType!=="PHARMACY"&&r.careType!=="LAB").slice(0,4);

  const alerts=[];
  if(u.allergies&&u.allergies!=="None known") alerts.push({icon:"⚠️",label:"Drug Allergy",value:u.allergies,color:"#DC2626",bg:"#FEF2F2"});
  if(chronic.some(c=>/hypertension|htn/i.test(c))) alerts.push({icon:"❤️",label:"Hypertension",value:"Monitor BP regularly",color:"#B45309",bg:"#FFFBEB"});
  if(chronic.some(c=>/diabet/i.test(c))) alerts.push({icon:"🩸",label:"Diabetes",value:"Monitor blood sugar daily",color:"#B45309",bg:"#FFFBEB"});
  if(chronic.some(c=>/sickle/i.test(c))) alerts.push({icon:"🔴",label:"Sickle Cell Disease",value:"Stay hydrated, avoid cold",color:"#DC2626",bg:"#FEF2F2"});
  if(isPregnant) alerts.push({icon:"🤱",label:"Pregnancy",value:"Keep your ANC appointments",color:"#7C3AED",bg:"#F5F3FF"});

  const simplifyLab=(r)=>{
    const f=r.fields||{};
    const status=f.resultStatus||"";
    const sc=STATUS_COLOR[status]||"#78716C";
    let plain=r.title||f.testCategory||"Lab Test";
    if(/sugar|hba1c/i.test(f.testCategory||"")) plain="Blood Sugar";
    else if(/malaria/i.test(f.testCategory||"")) plain="Malaria Test";
    else if(/fbc|full blood/i.test(f.testCategory||"")) plain="Full Blood Count";
    else if(/urin/i.test(f.testCategory||"")) plain="Urine Test";
    else if(/lipid/i.test(f.testCategory||"")) plain="Cholesterol Check";
    else if(/typhoid/i.test(f.testCategory||"")) plain="Typhoid Test";
    else if(/faecal|stool/i.test(f.testCategory||"")) plain="Stool Test";
    const plainStatus=status==="High"?"Above normal range":status==="Low"?"Below normal range":status==="Positive"?"Positive result":status==="Negative"?"No infection found":status==="Abnormal"?"Needs attention":status==="Normal"?"All clear":"";
    return{plain,status,plainStatus,sc};
  };

  return(<div>
    <div style={{background:"linear-gradient(135deg,#0A3320,#14532D)",borderRadius:18,padding:"18px 20px",marginBottom:14,color:"#fff",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-20,right:-20,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,.05)"}}/>
      <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:20,fontWeight:700,marginBottom:6}}>{u.name}</div>
      <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:10}}>
        {[["Age",age+" yrs"],["Blood Group",u.bloodGroup],["Genotype",u.genotype]].map(([l,v])=>(
          <div key={l}><div style={{fontSize:9,opacity:.6,textTransform:"uppercase",letterSpacing:.8}}>{l}</div><div style={{fontSize:14,fontWeight:700,marginTop:1}}>{v}</div></div>
        ))}
      </div>
      <div style={{background:"rgba(255,255,255,.1)",borderRadius:10,padding:"7px 12px",fontSize:12}}>
        <span style={{opacity:.7,fontSize:10,textTransform:"uppercase",letterSpacing:.8}}>NHIA: </span>
        <span style={{fontWeight:600}}>{u.nhia||"Not registered"}</span>
      </div>
      {(latestBP||latestWeight)&&<div style={{display:"flex",gap:8,marginTop:10}}>
        {latestBP&&<div style={{background:"rgba(255,255,255,.12)",borderRadius:9,padding:"7px 12px",flex:1,textAlign:"center"}}><div style={{fontSize:9,opacity:.6,textTransform:"uppercase"}}>Last BP</div><div style={{fontSize:16,fontWeight:800,marginTop:2}}>{latestBP}</div></div>}
        {latestWeight&&<div style={{background:"rgba(255,255,255,.12)",borderRadius:9,padding:"7px 12px",flex:1,textAlign:"center"}}><div style={{fontSize:9,opacity:.6,textTransform:"uppercase"}}>Weight</div><div style={{fontSize:16,fontWeight:800,marginTop:2}}>{latestWeight} kg</div></div>}
      </div>}
    </div>

    {alerts.length>0&&<div style={{marginBottom:14}}>
      <div style={{fontSize:12,fontWeight:700,color:"#DC2626",marginBottom:8}}>🚨 Important Alerts</div>
      {alerts.map((a,i)=>(<div key={i} style={{background:a.bg,borderLeft:"4px solid "+a.color,borderRadius:"0 12px 12px 0",padding:"10px 14px",display:"flex",gap:12,alignItems:"center",marginBottom:6}}>
        <span style={{fontSize:20,flex:"none"}}>{a.icon}</span>
        <div><div style={{fontWeight:700,fontSize:13,color:a.color}}>{a.label}</div><div style={{fontSize:12,color:"#57534E",marginTop:1}}>{a.value}</div></div>
      </div>))}
    </div>}

    {chronic.length>0&&<div style={{...S.card,marginBottom:14,background:"#F0FDF4",border:"1.5px solid #BBF7D0"}}>
      <div style={{fontWeight:700,fontSize:13,color:G,marginBottom:8}}>My Conditions</div>
      {chronic.map((c,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,marginBottom:i<chronic.length-1?5:0}}><div style={{width:8,height:8,borderRadius:"50%",background:G,flex:"none"}}/>{c}</div>)}
    </div>}

    {meds.length>0&&<div style={{marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:G,marginBottom:8}}>💊 My Medications</div>
      {meds.map((r,i)=>{const f=r.fields||{};return(<div key={i} style={{...S.card,display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
        <div style={{width:38,height:38,borderRadius:9,background:"#CFFAFE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flex:"none"}}>💊</div>
        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{f.genericName}</div>
          {f.brandName&&f.brandName!==f.genericName&&<div style={{fontSize:11,color:"#78716C"}}>Brand: {f.brandName}</div>}
          <div style={{fontSize:13,color:"#0891B2",fontWeight:600}}>{f.dose} · {f.frequency}</div>
          {f.indication&&<div style={{fontSize:11,color:"#78716C"}}>For: {f.indication}</div>}
          {f.notes&&<div style={{fontSize:11,color:"#57534E",marginTop:3,background:"#F0FDFA",padding:"4px 8px",borderRadius:6}}>{f.notes}</div>}
        </div>
      </div>);})}
    </div>}

    {labRecs.length>0&&<div style={{marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:G,marginBottom:8}}>🔬 Recent Test Results</div>
      {labRecs.map((r,i)=>{const{plain,plainStatus,sc}=simplifyLab(r);return(<div key={i} style={{...S.card,display:"flex",gap:10,alignItems:"center",marginBottom:8,cursor:"pointer"}} onClick={()=>ctx.setDetail(r)}>
        <div style={{width:38,height:38,borderRadius:9,background:CARE.LAB.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flex:"none"}}>🔬</div>
        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{plain}</div>
          <div style={{fontSize:11,color:"#78716C"}}>{r.date} · {r.labName||"Lab"}</div>
          {plainStatus&&<div style={{display:"flex",alignItems:"center",gap:5,marginTop:3}}><div style={{width:8,height:8,borderRadius:"50%",background:sc,flex:"none"}}/><div style={{fontSize:12,color:sc,fontWeight:600}}>{plainStatus}</div></div>}
        </div>
        <div style={{fontSize:10,color:"#A8A29E"}}>›</div>
      </div>);})}
    </div>}

    {visits.length>0&&<div style={{marginBottom:14}}>
      <div style={{fontSize:13,fontWeight:700,color:G,marginBottom:8}}>📅 Recent Visits</div>
      {visits.map((r,i)=>{const ct=CARE[r.careType]||{color:"#555",bg:"#eee",icon:"📄",label:r.careType};const f=r.fields||{};const done=!f.nextAppt&&!f.nextReview&&!f.nextANC&&r.careType!=="EMERGENCY"&&r.careType!=="MATERNITY";
        return(<div key={r.id} style={{display:"flex",gap:0,cursor:"pointer"}} onClick={()=>ctx.setDetail(r)}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginRight:10}}>
            <div style={{width:30,height:30,borderRadius:"50%",background:ct.bg,border:"2px solid "+ct.color+"30",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flex:"none"}}>{ct.icon}</div>
            {i<visits.length-1&&<div style={{width:2,flex:1,background:"#E5E2DB",minHeight:16,marginTop:3}}/>}
          </div>
          <div style={{...S.card,flex:1,marginBottom:8,padding:"10px 12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:10,color:ct.color,fontWeight:700,textTransform:"uppercase"}}>{ct.label} · {r.date}</div>
                <div style={{fontWeight:700,fontSize:13,marginTop:1}}>{r.title}</div>
                {r.facility&&<div style={{fontSize:11,color:"#78716C"}}>📍 {r.facility}</div>}
                {f.diagnosis&&<div style={{fontSize:11,color:"#57534E",marginTop:3,background:"#F9F7F4",padding:"3px 7px",borderRadius:6}}>Dx: {f.diagnosis}</div>}
                {f.condition&&!f.diagnosis&&<div style={{fontSize:11,color:"#57534E",marginTop:3,background:"#F9F7F4",padding:"3px 7px",borderRadius:6}}>{f.condition}</div>}
              </div>
              <span style={{fontSize:10,color:done?"#16A34A":"#7C3AED",fontWeight:700,background:done?"#F0FDF4":"#F5F3FF",padding:"2px 7px",borderRadius:99,marginLeft:6,flex:"none"}}>{done?"Completed":"Ongoing"}</span>
            </div>
          </div>
        </div>);
      })}
    </div>}

    {!recs.length&&<div style={{textAlign:"center",padding:"40px 20px"}}>
      <div style={{fontSize:48,marginBottom:12}}>🏥</div>
      <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:18,fontWeight:700,color:G,marginBottom:8}}>Your health story starts here</div>
      <div style={{fontSize:13,color:"#78716C",lineHeight:1.7}}>When a doctor or lab adds information, it will appear here. Share your access code with your doctor to get started.</div>
      <button onClick={()=>ctx.setSub("access")} style={{...S.btnG,maxWidth:240,margin:"20px auto 0"}}>Share with a Doctor or Lab</button>
    </div>}

    {/* HMO Card */}
    <div style={{...S.card,marginBottom:14,cursor:"pointer",border:"1.5px solid "+(u.hmo?.provider?HMO_PROVIDERS[u.hmo.provider]?.color||G:"#E5E2DB")}} onClick={()=>ctx.setModal("hmo")}>
      {u.hmo?.provider?(<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontWeight:700,fontSize:13,color:HMO_PROVIDERS[u.hmo.provider]?.color||G}}>🏥 HMO Card</div>
          <span style={{fontSize:11,color:"#78716C"}}>tap to view or share ›</span>
        </div>
        <div style={{background:HMO_PROVIDERS[u.hmo.provider]?.color||G,borderRadius:12,padding:"12px 14px",color:"#fff"}}>
          <div style={{fontSize:11,opacity:.7,marginBottom:2}}>{u.hmo.provider}</div>
          <div style={{fontWeight:700,fontSize:14,marginBottom:6}}>{u.name}</div>
          <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
            <div><div style={{fontSize:9,opacity:.6,textTransform:"uppercase"}}>Member ID</div><div style={{fontSize:13,fontWeight:800,letterSpacing:.5,marginTop:1}}>{u.hmo.memberId}</div></div>
            <div><div style={{fontSize:9,opacity:.6,textTransform:"uppercase"}}>Plan</div><div style={{fontSize:12,fontWeight:700,marginTop:1}}>{u.hmo.plan||"—"}</div></div>
            {u.hmo.expiry&&<div><div style={{fontSize:9,opacity:.6,textTransform:"uppercase"}}>Expires</div><div style={{fontSize:12,fontWeight:700,marginTop:1}}>{u.hmo.expiry}</div></div>}
          </div>
        </div>
      </>):(
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <div style={{width:40,height:40,borderRadius:10,background:"#F0FDF4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flex:"none"}}>🏥</div>
          <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14,color:G}}>Add HMO Card</div><div style={{fontSize:12,color:"#78716C",marginTop:2}}>Store your health insurance details for quick sharing at hospital desks</div></div>
          <span style={{fontSize:18,color:G}}>+</span>
        </div>
      )}
    </div>

    <div style={{...S.card,background:"#FEF9EC",border:"1px solid #FCD34D",marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:12,marginBottom:4,color:"#92400E"}}>🆘 Emergency Contact</div>
      <div style={{fontSize:13,color:"#57534E"}}><strong>{u.nokName}</strong> ({u.nokRelation}) · {u.nokPhone}</div>
    </div>
  </div>);
}

// ── PATIENT HISTORY ───────────────────────────────────────────────
function PatientHistory({ctx,recs}){
  const [filter,setFilter]=useState("ALL");
  const filtered=filter==="ALL"?recs:recs.filter(r=>r.careType===filter);
  const grouped=filtered.reduce((acc,r)=>{const ym=r.date?.slice(0,7)||"Unknown";if(!acc[ym])acc[ym]=[];acc[ym].push(r);return acc;},{});
  const fmt=ym=>{if(!ym||ym==="Unknown")return"Unknown";const[y,m]=ym.split("-");return new Date(y,m-1).toLocaleDateString("en-NG",{month:"long",year:"numeric"});};
  return(<div>
    <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:20,fontWeight:700,color:G,marginBottom:12}}>My Health History</div>
    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
      {["ALL",...Object.keys(CARE)].map(k=>{const info=k==="ALL"?{label:"All",color:G,bg:"#D1FAE5"}:CARE[k];const active=filter===k;return(<button key={k} onClick={()=>setFilter(k)} style={{padding:"5px 12px",borderRadius:99,fontSize:11,fontWeight:600,border:active?"2px solid "+info.color:"2px solid #E5E2DB",background:active?info.bg:"#FAFAF9",color:active?info.color:"#78716C",cursor:"pointer"}}>{k==="ALL"?"All":info.label}</button>);})}
    </div>
    {!filtered.length&&<div style={{textAlign:"center",padding:"30px",color:"#78716C",fontSize:13}}>No records in this category yet.</div>}
    {Object.entries(grouped).sort(([a],[b])=>b.localeCompare(a)).map(([ym,grp])=>(
      <div key={ym} style={{marginBottom:18}}>
        <div style={{fontSize:11,fontWeight:700,color:"#A8A29E",textTransform:"uppercase",letterSpacing:1,marginBottom:8,paddingBottom:5,borderBottom:"1px solid #F0EDE8"}}>{fmt(ym)} · {grp.length} record{grp.length!==1?"s":""}</div>
        {grp.map(r=>{const ct=CARE[r.careType]||{color:"#555",bg:"#eee",icon:"📄",label:r.careType};const f=r.fields||{};
          return(<div key={r.id} style={{...S.card,display:"flex",gap:10,marginBottom:7,cursor:"pointer",alignItems:"flex-start"}} onClick={()=>ctx.setDetail(r)}>
            <div style={{background:ct.bg,borderRadius:8,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flex:"none",marginTop:1}}>{ct.icon}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:9,fontWeight:700,color:ct.color,textTransform:"uppercase"}}>{ct.label}</div>
              <div style={{fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.title}</div>
              {r.facility&&<div style={{fontSize:11,color:"#78716C"}}>📍 {r.facility}</div>}
              {f.diagnosis&&<div style={{fontSize:11,color:"#57534E",marginTop:1}}>Dx: {f.diagnosis}</div>}
              {f.condition&&!f.diagnosis&&<div style={{fontSize:11,color:"#57534E",marginTop:1}}>{f.condition}</div>}
              {r.careType==="PHARMACY"&&f.genericName&&<div style={{fontSize:11,color:"#0891B2",fontWeight:600,marginTop:1}}>💊 {f.genericName} {f.dose}</div>}
              {r.careType==="LAB"&&f.resultStatus&&<span style={{fontSize:10,fontWeight:700,color:"#fff",background:STATUS_COLOR[f.resultStatus]||"#78716C",padding:"1px 7px",borderRadius:99,display:"inline-block",marginTop:2}}>{f.resultStatus}</span>}
            </div>
            <div style={{fontSize:10,color:"#A8A29E",marginTop:2}}>›</div>
          </div>);
        })}
      </div>
    ))}
  </div>);
}

// ── PATIENT DOCUMENTS ─────────────────────────────────────────────
function PatientDocuments({ctx}){
  const phone=ctx.user?.phone;
  const [docs,setDocs]=useState(()=>DB.get("hvng_docs_"+phone)||[]);
  const [uploading,setUploading]=useState(false);
  const [processing,setProcessing]=useState(false);
  const fileRef=useRef();

  const processDoc=async(doc)=>{
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:400,messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:doc.type,data:doc.dataUrl.split(",")[1]}},{type:"text",text:"Extract medical information from this document as JSON only: {careType: GENERAL/MATERNITY/LAB/CHRONIC/EMERGENCY/PHARMACY, title: string, facility: string or null, date: YYYY-MM-DD or null, fields: {diagnosis, treatment, genericName, dose, frequency, indication, nafdac, testCategory, resultStatus, result, condition, notes}}. Return ONLY valid JSON."}]}]})});
      const data=await res.json();
      const text=data.content?.map(b=>b.text||"").join("").replace(/```json|```/g,"").trim();
      const extracted=JSON.parse(text);
      if(extracted?.careType&&CARE[extracted.careType]){
        const rec={id:Date.now(),date:extracted.date||today(),careType:extracted.careType,title:extracted.title||"Uploaded Document",facility:extracted.facility||"",addedBy:"patient",attachments:[{name:doc.name,type:doc.type,size:doc.size,dataUrl:doc.dataUrl}],fields:extracted.fields||{},fromUpload:true};
        const recs=DB.get("hvng_records_"+phone)||[];
        DB.set("hvng_records_"+phone,[...recs,rec]);
        ctx.flash("Document scanned and added to your records!");
      }
    }catch(e){}
  };

  const handleUpload=async(e)=>{
    const files=Array.from(e.target.files);if(!files.length)return;
    setUploading(true);const newDocs=[];
    for(const file of files){
      if(file.size>10*1024*1024){ctx.flash(file.name+" is over 10MB","err");continue;}
      const dataUrl=await new Promise(res=>{const r=new FileReader();r.onload=()=>res(r.result);r.readAsDataURL(file);});
      newDocs.push({id:Date.now()+Math.random(),name:file.name,type:file.type,size:file.size,dataUrl,uploaded:today()});
    }
    const all=[...docs,...newDocs];DB.set("hvng_docs_"+phone,all);setDocs(all);setUploading(false);e.target.value="";
    if(newDocs.length){ctx.flash(newDocs.length+" document"+(newDocs.length>1?"s":"")+" uploaded!");
      for(const doc of newDocs){if(doc.type.startsWith("image/")){setProcessing(true);await processDoc(doc);setProcessing(false);}}}
  };

  return(<div>
    <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:20,fontWeight:700,color:G,marginBottom:6}}>My Health Documents</div>
    <div style={{fontSize:13,color:"#78716C",lineHeight:1.7,marginBottom:14}}>Upload prescriptions, lab results or any health document. Photos of documents are automatically scanned and saved to your records.</div>
    <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" style={{display:"none"}} onChange={handleUpload}/>
    <div onClick={()=>fileRef.current.click()} style={{background:"#F0FDF4",border:"2px dashed #86EFAC",borderRadius:16,padding:"24px 20px",textAlign:"center",cursor:"pointer",marginBottom:14}}>
      <div style={{fontSize:32,marginBottom:6}}>📤</div>
      <div style={{fontWeight:700,fontSize:14,color:G,marginBottom:3}}>Upload Health Documents</div>
      <div style={{fontSize:12,color:"#78716C"}}>Prescriptions · Lab results · Discharge letters · Referral letters</div>
      <div style={{marginTop:10,background:G,color:"#fff",padding:"9px 22px",borderRadius:99,display:"inline-block",fontSize:13,fontWeight:700}}>{uploading?"Uploading...":"Choose Files"}</div>
    </div>
    {processing&&<div style={{...S.card,background:"#EFF6FF",border:"1px solid #BFDBFE",marginBottom:12,display:"flex",gap:10,alignItems:"center"}}>
      <span style={{fontSize:22}}>🤖</span><div><div style={{fontWeight:700,fontSize:12,color:"#1E40AF"}}>Reading document...</div><div style={{fontSize:11,color:"#3B82F6",marginTop:1}}>AI is scanning for medical information</div></div>
    </div>}
    <div style={{...S.card,background:"#FFFBEB",border:"1px solid #FCD34D",marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:11,color:"#92400E",marginBottom:4}}>💡 Tips</div>
      {["Good lighting makes a big difference","Make sure the text is clearly visible","Works well with printed prescriptions, results and letters"].map((t,i)=><div key={i} style={{fontSize:11,color:"#57534E",display:"flex",gap:6,marginBottom:2}}><span style={{color:"#92400E"}}>•</span>{t}</div>)}
    </div>
    {docs.length>0&&<div>
      <div style={{fontSize:13,fontWeight:700,color:G,marginBottom:8}}>Uploaded Documents ({docs.length})</div>
      {docs.map(doc=><div key={doc.id} style={{...S.card,display:"flex",gap:10,alignItems:"center",marginBottom:8}}>
        <div style={{width:40,height:40,borderRadius:9,background:doc.type.startsWith("image/")?"#EDE9FE":"#FEF3C7",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flex:"none"}}>{doc.type.startsWith("image/")?"🖼️":"📄"}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:600,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{doc.name}</div>
          <div style={{fontSize:10,color:"#78716C",marginTop:1}}>Uploaded {doc.uploaded} · {(doc.size/1024).toFixed(0)} KB</div>
        </div>
        <button onClick={()=>{const u=docs.filter(d=>d.id!==doc.id);DB.set("hvng_docs_"+phone,u);setDocs(u);ctx.flash("Removed");}} style={{background:"#FEE2E2",color:"#DC2626",border:"none",borderRadius:7,padding:"5px 9px",fontSize:11,cursor:"pointer",fontWeight:600}}>Remove</button>
      </div>)}
    </div>}
    {!docs.length&&<div style={{textAlign:"center",padding:"20px",color:"#A8A29E",fontSize:12}}>No documents uploaded yet.</div>}
  </div>);
}

function AccessManager({ctx}){
  const ph=ctx.user?.phone;
  const [label,setLabel]=useState("");
  const [allCodes,setAllCodes]=useState(()=>DB.get("hvng_access_codes")||[]);
  const mine=allCodes.filter(c=>c.phone===ph);
  const active=mine.filter(c=>c.active&&c.expires>Date.now());
  const expired=mine.filter(c=>!c.active||c.expires<=Date.now());
  const generate=()=>{
    if(!label.trim()) return ctx.flash("Please name this access code first","err");
    const c=genCode(),exp=Date.now()+24*60*60*1000;
    const all=[...(DB.get("hvng_access_codes")||[]),{code:c,phone:ph,label:label.trim(),expires:exp,active:true,generated:today()}];
    DB.set("hvng_access_codes",all);setAllCodes(all);setLabel("");ctx.flash("Access code generated!");
  };
  const revoke=(code)=>{const all=(DB.get("hvng_access_codes")||[]).map(c=>c.code===code?{...c,active:false}:c);DB.set("hvng_access_codes",all);setAllCodes(all);ctx.flash("Access revoked","err");};
  return(<div>
    <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:20,fontWeight:700,color:G,marginBottom:6}}>Share with a Doctor or Lab</div>
    <div style={{fontSize:13,color:"#78716C",lineHeight:1.7,marginBottom:14}}>Give your doctor or lab a one-time code to view your records. The code expires in <strong>24 hours</strong>. You can cancel it anytime.</div>
    <div style={{...S.card,marginBottom:16}}>
      <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>🔑 Give Access to a Doctor or Lab</div>
      <Fl label="Who is this for?"><input style={S.inp} placeholder="e.g. Dr. Fatima Bello / Medilab Diagnostics" value={label} onChange={e=>setLabel(e.target.value)} maxLength={80}/></Fl>
      <button style={S.btnG} onClick={generate}>Create Sharing Code</button>
    </div>
    {active.length>0&&<div style={{fontWeight:700,fontSize:13,color:G,marginBottom:8}}>Active Access ({active.length})</div>}
    {active.map(c=>(<div key={c.code} style={{...S.card,border:"1.5px solid #BBF7D0",marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div><div style={{fontWeight:700,fontSize:14}}>{c.label}</div><div style={{fontSize:11,color:"#78716C",marginTop:1}}>Expires in 24h · Generated {c.generated}</div></div>
        <button onClick={()=>revoke(c.code)} style={{background:"#FEE2E2",color:"#DC2626",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer",fontWeight:600}}>Revoke</button>
      </div>
      <div style={{background:"#F0FDF4",border:"2px dashed #86EFAC",borderRadius:10,padding:"10px 16px",textAlign:"center"}}>
        <div style={{fontSize:10,color:"#15803D",fontWeight:700,letterSpacing:2,marginBottom:4}}>ACCESS CODE</div>
        <div style={{fontFamily:"monospace",fontSize:30,fontWeight:900,letterSpacing:8,color:G}}>{c.code}</div>
        <div style={{fontSize:11,color:"#78716C",marginTop:3}}>Share this code with your doctor or lab</div>
      </div>
    </div>))}
    {!active.length&&<div style={{fontSize:13,color:"#78716C",padding:"14px",background:"#F9F7F4",borderRadius:12,marginBottom:14}}>No active codes. Generate one above to share your records.</div>}
    {expired.length>0&&<>
      <div style={{fontWeight:700,fontSize:12,color:"#78716C",marginBottom:6}}>Past Access ({expired.length})</div>
      {expired.slice(0,5).map(c=><div key={c.code} style={{...S.card,opacity:.5,display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,padding:"9px 12px"}}><div style={{fontWeight:600,fontSize:12}}>{c.label}</div><div style={{fontFamily:"monospace",fontSize:10,color:"#78716C"}}>{c.code} · {c.active?"Expired":"Revoked"}</div></div>)}
    </>}
  </div>);
}


// ── DOCTOR LOGIN + REGISTER ───────────────────────────────────────
function DrLogin({ctx}){
  const [f,setF]=useState({email:"",pw:""});const [err,setErr]=useState("");
  const login=()=>{
    const d=(DB.get("hvng_doctors")||[]).find(d=>d.email===f.email&&d.password===f.pw);
    if(!d){setErr("Invalid credentials");return;}
    ctx.setDoc(d);ctx.flash(`Welcome, ${d.name}`);ctx.go("dr-app","patients");
  };
  return(<Centered><PageTitle title="Clinician Login" sub="HealthVault NG — Clinician Portal" color={GB}/>
    <div style={S.card}>
      <Fl label="Email"><input style={S.inp} placeholder="doctor@hospital.ng" value={f.email} onChange={e=>setF(p=>({...p,email:e.target.value}))}/></Fl>
      <Fl label="Password"><input type="password" style={S.inp} value={f.pw} onChange={e=>setF(p=>({...p,pw:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&login()}/></Fl>
      {err&&<div style={{color:"#DC2626",fontSize:13,marginBottom:10}}>{err}</div>}
      <button style={S.btnB} onClick={login}>LOGIN</button>
      <div style={{textAlign:"center",marginTop:14,fontSize:13,color:"#78716C"}}>New clinician? <span style={{color:GB,fontWeight:700,cursor:"pointer"}} onClick={()=>ctx.go("dr-register")}>Register here</span></div>
    </div>
    <Hint color="blue">Email: <strong>dr.emeka@hospital.ng</strong> · Password: <strong>doctor123</strong></Hint>
    <Back onClick={()=>ctx.go("landing")}/></Centered>);
}

function DrRegister({ctx}){
  const SPECS=["General Practice","Internal Medicine","Paediatrics","Obstetrics & Gynaecology","Surgery","Cardiology","Neurology","Psychiatry","Orthopaedics","Dermatology","Ophthalmology","ENT","Radiology","Pathology","Emergency Medicine","Anaesthesia","Other"];
  const [f,setF]=useState({name:"",email:"",password:"",confirmPw:"",phone:"",mdcn:"",qualification:"",specialty:"General Practice",subSpecialty:"",hospitals:"",bio:""});
  const upd=(k,v)=>setF(p=>({...p,[k]:v}));
  const submit=()=>{
    if(!f.name||!f.email||!f.password) return ctx.flash("Name, email and password are required","err");
    if(f.password!==f.confirmPw) return ctx.flash("Passwords do not match","err");
    if(f.password.length<6) return ctx.flash("Password must be at least 6 characters","err");
    const docs=DB.get("hvng_doctors")||[];
    if(docs.find(d=>d.email===f.email)) return ctx.flash("An account with this email already exists","err");
    const nd={name:f.name,email:f.email,password:f.password,phone:f.phone,mdcn:f.mdcn,qualification:f.qualification,specialty:f.specialty,subSpecialty:f.subSpecialty,hospitals:f.hospitals,bio:f.bio,verified:false};
    DB.set("hvng_doctors",[...docs,nd]);
    ctx.setDoc(nd);ctx.flash(`Welcome, ${f.name}!`);ctx.go("dr-app","patients");
  };
  return(<div style={{maxWidth:480,margin:"0 auto",padding:"0 20px 60px"}}>
    <PageTitle title="Clinician Registration" sub="Create your professional profile" color={GB}/>
    <div style={S.card}>
      <SectionHead color={GB}>👤 Personal & Login Details</SectionHead>
      <Fl label="Full Name (with title) *"><input style={S.inp} placeholder="e.g. Dr. Fatima Bello" value={f.name} onChange={e=>upd("name",e.target.value)}/></Fl>
      <Fl label="Email Address *"><input type="email" style={S.inp} placeholder="doctor@hospital.ng" value={f.email} onChange={e=>upd("email",e.target.value)}/></Fl>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Fl label="Password *"><input type="password" style={S.inp} placeholder="Min 6 chars" value={f.password} onChange={e=>upd("password",e.target.value)}/></Fl>
        <Fl label="Confirm Password *"><input type="password" style={S.inp} value={f.confirmPw} onChange={e=>upd("confirmPw",e.target.value)}/></Fl>
      </div>
      <Fl label="Phone Number"><input style={S.inp} placeholder="e.g. 08012345678" value={f.phone} onChange={e=>upd("phone",e.target.value)} maxLength={11}/></Fl>
      <SectionHead color={GB}>🏥 Professional Details</SectionHead>
      <Fl label="MDCN Number"><input style={S.inp} placeholder="e.g. MDCN/2015/00123" value={f.mdcn} onChange={e=>upd("mdcn",e.target.value)}/></Fl>
      <Fl label="Primary Qualification"><input style={S.inp} placeholder="e.g. MBBS (Lagos), FMCP, FWACS" value={f.qualification} onChange={e=>upd("qualification",e.target.value)}/></Fl>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Fl label="Primary Specialty"><select style={S.inp} value={f.specialty} onChange={e=>upd("specialty",e.target.value)}>{SPECS.map(s=><option key={s}>{s}</option>)}</select></Fl>
        <Fl label="Sub-specialty"><input style={S.inp} placeholder="Optional" value={f.subSpecialty} onChange={e=>upd("subSpecialty",e.target.value)}/></Fl>
      </div>
      <Fl label="Hospital / Practice Affiliations"><input style={S.inp} placeholder="e.g. LUTH, Lagos Island General" value={f.hospitals} onChange={e=>upd("hospitals",e.target.value)}/></Fl>
      <Fl label="Short Bio (optional)"><textarea style={{...S.inp,height:68,resize:"vertical"}} placeholder="Brief professional summary…" value={f.bio} onChange={e=>upd("bio",e.target.value)} maxLength={400}/><CharCount val={f.bio} max={400}/></Fl>
      <button style={S.btnB} onClick={submit}>Create My Account</button>
    </div>
    <Back onClick={()=>ctx.go("dr-login")}/>
  </div>);
}

// ── DOCTOR APP SHELL ──────────────────────────────────────────────
function DrApp({ctx}){
  const d=ctx.doc;
  const drKey=`hvng_dr_patients_${d?.email}`;
  const TABS=[{id:"patients",icon:"👥",label:"Patients"},{id:"visits",icon:"📋",label:"My Visits"},{id:"profile",icon:"👤",label:"Profile"}];
  const allMyRecs=Object.keys(localStorage).filter(k=>k.startsWith("hvng_records_")).flatMap(k=>DB.get(k)||[]).filter(r=>r.docEmail===d?.email).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const PAGES={
    patients:<DrPatients ctx={ctx} drKey={drKey}/>,
    visits:<DrVisitHistory recs={allMyRecs} ctx={ctx}/>,
    profile:<DrProfile doc={d} ctx={ctx}/>,
  };
  return(
    <div style={{maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column",minHeight:"100vh"}}>
      <div style={{...S.topBar(GB)}}>
        <div style={{width:38,height:38,borderRadius:10,background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,flex:"none"}}>{d?.name?.split(" ").filter(w=>w!=="Dr.").map(w=>w[0]).join("").slice(0,2)}</div>
        <div style={{flex:1}}><div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:15,fontWeight:700}}>{d?.name}</div><div style={{fontSize:11,opacity:.7}}>{d?.specialty}{d?.mdcn?` · MDCN: ${d.mdcn}`:""}</div></div>
        <span style={{fontSize:12,cursor:"pointer",opacity:.8,background:"rgba(255,255,255,.15)",padding:"5px 10px",borderRadius:8,fontWeight:600}} onClick={()=>{ctx.setDoc(null);ctx.setVp(null);ctx.go("landing");}}>Sign out</span>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"18px 16px 96px"}}>{PAGES[ctx.sub]??PAGES.patients}</div>
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"#fff",borderTop:"1.5px solid #F0EDE8",display:"flex",zIndex:50,boxShadow:"0 -4px 20px rgba(0,0,0,.06)"}}>
        {TABS.map(t=><div key={t.id} style={{flex:1,padding:"10px 0",textAlign:"center",cursor:"pointer",borderTop:ctx.sub===t.id?`3px solid ${GB}`:"3px solid transparent"}} onClick={()=>ctx.setSub(t.id)}><div style={{fontSize:18}}>{t.icon}</div><div style={{fontSize:10,color:ctx.sub===t.id?GB:"#78716C",fontWeight:ctx.sub===t.id?700:400,marginTop:1}}>{t.label}</div></div>)}
      </div>
    </div>
  );
}

// ── DOCTOR PATIENTS (home screen — mirrors lab) ───────────────────
function DrPatients({ctx,drKey}){
  const [showAddModal,setShowAddModal]=useState(false);
  const [code,setCode]=useState("");const [codeErr,setCodeErr]=useState("");
  const patients=DB.get(drKey)||[];

  const lookupPatient=()=>{
    const entry=(DB.get("hvng_access_codes")||[]).find(c=>c.code===code&&c.active&&c.expires>Date.now());
    if(!entry){setCodeErr("Invalid or expired code. Ask the patient to generate one from their Access tab.");return;}
    const pt=(DB.get("hvng_users")||[]).find(u=>u.phone===entry.phone);
    if(!pt){setCodeErr("Patient not found.");return;}
    const existing=DB.get(drKey)||[];
    if(!existing.find(e=>e.phone===pt.phone)){
      DB.set(drKey,[...existing,{phone:pt.phone,name:pt.name,dob:pt.dob,bloodGroup:pt.bloodGroup,genotype:pt.genotype,gender:pt.gender}]);
    }
    ctx.setVp({...pt});ctx.flash(`Viewing: "+pt.name+"`);
    setShowAddModal(false);setCode("");setCodeErr("");
    ctx.go("dr-view");
  };

  const openPatient=(pt)=>{
    const full=(DB.get("hvng_users")||[]).find(u=>u.phone===pt.phone)||pt;
    ctx.setVp({...full});ctx.go("dr-view");
  };

  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
      <div>
        <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:22,fontWeight:700,color:GB}}>My Patients</div>
        <div style={{fontSize:13,color:"#78716C",marginTop:2}}>{patients.length} patient{patients.length!==1?"s":""} on your list</div>
      </div>
      <button onClick={()=>setShowAddModal(true)} style={{background:GB,color:"#fff",border:"none",borderRadius:10,padding:"10px 18px",fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 2px 8px rgba(29,78,216,.3)"}}>＋ Add Patient</button>
    </div>

    {!patients.length?(
      <div style={{textAlign:"center",paddingTop:60,paddingBottom:40}}>
        <div style={{fontSize:56,marginBottom:16}}>👥</div>
        <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:20,fontWeight:700,color:GB,marginBottom:8}}>No patients yet</div>
        <div style={{color:"#78716C",fontSize:14,lineHeight:1.75,maxWidth:280,margin:"0 auto 24px"}}>Add a patient using their 6-digit access code. They appear here permanently — no code needed next time.</div>
        <button onClick={()=>setShowAddModal(true)} style={{background:GB,color:"#fff",border:"none",borderRadius:12,padding:"13px 28px",fontSize:15,fontWeight:700,cursor:"pointer"}}>Add First Patient</button>
      </div>
    ):(
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {patients.map(pt=>{
          const recs=(DB.get(`hvng_records_${pt.phone}`)||[]).sort((a,b)=>new Date(b.date)-new Date(a.date));
          const last=recs[0];
          const lastBP=recs.find(r=>r.fields?.bp)?.fields?.bp;
          return(
            <div key={pt.phone} style={{...S.card,padding:"16px 18px",cursor:"pointer"}} onClick={()=>openPatient(pt)}>
              <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:last?10:0}}>
                <div style={{width:44,height:44,borderRadius:12,background:"linear-gradient(135deg,#DBEAFE,#BFDBFE)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,color:GB,flex:"none"}}>
                  {pt.name.split(" ").map(w=>w[0]).join("").slice(0,2)}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:15}}>{pt.name}</div>
                  <div style={{fontSize:12,color:"#78716C",marginTop:2}}>{pt.bloodGroup} · {pt.genotype} · Age {getAge(pt.dob)} · {pt.gender==="F"?"Female":"Male"}</div>
                </div>
                <div style={{textAlign:"right",flex:"none"}}>
                  <div style={{fontSize:20,fontWeight:900,fontFamily:"'Fraunces',Georgia,serif",color:GB}}>{recs.length}</div>
                  <div style={{fontSize:10,color:"#A8A29E",fontWeight:600}}>RECORDS</div>
                </div>
              </div>
              {last&&(<div style={{background:"#EFF6FF",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#1E40AF"}}>
                <span style={{fontWeight:600}}>Last visit:</span> {last.title} · {last.date}
                {lastBP&&<span style={{marginLeft:10,color:"#DC2626",fontWeight:600}}>BP: {lastBP}</span>}
              </div>)}
            </div>
          );
        })}
      </div>
    )}

    {/* Add Patient Modal */}
    {showAddModal&&(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:600,display:"flex",alignItems:"flex-end"}} onClick={()=>{setShowAddModal(false);setCode("");setCodeErr("");}}>
        <div className="sheet-anim" style={{background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",padding:"24px 20px 44px"}} onClick={e=>e.stopPropagation()}>
          <div style={{width:40,height:4,background:"#D6D3CE",borderRadius:99,margin:"0 auto 20px"}}/>
          <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:20,fontWeight:700,color:GB,marginBottom:4}}>Add New Patient</div>
          <div style={{fontSize:13,color:"#78716C",marginBottom:20,lineHeight:1.65}}>Ask the patient to go to their <strong>Access tab</strong> and share their 6-digit code with you.</div>
          <Fl label="Patient Access Code">
            <input style={{...S.inp,fontSize:26,fontWeight:700,letterSpacing:10,textAlign:"center"}} placeholder="——————" maxLength={6} value={code} onChange={e=>{setCode(e.target.value);setCodeErr("");}} onKeyDown={e=>e.key==="Enter"&&lookupPatient()}/>
          </Fl>
          {codeErr&&<div style={{color:"#DC2626",fontSize:13,marginBottom:10,lineHeight:1.5}}>{codeErr}</div>}
          <button style={S.btnB} onClick={lookupPatient}>Find Patient</button>
          <button style={{...S.btnG,marginTop:10,background:"#F3F1EC",color:"#57534E",boxShadow:"none"}} onClick={()=>{setShowAddModal(false);setCode("");setCodeErr("");}}>Cancel</button>
        </div>
      </div>
    )}
  </div>);
}

function DrVisitHistory({recs,ctx}){
  const allPtRecs=(DB.get(`hvng_records_${ctx.vp?.phone}`)||[]).sort((a,b)=>new Date(b.date)-new Date(a.date));
  return(<div>
    {ctx.vp?(
      <>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <button onClick={()=>ctx.setVp(null)} style={{...S.sm("ghost"),fontSize:12,padding:"6px 12px"}}>← Back</button>
          <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:18,fontWeight:700,color:GB}}>{ctx.vp.name}'s History</div>
        </div>
        <FullHistory recs={allPtRecs} title={`${ctx.vp.name} — Full History`}/>
      </>
    ):(
      <>
        <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:20,fontWeight:700,color:GB,marginBottom:16}}>My Visit Records</div>
        {!recs.length&&<Empty msg="You haven't added any visit records yet."/>}
        <RecordList recs={recs} onOpen={r=>ctx.setDetail(r)}/>
      </>
    )}
  </div>);
}

function DrProfile({doc,ctx}){
  const d=doc||{};
  return(<div>
    <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:20,fontWeight:700,color:GB,marginBottom:16}}>My Profile</div>
    <div style={{...S.card,marginBottom:14,background:"linear-gradient(135deg,#1D4ED8,#2563EB)",color:"#fff",borderRadius:20}}>
      <div style={{fontSize:36,marginBottom:10}}>🩺</div>
      <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:22,fontWeight:700}}>{d.name}</div>
      <div style={{fontSize:13,opacity:.85,marginTop:4}}>{d.specialty}{d.subSpecialty?` · ${d.subSpecialty}`:""}</div>
      {d.qualification&&<div style={{fontSize:13,opacity:.75,marginTop:2}}>{d.qualification}</div>}
      {d.verified&&<div style={{marginTop:8,background:"rgba(255,255,255,.2)",display:"inline-block",padding:"3px 10px",borderRadius:99,fontSize:12,fontWeight:700}}>✓ MDCN Verified</div>}
    </div>
    <div style={S.card}>
      {[["MDCN Number",d.mdcn||"Not provided"],["Phone",d.phone||"Not provided"],["Email",d.email],["Hospitals / Practice",d.hospitals||"Not provided"]].map(([l,v])=>(
        <div key={l} style={{marginBottom:14}}><div style={S.lbl}>{l}</div><div style={{fontSize:14,color:"#1C1917"}}>{v}</div></div>
      ))}
      {d.bio&&(<div><div style={S.lbl}>Bio</div><div style={{fontSize:14,color:"#57534E",lineHeight:1.65}}>{d.bio}</div></div>)}
    </div>
  </div>);
}

// ── DOCTOR VIEW PATIENT ───────────────────────────────────────────
function DrView({ctx}){
  const p=ctx.vp;if(!p) return null;
  const [filter,setFilter]=useState("ALL");
  const [aiSummary,setAiSummary]=useState(null);const [aiLoading,setAiLoading]=useState(false);
  const all=(DB.get(`hvng_records_${p.phone}`)||[]).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const recs=filter==="ALL"?all:all.filter(r=>r.careType===filter);
  const hasMaternity=all.some(r=>r.careType==="MATERNITY");

  const generateSummary=async()=>{
    setAiLoading(true);setAiSummary(null);
    const recent=all.slice(0,5).map(r=>({date:r.date,careType:r.careType,title:r.title,diagnosis:r.fields?.diagnosis||r.fields?.condition||null,bp:r.fields?.bp||null,weight:r.fields?.weight||null,bloodGlucose:r.fields?.bloodGlucose||null,hba1c:r.fields?.hba1c||r.fields?.value||null,resultStatus:r.fields?.resultStatus||null,notes:r.fields?.notes||null,treatment:r.fields?.treatment||null}));
    const prompt=`You are a clinical assistant in Nigeria. Write a concise plain-English patient summary for a clinician (3–5 sentences). Use only data provided. Be factual, no diagnosis.\n\nPatient: ${p.name}, Age ${getAge(p.dob)}, ${p.gender==="F"?"Female":"Male"}, Blood group ${p.bloodGroup}, Genotype ${p.genotype}.\nAllergies: ${p.allergies||"None known"}\nRecent records: ${JSON.stringify(recent,null,2)}\n\nCover: known conditions, recent diagnoses, key vitals or lab trends, medications, follow-up due. End with what the clinician should focus on today.`;
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:400,messages:[{role:"user",content:prompt}]})});
      const data=await res.json();
      setAiSummary(data.content?.map(b=>b.text||"").join("")||"Summary unavailable.");
    }catch{setAiSummary("Could not generate summary — check connection.");}
    setAiLoading(false);
  };

  return(
    <div style={{maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column",minHeight:"100vh"}}>
      <div style={S.topBar(GB)}>
        <span style={{cursor:"pointer",fontSize:22}} onClick={()=>ctx.go("dr-app","patients")}>‹</span>
        <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:16,fontWeight:700,flex:1}}>{p.name} | {getAge(p.dob)} | {p.gender}</div>
        <span style={{fontSize:12,background:"rgba(255,255,255,.2)",padding:"4px 10px",borderRadius:99,fontWeight:600}}>{p.bloodGroup}</span>
      </div>

      <div style={{flex:1,padding:"16px 14px 96px"}}>
        {/* Patient strip */}
        <div style={{...S.card,marginBottom:14,background:"#EFF6FF",border:"1.5px solid #BFDBFE"}}>
          <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:p.nokName?10:0}}>
            {[["Genotype",p.genotype],["DOB",p.dob],["NHIA",p.nhia||"N/A"],["Allergies",p.allergies||"None"]].map(([l,v])=>(<div key={l}><div style={{fontSize:10,color:"#1E40AF",fontWeight:700}}>{l}</div><div style={{fontSize:13,fontWeight:600,marginTop:1}}>{v}</div></div>))}
          </div>
          {p.nokName&&<div style={{fontSize:12,color:"#1E40AF",borderTop:"1px solid #BFDBFE",paddingTop:8,marginTop:4}}>🆘 NOK: <strong>{p.nokName}</strong> ({p.nokRelation}) · {p.nokPhone}</div>}
        </div>

        {/* Quick actions */}
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
          {[["📈 Vitals","vitals"],["📊 Summary","summary"],["🤱 Maternal","maternal",!hasMaternity],["🚨 Emergency","emergency"],["📋 Referral","referral"]].map(([label,key,hidden])=>!hidden&&(
            <button key={key} onClick={()=>ctx.setModal(key)} style={{...S.sm("ghost"),fontSize:12,padding:"7px 12px"}}>{label}</button>
          ))}
          <button onClick={()=>{ctx.setVp(p);ctx.go("dr-app","visits");}} style={{...S.sm("ghost"),fontSize:12,padding:"7px 12px"}}>📂 History</button>
        </div>

        {/* AI Summary */}
        <div style={{...S.card,marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:aiSummary?12:0}}>
            <div style={{fontWeight:700,fontSize:13}}>✨ AI Clinic Summary</div>
            <button onClick={generateSummary} disabled={aiLoading} style={{...S.sm("b"),fontSize:12,padding:"6px 14px",opacity:aiLoading?.7:1}}>{aiLoading?"Generating…":aiSummary?"Refresh":"Generate"}</button>
          </div>
          {aiLoading&&<div style={{fontSize:13,color:"#78716C",paddingTop:8}}>⏳ Analysing records…</div>}
          {aiSummary&&!aiLoading&&<div style={{fontSize:14,lineHeight:1.75,background:"#F0F7FF",padding:"12px 14px",borderRadius:10,borderLeft:"3px solid #1D4ED8"}}>{aiSummary}</div>}
          {!aiSummary&&!aiLoading&&<div style={{fontSize:12,color:"#A8A29E",marginTop:4}}>Tap Generate to get an AI summary from the last 5 visits.</div>}
        </div>

        <FilterPills filter={filter} setFilter={setFilter}/>
        {!recs.length&&<Empty msg="No records in this category."/>}
        <RecordList recs={recs} onOpen={r=>ctx.setDetail(r)}/>
      </div>

      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"#fff",borderTop:"1.5px solid #F0EDE8",padding:"12px 14px"}}>
        <button style={S.btnB} onClick={()=>ctx.go("dr-newvisit")}>+ NEW VISIT</button>
      </div>
    </div>
  );
}

function DrNewVisit({ctx}){
  return(<div style={{maxWidth:480,margin:"0 auto"}}>
    <div style={S.topBar(GB)}><span style={{cursor:"pointer",fontSize:22}} onClick={()=>ctx.go("dr-view")}>‹</span><div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:17,fontWeight:700,flex:1}}>New Visit</div></div>
    <div style={{padding:"18px 14px 60px"}}><AddRecord ctx={ctx} isDr={true}/></div>
  </div>);
}

// ── LAB PORTAL ────────────────────────────────────────────────────
function LabLogin({ctx}){
  const [f,setF]=useState({email:"",pw:""});const [err,setErr]=useState("");
  const login=()=>{const l=(DB.get("hvng_labs")||[]).find(l=>l.email===f.email&&l.password===f.pw);if(!l){setErr("Invalid credentials");return;}ctx.setLab(l);ctx.setVp(null);ctx.flash(`Welcome, ${l.name}`);ctx.go("lab-app","patients");};
  return(<Centered><PageTitle title="Lab Portal" sub="HealthVault NG — Laboratory Login" color={GL}/>
    <div style={S.card}>
      <Fl label="Lab Email"><input style={S.inp} placeholder="lab@diagnostics.ng" value={f.email} onChange={e=>setF(p=>({...p,email:e.target.value}))}/></Fl>
      <Fl label="Password"><input type="password" style={S.inp} value={f.pw} onChange={e=>setF(p=>({...p,pw:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&login()}/></Fl>
      {err&&<div style={{color:"#DC2626",fontSize:13,marginBottom:10}}>{err}</div>}
      <button style={S.btnL} onClick={login}>LOGIN</button>
    </div>
    <Hint color="amber">Email: <strong>medilab@diagnostics.ng</strong> · Password: <strong>lab123</strong></Hint>
    <Back onClick={()=>ctx.go("landing")}/></Centered>);
}

function LabApp({ctx}){
  const l=ctx.lab;
  const labKey=`hvng_lab_patients_${l?.email}`;
  const TABS=[{id:"patients",icon:"👥",label:"Patients"},{id:"entry",icon:"🔬",label:"Post Result"},{id:"history",icon:"📂",label:"History"}];
  const PAGES={patients:<LabMyPatients ctx={ctx} labKey={labKey}/>,entry:<LabEntry ctx={ctx} labKey={labKey}/>,history:<LabHistoryView ctx={ctx}/>};
  return(
    <div style={{maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column",minHeight:"100vh"}}>
      <div style={{...S.topBar(GL),boxShadow:"0 2px 12px rgba(0,0,0,.15)"}}>
        <div style={{width:38,height:38,borderRadius:10,background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flex:"none"}}>🔬</div>
        <div style={{flex:1}}><div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:15,fontWeight:700}}>{l?.name}</div><div style={{fontSize:11,opacity:.7}}>{l?.location}</div></div>
        <span style={{fontSize:12,cursor:"pointer",opacity:.8,background:"rgba(255,255,255,.15)",padding:"5px 10px",borderRadius:8,fontWeight:600}} onClick={()=>{ctx.setLab(null);ctx.setVp(null);ctx.go("landing");}}>Sign out</span>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"18px 16px 96px"}}>{PAGES[ctx.sub]??PAGES.patients}</div>
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"#fff",borderTop:"1.5px solid #F0EDE8",display:"flex",zIndex:50,boxShadow:"0 -4px 20px rgba(0,0,0,.06)"}}>
        {TABS.map(t=><div key={t.id} style={{flex:1,padding:"10px 0",textAlign:"center",cursor:"pointer",borderTop:ctx.sub===t.id?`3px solid ${GL}`:"3px solid transparent"}} onClick={()=>ctx.setSub(t.id)}><div style={{fontSize:18}}>{t.icon}</div><div style={{fontSize:10,color:ctx.sub===t.id?GL:"#78716C",fontWeight:ctx.sub===t.id?700:400,marginTop:1}}>{t.label}</div></div>)}
      </div>
    </div>
  );
}

function LabMyPatients({ctx,labKey}){
  const [showAddModal,setShowAddModal]=useState(false);
  const [code,setCode]=useState("");const [codeErr,setCodeErr]=useState("");
  const knownPatients=DB.get(labKey)||[];
  const lookupPatient=()=>{
    const entry=(DB.get("hvng_access_codes")||[]).find(c=>c.code===code&&c.active&&c.expires>Date.now());
    if(!entry){setCodeErr("Invalid or expired code.");return;}
    const pt=(DB.get("hvng_users")||[]).find(u=>u.phone===entry.phone);
    if(!pt){setCodeErr("Patient not found.");return;}
    const existing=DB.get(labKey)||[];
    if(!existing.find(e=>e.phone===pt.phone)) DB.set(labKey,[...existing,{phone:pt.phone,name:pt.name,dob:pt.dob,bloodGroup:pt.bloodGroup,genotype:pt.genotype}]);
    ctx.setVp({...pt});ctx.flash(`Patient added: "+pt.name+"`);
    setShowAddModal(false);setCode("");setCodeErr("");ctx.setSub("entry");
  };
  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
      <div><div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:22,fontWeight:700,color:GL}}>My Patients</div><div style={{fontSize:13,color:"#78716C",marginTop:2}}>{knownPatients.length} patient{knownPatients.length!==1?"s":""} on record</div></div>
      <button onClick={()=>setShowAddModal(true)} style={{background:GL,color:"#fff",border:"none",borderRadius:10,padding:"10px 18px",fontSize:13,fontWeight:700,cursor:"pointer"}}>＋ Add Patient</button>
    </div>
    {!knownPatients.length?(<div style={{textAlign:"center",paddingTop:60}}><div style={{fontSize:56,marginBottom:14}}>👥</div><div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:20,fontWeight:700,color:GL,marginBottom:8}}>No patients yet</div><div style={{color:"#78716C",fontSize:14,lineHeight:1.75,maxWidth:280,margin:"0 auto 24px"}}>Add a patient using their access code.</div><button onClick={()=>setShowAddModal(true)} style={{background:GL,color:"#fff",border:"none",borderRadius:12,padding:"13px 28px",fontSize:15,fontWeight:700,cursor:"pointer"}}>Add First Patient</button></div>):(
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {knownPatients.map(pt=>{
          const recs=(DB.get(`hvng_records_${pt.phone}`)||[]).filter(r=>r.labName===ctx.lab?.name).sort((a,b)=>new Date(b.date)-new Date(a.date));
          const last=recs[0];
          return(<div key={pt.phone} style={{...S.card,padding:"16px 18px"}}>
            <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:last?10:0}}>
              <div style={{width:44,height:44,borderRadius:12,background:"linear-gradient(135deg,#FEF3C7,#FDE68A)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,color:GL,flex:"none"}}>{pt.name.split(" ").map(w=>w[0]).join("").slice(0,2)}</div>
              <div style={{flex:1}}><div style={{fontWeight:700,fontSize:15}}>{pt.name}</div><div style={{fontSize:12,color:"#78716C",marginTop:2}}>{pt.bloodGroup} · {pt.genotype} · Age {getAge(pt.dob)}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:20,fontWeight:900,fontFamily:"'Fraunces',Georgia,serif",color:GL}}>{recs.length}</div><div style={{fontSize:10,color:"#A8A29E",fontWeight:600}}>RESULTS</div></div>
            </div>
            {last&&<div style={{background:"#FEF9EC",borderRadius:8,padding:"8px 12px",marginBottom:10,fontSize:12,color:"#92400E"}}><span style={{fontWeight:600}}>Last:</span> {last.title} · {last.date}</div>}
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{ctx.setVp(pt);ctx.setSub("history");}} style={{flex:1,padding:"9px",borderRadius:9,background:"#F9F7F4",color:GL,border:`1.5px solid ${GL}22`,fontSize:13,fontWeight:600,cursor:"pointer"}}>📂 History</button>
              <button onClick={()=>{ctx.setVp(pt);ctx.setSub("entry");}} style={{flex:1,padding:"9px",borderRadius:9,background:GL,color:"#fff",border:"none",fontSize:13,fontWeight:700,cursor:"pointer"}}>🔬 Post Result</button>
            </div>
          </div>);
        })}
      </div>
    )}
    {showAddModal&&(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:600,display:"flex",alignItems:"flex-end"}} onClick={()=>{setShowAddModal(false);setCode("");setCodeErr("");}}>
        <div className="sheet-anim" style={{background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",padding:"24px 20px 44px"}} onClick={e=>e.stopPropagation()}>
          <div style={{width:40,height:4,background:"#D6D3CE",borderRadius:99,margin:"0 auto 20px"}}/>
          <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:20,fontWeight:700,color:GL,marginBottom:4}}>Add New Patient</div>
          <div style={{fontSize:13,color:"#78716C",marginBottom:20,lineHeight:1.65}}>Ask the patient to go to their <strong>Access tab</strong> and share their 6-digit code.</div>
          <Fl label="Patient Access Code">
            <input style={{...S.inp,fontSize:26,fontWeight:700,letterSpacing:10,textAlign:"center"}} placeholder="——————" maxLength={6} value={code} onChange={e=>{setCode(e.target.value);setCodeErr("");}} onKeyDown={e=>e.key==="Enter"&&lookupPatient()}/>
          </Fl>
          {codeErr&&<div style={{color:"#DC2626",fontSize:13,marginBottom:10,lineHeight:1.5}}>{codeErr}</div>}
          <button style={S.btnL} onClick={lookupPatient}>Add Patient</button>
          <button style={{...S.btnG,marginTop:10,background:"#F3F1EC",color:"#57534E",boxShadow:"none"}} onClick={()=>{setShowAddModal(false);setCode("");setCodeErr("");}}>Cancel</button>
        </div>
      </div>
    )}
  </div>);
}

function LabHistoryView({ctx}){
  const p=ctx.vp;
  if(!p) return(<div style={{textAlign:"center",paddingTop:60}}><div style={{fontSize:48,marginBottom:12}}>🔍</div><div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:20,fontWeight:700,marginBottom:6}}>No patient selected</div><div style={{color:"#78716C",fontSize:14}}>Go to Patients and tap a patient to view their history.</div></div>);
  const allRecs=(DB.get(`hvng_records_${p.phone}`)||[]).sort((a,b)=>new Date(b.date)-new Date(a.date));
  return(<FullHistory recs={allRecs} title={`${p.name} — Full History`}/>);
}

function LabEntry({ctx,labKey}){
  const p=ctx.vp;
  const [testCat,setTestCat]=useState("Malaria Test");
  const [fields,setFields]=useState({});
  const [date,setDate]=useState(today());
  const [attachments,setAttachments]=useState([]);
  const [aiParsing,setAiParsing]=useState(false);
  const fileRef=useRef();
  const upd=(k,v)=>setFields(prev=>({...prev,[k]:v}));

  const handleFileUpload=async(e)=>{
    const files=Array.from(e.target.files);const processed=[];
    for(const file of files){
      if(file.size>5*1024*1024){ctx.flash(`${file.name} over 5MB`,"err");continue;}
      const dataUrl=await new Promise(res=>{const r=new FileReader();r.onload=()=>res(r.result);r.readAsDataURL(file);});
      processed.push({name:file.name,type:file.type,size:file.size,dataUrl});
    }
    setAttachments(prev=>[...prev,...processed]);e.target.value="";
    const toparse=processed.find(f=>f.type.startsWith("image/")||f.type==="application/pdf");
    if(!toparse) return;
    setAiParsing(true);
    try{
      const isImg=toparse.type.startsWith("image/");const base64=toparse.dataUrl.split(",")[1];const mediaType=toparse.type;
      const prompt=`Extract structured values from this lab result. Test category: ${testCat}. Return ONLY valid JSON with relevant fields. For ${testCat} extract: ${testCat==="Malaria Test"?"result,parasiteDensity,method,testType":testCat==="Full Blood Count"?"hb,pcv,wbc,platelets,neutrophils,lymphocytes":testCat==="Blood Sugar"?"testType,value,unit,referenceRange,interpretation,resultStatus":testCat==="Urinalysis"?"colour,appearance,protein,glucose,ketones,blood,ph,specificGravity,leukocytes,nitrites":testCat==="Lipid Profile"?"totalCholesterol,hdl,ldl,triglycerides":"results,testName"}. Always include resultStatus (Normal/High/Low/Positive/Negative) and notes. Return only JSON.`;
      const content=isImg?[{type:"image",source:{type:"base64",media_type:mediaType,data:base64}},{type:"text",text:prompt}]:[{type:"document",source:{type:"base64",media_type:"application/pdf",data:base64}},{type:"text",text:prompt}];
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,messages:[{role:"user",content}]})});
      const data=await res.json();
      const text=data.content?.map(b=>b.text||"").join("")||"{}";
      const clean=text.replace(/```json|```/g,"").trim();
      setFields(prev=>({...prev,...JSON.parse(clean)}));
      ctx.flash("✓ Fields auto-populated — please review","info",5000);
    }catch{ctx.flash("Could not auto-read — fill fields manually","info");}
    setAiParsing(false);
  };

  const save=()=>{
    if(!p) return ctx.flash("Find a patient first","err");
    const formatted=LAB_TESTS[testCat]?.formatResult({...fields,testType:fields.testType||testCat})||"";
    const rec={id:Date.now(),date,careType:"LAB",addedBy:"lab",labName:ctx.lab?.name,facility:ctx.lab?.location,attachments,title:fields.testType||testCat,fields:{testCategory:testCat,testType:fields.testType||testCat,...fields,resultSummary:formatted}};
    const recs=DB.get(`hvng_records_${p.phone}`)||[];
    DB.set(`hvng_records_${p.phone}`,[...recs,rec]);
    if(labKey){const existing=DB.get(labKey)||[];if(!existing.find(e=>e.phone===p.phone)) DB.set(labKey,[...existing,{phone:p.phone,name:p.name,dob:p.dob,bloodGroup:p.bloodGroup,genotype:p.genotype}]);}
    pushNotif(p.phone,`${ctx.lab?.name} posted your ${testCat} result.`,"result",ctx.lab?.name||"Lab");
    ctx.flash("Result posted to patient record");
    setFields({});setAttachments([]);ctx.setSub("patients");
  };

  if(!p) return(<div>
    <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:20,fontWeight:700,color:GL,marginBottom:14}}>Post Lab Result</div>
    <div style={{...S.card,background:"#FEF3C7",border:"1.5px solid #FCD34D",marginBottom:16,padding:"12px 14px"}}><div style={{fontSize:12,fontWeight:600,color:"#92400E"}}>🔬 {ctx.lab?.name} · {ctx.lab?.location}</div></div>
    <div style={S.card}>
      <div style={{textAlign:"center",padding:"24px 0"}}><div style={{fontSize:40,marginBottom:10}}>👥</div><div style={{fontSize:14,color:"#78716C",marginBottom:16}}>Select a patient from the Patients tab, or add one using an access code.</div></div>
      <button style={S.btnL} onClick={()=>ctx.setSub("patients")}>Go to My Patients</button>
    </div>
  </div>);

  return(<div>
    <div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:20,fontWeight:700,color:GL,marginBottom:14}}>Post Lab Result</div>
    <div style={S.card}>
      <div style={{background:"#FEF3C7",border:"1.5px solid #FCD34D",borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
          {[["Patient",p.name],["Blood Gp",p.bloodGroup],["Genotype",p.genotype],["Age",getAge(p.dob)]].map(([l,v])=>(<div key={l}><div style={{fontSize:10,color:"#92400E",fontWeight:700}}>{l}</div><div style={{fontSize:13,fontWeight:600}}>{v}</div></div>))}
        </div>
        <button onClick={()=>ctx.setVp(null)} style={{...S.sm("ghost"),fontSize:11,padding:"5px 10px",color:GL,border:`1.5px solid ${GL}`}}>Change</button>
      </div>
      <Fl label="Test Type">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {LAB_TEST_KEYS.map(k=>{const info=LAB_TESTS[k];const active=testCat===k;return(<div key={k} onClick={()=>{setTestCat(k);setFields({});}} style={{padding:"9px 12px",borderRadius:10,cursor:"pointer",border:active?"2px solid #D97706":"2px solid #E5E2DB",background:active?"#FEF3C7":"#FAFAF9",display:"flex",alignItems:"center",gap:7,transition:"all .15s"}}><span style={{fontSize:18}}>{info.icon}</span><span style={{fontSize:12,fontWeight:active?700:500,color:active?"#B45309":"#57534E"}}>{k}</span></div>);})}
        </div>
      </Fl>
      <Fl label="Date of Test"><input type="date" style={S.inp} value={date} onChange={e=>setDate(e.target.value)}/></Fl>
      <div style={{background:"#FEF9EC",border:"2px solid #FCD34D",borderRadius:12,padding:"14px 16px",marginBottom:16}}>
        <div style={{fontWeight:700,fontSize:13,color:"#92400E",marginBottom:6}}>📎 Upload Lab Document</div>
        <div style={{fontSize:12,color:"#78716C",marginBottom:10,lineHeight:1.6}}>Upload a PDF or photo — AI will <strong>auto-fill fields below</strong> for you to review.</div>
        {aiParsing&&<div style={{fontSize:13,color:"#B45309",fontWeight:600,marginBottom:8}}>⏳ Reading document…</div>}
        {attachments.length>0&&(<div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
          {attachments.map((a,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:"#fff",borderRadius:8,border:"1.5px solid #E5E2DB"}}>
            <span style={{fontSize:16}}>{a.type?.startsWith("image/")?"🖼️":"📄"}</span>
            <span style={{flex:1,fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name}</span>
            <span style={{fontSize:11,color:"#78716C"}}>{(a.size/1024).toFixed(0)} KB</span>
            <button onClick={()=>setAttachments(prev=>prev.filter((_,x)=>x!==i))} style={{background:"#FEE2E2",color:"#DC2626",border:"none",borderRadius:5,padding:"3px 8px",fontSize:11,cursor:"pointer",fontWeight:700}}>✕</button>
          </div>))}
        </div>)}
        <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" style={{display:"none"}} onChange={handleFileUpload}/>
        <button type="button" onClick={()=>fileRef.current.click()} disabled={aiParsing} style={{width:"100%",padding:"11px",borderRadius:10,border:"2px dashed #FCD34D",background:"#fff",cursor:"pointer",fontSize:13,color:"#92400E",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:aiParsing?.6:1}}>
          <span style={{fontSize:20}}>📎</span>{attachments.length>0?"Add more files":"Upload PDF or Photo — auto-read by AI"}
        </button>
      </div>
      <div style={{borderTop:"1.5px solid #FCD34D",paddingTop:14}}>
        <div style={{fontSize:11,fontWeight:700,color:"#D97706",marginBottom:10,textTransform:"uppercase",letterSpacing:.5}}>🔬 {testCat} — Enter or Review Values</div>
        <StructuredTestForm testCat={testCat} fields={fields} upd={upd}/>
      </div>
      <button style={{...S.btnL,marginTop:14}} onClick={save}>Save Result to Patient</button>
    </div>
  </div>);
}

// ── STRUCTURED TEST FORMS ─────────────────────────────────────────
function StructuredTestForm({testCat,fields:f,upd}){
  const pn=["Positive","Negative"];
  const SEL=(label,key,opts)=>(<Fl key={key} label={label}><select style={S.inp} value={f[key]||opts[0]} onChange={e=>upd(key,e.target.value)}>{opts.map(o=><option key={o}>{o}</option>)}</select></Fl>);
  const INP=(label,key,ph,suffix="")=>(<Fl key={key} label={label}><div style={{display:"flex",gap:8,alignItems:"center"}}><input style={{...S.inp,flex:1}} placeholder={ph} value={f[key]||""} onChange={e=>upd(key,e.target.value)} maxLength={30}/>{suffix&&<span style={{fontSize:13,color:"#78716C",flex:"none",fontWeight:600}}>{suffix}</span>}</div></Fl>);
  const grid=ch=><div key="grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{ch}</div>;
  const FORMS={
    "Malaria Test":(<>{SEL("Test Sub-type","testType",["Malaria Parasite (MP)","Malaria RDT"])}{SEL("Result *","result",pn)}{INP("Parasite Density","parasiteDensity","e.g. 2+ or 1500/µL")}{SEL("Method","method",["Microscopy","RDT","Both"])}{SEL("Status","resultStatus",STATUS_OPTS)}</>),
    "Full Blood Count":(<>{grid([INP("Hb","hb","11.5","g/dL"),INP("PCV","pcv","34","%"),INP("WBC","wbc","6.2","×10⁹/L"),INP("Platelets","platelets","250","×10⁹/L"),INP("Neutrophils","neutrophils","60","%"),INP("Lymphocytes","lymphocytes","30","%")])}{SEL("Overall Status","resultStatus",STATUS_OPTS)}</>),
    "Blood Sugar":(<>{SEL("Test Sub-type","testType",["Fasting Blood Sugar (FBS)","Random Blood Sugar (RBS)","HbA1c","2-Hour Postprandial"])}{grid([INP("Value *","value","110"),SEL("Unit","unit",["mg/dL","mmol/L","%"])])}{INP("Reference Range","referenceRange","e.g. 70–100 mg/dL")}{INP("Interpretation","interpretation","e.g. Slightly elevated")}{SEL("Status","resultStatus",STATUS_OPTS)}</>),
    "Urinalysis":(<>{grid([INP("Colour","colour","Yellow"),INP("Appearance","appearance","Clear"),SEL("Protein","protein",pn),SEL("Glucose","glucose",pn),SEL("Ketones","ketones",pn),SEL("Blood","blood",pn),INP("pH","ph","6.0"),INP("Specific Gravity","specificGravity","1.020"),SEL("Leukocytes","leukocytes",pn),SEL("Nitrites","nitrites",pn)])}</>),
    "Lipid Profile":(<>{grid([INP("Total Cholesterol","totalCholesterol","210","mg/dL"),INP("HDL","hdl","45","mg/dL"),INP("LDL","ldl","140","mg/dL"),INP("Triglycerides","triglycerides","180","mg/dL")])}{SEL("Overall Status","resultStatus",STATUS_OPTS)}</>),
    "Typhoid (Widal)":(<>{grid([INP("S. Typhi O","salmonellaTyphi_O","1:160"),INP("S. Typhi H","salmonellaTyphi_H","1:80"),INP("S. Paratyphi A","salmonellaParaTyphi_A","1:40"),INP("S. Paratyphi B","salmonellaParaTyphi_B","1:40")])}{INP("Interpretation","interpretation","e.g. Significant titre for S. Typhi O")}{SEL("Status","resultStatus",STATUS_OPTS)}</>),
    "Faecal Analysis":(<>
      {grid([INP("Colour","faecalColour","e.g. Brown, Yellow"),INP("Consistency","faecalConsistency","e.g. Formed, Watery"),SEL("Blood","faecalBlood",["Absent","Present"]),SEL("Mucus","faecalMucus",["Absent","Present"]),SEL("Occult Blood","occultBlood",["Negative","Positive"])])}
      <Fl key="ova" label="Ova / Cysts / Parasites"><input style={S.inp} placeholder="e.g. Ascaris lumbricoides ova seen / None seen" value={f.ovaParasites||""} onChange={e=>upd("ovaParasites",e.target.value)}/></Fl>
      <Fl key="micro" label="Microscopy Findings"><input style={S.inp} placeholder="e.g. Pus cells 3-5/hpf, RBC occasional" value={f.faecalMicroscopy||""} onChange={e=>upd("faecalMicroscopy",e.target.value)}/></Fl>
      {SEL("Overall Status","resultStatus",STATUS_OPTS)}
    </>),
    "Other":(<><Fl key="tn" label="Test Name"><input style={S.inp} placeholder="e.g. Genotype, HIV Screening" value={f.testName||""} onChange={e=>upd("testName",e.target.value)}/></Fl><Fl key="res" label="Results"><textarea style={{...S.inp,height:80,resize:"vertical"}} value={f.results||""} onChange={e=>upd("results",e.target.value)} maxLength={LIMIT.notes}/><CharCount val={f.results||""} max={LIMIT.notes}/></Fl>{SEL("Status","resultStatus",STATUS_OPTS)}</>),
  };
  return(<div>{FORMS[testCat]||null}<Fl label="Notes (optional)"><textarea style={{...S.inp,height:60,resize:"vertical"}} value={f.notes||""} onChange={e=>upd("notes",e.target.value)} maxLength={500}/></Fl></div>);
}

// ── Shared UI components ──────────────────────────────────────────
function RecordList({recs,onOpen}){
  return(<div style={{display:"flex",flexDirection:"column",gap:10}}>
    {recs.map(r=>{
      const ct=CARE[r.careType]||{color:"#555",bg:"#eee",icon:"📄",label:r.careType};
      const f=r.fields||{};const hasFiles=(r.attachments||[]).length>0;const status=f.resultStatus;
      return(<div key={r.id} style={{...S.card,display:"flex",alignItems:"center",gap:12,cursor:"pointer"}} onClick={()=>onOpen(r)}>
        <div style={{background:ct.bg,borderRadius:10,padding:"10px 8px",fontSize:20,textAlign:"center",flex:"none",width:44}}>{ct.icon}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:10,fontWeight:700,color:ct.color,marginBottom:2}}>{ct.label.toUpperCase()}</div>
          <div style={{fontWeight:600,fontSize:14,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.title}</div>
          <div style={{fontSize:12,color:"#78716C",marginTop:1}}>{r.date}{r.facility?` · ${r.facility}`:""}</div>
          <div style={{display:"flex",gap:6,marginTop:3,flexWrap:"wrap",alignItems:"center"}}>
            {f.testCategory&&<span style={{fontSize:11,color:GL,fontWeight:600}}>{f.testCategory}</span>}
            {f.diagnosis&&!f.testCategory&&<span style={{fontSize:11,color:"#57534E"}}>Dx: {f.diagnosis}</span>}
            {status&&<span style={{fontSize:10,fontWeight:700,color:"#fff",background:STATUS_COLOR[status]||"#78716C",padding:"1px 7px",borderRadius:99}}>{status}</span>}
            {hasFiles&&<span style={{fontSize:11,color:GB,fontWeight:600}}>📎 {r.attachments.length}</span>}
            {r.addedBy==="lab"&&<span style={{fontSize:10,color:GL,fontWeight:700}}>🔬 Lab</span>}
            {r.addedBy==="doctor"&&<span style={{fontSize:10,color:"#7C3AED",fontWeight:700}}>✍️ Dr</span>}
          </div>
        </div>
        <span style={{color:"#C0BCB5",fontSize:20,flex:"none"}}>›</span>
      </div>);
    })}
  </div>);
}

function FilterPills({filter,setFilter}){
  return(<div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:10,marginBottom:12}}>
    {["ALL",...CARE_TYPES].map(ct=>{const c=CARE[ct];const isActive=filter===ct;return(
      <div key={ct} onClick={()=>setFilter(ct)} style={{flex:"none",padding:"5px 12px",borderRadius:99,fontSize:12,fontWeight:600,cursor:"pointer",background:isActive?(c?.bg||"#E2E8F0"):"#F3F1EC",color:isActive?(c?.color||"#333"):"#78716C",border:isActive?`1.5px solid ${c?.color||"#888"}`:"1.5px solid transparent",transition:"all .15s"}}>
        {c?`${c.icon} ${c.label}`:"All"}
      </div>
    );})}
  </div>);
}

function Sheet({children,onClose,title}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:500,display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div className="sheet-anim" style={{background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",maxHeight:"90vh",overflowY:"auto",padding:"20px 20px 48px"}} onClick={e=>e.stopPropagation()}>
        <div style={{width:40,height:4,background:"#D6D3CE",borderRadius:99,margin:"0 auto 20px"}}/>
        {title&&<div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:18,fontWeight:700,marginBottom:16}}>{title}</div>}
        {children}
      </div>
    </div>
  );
}

function CharCount({val,max}){const len=(val||"").length;const near=len>max*.85;const over=len>=max;if(!len)return null;return(<div style={{textAlign:"right",fontSize:11,marginTop:3,color:over?"#DC2626":near?"#D97706":"#A8A29E",fontWeight:near?600:400}}>{len}/{max}</div>);}
function Centered({children,pad="0 24px"}){return <div style={{maxWidth:420,margin:"0 auto",padding:pad}}>{children}</div>;}
function PageTitle({title,sub,color=G}){return <div style={{padding:"44px 0 22px",textAlign:"center"}}><div style={{fontFamily:"'Fraunces',Georgia,serif",fontSize:26,fontWeight:700,color}}>{title}</div>{sub&&<div style={{color:"#78716C",fontSize:14,marginTop:5}}>{sub}</div>}</div>;}
function Fl({label,children}){return <div style={{marginBottom:14}}><label style={S.lbl}>{label}</label>{children}</div>;}
function SectionHead({children,color=G}){return <div style={{fontWeight:700,fontSize:13,color,marginBottom:14,marginTop:8,paddingTop:14,borderTop:"1.5px solid #EAE8E3"}}>{children}</div>;}
function Back({onClick}){return <div style={{textAlign:"center",marginTop:16}}><span style={{fontSize:13,color:"#78716C",cursor:"pointer"}} onClick={onClick}>← Back</span></div>;}
function Hint({children,color="green"}){const bg={green:"#EFF6EE",blue:"#EFF6FF",amber:"#FEF3C7"};const tc={green:"#166534",blue:"#1E40AF",amber:"#92400E"};return <div style={{marginTop:14,padding:"12px 16px",background:bg[color]||bg.green,borderRadius:12,fontSize:12,color:tc[color]||tc.green,lineHeight:1.8}}>{children}</div>;}
function Empty({msg}){return <div style={{textAlign:"center",paddingTop:44}}><div style={{fontSize:44,marginBottom:10}}>📂</div><div style={{color:"#78716C",fontSize:14}}>{msg}</div></div>;}"],{type:"text/html"})["<html><head><title>Referral - "+pt.name+"</title>import { useState, useEffect, useRef } from "react";

// ── Storage ───────────────────────────────────────────────────────
const DB = {
  get:(k)=>{ try{return JSON.parse(localStorage.getItem(k));}catch{return null;} },
  set:(k,v)=>{ try{localStorage.setItem(k,JSON.stringify(v));}catch{} },
};

// ── Offline queue ─────────────────────────────────────────────────
const Q = {
  push:(action)=>{ const q=DB.get("hvng_queue")||[]; DB.set("hvng_queue",[...q,{...action,id:Date.now()}]); },
  flush:()=>{ const q=DB.get("hvng_queue")||[]; q.forEach(a=>{ if(a.type==="addRecord"){ const recs=DB.get(`hvng_records_${a.phone}`)||[]; if(!recs.find(r=>r.id===a.rec.id)) DB.set(`hvng_records_${a.phone}`,[...recs,a.rec]); } }); DB.set("hvng_queue",[]); },
  count:()=>(DB.get("hvng_queue")||[]).length,
};

// ── Notifications ─────────────────────────────────────────────────
function pushNotif(phone,message,type="result",from=""){
  if(!phone) return;
  const all=DB.get(`hvng_notif_${phone}`)||[];
  DB.set(`hvng_notif_${phone}`,[{id:Date.now(),message,type,from,date:new Date().toISOString().split("T")[0],read:false},...all.slice(0,49)]);
}

// ── Seed ─────────────────────────────────────────────────────────